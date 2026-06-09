import { NextRequest, NextResponse } from 'next/server';
import { getLiveStateInfo } from '@/lib/groundTruthStore';
import { fetchCurrentCM, validateFact } from '@/lib/liveDataFetcher';
import { writeVerifiedFact, invalidateFactsCache } from '@/lib/groundTruthStore';
import { getStateById } from '@/lib/indiaData';

/**
 * GET  /api/state-live?stateId=KA          — current verified info (live overlay)
 * POST /api/state-live  { stateId, force } — on-demand live refresh for ONE state
 *
 * The POST path lets a user click "refresh" on any state and trigger the full
 * web-search + validation pipeline for just that state in real time.
 */

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
  try {
    const { stateId } = await request.json();
    const state = getStateById(stateId);
    if (!state) return NextResponse.json({ error: 'State not found' }, { status: 404 });

    // Full live pipeline for this one state
    const fact = await fetchCurrentCM(state.name);
    if (!fact.value) {
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

    let committed = false;
    if (confidence >= 0.75 && validation.agree) {
      committed = await writeVerifiedFact({
        entity_type: 'state', entity_id: state.id, fact_key: 'chief_minister',
        fact_value: fact.value, fact_party: fact.party,
        confidence, sources: fact.sources, validation_notes: validation.notes,
      });
      invalidateFactsCache();
    }

    return NextResponse.json({
      status: committed ? 'updated' : (confidence < 0.75 ? 'low_confidence' : 'verified_same'),
      chief_minister: committed ? fact.value : state.chief_minister,
      candidate: fact.value,
      cm_party: fact.party,
      confidence: Math.round(confidence * 100) / 100,
      changed,
      committed,
      sources: fact.sources,
      validation: validation.notes,
      is_live: committed,
    });
  } catch (err) {
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
