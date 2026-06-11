import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { INDIA_STATES } from '@/lib/indiaData';

/**
 * GET /api/cron/data-agent
 *
 * Specialized background data polling agent.
 * Runs daily (after daily-pipeline) to keep all reference data fresh:
 *   1. Upsert latest CM info from ground_truth_facts → representatives table
 *   2. Check mandals table completeness — flag any district with 0 mandals
 *   3. Refresh stale politician_profiles (expired > 6h)
 *   4. Log summary to data_sync_log
 *
 * maxDuration=300 on Hobby plan.
 */

export const maxDuration = 300;

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://reviewyourleader.com';

export async function GET(req: NextRequest) {
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');

  if (!isVercelCron && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const log: Record<string, unknown> = { started: new Date().toISOString() };

  // ── Phase 1: Sync CM data from ground_truth_facts → states table ─────────
  try {
    const { data: facts } = await supabase
      .from('ground_truth_facts')
      .select('state_id, chief_minister, cm_party, confidence, verified_at')
      .eq('is_live', true)
      .order('verified_at', { ascending: false });

    let cmSynced = 0;
    if (facts?.length) {
      const seen = new Set<string>();
      for (const fact of facts) {
        if (seen.has(fact.state_id)) continue;
        seen.add(fact.state_id);
        await supabase
          .from('states')
          .update({ chief_minister: fact.chief_minister, ruling_party: fact.cm_party })
          .eq('id', fact.state_id);
        cmSynced++;
      }
    }
    log.cm_sync = { synced: cmSynced };
  } catch (e) {
    log.cm_sync = { error: String(e) };
  }

  // ── Phase 2: Detect districts with no mandals and flag them ──────────────
  try {
    const { data: districts } = await supabase
      .from('districts')
      .select('id, name, state_id, mandals_count');

    const { data: mandalCounts } = await supabase
      .from('mandals')
      .select('district_id');

    const filled = new Set((mandalCounts || []).map(m => m.district_id));
    const missing = (districts || []).filter(d => !filled.has(d.id) && d.mandals_count > 0);
    log.mandal_gaps = { missing_count: missing.length, sample: missing.slice(0, 5).map(d => d.id) };
  } catch (e) {
    log.mandal_gaps = { error: String(e) };
  }

  // ── Phase 3: Refresh expired politician profiles ──────────────────────────
  try {
    const { data: expired } = await supabase
      .from('politician_profiles')
      .select('slug, name, state_id')
      .lt('expires_at', new Date().toISOString())
      .limit(10); // Refresh 10 per cycle to stay within time budget

    let refreshed = 0;
    for (const profile of expired || []) {
      try {
        const res = await fetch(`${BASE}/api/politician-journey?name=${encodeURIComponent(profile.name)}&stateId=${profile.state_id}&refresh=true`, {
          headers: { 'x-cron-secret': process.env.CRON_SECRET || '' },
          signal: AbortSignal.timeout(15_000),
        });
        if (res.ok) refreshed++;
      } catch { /* skip individual failures */ }
    }
    log.profile_refresh = { refreshed, total_expired: expired?.length ?? 0 };
  } catch (e) {
    log.profile_refresh = { error: String(e) };
  }

  // ── Phase 4: Verify CMs for states not verified in last 7 days ───────────
  try {
    const { data: staleStates } = await supabase
      .from('ground_truth_facts')
      .select('state_id, verified_at')
      .order('verified_at', { ascending: true })
      .limit(5);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const toVerify = (staleStates || [])
      .filter(s => !s.verified_at || s.verified_at < sevenDaysAgo)
      .map(s => s.state_id);

    // Also check states not in ground_truth_facts at all
    const verifiedStateIds = new Set((staleStates || []).map(s => s.state_id));
    const unverifiedStates = INDIA_STATES
      .filter(s => !verifiedStateIds.has(s.id))
      .slice(0, 3)
      .map(s => s.id);

    const allToVerify = [...new Set([...toVerify, ...unverifiedStates])].slice(0, 5);

    let verified = 0;
    for (const stateId of allToVerify) {
      try {
        const res = await fetch(`${BASE}/api/state-live`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-cron-secret': process.env.CRON_SECRET || '' },
          body: JSON.stringify({ stateId }),
          signal: AbortSignal.timeout(30_000),
        });
        if (res.ok) verified++;
      } catch { /* skip */ }
    }
    log.cm_verify = { verified, states: allToVerify };
  } catch (e) {
    log.cm_verify = { error: String(e) };
  }

  // ── Phase 5: Write sync log ───────────────────────────────────────────────
  log.completed = new Date().toISOString();
  try {
    await supabase.from('data_sync_log').insert({
      source: 'data-agent-cron',
      state_id: 'ALL',
      records_synced: 0,
      status: 'success',
      details: log,
    });
  } catch { /* non-critical */ }

  return NextResponse.json({ success: true, log });
}
