import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  fetchLokDhabaResults, normaliseLokDhabaResult,
  fetchNdapDatasets,
} from '@/lib/electoralSources';

/**
 * GET /api/cron/sync-electoral
 *
 * Nightly background job that syncs electoral data from all sources.
 * Processes states in batches; picks states with oldest sync timestamps first.
 *
 * Auth: CRON_SECRET (Vercel cron) or x-cron-secret header.
 */

export const maxDuration = 60;

// States to sync in each run — rotate through all 36 over ~2 weeks
const BATCH_SIZE = 4;

// Most recent election year per state
const LATEST_ELECTION: Record<string, number> = {
  AP: 2024, AR: 2024, AS: 2021, BR: 2020, CG: 2023, GA: 2022, GJ: 2022,
  HR: 2019, HP: 2022, JH: 2019, KA: 2023, KL: 2021, MP: 2023, MH: 2024,
  MN: 2022, ML: 2023, MZ: 2023, NL: 2023, OR: 2024, PB: 2022, RJ: 2023,
  SK: 2024, TN: 2021, TS: 2023, TR: 2023, UP: 2022, UK: 2022, WB: 2021,
  DL: 2020, PY: 2021, JK: 2024,
};

export async function GET(request: NextRequest) {
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const secret       = request.headers.get('x-cron-secret') ?? request.nextUrl.searchParams.get('secret');
  const stateFilter  = request.nextUrl.searchParams.get('state');

  if (!isVercelCron && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const started  = Date.now();
  const synced: string[] = [];
  const errors:  string[] = [];

  // ── Pick states to sync ─────────────────────────────────
  let statesToSync: string[];

  if (stateFilter) {
    statesToSync = [stateFilter];
  } else {
    // Find states not synced recently (or never)
    const { data: recentSyncs } = await supabase
      .from('data_sync_log')
      .select('entity_id, started_at')
      .eq('source', 'LokDhaba')
      .eq('status', 'success')
      .order('started_at', { ascending: false })
      .limit(50);

    const recentMap = new Map<string, Date>();
    for (const s of (recentSyncs ?? [])) {
      if (s.entity_id && !recentMap.has(s.entity_id)) {
        recentMap.set(s.entity_id, new Date(s.started_at));
      }
    }

    const allStates = Object.keys(LATEST_ELECTION);
    // Sort by oldest sync first
    allStates.sort((a, b) => {
      const ta = recentMap.get(a)?.getTime() ?? 0;
      const tb = recentMap.get(b)?.getTime() ?? 0;
      return ta - tb;
    });

    statesToSync = allStates.slice(0, BATCH_SIZE);
  }

  // ── Sync each state ─────────────────────────────────────
  for (const stateId of statesToSync) {
    const year = LATEST_ELECTION[stateId];
    if (!year) continue;

    const cycleId = `${stateId}-${year}`;
    const logStart = Date.now();

    try {
      // Check if we already have results for this cycle
      const { count } = await supabase
        .from('election_results')
        .select('id', { count: 'exact', head: true })
        .eq('cycle_id', cycleId);

      if ((count ?? 0) > 50) {
        // Already have data — skip
        synced.push(`${stateId}:skip`);
        continue;
      }

      // Fetch from LokDhaba
      const lokData = await fetchLokDhabaResults(stateId, year, 'AE');

      if (lokData.length > 0) {
        // Ensure cycle exists
        await supabase.from('election_cycles').upsert({
          id: cycleId,
          election_type: 'state',
          state_id: stateId,
          year,
          source: 'LokDhaba',
        }, { onConflict: 'election_type,state_id,year', ignoreDuplicates: true });

        // Normalise + insert results in batches of 100
        const rows = lokData.map(r => normaliseLokDhabaResult(r, cycleId));
        for (let i = 0; i < rows.length; i += 100) {
          await supabase.from('election_results').upsert(rows.slice(i, i + 100), {
            onConflict: 'cycle_id,constituency_id,candidate_name',
            ignoreDuplicates: true,
          });
        }

        // Aggregate party performance
        await syncPartyPerformance(supabase, stateId, cycleId, rows);

        // Log success
        await supabase.from('data_sync_log').insert({
          source: 'LokDhaba',
          entity_type: 'election_results',
          entity_id: stateId,
          status: 'success',
          records_synced: rows.length,
          duration_ms: Date.now() - logStart,
          completed_at: new Date().toISOString(),
        });

        synced.push(`${stateId}:${rows.length}`);
      } else {
        synced.push(`${stateId}:empty`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${stateId}:${msg}`);
      await supabase.from('data_sync_log').insert({
        source: 'LokDhaba',
        entity_type: 'election_results',
        entity_id: stateId,
        status: 'failed',
        error_message: msg.slice(0, 500),
        duration_ms: Date.now() - logStart,
        completed_at: new Date().toISOString(),
      });
    }
  }

  // ── Also sync NDAP dataset index (once per run) ─────────
  try {
    const ndapSets = await fetchNdapDatasets('Election');
    if (ndapSets.length > 0) {
      await supabase.from('ndap_datasets').upsert(
        ndapSets.map(d => ({
          id: d.id,
          title: d.title,
          description: d.description,
          sector: d.sector,
          ministry: d.ministry,
          granularity: d.granularity,
          last_updated: d.lastUpdated,
          api_endpoint: d.apiEndpoint,
          record_count: d.recordCount,
        })),
        { onConflict: 'id', ignoreDuplicates: true }
      );
    }
  } catch { /* non-fatal */ }

  return NextResponse.json({
    ok: true,
    synced,
    errors,
    duration_ms: Date.now() - started,
    states_processed: statesToSync.length,
  });
}

// ── Aggregate party performance from results rows ────────────
async function syncPartyPerformance(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  stateId: string,
  cycleId: string,
  rows: ReturnType<typeof normaliseLokDhabaResult>[]
) {
  const partyMap = new Map<string, { contested: number; won: number; votes: number }>();
  for (const r of rows) {
    const key = r.party_short || r.party;
    const cur = partyMap.get(key) ?? { contested: 0, won: 0, votes: 0 };
    cur.contested++;
    if (r.is_winner) cur.won++;
    cur.votes += r.votes ?? 0;
    partyMap.set(key, cur);
  }

  const totalVotes = rows.reduce((s, r) => s + (r.votes ?? 0), 0);

  const ppRows = [...partyMap.entries()].map(([party, stats]) => ({
    cycle_id: cycleId,
    state_id: stateId,
    party,
    party_short: party,
    seats_contested: stats.contested,
    seats_won: stats.won,
    total_votes: stats.votes,
    vote_share: totalVotes > 0 ? parseFloat(((stats.votes / totalVotes) * 100).toFixed(2)) : 0,
    source: 'LokDhaba',
  }));

  await supabase.from('party_performance').upsert(ppRows, {
    onConflict: 'cycle_id,state_id,party',
    ignoreDuplicates: true,
  });
}
