'use client';

import { motion } from 'framer-motion';
import { MapPin, Users, Landmark, ArrowRight, Building2 } from 'lucide-react';
import { State, District } from '@/types';
import { formatNumber } from '@/lib/utils';

// Mock districts for demo
const MOCK_DISTRICTS: Record<string, District[]> = {
  MH: [
    { id: 'mh-pune', state_id: 'MH', name: 'Pune', headquarters: 'Pune', population: 9429408, geojson_id: 'Pune' },
    { id: 'mh-mumbai', state_id: 'MH', name: 'Mumbai City', headquarters: 'Mumbai', population: 3085411, geojson_id: 'Mumbai City' },
    { id: 'mh-nashik', state_id: 'MH', name: 'Nashik', headquarters: 'Nashik', population: 6107187, geojson_id: 'Nashik' },
    { id: 'mh-nagpur', state_id: 'MH', name: 'Nagpur', headquarters: 'Nagpur', population: 4653570, geojson_id: 'Nagpur' },
    { id: 'mh-thane', state_id: 'MH', name: 'Thane', headquarters: 'Thane', population: 11060148, geojson_id: 'Thane' },
    { id: 'mh-aurangabad', state_id: 'MH', name: 'Aurangabad', headquarters: 'Aurangabad', population: 3695928, geojson_id: 'Aurangabad' },
  ],
  UP: [
    { id: 'up-lucknow', state_id: 'UP', name: 'Lucknow', headquarters: 'Lucknow', population: 4589838, geojson_id: 'Lucknow' },
    { id: 'up-varanasi', state_id: 'UP', name: 'Varanasi', headquarters: 'Varanasi', population: 3676841, geojson_id: 'Varanasi' },
    { id: 'up-agra', state_id: 'UP', name: 'Agra', headquarters: 'Agra', population: 4418797, geojson_id: 'Agra' },
    { id: 'up-kanpur', state_id: 'UP', name: 'Kanpur', headquarters: 'Kanpur', population: 4572951, geojson_id: 'Kanpur' },
    { id: 'up-allahabad', state_id: 'UP', name: 'Prayagraj', headquarters: 'Prayagraj', population: 5954391, geojson_id: 'Allahabad' },
  ],
  KA: [
    { id: 'ka-bangalore', state_id: 'KA', name: 'Bengaluru Urban', headquarters: 'Bengaluru', population: 9621551, geojson_id: 'Bangalore' },
    { id: 'ka-mysore', state_id: 'KA', name: 'Mysuru', headquarters: 'Mysuru', population: 3001127, geojson_id: 'Mysore' },
    { id: 'ka-belgaum', state_id: 'KA', name: 'Belagavi', headquarters: 'Belagavi', population: 4779661, geojson_id: 'Belgaum' },
    { id: 'ka-mangalore', state_id: 'KA', name: 'Dakshina Kannada', headquarters: 'Mangaluru', population: 2083625, geojson_id: 'Dakshina Kannada' },
  ],
};

function getDistricts(stateId: string): District[] {
  return MOCK_DISTRICTS[stateId] || [
    { id: `${stateId}-d1`, state_id: stateId, name: 'District 1', headquarters: 'HQ 1', geojson_id: 'D1' },
    { id: `${stateId}-d2`, state_id: stateId, name: 'District 2', headquarters: 'HQ 2', geojson_id: 'D2' },
    { id: `${stateId}-d3`, state_id: stateId, name: 'District 3', headquarters: 'HQ 3', geojson_id: 'D3' },
  ];
}

interface StatePanelProps {
  state: State;
  onDistrictSelect: (district: District) => void;
}

export function StatePanel({ state, onDistrictSelect }: StatePanelProps) {
  const districts = getDistricts(state.id);

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {/* State header */}
      <div className="glass-card p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-rajdhani)' }}>
              {state.name}
            </h2>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Capital: <span className="text-amber-400 font-medium">{state.capital}</span></span>
            </div>
          </div>
          <div className="text-3xl">🏛</div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-slate-800/40 rounded-lg p-2.5 text-center">
            <Building2 className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-white">{districts.length}+</div>
            <div className="text-xs text-slate-400">Districts</div>
          </div>
          <div className="bg-slate-800/40 rounded-lg p-2.5 text-center">
            <Landmark className="w-4 h-4 text-green-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-white">Select</div>
            <div className="text-xs text-slate-400">to explore</div>
          </div>
        </div>
      </div>

      {/* Districts list */}
      <div>
        <h3 className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">
          Select District
        </h3>
        <div className="space-y-2">
          {districts.map((district, idx) => (
            <motion.button
              key={district.id}
              onClick={() => onDistrictSelect(district)}
              className="w-full glass-card p-3 flex items-center justify-between hover:border-indigo-500/40 hover:bg-slate-800/60 transition-all group text-left"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div>
                <div className="font-medium text-white text-sm">{district.name}</div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  HQ: {district.headquarters}
                  {district.population && (
                    <span className="ml-2 text-slate-600">
                      · {formatNumber(district.population)} pop
                    </span>
                  )}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
