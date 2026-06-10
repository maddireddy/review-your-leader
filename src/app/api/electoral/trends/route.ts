import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * GET /api/electoral/trends
 * ?stateId=TN&party=DMK&type=assembly
 *
 * Returns party performance over time + seat swing data.
 * Powers the trend chart in ElectionHistory.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const stateId = searchParams.get('stateId') || '';
  const party   = searchParams.get('party') || '';

  if (!stateId) return NextResponse.json({ error: 'stateId required' }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // ── Party performance over all cycles ─────────────────────
  const ppQuery = supabase
    .from('party_performance')
    .select('*, election_cycles(year, result_date, total_seats)')
    .eq('state_id', stateId)
    .order('cycle_id', { ascending: true });

  if (party) ppQuery.eq('party', party);

  const { data: partyData } = await ppQuery;

  // ── Turnout history ───────────────────────────────────────
  const { data: turnoutData } = await supabase
    .from('voter_turnout_history')
    .select('election_year, election_type, turnout_percent, votes_polled, total_electors')
    .eq('state_id', stateId)
    .order('election_year', { ascending: true });

  // ── Winner parties per cycle (from election_results) ──────
  const { data: winnersData } = await supabase
    .from('election_results')
    .select('cycle_id, party, party_short')
    .eq('state_id', stateId)
    .eq('is_winner', true);

  // Aggregate wins per party per cycle
  const winsByPartyCycle: Record<string, Record<string, number>> = {};
  for (const row of (winnersData ?? [])) {
    if (!winsByPartyCycle[row.cycle_id]) winsByPartyCycle[row.cycle_id] = {};
    const p = row.party_short || row.party;
    winsByPartyCycle[row.cycle_id][p] = (winsByPartyCycle[row.cycle_id][p] ?? 0) + 1;
  }

  return NextResponse.json({
    partyTrends: partyData ?? [],
    turnoutHistory: turnoutData ?? [],
    seatsByPartyPerCycle: winsByPartyCycle,
  });
}
