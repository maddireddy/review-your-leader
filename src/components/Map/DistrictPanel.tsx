'use client';

import { motion } from 'framer-motion';
import { Landmark, Users, ArrowRight, Vote } from 'lucide-react';
import { District, Constituency } from '@/types';

// Mock constituencies
function getConstituencies(districtId: string): Constituency[] {
  const base = districtId.split('-').pop() || districtId;
  return [
    {
      id: `${districtId}-lok1`,
      district_id: districtId,
      state_id: districtId.split('-')[0].toUpperCase(),
      name: `${base.charAt(0).toUpperCase() + base.slice(1)} Lok Sabha`,
      type: 'parliament',
      geojson_id: `${base}-lok1`,
    },
    {
      id: `${districtId}-vidhana1`,
      district_id: districtId,
      state_id: districtId.split('-')[0].toUpperCase(),
      name: `${base.charAt(0).toUpperCase() + base.slice(1)} North Vidhan Sabha`,
      type: 'assembly',
      geojson_id: `${base}-vidhana1`,
    },
    {
      id: `${districtId}-vidhana2`,
      district_id: districtId,
      state_id: districtId.split('-')[0].toUpperCase(),
      name: `${base.charAt(0).toUpperCase() + base.slice(1)} South Vidhan Sabha`,
      type: 'assembly',
      geojson_id: `${base}-vidhana2`,
    },
    {
      id: `${districtId}-vidhana3`,
      district_id: districtId,
      state_id: districtId.split('-')[0].toUpperCase(),
      name: `${base.charAt(0).toUpperCase() + base.slice(1)} East Vidhan Sabha`,
      type: 'assembly',
      reserved: 'SC',
      geojson_id: `${base}-vidhana3`,
    },
  ];
}

interface DistrictPanelProps {
  district: District;
  onConstituencySelect: (constituency: Constituency) => void;
}

export function DistrictPanel({ district, onConstituencySelect }: DistrictPanelProps) {
  const constituencies = getConstituencies(district.id);
  const parlConstituencies = constituencies.filter((c) => c.type === 'parliament');
  const assemblyConstituencies = constituencies.filter((c) => c.type === 'assembly');

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {/* District header */}
      <div className="glass-card p-4">
        <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-rajdhani)' }}>
          {district.name}
        </h2>
        <p className="text-sm text-slate-400 mt-1">Headquarters: {district.headquarters}</p>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2.5 text-center">
            <div className="text-lg font-bold text-orange-400">{parlConstituencies.length}</div>
            <div className="text-xs text-slate-400">Parliament Seats</div>
          </div>
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2.5 text-center">
            <div className="text-lg font-bold text-indigo-400">{assemblyConstituencies.length}</div>
            <div className="text-xs text-slate-400">Assembly Seats</div>
          </div>
        </div>
      </div>

      {/* Parliament constituencies */}
      {parlConstituencies.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Lok Sabha Constituencies
            </h3>
          </div>
          <div className="space-y-2">
            {parlConstituencies.map((c, idx) => (
              <motion.button
                key={c.id}
                onClick={() => onConstituencySelect(c)}
                className="w-full p-3 rounded-xl border border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 hover:border-orange-500/40 transition-all group flex items-center justify-between text-left"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Landmark className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white text-sm">{c.name}</div>
                    <div className="text-xs text-orange-400/70 mt-0.5">Parliament • Lok Sabha</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-orange-400 transition-colors" />
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Assembly constituencies */}
      {assemblyConstituencies.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-indigo-400" />
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Vidhan Sabha Constituencies
            </h3>
          </div>
          <div className="space-y-2">
            {assemblyConstituencies.map((c, idx) => (
              <motion.button
                key={c.id}
                onClick={() => onConstituencySelect(c)}
                className="w-full p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/40 transition-all group flex items-center justify-between text-left"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Vote className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white text-sm">{c.name}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-indigo-400/70 mt-0.5">Assembly • Vidhan Sabha</span>
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
        </div>
      )}
    </motion.div>
  );
}
