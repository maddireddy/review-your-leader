/**
 * GET /api/mandals?districtId=TG-KHM
 * GET /api/mandals?constituencyId=TG-117
 * GET /api/mandals?stateId=TG
 *
 * Returns mandals from Supabase. Falls back to static data.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getMandalsByDistrict } from '@/lib/districtData';
import { getAssemblyByDistrict } from '@/lib/constituencyData';

const MEM: Map<string, { data: unknown; ts: number }> = new Map();
const TTL = 10 * 60 * 1000; // 10 min

export async function GET(req: NextRequest) {
  const districtId      = req.nextUrl.searchParams.get('districtId');
  const constituencyId  = req.nextUrl.searchParams.get('constituencyId');
  const stateId         = req.nextUrl.searchParams.get('stateId');

  if (!districtId && !constituencyId && !stateId) {
    return NextResponse.json({ error: 'districtId, constituencyId, or stateId required' }, { status: 400 });
  }

  const cacheKey = districtId ? `d:${districtId}` : constituencyId ? `c:${constituencyId}` : `s:${stateId}`;
  const hit = MEM.get(cacheKey);
  if (hit && Date.now() - hit.ts < TTL) return NextResponse.json({ mandals: hit.data, source: 'cache' });

  // Try Supabase
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key && !url.includes('your_supabase')) {
      const db = createClient(url, key);
      let q = db
        .from('mandals')
        .select(`
          id, state_id, district_id, constituency_id, name, headquarters,
          village_count, population, area_sq_km,
          assembly_constituencies(id, name, current_mla, mla_party, reserved, number)
        `)
        .order('name');

      if (districtId)     q = q.eq('district_id', districtId);
      else if (constituencyId) q = q.eq('constituency_id', constituencyId);
      else q = q.eq('state_id', stateId!);

      const { data, error } = await q;
      if (!error && data && data.length > 0) {
        MEM.set(cacheKey, { data, ts: Date.now() });
        return NextResponse.json({ mandals: data, source: 'db', count: data.length });
      }
    }
  } catch { /* fall through */ }

  // Static fallback — reconstruct from constituencyData mandal arrays
  if (districtId) {
    const seats = getAssemblyByDistrict(districtId);
    const staticMandals = seats.flatMap(seat =>
      (seat.mandals ?? []).map(name => ({
        id: `${seat.district_id}-${name.replace(/\s+/g, '-').toUpperCase()}`,
        state_id: seat.state_id,
        district_id: seat.district_id,
        constituency_id: seat.id,
        name,
        assembly_constituencies: {
          id: seat.id,
          name: seat.name,
          current_mla: seat.current_mla ?? null,
          mla_party: seat.mla_party ?? null,
          reserved: seat.reserved ?? null,
          number: seat.number,
        },
      }))
    );

    // Fall back to districtData mandals if no constituency-level data
    const fallback = staticMandals.length > 0
      ? staticMandals
      : getMandalsByDistrict(districtId).map(m => ({
          id: m.id,
          state_id: m.district_id.split('-')[0],
          district_id: m.district_id,
          constituency_id: null,
          name: m.name,
          assembly_constituencies: null,
        }));

    MEM.set(cacheKey, { data: fallback, ts: Date.now() });
    return NextResponse.json({ mandals: fallback, source: 'static', count: fallback.length });
  }

  return NextResponse.json({ mandals: [], source: 'static', count: 0 });
}
