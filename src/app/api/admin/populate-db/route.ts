import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { INDIA_STATES } from '@/lib/indiaData';
import { getDistrictsByState } from '@/lib/districtData';
import { getMandalsByDistrict } from '@/lib/districtData';
import { getAssemblyByDistrict } from '@/lib/constituencyData';

/**
 * POST /api/admin/populate-db
 * Seeds all static data into Supabase after a schema reset.
 * Protected by CRON_SECRET.
 *
 * Run order: states → districts → assembly_constituencies → mandals
 */

export const maxDuration = 300;

function auth(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
  return secret === process.env.CRON_SECRET;
}

async function chunk<T>(arr: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const log: Record<string, unknown> = {};

  // ── 1. States ────────────────────────────────────────────────────────────
  const stateRows = INDIA_STATES.map(s => ({
    id: s.id,
    name: s.name,
    capital: s.capital,
    ruling_party: s.ruling_party,
    chief_minister: s.chief_minister,
    cm_party: s.cm_party,
    formed_year: s.formed_year,
    districts_count: s.districts_count,
    is_ut: s.is_ut,
  }));
  const { error: stateErr, count: stateCount } = await supabase
    .from('states')
    .upsert(stateRows, { onConflict: 'id' });
  log.states = { count: stateCount, error: stateErr?.message };

  // ── 2. Districts ──────────────────────────────────────────────────────────
  const districtRows = INDIA_STATES.flatMap(s => {
    const districts = getDistrictsByState(s.id);
    return districts.map(d => ({
      id: d.id,
      state_id: d.state_id,
      name: d.name,
      headquarters: d.headquarters,
      population: d.population,
      area_km2: d.area_km2,
      mandals_count: d.mandals_count,
      assembly_seats: d.assembly_seats,
      lok_sabha_seats: d.lok_sabha_seats,
    }));
  });
  for (const batch of await chunk(districtRows, 100)) {
    await supabase.from('districts').upsert(batch, { onConflict: 'id' });
  }
  log.districts = { count: districtRows.length };

  // ── 3. Assembly constituencies ────────────────────────────────────────────
  const assemblyRows: Record<string, unknown>[] = [];
  for (const s of INDIA_STATES) {
    for (const d of getDistrictsByState(s.id)) {
      const seats = getAssemblyByDistrict(d.id);
      for (const seat of seats) {
        assemblyRows.push({
          id: seat.id,
          state_id: seat.state_id ?? s.id,
          district_id: seat.district_id ?? d.id,
          name: seat.name,
          number: seat.number,
          reserved: seat.reserved ?? null,
          current_mla: seat.current_mla ?? null,
          mla_party: seat.mla_party ?? null,
        });
      }
    }
  }
  for (const batch of await chunk(assemblyRows, 100)) {
    await supabase.from('assembly_constituencies').upsert(batch, { onConflict: 'id' });
  }
  log.assembly = { count: assemblyRows.length };

  // ── 4. Mandals ────────────────────────────────────────────────────────────
  const mandalRows: Record<string, unknown>[] = [];
  for (const s of INDIA_STATES) {
    for (const d of getDistrictsByState(s.id)) {
      const mandals = getMandalsByDistrict(d.id);
      for (const m of mandals) {
        // Find constituency for this mandal
        const seats = getAssemblyByDistrict(d.id);
        const matchSeat = seats.find(seat =>
          (seat.mandals || []).some(mn => mn.toLowerCase() === m.name.toLowerCase())
        );
        mandalRows.push({
          id: m.id,
          district_id: m.district_id,
          name: m.name,
          type: m.type,
          constituency_id: matchSeat?.id ?? null,
        });
      }
    }
  }
  for (const batch of await chunk(mandalRows, 200)) {
    await supabase.from('mandals').upsert(batch, { onConflict: 'id' });
  }
  log.mandals = { count: mandalRows.length };

  return NextResponse.json({
    success: true,
    summary: log,
    timestamp: new Date().toISOString(),
  });
}
