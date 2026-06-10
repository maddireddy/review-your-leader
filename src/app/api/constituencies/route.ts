/**
 * GET /api/constituencies?districtId=TG-KHM
 * GET /api/constituencies?stateId=TG
 *
 * Returns constituencies from Supabase. Falls back to static data if DB unavailable.
 * Each constituency includes its mandal list.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAssemblyByDistrict, getAssemblyByState } from '@/lib/constituencyData';

const MEM: Map<string, { data: unknown; ts: number }> = new Map();
const TTL = 5 * 60 * 1000; // 5 min

function fromCache(key: string) {
  const hit = MEM.get(key);
  if (hit && Date.now() - hit.ts < TTL) return hit.data;
  return null;
}
function toCache(key: string, data: unknown) { MEM.set(key, { data, ts: Date.now() }); }

export async function GET(req: NextRequest) {
  const districtId = req.nextUrl.searchParams.get('districtId');
  const stateId    = req.nextUrl.searchParams.get('stateId');

  if (!districtId && !stateId) {
    return NextResponse.json({ error: 'districtId or stateId required' }, { status: 400 });
  }

  const cacheKey = districtId ? `d:${districtId}` : `s:${stateId}`;
  const cached = fromCache(cacheKey);
  if (cached) return NextResponse.json({ constituencies: cached, source: 'cache' });

  // Try Supabase
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key && !url.includes('your_supabase')) {
      const db = createClient(url, key);
      let q = db
        .from('assembly_constituencies')
        .select(`
          id, state_id, district_id, number, name, type, reserved,
          current_mla, mla_party, eci_code, last_election_year, ai_validated, ai_confidence,
          mandals(id, name, headquarters, village_count, population)
        `)
        .order('number');

      if (districtId) q = q.eq('district_id', districtId);
      else q = q.eq('state_id', stateId!);

      const { data, error } = await q;
      if (!error && data && data.length > 0) {
        toCache(cacheKey, data);
        return NextResponse.json({ constituencies: data, source: 'db' });
      }
    }
  } catch { /* fall through to static */ }

  // Static fallback
  const staticData = districtId
    ? getAssemblyByDistrict(districtId)
    : getAssemblyByState(stateId!);

  toCache(cacheKey, staticData);
  return NextResponse.json({ constituencies: staticData, source: 'static' });
}
