'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, ArrowRight, Vote, MapPin, ChevronDown, ChevronUp, Grid3x3 } from 'lucide-react';
import { DistrictInfo, getMandalsByDistrict } from '@/lib/districtData';
import { Constituency } from '@/types';
import { formatNumber } from '@/lib/utils';
import { CONSTITUENCY_COLORS } from '@/lib/colorSystem';

function getConstituencies(district: DistrictInfo): Constituency[] {
  const lok: Constituency[] = Array.from({ length: district.lok_sabha_seats }, (_, i) => ({
    id: `${district.id}-lok-${i}`,
    district_id: district.id,
    state_id: district.state_id,
    name: i === 0 ? `${district.name} (Lok Sabha)` : `${district.name} - ${i + 1} (Lok Sabha)`,
    type: 'parliament' as const,
    geojson_id: `${district.id}-lok-${i}`,
  }));

  const vidhan: Constituency[] = Array.from({ length: Math.min(district.assembly_seats, 6) }, (_, i) => {
    const suffixes = ['North', 'South', 'East', 'West', 'Central', 'Rural'];
    return {
      id: `${district.id}-vid-${i}`,
      district_id: district.id,
      state_id: district.state_id,
      name: `${district.name} ${suffixes[i] || i + 1} (Vidhan Sabha)`,
      type: 'assembly' as const,
      reserved: i === 2 ? 'SC' : i === 4 ? 'ST' : undefined,
      geojson_id: `${district.id}-vid-${i}`,
    };
  });

  return [...lok, ...vidhan];
}

interface DistrictPanelProps {
  district: DistrictInfo;
  onConstituencySelect: (constituency: Constituency) => void;
}

export function DistrictPanel({ district, onConstituencySelect }: DistrictPanelProps) {
  const constituencies = getConstituencies(district);
  const mandals = getMandalsByDistrict(district.id);
  const parlConstituencies = constituencies.filter(c => c.type === 'parliament');
  const assemblyConstituencies = constituencies.filter(c => c.type === 'assembly');
  const [showMandals, setShowMandals] = useState(false);
  const [showAllAssembly, setShowAllAssembly] = useState(false);

  const visibleAssembly = showAllAssembly ? assemblyConstituencies : assemblyConstituencies.slice(0, 4);

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

      {/* Mandals section */}
      <div>
        <button
          onClick={() => setShowMandals(!showMandals)}
          className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-700/60 bg-slate-800/30 hover:bg-slate-800/60 transition-all"
        >
          <div className="flex items-center gap-2">
            <Grid3x3 className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-slate-300">
              Mandals / Revenue Circles ({mandals.length})
            </span>
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
            </h3>
          </div>
          <div className="space-y-2">
            {visibleAssembly.map((c, idx) => (
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
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: CONSTITUENCY_COLORS.assembly.light, border: `1px solid ${CONSTITUENCY_COLORS.assembly.border}` }}>
                    <Vote className="w-4 h-4" style={{ color: CONSTITUENCY_COLORS.assembly.primary }} />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{c.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs" style={{ color: CONSTITUENCY_COLORS.assembly.text }}>Assembly</span>
                      {c.reserved && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/20">
                          {c.reserved}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </motion.button>
            ))}
          </div>

          {assemblyConstituencies.length > 4 && (
            <button
              onClick={() => setShowAllAssembly(!showAllAssembly)}
              className="w-full mt-2 py-2 rounded-xl border border-slate-700/50 text-xs text-slate-400 hover:text-white transition-all flex items-center justify-center gap-1"
            >
              {showAllAssembly
                ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                : <><ChevronDown className="w-3.5 h-3.5" /> +{assemblyConstituencies.length - 4} more seats</>}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
