'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Landmark, ArrowRight, Vote, MapPin, Grid3x3, User, X, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { DistrictInfo, getMandalsByDistrict } from '@/lib/districtData';
import { getAssemblyByDistrict, hasRealData, getPartyColor, AssemblyConstituency } from '@/lib/constituencyData';
import { Constituency } from '@/types';
import { formatNumber } from '@/lib/utils';
import { CONSTITUENCY_COLORS } from '@/lib/colorSystem';

interface DistrictPanelProps {
  district: DistrictInfo;
  onConstituencySelect: (constituency: Constituency) => void;
}

interface MandalDetail { name: string; constituency?: AssemblyConstituency }

// DB mandal shape (from /api/mandals)
interface DbMandal {
  id: string;
  name: string;
  constituency_id: string | null;
  assembly_constituencies?: {
    id: string; name: string; current_mla: string | null;
    mla_party: string | null; reserved: string | null; number: number;
  } | null;
}

// Party badge component
function PartyBadge({ party }: { party?: string }) {
  if (!party) return null;
  const c = getPartyColor(party);
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold flex-shrink-0"
      style={{ background: c.bg + '22', color: c.bg, border: `1px solid ${c.bg}44` }}>
      {party}
    </span>
  );
}

export function DistrictPanel({ district, onConstituencySelect }: DistrictPanelProps) {
  // Static data — immediate render
  const staticSeats = getAssemblyByDistrict(district.id);
  const hasStaticReal = hasRealData(district.id);

  const staticMandalList: MandalDetail[] = hasStaticReal
    ? staticSeats.flatMap(seat => (seat.mandals || []).map(m => ({ name: m, constituency: seat })))
    : [];
  const staticFallback = staticMandalList.length > 0 ? [] : getMandalsByDistrict(district.id);

  // DB-enriched data (fetched from API)
  const [dbMandals, setDbMandals] = useState<DbMandal[] | null>(null);
  const [dbSeats, setDbSeats] = useState<AssemblyConstituency[] | null>(null);
  const [dataSource, setDataSource] = useState<'static' | 'db' | 'cache'>('static');
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchFromDb() {
      setFetching(true);
      try {
        const [mandalsRes, constsRes] = await Promise.all([
          fetch(`/api/mandals?districtId=${district.id}`),
          fetch(`/api/constituencies?districtId=${district.id}`),
        ]);
        if (cancelled) return;
        if (mandalsRes.ok) {
          const d = await mandalsRes.json();
          if (!cancelled && d.mandals?.length > 0) {
            setDbMandals(d.mandals);
            setDataSource(d.source);
          }
        }
        if (constsRes.ok) {
          const d = await constsRes.json();
          if (!cancelled && d.constituencies?.length > 0) {
            setDbSeats(d.constituencies);
          }
        }
      } catch { /* use static */ }
      if (!cancelled) setFetching(false);
    }
    fetchFromDb();
    return () => { cancelled = true; };
  }, [district.id]);

  // Resolve which data to render
  const seats: AssemblyConstituency[] = dbSeats ?? staticSeats;
  const hasReal = seats.length > 0 && (dbSeats !== null ? true : hasStaticReal);

  const mandalList: MandalDetail[] = dbMandals
    ? dbMandals.map(m => ({
        name: m.name,
        constituency: m.assembly_constituencies
          ? {
              id: m.assembly_constituencies.id,
              state_id: district.state_id,
              district_id: district.id,
              number: m.assembly_constituencies.number,
              name: m.assembly_constituencies.name,
              current_mla: m.assembly_constituencies.current_mla ?? undefined,
              mla_party: m.assembly_constituencies.mla_party ?? undefined,
              reserved: (m.assembly_constituencies.reserved as 'SC' | 'ST' | undefined),
            }
          : undefined,
      }))
    : staticMandalList;

  const useRealMandals = mandalList.length > 0;
  const fallbackMandals = useRealMandals ? [] : staticFallback;

  const [selectedMandal, setSelectedMandal] = useState<MandalDetail | null>(null);
  const [showAllAssembly, setShowAllAssembly] = useState(false);
  const [showMandals, setShowMandals] = useState(true);

  const parlConstituencies: Constituency[] = Array.from({ length: district.lok_sabha_seats }, (_, i) => ({
    id: `${district.id}-lok-${i}`,
    district_id: district.id,
    state_id: district.state_id,
    name: district.lok_sabha_seats === 1 ? district.name : `${district.name} ${i + 1}`,
    type: 'parliament' as const,
    geojson_id: `${district.id}-lok-${i}`,
  }));

  const assemblyConstituencies: Constituency[] = hasReal
    ? seats.map(s => ({
        id: s.id,
        district_id: s.district_id,
        state_id: s.state_id,
        name: s.name,
        type: 'assembly' as const,
        reserved: s.reserved,
        geojson_id: s.id,
        current_mla: s.current_mla,
        mla_party: s.mla_party,
      }))
    : Array.from({ length: district.assembly_seats }, (_, i) => ({
        id: `${district.id}-vid-${i}`,
        district_id: district.id,
        state_id: district.state_id,
        name: `Constituency ${i + 1}`,
        type: 'assembly' as const,
        geojson_id: `${district.id}-vid-${i}`,
      }));

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {/* ── District header ─────────────────────────────────────────── */}
      <div className="glass-card p-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-rajdhani)' }}>
              {district.name}
            </h2>
            <div className="text-xs text-slate-400">
              HQ: <span className="text-amber-400 font-medium">{district.headquarters}</span>
              {district.area_km2 && <span className="ml-2 text-slate-500">· {formatNumber(district.area_km2)} km²</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { val: district.lok_sabha_seats, label: 'Lok Sabha', color: CONSTITUENCY_COLORS.parliament.primary, bg: CONSTITUENCY_COLORS.parliament.light, border: CONSTITUENCY_COLORS.parliament.border },
            { val: district.assembly_seats,  label: 'Vidhan Sabha', color: CONSTITUENCY_COLORS.assembly.primary, bg: CONSTITUENCY_COLORS.assembly.light, border: CONSTITUENCY_COLORS.assembly.border },
            { val: district.mandals_count,   label: 'Mandals', color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' },
            { val: district.population ? formatNumber(district.population) : 'N/A', label: 'Population', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-2.5 text-center" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
              <div className="text-base font-bold" style={{ color: s.color }}>{s.val}</div>
              <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MANDALS — Primary drill-down ─────────────────────────────── */}
      <div className="glass-card p-3">
        <button
          className="w-full flex items-center justify-between mb-2"
          onClick={() => setShowMandals(s => !s)}
        >
          <div className="flex items-center gap-2">
            <Grid3x3 className="w-4 h-4 text-green-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Mandals
            </span>
            <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold">
              {useRealMandals ? mandalList.length : fallbackMandals.length}
            </span>
            {useRealMandals && (
              <span className="text-[10px] text-green-500/60">· tap → Assembly &amp; MLA</span>
            )}
            {fetching && <RefreshCw className="w-3 h-3 text-slate-500 animate-spin" />}
            {dataSource === 'db' && <span className="text-[10px] text-indigo-400/60">· DB</span>}
          </div>
          {showMandals ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        {/* Mandal detail card — shows when a mandal is clicked */}
        {selectedMandal && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 rounded-xl border border-green-500/30 bg-green-900/20 p-3"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Grid3x3 className="w-4 h-4 text-green-400" />
                <span className="font-bold text-white text-sm">{selectedMandal.name} Mandal</span>
              </div>
              <button onClick={() => setSelectedMandal(null)} className="text-slate-500 hover:text-white p-0.5 rounded">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {selectedMandal.constituency ? (
              <div className="space-y-1.5">
                {/* Assembly constituency */}
                <motion.button
                  className="w-full flex items-center gap-2 rounded-lg bg-indigo-900/30 border border-indigo-500/30 px-2.5 py-2 text-left hover:border-indigo-500/60 transition-all"
                  onClick={() => onConstituencySelect({
                    id: selectedMandal.constituency!.id,
                    district_id: district.id,
                    state_id: district.state_id,
                    name: selectedMandal.constituency!.name,
                    type: 'assembly',
                    reserved: selectedMandal.constituency!.reserved,
                    geojson_id: selectedMandal.constituency!.id,
                    current_mla: selectedMandal.constituency!.current_mla,
                    mla_party: selectedMandal.constituency!.mla_party,
                  })}
                >
                  <Vote className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-white font-semibold">{selectedMandal.constituency.name}</span>
                      {selectedMandal.constituency.reserved && (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-400">{selectedMandal.constituency.reserved}</span>
                      )}
                    </div>
                    <div className="text-[10px] text-indigo-300/70">Assembly constituency · tap to explore</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                </motion.button>
                {/* MLA */}
                {selectedMandal.constituency.current_mla && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-900/20 border border-amber-500/20 px-2.5 py-2">
                    <User className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm text-white font-medium">{selectedMandal.constituency.current_mla}</div>
                      <div className="text-[10px] text-amber-400/70">MLA · 2023</div>
                    </div>
                    <PartyBadge party={selectedMandal.constituency.mla_party} />
                  </div>
                )}
                <div className="text-[10px] text-slate-600 px-1">
                  {district.name} · {district.state_id === 'TG' ? 'Telangana' : district.state_id === 'AP' ? 'Andhra Pradesh' : district.state_id}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 px-1">Assembly constituency data not available for this mandal yet.</div>
            )}
          </motion.div>
        )}

        {showMandals && (
          <div className="grid grid-cols-2 gap-1.5">
            {useRealMandals
              ? mandalList.map((m, i) => (
                  <motion.button
                    key={`${m.name}-${i}`}
                    onClick={() => setSelectedMandal(prev => prev?.name === m.name ? null : m)}
                    className="px-2.5 py-2 rounded-lg text-xs text-left transition-all flex items-center gap-1.5"
                    style={{
                      background: selectedMandal?.name === m.name ? 'rgba(34,197,94,0.15)' : 'rgba(30,41,59,0.5)',
                      border: selectedMandal?.name === m.name ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(71,85,105,0.4)',
                      color: selectedMandal?.name === m.name ? '#86efac' : '#94a3b8',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.015 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400/70 flex-shrink-0" />
                    <span className="truncate font-medium">{m.name}</span>
                    {m.constituency && <ArrowRight className="w-2.5 h-2.5 ml-auto text-slate-600 flex-shrink-0" />}
                  </motion.button>
                ))
              : fallbackMandals.map((mandal) => (
                  <div
                    key={mandal.id}
                    className="px-2.5 py-2 rounded-lg bg-slate-800/40 border border-slate-700/40 text-xs text-slate-400 flex items-center gap-1.5"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500/60 flex-shrink-0" />
                    <span className="truncate">{mandal.name}</span>
                  </div>
                ))
            }
          </div>
        )}
      </div>

      {/* ── Assembly Constituencies — Reference list ──────────────────── */}
      <div className="glass-card p-3">
        <button
          className="w-full flex items-center justify-between mb-2"
          onClick={() => setShowAllAssembly(s => !s)}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CONSTITUENCY_COLORS.assembly.primary }} />
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Vidhan Sabha · {district.assembly_seats} Seats
            </h3>
            {!hasReal && <span className="text-[10px] text-amber-500/70">loading…</span>}
          </div>
          {showAllAssembly ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        {showAllAssembly && (
          <div className="space-y-1.5">
            {assemblyConstituencies.map((c, i) => (
              <motion.button
                key={c.id}
                onClick={() => onConstituencySelect(c)}
                className="w-full px-3 py-2.5 rounded-xl transition-all group flex items-center justify-between text-left"
                style={{ background: CONSTITUENCY_COLORS.assembly.light, border: `1px solid ${CONSTITUENCY_COLORS.assembly.border}` }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ scale: 1.01, filter: 'brightness(1.15)' }}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <Vote className="w-3.5 h-3.5 flex-shrink-0" style={{ color: CONSTITUENCY_COLORS.assembly.primary }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-white text-sm">{c.name}</span>
                      {c.reserved && (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/20">{c.reserved}</span>
                      )}
                    </div>
                    {c.current_mla ? (
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <User className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        <span className="text-xs text-slate-300 truncate">{c.current_mla}</span>
                        <PartyBadge party={c.mla_party} />
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500">Assembly constituency</span>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0 ml-2" />
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lok Sabha ────────────────────────────────────────────────── */}
      {parlConstituencies.length > 0 && (
        <div className="glass-card p-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CONSTITUENCY_COLORS.parliament.primary }} />
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Lok Sabha · Parliament
            </h3>
          </div>
          <div className="space-y-1.5">
            {parlConstituencies.map((c, i) => (
              <motion.button
                key={c.id}
                onClick={() => onConstituencySelect(c)}
                className="w-full px-3 py-2.5 rounded-xl transition-all group flex items-center justify-between text-left"
                style={{ background: CONSTITUENCY_COLORS.parliament.light, border: `1px solid ${CONSTITUENCY_COLORS.parliament.border}` }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center gap-2.5">
                  <Landmark className="w-4 h-4" style={{ color: CONSTITUENCY_COLORS.parliament.primary }} />
                  <span className="font-semibold text-white text-sm">{c.name}</span>
                  <span className="text-[10px]" style={{ color: CONSTITUENCY_COLORS.parliament.text }}>Parliament</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-sky-400 transition-colors" />
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
