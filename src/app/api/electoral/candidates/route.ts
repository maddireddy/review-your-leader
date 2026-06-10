import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { fetchAdrCandidates } from '@/lib/electoralSources';

/**
 * GET /api/electoral/candidates
 * ?name=Narendra+Modi&stateId=GJ&year=2024
 *
 * Returns ADR affidavit data: assets, criminal cases, education, expenditure.
 */
export const maxDuration = 20;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const name    = searchParams.get('name') || '';
  const stateId = searchParams.get('stateId') || '';
  const year    = parseInt(searchParams.get('year') || '0', 10);

  const supabase = getSupabaseAdmin();

  // ── Query Supabase cache ──────────────────────────────────
  let query = supabase.from('candidate_profiles').select('*').limit(20);
  if (name)    query = query.ilike('candidate_name', `%${name}%`);
  if (stateId) query = query.eq('state_id', stateId);
  if (year)    query = query.eq('election_year', year);

  const { data: cached } = await query;
  if (cached && cached.length > 0) {
    return NextResponse.json({ candidates: cached, fromCache: true });
  }

  // ── Fetch from ADR ────────────────────────────────────────
  if (stateId && year) {
    // Map state ID back to full name for ADR
    const STATE_NAMES: Record<string, string> = {
      AP: 'Andhra Pradesh', AR: 'Arunachal Pradesh', AS: 'Assam', BR: 'Bihar',
      CG: 'Chhattisgarh', GA: 'Goa', GJ: 'Gujarat', HR: 'Haryana',
      HP: 'Himachal Pradesh', JH: 'Jharkhand', KA: 'Karnataka', KL: 'Kerala',
      MP: 'Madhya Pradesh', MH: 'Maharashtra', MN: 'Manipur', ML: 'Meghalaya',
      MZ: 'Mizoram', NL: 'Nagaland', OR: 'Odisha', PB: 'Punjab',
      RJ: 'Rajasthan', SK: 'Sikkim', TN: 'Tamil Nadu', TS: 'Telangana',
      TR: 'Tripura', UP: 'Uttar Pradesh', UK: 'Uttarakhand', WB: 'West Bengal',
      DL: 'Delhi', PY: 'Puducherry', JK: 'Jammu And Kashmir',
    };
    const stateName = STATE_NAMES[stateId] ?? stateId;
    const adrData = await fetchAdrCandidates(stateName, year);

    if (adrData.length > 0) {
      const rows = adrData.map(c => ({
        candidate_name: c.candidate_name,
        state_id: stateId,
        party: c.party,
        constituency: c.constituency,
        election_year: c.year,
        age: c.age,
        gender: c.gender,
        education: c.education,
        total_assets: c.total_assets,
        total_liabilities: c.total_liabilities,
        criminal_cases: c.criminal_cases,
        serious_criminal_cases: c.serious_criminal_cases,
        affidavit_url: c.affidavit_url,
        source: 'ADR',
      }));

      await supabase.from('candidate_profiles').upsert(rows, {
        onConflict: 'candidate_name,state_id,election_year,constituency',
        ignoreDuplicates: true,
      });

      const filtered = name
        ? rows.filter(r => r.candidate_name.toLowerCase().includes(name.toLowerCase()))
        : rows.slice(0, 20);

      return NextResponse.json({ candidates: filtered, fromCache: false });
    }
  }

  return NextResponse.json({ candidates: [], fromCache: false });
}
