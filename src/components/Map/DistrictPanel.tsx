'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, ArrowRight, Vote, MapPin, ChevronDown, ChevronUp, Grid3x3, User, X } from 'lucide-react';
import { DistrictInfo, getMandalsByDistrict } from '@/lib/districtData';
import { getAssemblyByDistrict, hasRealData, getPartyColor, AssemblyConstituency } from '@/lib/constituencyData';
import { Constituency } from '@/types';
import { formatNumber } from '@/lib/utils';
import { CONSTITUENCY_COLORS } from '@/lib/colorSystem';

interface DistrictPanelProps {
  district: DistrictInfo;
  onConstituencySelect: (constituency: Constituency) => void;
}

interface MandalDetail {
  name: string;
  constituency?: AssemblyConstituency;
}

export function DistrictPanel({ district, onConstituencySelect }: DistrictPanelProps) {
  const realSeats = getAssemblyByDistrict(district.id);
  const hasReal = hasRealData(district.id);
  const genericMandals = getMandalsByDistrict(district.id);
  const [showMandals, setShowMandals] = useState(false);
  const [showAllAssembly, setShowAllAssembly] = useState(false);
  const [selectedMandal, setSelectedMandal] = useState<MandalDetail | null>(null);

  // Aggregate mandals from real constituency data when available
  const realMandalList: MandalDetail[] = hasReal
    ? realSeats.flatMap(seat =>
        (seat.mandals || []).map(m => ({ name: m, constituency: seat }))
      )
    : [];
  const useRealMandals = realMandalList.length > 0;
  const mandals = useRealMandals ? [] : genericMandals; // generic used only as fallback

  // Build Lok Sabha placeholder seats (one per seat count)
  const parlConstituencies: Constituency[] = Array.from({ length: district.lok_sabha_seats }, (_, i) => ({
    id: `${district.id}-lok-${i}`,
    district_id: district.id,
    state_id: district.state_id,
    name: district.lok_sabha_seats === 1 ? `${district.name}` : `${district.name} ${i + 1}`,
    type: 'parliament' as const,
    geojson_id: `${district.id}-lok-${i}`,
  }));

  // Use real assembly data if available, otherwise fall back to generic placeholders
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

  const visibleAssembly = showAllAssembly ? assemblyConstituencies : assemblyConstituencies.slice(0, 6);

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {/* District header */}
      <div className="glass-card p-4">
        <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-rajdhani)' }}>
          {district.name}
        </h2>
        <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-4">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          Headquarters: <span className="text-amber-400 font-medium">{district.headquarters}</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-xl p-2.5 text-center" style={{ background: CONSTITUENCY_COLORS.parliament.light, border: `1px solid ${CONSTITUENCY_COLORS.parliament.border}` }}>
            <div className="text-lg font-bold" style={{ color: CONSTITUENCY_COLORS.parliament.primary }}>{district.lok_sabha_seats}</div>
            <div className="text-xs text-slate-500 leading-tight">Lok Sabha</div>
          </div>
          <div className="rounded-xl p-2.5 text-center" style={{ background: CONSTITUENCY_COLORS.assembly.light, border: `1px solid ${CONSTITUENCY_COLORS.assembly.border}` }}>
            <div className="text-lg font-bold" style={{ color: CONSTITUENCY_COLORS.assembly.primary }}>{district.assembly_seats}</div>
            <div className="text-xs text-slate-500 leading-tight">Vidhan Sabha</div>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-2.5 text-center">
            <div className="text-lg font-bold text-green-400">{district.mandals_count}</div>
            <div className="text-xs text-slate-500 leading-tight">Mandals</div>
          </div>
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-2.5 text-center">
            <div className="text-sm font-bold text-violet-400">{district.population ? formatNumber(district.population) : 'N/A'}</div>
            <div className="text-xs text-slate-500 leading-tight">Population</div>
          </div>
        </div>
      </div>

      {/* Mandal detail popup */}
      <AnimatePresence>
        {selectedMandal && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="rounded-xl border border-green-500/30 bg-green-900/20 p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Grid3x3 className="w-4 h-4 text-green-400" />
                  <span className="font-bold text-white text-base">{selectedMandal.name} Mandal</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{district.name} District · Telangana</div>
              </div>
              <button onClick={() => setSelectedMandal(null)} className="text-slate-500 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            {selectedMandal.constituency && (
              <div className="space-y-2">
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Assembly Constituency</div>
                <div className="flex items-center justify-between rounded-lg bg-slate-800/60 border border-slate-700/40 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Vote className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-sm text-white font-semibold">{selectedMandal.constituency.name}</span>
                    {selectedMandal.constituency.reserved && (
                      <span className="text-xs px-1 py-0.5 rounded bg-purple-500/20 text-purple-400">{selectedMandal.constituency.reserved}</span>
                    )}
                  </div>
                </div>
                {selectedMandal.constituency.current_mla && (
                  <div className="flex items-center justify-between rounded-lg bg-slate-800/60 border border-slate-700/40 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      <div>
                        <div className="text-sm text-white font-medium">{selectedMandal.constituency.current_mla}</div>
                        <div className="text-xs text-slate-400">Current MLA</div>
                      </div>
                    </div>
                    {selectedMandal.constituency.mla_party && (
                      <span className="text-xs px-2 py-1 rounded font-bold"
                        style={{ background: getPartyColor(selectedMandal.constituency.mla_party).bg + '22',
                          color: getPartyColor(selectedMandal.constituency.mla_party).bg,
                          border: `1px solid ${getPartyColor(selectedMandal.constituency.mla_party).bg}44` }}>
                        {selectedMandal.constituency.mla_party}
                      </span>
                    )}
                  </div>
                )}
                <div className="text-xs text-slate-500 mt-1">
                  Gram Panchayat details and village-level data coming soon.
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mandals section */}
      <div>
        <button
          onClick={() => setShowMandals(!showMandals)}
          className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-700/60 bg-slate-800/30 hover:bg-slate-800/60 transition-all"
        >
          <div className="flex items-center gap-2">
            <Grid3x3 className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-slate-300">
              Mandals / Revenue Circles ({district.mandals_count})
            </span>
            {useRealMandals && <span className="text-xs text-green-500/70">· click to explore</span>}
          </div>
          {showMandals ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        <AnimatePresence>
          {showMandals && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {useRealMandals ? (
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {realMandalList.map((m, idx) => (
                    <motion.button
                      key={`${m.name}-${idx}`}
                      onClick={() => setSelectedMandal(selectedMandal?.name === m.name ? null : m)}
                      className="px-3 py-2 rounded-lg text-xs text-slate-300 flex items-center gap-1.5 text-left transition-all hover:text-white"
                      style={{
                        background: selectedMandal?.name === m.name ? 'rgba(34,197,94,0.15)' : 'rgba(30,41,59,0.4)',
                        border: selectedMandal?.name === m.name ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(71,85,105,0.4)',
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400/70 flex-shrink-0" />
                      <span className="truncate">{m.name}</span>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {mandals.map((mandal, idx) => (
                    <motion.div
                      key={mandal.id}
                      className="px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/40 text-xs text-slate-300 flex items-center gap-1.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400/60 flex-shrink-0" />
                      {mandal.name}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lok Sabha Constituencies */}
      {parlConstituencies.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CONSTITUENCY_COLORS.parliament.primary }} />
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Lok Sabha · Parliament
            </h3>
          </div>
          <div className="space-y-2">
            {parlConstituencies.map((c, idx) => (
              <motion.button
                key={c.id}
                onClick={() => onConstituencySelect(c)}
                className="w-full p-3 rounded-xl transition-all group flex items-center justify-between text-left hover:brightness-110"
                style={{ background: CONSTITUENCY_COLORS.parliament.light, border: `1px solid ${CONSTITUENCY_COLORS.parliament.border}` }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: CONSTITUENCY_COLORS.parliament.light, border: `1px solid ${CONSTITUENCY_COLORS.parliament.border}` }}>
                    <Landmark className="w-4 h-4" style={{ color: CONSTITUENCY_COLORS.parliament.primary }} />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{c.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: CONSTITUENCY_COLORS.parliament.text }}>Parliament • General</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:transition-colors" style={{ color: 'inherit' }} />
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Vidhan Sabha Constituencies */}
      {assemblyConstituencies.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CONSTITUENCY_COLORS.assembly.primary }} />
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Vidhan Sabha · Assembly ({district.assembly_seats} seats)
              {!hasReal && <span className="ml-1 text-amber-500/70 normal-case font-normal">(data loading)</span>}
            </h3>
          </div>
          <div className="space-y-2">
            {visibleAssembly.map((c, idx) => {
              const partyColor = getPartyColor(c.mla_party);
              return (
                <motion.button
                  key={c.id}
                  onClick={() => onConstituencySelect(c)}
                  className="w-full p-3 rounded-xl transition-all group flex items-center justify-between text-left hover:brightness-110"
                  style={{ background: CONSTITUENCY_COLORS.assembly.light, border: `1px solid ${CONSTITUENCY_COLORS.assembly.border}` }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: CONSTITUENCY_COLORS.assembly.light, border: `1px solid ${CONSTITUENCY_COLORS.assembly.border}` }}>
                      <Vote className="w-4 h-4" style={{ color: CONSTITUENCY_COLORS.assembly.primary }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-white text-sm">{c.name}</span>
                        {c.reserved && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/20">
                            {c.reserved}
                          </span>
                        )}
                      </div>
                      {c.current_mla ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <User className="w-3 h-3 text-slate-500 flex-shrink-0" />
                          <span className="text-xs text-slate-300 truncate">{c.current_mla}</span>
                          {c.mla_party && (
                            <span className="text-xs px-1.5 py-0.5 rounded font-semibold flex-shrink-0"
                              style={{ background: partyColor.bg + '22', color: partyColor.bg, border: `1px solid ${partyColor.bg}44` }}>
                              {c.mla_party}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs mt-0.5" style={{ color: CONSTITUENCY_COLORS.assembly.text }}>Assembly Constituency</span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0 ml-2" />
                </motion.button>
              );
            })}
          </div>

          {assemblyConstituencies.length > 6 && (
            <button
              onClick={() => setShowAllAssembly(!showAllAssembly)}
              className="w-full mt-2 py-2 rounded-xl border border-slate-700/50 text-xs text-slate-400 hover:text-white transition-all flex items-center justify-center gap-1"
            >
              {showAllAssembly
                ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                : <><ChevronDown className="w-3.5 h-3.5" /> +{assemblyConstituencies.length - 6} more seats</>}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
