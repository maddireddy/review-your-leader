import { NextRequest, NextResponse } from 'next/server';
import { INDIA_STATES } from '@/lib/indiaData';
import { fetchCurrentCM, validateFact, fetchStateEnrichment } from '@/lib/liveDataFetcher';
import { writeVerifiedFact, invalidateFactsCache } from '@/lib/groundTruthStore';
import { invalidateInsightCache } from '@/lib/aiValidator';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * SMART 24/7 BACKGROUND REFRESH
 *
 * Runs every 10 minutes via Vercel cron (see vercel.json).
 * Each run picks the MOST STALE states (by verified_at age) and refreshes them.
 * With 36 states and runs every 10 minutes, every state gets refreshed multiple
 * times per day — effectively a continuous background model.
 *
 * Batch size = 3 states per run → 36 states covered every 120 min max.
 * With 6 geographic batch crons on top of this, coverage is every ~20 min.
 */

export const maxDuration = 60; // safe for Vercel Hobby

const COMMIT_THRESHOLD = 0.75;
const BATCH_SIZE = 3;

type StateRow = {
  entity_id: string;
  verified_at: string | null;
};

async function getStalestStates(count: number): Promise<string[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('ground_truth_facts')
      .select('entity_id, verified_at')
      .eq('entity_type', 'state')
      .eq('fact_key', 'chief_minister')
      .order('verified_at', { ascending: true })
      .limit(count * 3); // fetch extra to handle gaps

    const refreshedIds = new Set((data as StateRow[] || []).map(r => r.entity_id));
    const staleVerified: string[] = ((data as StateRow[]) || [])
      .slice(0, count)
      .map(r => r.entity_id);

    // Also include states that have NEVER been verified
    const neverVerified = INDIA_STATES
      .filter(s => !refreshedIds.has(s.id))
      .slice(0, count)
      .map(s => s.id);

    // Merge: never-verified first, then stalest
    const combined = [...new Set([...neverVerified, ...staleVerified])].slice(0, count);
    return combined.length > 0 ? combined : INDIA_STATES.slice(0, count).map(s => s.id);
  } catch {
    // If Supabase unavailable, pick random batch
    const shuffled = [...INDIA_STATES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(s => s.id);
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (process.env.NODE_ENV === 'production' && !isVercelCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Allow override batch from query string (for manual testing)
  const batchParam = request.nextUrl.searchParams.get('batch');
  let targetIds: string[];

  if (batchParam) {
    targetIds = batchParam.split(',').map(s => s.trim().toUpperCase());
  } else {
    targetIds = await getStalestStates(BATCH_SIZE);
  }

  const targets = INDIA_STATES.filter(s => targetIds.includes(s.id));
  const results = [];
  const start = Date.now();

  for (const state of targets) {
    try {
      const fact = await fetchCurrentCM(state.name);
      if (!fact.value) {
        results.push({ state: state.id, status: 'no_data', notes: fact.reasoning });
        continue;
      }

      const validation = await validateFact(state.name, 'chief_minister', fact.value, fact.party, fact.reasoning);
      const sourceBonus = Math.min(1, 0.7 + fact.sources.length * 0.1);
      const confidence = Math.min(1, validation.confidence * sourceBonus);

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

        if (committed) {
          invalidateFactsCache();
          await invalidateInsightCache('state', state.id);

          // Enrich best-effort
          try {
            const enrich = await fetchStateEnrichment(state.name);
            if (enrich.recent_developments.length) {
              await writeVerifiedFact({
                entity_type: 'state',
                entity_id: state.id,
                fact_key: 'enrichment',
                fact_value: JSON.stringify({
                  recent_developments: enrich.recent_developments,
                  infrastructure: enrich.infrastructure,
                  heritage: enrich.heritage,
                }),
                confidence: 0.8,
                sources: enrich.sources,
                validation_notes: 'smart-refresh enrichment',
              });
              invalidateFactsCache();
            }
          } catch { /* best-effort */ }
        }
      }

      results.push({
        state: state.id,
        cm: fact.value,
        confidence: Math.round(confidence * 100),
        committed,
        status: committed ? 'updated' : confidence < COMMIT_THRESHOLD ? 'low_confidence' : 'verified',
      });

      // Brief pause between states to be a good API citizen
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      results.push({
        state: state.id,
        status: 'error',
        notes: err instanceof Error ? err.message : 'unknown',
      });
    }
  }

  return NextResponse.json({
    message: `Smart refresh: ${targets.length} states processed in ${Date.now() - start}ms`,
    committed: results.filter(r => r.committed).length,
    results,
    next_stalest: await getStalestStates(3),
  });
}
