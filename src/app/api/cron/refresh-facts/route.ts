import { NextRequest, NextResponse } from 'next/server';
import { INDIA_STATES } from '@/lib/indiaData';
import { fetchCurrentCM, validateFact } from '@/lib/liveDataFetcher';
import { writeVerifiedFact } from '@/lib/groundTruthStore';

/**
 * AUTONOMOUS FACT REFRESH PIPELINE
 *
 * Runs nightly (Vercel cron). For each state:
 *   1. Live web search for current CM (groq/compound)
 *   2. Two independent models validate the claim
 *   3. Confidence = extraction_conf × validation_conf × source_bonus
 *   4. Commit to Supabase only if confidence ≥ COMMIT_THRESHOLD
 *
 * Self-healing: a CM change anywhere gets picked up automatically.
 *
 * Manual trigger: GET /api/cron/refresh-facts?state=KA  (single state)
 *                 GET /api/cron/refresh-facts            (all states)
 */

export const maxDuration = 300; // 5 min (Vercel Pro). Hobby caps at 60s — use ?state= for those.

const COMMIT_THRESHOLD = 0.75;

export async function GET(request: NextRequest) {
  // Auth — Vercel cron sends the secret; manual calls in dev are allowed
  const authHeader = request.headers.get('authorization');
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const stateFilter = request.nextUrl.searchParams.get('state');

  if (process.env.NODE_ENV === 'production' && !isVercelCron && !stateFilter) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const targets = stateFilter
    ? INDIA_STATES.filter(s => s.id === stateFilter.toUpperCase())
    : INDIA_STATES;

  const results: Array<{
    state: string; old_cm: string; new_cm: string;
    confidence: number; committed: boolean; changed: boolean; notes: string;
  }> = [];

  const start = Date.now();

  for (const state of targets) {
    // Budget guard — bail before Vercel kills the function
    if (Date.now() - start > 280000) {
      results.push({ state: state.id, old_cm: state.chief_minister, new_cm: '', confidence: 0, committed: false, changed: false, notes: 'time budget exhausted' });
      break;
    }

    try {
      // 1. Live web-search fetch
      const fact = await fetchCurrentCM(state.name);

      if (!fact.value) {
        results.push({ state: state.id, old_cm: state.chief_minister, new_cm: '', confidence: 0, committed: false, changed: false, notes: fact.reasoning });
        continue;
      }

      // 2. Multi-model validation
      const validation = await validateFact(
        state.name, 'chief_minister', fact.value, fact.party, fact.reasoning
      );

      // 3. Composite confidence
      const sourceBonus = Math.min(1, 0.7 + fact.sources.length * 0.1);
      const confidence = Math.min(1, validation.confidence * sourceBonus);

      const changed = normalize(fact.value) !== normalize(state.chief_minister);

      // 4. Commit if confident AND validators agree
      let committed = false;
      if (confidence >= COMMIT_THRESHOLD && validation.agree) {
        committed = await writeVerifiedFact({
          entity_type: 'state',
          entity_id: state.id,
          fact_key: 'chief_minister',
          fact_value: fact.value,
          fact_party: fact.party,
          confidence,
          sources: fact.sources,
          validation_notes: validation.notes,
        });
      }

      results.push({
        state: state.id,
        old_cm: state.chief_minister,
        new_cm: fact.value,
        confidence: Math.round(confidence * 100) / 100,
        committed,
        changed,
        notes: validation.notes,
      });

      // Rate-limit courtesy
      await new Promise(r => setTimeout(r, 800));
    } catch (err) {
      results.push({
        state: state.id, old_cm: state.chief_minister, new_cm: '',
        confidence: 0, committed: false, changed: false,
        notes: err instanceof Error ? err.message : 'error',
      });
    }
  }

  const changes = results.filter(r => r.changed && r.committed);

  return NextResponse.json({
    message: `Scanned ${results.length} states, committed ${results.filter(r => r.committed).length}, detected ${changes.length} changes`,
    duration_ms: Date.now() - start,
    changes_detected: changes,
    results,
  });
}

function normalize(name: string): string {
  return name.toLowerCase().replace(/[.\s]+/g, '').replace(/^(shri|smt|dr|mr|ms)/, '');
}
