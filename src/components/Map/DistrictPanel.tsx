'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Landmark, ArrowRight, Vote, MapPin, Grid3x3, User, X, ChevronDown, ChevronUp } from 'lucide-react';
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
  const realSeats = getAssemblyByDistrict(district.id);
  const hasReal = hasRealData(district.id);

  // Build mandal list — prefer real seat-level mandals, fallback to district-level lookup
  const realMandalList: MandalDetail[] = hasReal
    ? realSeats.flatMap(seat => (seat.mandals || []).map(m => ({ name: m, constituency: seat })))
    : [];
  const useRealMandals = realMandalList.length > 0;
  const fallbackMandals = useRealMandals ? [] : getMandalsByDistrict(district.id);

  const [selectedMandal, setSelectedMandal] = useState<MandalDetail | null>(null);
  const [showAllAssembly, setShowAllAssembly] = useState(false);
  const [showMandals, setShowMandals] = useState(true); // open by default

  const parlConstituencies: Constituency[] = Array.from({ length: district.lok_sabha_seats }, (_, i) => ({
    id: `${district.id}-lok-${i}`,
    district_id: district.id,
    state_id: district.state_id,
    name: district.lok_sabha_seats === 1 ? district.name : `${district.name} ${i + 1}`,
    type: 'parliament' as const,
    geojson_id: `${district.id}-lok-${i}`,
  }));

  const assemblyConstituencies: Constituency[] = hasReal
    ? realSeats.map(s => ({
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

  const visibleAssembly = showAllAssembly ? assemblyConstituencies : assemblyConstituencies.slice(0, 8);

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

      {/* ── Assembly Constituencies ──────────────────────────────────── */}
      <div className="glass-card p-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CONSTITUENCY_COLORS.assembly.primary }} />
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex-1">
            Vidhan Sabha · {district.assembly_seats} Seats
          </h3>
          {!hasReal && <span className="text-[10px] text-amber-500/70">data loading</span>}
        </div>

        <div className="space-y-1.5">
          {visibleAssembly.map((c, idx) => (
            <motion.button
              key={c.id}
              onClick={() => onConstituencySelect(c)}
              className="w-full px-3 py-2.5 rounded-xl transition-all group flex items-center justify-between text-left"
              style={{ background: CONSTITUENCY_COLORS.assembly.light, border: `1px solid ${CONSTITUENCY_COLORS.assembly.border}` }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              whileHover={{ scale: 1.01, filter: 'brightness(1.15)' }}
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: CONSTITUENCY_COLORS.assembly.light, border: `1px solid ${CONSTITUENCY_COLORS.assembly.border}` }}>
                  <Vote className="w-3.5 h-3.5" style={{ color: CONSTITUENCY_COLORS.assembly.primary }} />
                </div>
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

        {assemblyConstituencies.length > 8 && (
          <button
            onClick={() => setShowAllAssembly(!showAllAssembly)}
            className="w-full mt-2 py-2 rounded-xl border border-slate-700/50 text-xs text-slate-400 hover:text-white transition-all flex items-center justify-center gap-1"
          >
            {showAllAssembly
              ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
              : <><ChevronDown className="w-3.5 h-3.5" /> +{assemblyConstituencies.length - 8} more seats</>}
          </button>
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
            {parlConstituencies.map((c, idx) => (
              <motion.button
                key={c.id}
                onClick={() => onConstituencySelect(c)}
                className="w-full px-3 py-2.5 rounded-xl transition-all group flex items-center justify-between text-left"
                style={{ background: CONSTITUENCY_COLORS.parliament.light, border: `1px solid ${CONSTITUENCY_COLORS.parliament.border}` }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
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

      {/* ── Mandals ──────────────────────────────────────────────────── */}
      <div className="glass-card p-3">
        <button
          className="w-full flex items-center justify-between mb-2"
          onClick={() => setShowMandals(s => !s)}
        >
          <div className="flex items-center gap-2">
            <Grid3x3 className="w-4 h-4 text-green-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Mandals / Revenue Circles
            </span>
            <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold">
              {useRealMandals ? realMandalList.length : fallbackMandals.length}
            </span>
            {useRealMandals && (
              <span className="text-[10px] text-green-500/60">· tap for MLA info</span>
            )}
          </div>
          {showMandals ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        {/* Mandal popup */}
        {selectedMandal && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 rounded-xl border border-green-500/30 bg-green-900/20 p-3"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Grid3x3 className="w-4 h-4 text-green-400" />
                <span className="font-bold text-white">{selectedMandal.name} Mandal</span>
              </div>
              <button onClick={() => setSelectedMandal(null)} className="text-slate-500 hover:text-white p-0.5 rounded">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {selectedMandal.constituency && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 rounded-lg bg-slate-800/60 border border-slate-700/40 px-2.5 py-2">
                  <Vote className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                  <span className="text-xs text-white font-semibold">{selectedMandal.constituency.name}</span>
                  {selectedMandal.constituency.reserved && (
                    <span className="text-[10px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-400">{selectedMandal.constituency.reserved}</span>
                  )}
                  <span className="text-[10px] text-slate-500 ml-auto">Assembly</span>
                </div>
                {selectedMandal.constituency.current_mla && (
                  <div className="flex items-center gap-2 rounded-lg bg-slate-800/60 border border-slate-700/40 px-2.5 py-2">
                    <User className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <span className="text-xs text-white font-medium">{selectedMandal.constituency.current_mla}</span>
                    <span className="text-[10px] text-slate-500">MLA</span>
                    <PartyBadge party={selectedMandal.constituency.mla_party} />
                  </div>
                )}
                <div className="text-[10px] text-slate-600 px-1">
                  {district.name} District · {district.state_id === 'TG' ? 'Telangana' : district.state_id === 'AP' ? 'Andhra Pradesh' : district.state_id}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {showMandals && (
          <div className="grid grid-cols-2 gap-1.5">
            {useRealMandals
              ? realMandalList.map((m, idx) => (
                  <motion.button
                    key={`${m.name}-${idx}`}
                    onClick={() => setSelectedMandal(prev => prev?.name === m.name ? null : m)}
                    className="px-2.5 py-2 rounded-lg text-xs text-left transition-all flex items-center gap-1.5"
                    style={{
                      background: selectedMandal?.name === m.name ? 'rgba(34,197,94,0.15)' : 'rgba(30,41,59,0.5)',
                      border: selectedMandal?.name === m.name ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(71,85,105,0.4)',
                      color: selectedMandal?.name === m.name ? '#86efac' : '#94a3b8',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.015 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400/70 flex-shrink-0" />
                    <span className="truncate font-medium">{m.name}</span>
                  </motion.button>
                ))
              : fallbackMandals.map((mandal, idx) => (
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
    </motion.div>
  );
}
