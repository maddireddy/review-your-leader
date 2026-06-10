import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { fetchLokDhabaResults, normaliseLokDhabaResult } from '@/lib/electoralSources';

/**
 * GET /api/electoral/results
 * ?stateId=TN&year=2021&type=assembly|parliament&constituencyId=TN-A-001&top=20
 *
 * Returns election results for a state/constituency from Supabase.
 * If not cached, fetches from LokDhaba → normalises → stores → returns.
 */
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const stateId      = searchParams.get('stateId') || '';
  const year         = parseInt(searchParams.get('year') || '0', 10);
  const type         = searchParams.get('type') || 'assembly';
  const constituencyId = searchParams.get('constituencyId') || '';
  const top          = Math.min(parseInt(searchParams.get('top') || '50', 10), 200);

  if (!stateId) return NextResponse.json({ error: 'stateId required' }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // ── Query Supabase ────────────────────────────────────────
  let query = supabase
    .from('election_results')
    .select('*')
    .eq('state_id', stateId)
    .eq('constituency_type', type)
    .order('cycle_id', { ascending: false })
    .order('constituency_id')
    .order('position')
    .limit(top);

  if (year) {
    // Filter by cycle_id that contains the year
    query = query.like('cycle_id', `%${year}%`);
  }
  if (constituencyId) {
    query = query.eq('constituency_id', constituencyId);
  }

  const { data: cached } = await query;

  if (cached && cached.length > 0) {
    return NextResponse.json({ results: cached, fromCache: true, count: cached.length });
  }

  // ── Cache miss — fetch from LokDhaba ─────────────────────
  if (year) {
    try {
      const lokData = await fetchLokDhabaResults(stateId, year, type === 'parliament' ? 'GE' : 'AE');
      if (lokData.length > 0) {
        const cycleId = type === 'parliament' ? `GE-${year}` : `${stateId}-${year}`;
        const rows = lokData.map(r => normaliseLokDhabaResult(r, cycleId));

        // Batch upsert
        await supabase.from('election_results').upsert(rows, {
          onConflict: 'cycle_id,constituency_id,candidate_name',
          ignoreDuplicates: true,
        });

        return NextResponse.json({ results: rows, fromCache: false, count: rows.length });
      }
    } catch { /* fall through to empty response */ }
  }

  return NextResponse.json({ results: [], fromCache: false, count: 0 });
}
