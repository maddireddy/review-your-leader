/**
 * POST /api/admin/seed-constituencies
 * Seeds the assembly_constituencies + mandals tables from static TypeScript data.
 * Also seeds districts table with full metadata.
 * Protected by CRON_SECRET. Run once after schema v7 migration.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { INDIA_STATES } from '@/lib/indiaData';
import { getDistrictsByState } from '@/lib/districtData';
import { getAssemblyByDistrict, getAssemblyByState } from '@/lib/constituencyData';

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const db = supabase();
  const log: string[] = [];
  let totalConstituencies = 0;
  let totalMandals = 0;
  let totalDistricts = 0;

  try {
    // ── 1. Seed states ──────────────────────────────────────────
    const stateRows = INDIA_STATES.map(s => ({
      id: s.id,
      name: s.name,
      capital: s.capital,
      capital_lat: s.capital_lat ?? 0,
      capital_lng: s.capital_lng ?? 0,
      population: s.population ?? null,
      area_km2: s.area_km2 ?? null,
      chief_minister: s.chief_minister ?? null,
      ruling_party: s.ruling_party ?? null,
      geojson_id: s.geojson_id ?? s.id,
    }));
    const { error: stateErr } = await db
      .from('states')
      .upsert(stateRows, { onConflict: 'id', ignoreDuplicates: false });
    if (stateErr) log.push(`states error: ${stateErr.message}`);
    else log.push(`seeded ${stateRows.length} states`);

    // ── 2. Seed districts ───────────────────────────────────────
    const allStateIds = INDIA_STATES.map(s => s.id);
    const districtRows: Record<string, unknown>[] = [];
    for (const stateId of allStateIds) {
      const districts = getDistrictsByState(stateId);
      for (const d of districts) {
        districtRows.push({
          id: d.id,
          state_id: d.state_id,
          name: d.name,
          headquarters: d.headquarters,
          population: d.population ?? null,
          area_km2: d.area_km2 ?? null,
          geojson_id: d.id,
          mandals_count: d.mandals_count ?? 0,
          assembly_seats: d.assembly_seats ?? 0,
          lok_sabha_seats: d.lok_sabha_seats ?? 1,
        });
      }
    }
    const { error: distErr } = await db
      .from('districts')
      .upsert(districtRows, { onConflict: 'id', ignoreDuplicates: false });
    if (distErr) log.push(`districts error: ${distErr.message}`);
    else { log.push(`seeded ${districtRows.length} districts`); totalDistricts = districtRows.length; }

    // ── 3. Seed assembly constituencies ─────────────────────────
    const constRows: Record<string, unknown>[] = [];
    for (const stateId of allStateIds) {
      const seats = getAssemblyByState(stateId);
      for (const s of seats) {
        constRows.push({
          id: s.id,
          state_id: s.state_id,
          district_id: s.district_id,
          number: s.number,
          name: s.name,
          type: 'assembly',
          reserved: s.reserved ?? null,
          current_mla: s.current_mla ?? null,
          mla_party: s.mla_party ?? null,
          source: 'static',
          updated_at: new Date().toISOString(),
        });
      }
    }
    // Batch insert in chunks of 200
    for (let i = 0; i < constRows.length; i += 200) {
      const chunk = constRows.slice(i, i + 200);
      const { error } = await db
        .from('assembly_constituencies')
        .upsert(chunk, { onConflict: 'id', ignoreDuplicates: false });
      if (error) log.push(`constituencies chunk ${i}: ${error.message}`);
    }
    totalConstituencies = constRows.length;
    log.push(`seeded ${totalConstituencies} assembly constituencies`);

    // ── 4. Seed mandals ─────────────────────────────────────────
    const mandalRows: Record<string, unknown>[] = [];
    for (const stateId of allStateIds) {
      const seats = getAssemblyByState(stateId);
      for (const seat of seats) {
        for (const mandalName of seat.mandals ?? []) {
          const slug = mandalName.replace(/\s+/g, '-').toUpperCase().substring(0, 12);
          mandalRows.push({
            id: `${seat.district_id}-${slug}`,
            state_id: seat.state_id,
            district_id: seat.district_id,
            constituency_id: seat.id,
            name: mandalName,
            source: 'static',
          });
        }
      }
    }
    // Also add mandals from districtData that aren't covered by constituency data
    // (districts without real assembly data still have mandal lists)
    const { getMandalsByDistrict } = await import('@/lib/districtData');
    const seededDistrictIds = new Set(mandalRows.map(m => m.district_id as string));
    for (const stateId of allStateIds) {
      const districts = getDistrictsByState(stateId);
      for (const d of districts) {
        if (seededDistrictIds.has(d.id)) continue; // already seeded from constituency data
        const dMandals = getMandalsByDistrict(d.id);
        for (const m of dMandals) {
          if (m.name.startsWith('Mandal ')) continue; // skip placeholders
          mandalRows.push({
            id: m.id,
            state_id: d.state_id,
            district_id: d.id,
            constituency_id: null,
            name: m.name,
            source: 'static',
          });
        }
      }
    }
    for (let i = 0; i < mandalRows.length; i += 200) {
      const chunk = mandalRows.slice(i, i + 200);
      const { error } = await db
        .from('mandals')
        .upsert(chunk, { onConflict: 'district_id,name', ignoreDuplicates: true });
      if (error) log.push(`mandals chunk ${i}: ${error.message}`);
    }
    totalMandals = mandalRows.length;
    log.push(`seeded ${totalMandals} mandals`);

    return NextResponse.json({
      ok: true,
      summary: { states: stateRows.length, districts: totalDistricts, constituencies: totalConstituencies, mandals: totalMandals },
      log,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err), log }, { status: 500 });
  }
}
