import { NextRequest, NextResponse } from 'next/server';
import { getLiveStateInfo } from '@/lib/groundTruthStore';
import { fetchCurrentCM, validateFact, fetchStateEnrichment } from '@/lib/liveDataFetcher';
import { writeVerifiedFact, invalidateFactsCache } from '@/lib/groundTruthStore';
import { invalidateInsightCache } from '@/lib/aiValidator';
import { getStateById } from '@/lib/indiaData';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * GET  /api/state-live?stateId=KA          — current verified info (live overlay)
 * POST /api/state-live  { stateId, force } — on-demand live refresh for ONE state
 *
 * The POST path lets a user click "refresh" on any state and trigger the full
 * web-search + validation pipeline for just that state in real time.
 * Includes a DB-level pipeline lock so concurrent requests for the same state
 * don't all fire in parallel, burning Tavily/Groq quota N times.
 */

const LOCK_TTL_MS = 5 * 60 * 1000; // hold lock for max 5 min

async function acquirePipelineLock(stateId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    const expiry = new Date(Date.now() + LOCK_TTL_MS).toISOString();
    // Upsert fails if a non-expired lock exists for this state
    const { error } = await supabase.from('pipeline_locks').upsert(
      { entity_id: stateId, locked_at: now, expires_at: expiry },
      { onConflict: 'entity_id', ignoreDuplicates: false }
    );
    return !error;
  } catch {
    return true; // if no locks table yet, allow pipeline to run
  }
}

async function releasePipelineLock(stateId: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('pipeline_locks').delete().eq('entity_id', stateId);
  } catch { /* best effort */ }
}

async function isLockHeld(stateId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('pipeline_locks')
      .select('expires_at')
      .eq('entity_id', stateId)
      .gt('expires_at', new Date().toISOString())
      .single();
    return !!data;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const stateId = request.nextUrl.searchParams.get('stateId');
  if (!stateId) return NextResponse.json({ error: 'stateId required' }, { status: 400 });

  const info = await getLiveStateInfo(stateId);
  if (!info) return NextResponse.json({ error: 'State not found' }, { status: 404 });

  return NextResponse.json({
    chief_minister: info.chief_minister,
    cm_party: info.cm_party,
    is_live: info.cm_is_live,
    confidence: info.cm_confidence,
    sources: info.cm_sources,
    verified_at: info.cm_verified_at,
  });
}

export async function POST(request: NextRequest) {
  let stateId = '';
  try {
    const body = await request.json();
    stateId = body.stateId || '';
    const state = getStateById(stateId);
    if (!state) return NextResponse.json({ error: 'State not found' }, { status: 404 });

    // Dedup: if another pipeline is already running for this state, return current verified data
    if (await isLockHeld(stateId)) {
      const info = await getLiveStateInfo(stateId);
      return NextResponse.json({
        status: 'pipeline_in_flight',
        chief_minister: info?.chief_minister || state.chief_minister,
        cm_party: info?.cm_party || state.cm_party,
        is_live: info?.cm_is_live || false,
        confidence: info?.cm_confidence,
        sources: info?.cm_sources,
      });
    }

    const locked = await acquirePipelineLock(stateId);
    if (!locked) {
      return NextResponse.json({ status: 'pipeline_in_flight', is_live: false });
    }

    // Full live pipeline for this one state
    const fact = await fetchCurrentCM(state.name);
    if (!fact.value) {
      await releasePipelineLock(stateId);
      return NextResponse.json({
        status: 'no_data',
        message: 'Web search returned no usable result',
        chief_minister: state.chief_minister,
        is_live: false,
      });
    }

    const validation = await validateFact(state.name, 'chief_minister', fact.value, fact.party, fact.reasoning);
    const sourceBonus = Math.min(1, 0.7 + fact.sources.length * 0.1);
    const confidence = Math.min(1, validation.confidence * sourceBonus);
    const changed = normalize(fact.value) !== normalize(state.chief_minister);

    // A fact is "validated" when models agree + confidence clears the bar.
    // Persistence to Supabase is SEPARATE — the UI shows validated live data
    // immediately even if there's no database to persist it to.
    const validated = confidence >= 0.75 && validation.agree;

    let committed = false;
    if (validated) {
      committed = await writeVerifiedFact({
        entity_type: 'state', entity_id: state.id, fact_key: 'chief_minister',
        fact_value: fact.value, fact_party: fact.party,
        confidence, sources: fact.sources, validation_notes: validation.notes,
      });
      invalidateFactsCache();
      if (committed) await invalidateInsightCache('state', state.id);

      // Bonus: enrich with heritage/infrastructure/developments (non-blocking-ish).
      // Stored under separate fact_keys so the overlay machinery reuses as-is.
      try {
        const enrich = await fetchStateEnrichment(state.name);
        if (enrich.recent_developments.length || enrich.heritage.length) {
          await writeVerifiedFact({
            entity_type: 'state', entity_id: state.id, fact_key: 'enrichment',
            fact_value: JSON.stringify({
              recent_developments: enrich.recent_developments,
              infrastructure: enrich.infrastructure,
              heritage: enrich.heritage,
            }),
            confidence: 0.8, sources: enrich.sources,
            validation_notes: 'web-sourced civic enrichment',
          });
          invalidateFactsCache();
        }
      } catch { /* enrichment is best-effort */ }
    }

    await releasePipelineLock(stateId);
    return NextResponse.json({
      status: committed ? 'updated' : validated ? 'verified' : 'low_confidence',
      chief_minister: validated ? fact.value : state.chief_minister,
      candidate: fact.value,
      cm_party: fact.party,
      confidence: Math.round(confidence * 100) / 100,
      changed,
      committed,
      persisted: committed,
      sources: fact.sources,
      validation: validation.notes,
      is_live: validated,
    });
  } catch (err) {
    await releasePipelineLock(stateId).catch(() => {});
    const msg = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json(
      { status: 'error', message: msg.includes('GROQ') ? 'Add GROQ_API_KEY in Vercel settings.' : msg },
      { status: 200 }
    );
  }
}

function normalize(name: string): string {
  return name.toLowerCase().replace(/[.\s]+/g, '');
}
