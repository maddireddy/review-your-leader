import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { fetchCensusDemographics } from '@/lib/electoralSources';

/**
 * GET /api/electoral/demographics
 * ?stateId=TN&constituencyId=TN-A-001
 *
 * Returns Census demographics: population, SC/ST %, literacy, urban %, sex ratio.
 */
export const maxDuration = 15;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const stateId        = searchParams.get('stateId') || '';
  const constituencyId = searchParams.get('constituencyId') || '';

  if (!stateId) return NextResponse.json({ error: 'stateId required' }, { status: 400 });

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('constituency_demographics')
    .select('*')
    .eq('state_id', stateId)
    .limit(50);

  if (constituencyId) query = query.eq('constituency_id', constituencyId);

  const { data: cached } = await query;
  if (cached && cached.length > 0) {
    return NextResponse.json({ demographics: cached, fromCache: true });
  }

  // Fetch from Census API
  const censusData = await fetchCensusDemographics(stateId);
  if (censusData.length > 0) {
    const rows = censusData.map(c => ({
      ...c,
      state_id: stateId,
      constituency_type: 'assembly',
      reference_year: c.census_year || 2011,
      source: 'Census',
      fetched_at: new Date().toISOString(),
    }));
    await supabase.from('constituency_demographics').upsert(rows, {
      onConflict: 'constituency_id,reference_year',
      ignoreDuplicates: true,
    });
    return NextResponse.json({ demographics: rows, fromCache: false });
  }

  return NextResponse.json({ demographics: [], fromCache: false });
}
