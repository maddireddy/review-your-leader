import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * POST /api/admin/purge-insight
 * Body: { stateId: "TN" } or { stateId: "ALL" }
 *
 * Immediately deletes ALL ai_insight_cache entries for a state (or all states)
 * so the next page load generates fresh AI text with the correct CM.
 * Protected by CRON_SECRET.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') || request.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { stateId } = await request.json();
  if (!stateId) return NextResponse.json({ error: 'stateId required' }, { status: 400 });

  const supabase = getSupabaseAdmin();

  let query = supabase.from('ai_insight_cache').delete();
  if (stateId === 'ALL') {
    query = query.eq('entity_type', 'state');
  } else {
    query = query.eq('entity_type', 'state').eq('entity_id', stateId);
  }

  const { error, count } = await query.select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ purged: count ?? 0, stateId });
}
