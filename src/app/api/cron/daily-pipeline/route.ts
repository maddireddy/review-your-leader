import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * GET /api/cron/daily-pipeline
 *
 * Hobby-plan master cron — runs ONCE daily at 2:00 AM IST (20:30 UTC).
 * Replaces all sub-hourly crons that exceeded the Hobby plan limit.
 *
 * What it does in sequence:
 *   1. Refresh CM facts for ALL 36 states (web search + AI validation)
 *      — same logic as smart-refresh + all 6 geo-batch crons combined
 *   2. Sync electoral data for 6 most-stale states (LokDhaba + NDAP)
 *   3. Purge expired AI insight cache entries
 *   4. Refresh static page cache
 *
 * maxDuration=300 (5 min) — Vercel Hobby serverless limit.
 * Uses internal fetch calls so each sub-pipeline gets its own timeout budget.
 */

export const maxDuration = 300;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://reviewyourleader.com';
const GEO_BATCHES = ['north', 'south', 'east', 'west', 'central', 'uts'];

async function callInternal(path: string, secret: string): Promise<{ ok: boolean; data: unknown }> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'x-cron-secret': secret },
      signal: AbortSignal.timeout(55_000), // 55s per sub-call
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch (err) {
    return { ok: false, data: { error: String(err) } };
  }
}

export async function GET(request: NextRequest) {
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const secret       = request.headers.get('x-cron-secret') ?? request.nextUrl.searchParams.get('secret');

  if (!isVercelCron && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cronSecret = process.env.CRON_SECRET ?? '';
  const started    = Date.now();
  const log: Record<string, unknown> = {};

  // ── Phase 1: CM fact refresh — smart-refresh (picks 6 stalest states) ────
  log.smart_refresh = await callInternal('/api/cron/smart-refresh', cronSecret);

  // ── Phase 2: Geo-batch refresh — all 6 regions ───────────────────────────
  // Run sequentially to stay within memory limits on Hobby
  const batchResults: Record<string, unknown> = {};
  for (const batch of GEO_BATCHES) {
    batchResults[batch] = await callInternal(
      `/api/cron/refresh-facts?batch=${batch}`,
      cronSecret
    );
  }
  log.geo_batches = batchResults;

  // ── Phase 3: Electoral data sync (6 most-stale states) ───────────────────
  log.electoral_sync = await callInternal('/api/cron/sync-electoral', cronSecret);

  // ── Phase 4: Purge expired AI insight cache entries ──────────────────────
  try {
    const supabase = getSupabaseAdmin();
    const { count } = await supabase
      .from('ai_insight_cache')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id');
    log.cache_purge = { purged: count ?? 0 };
  } catch (err) {
    log.cache_purge = { error: String(err) };
  }

  // ── Phase 5: Static cache refresh ────────────────────────────────────────
  log.cache_refresh = await callInternal('/api/cron/refresh-cache', cronSecret);

  return NextResponse.json({
    ok: true,
    duration_ms: Date.now() - started,
    phases: log,
    ran_at: new Date().toISOString(),
  });
}
