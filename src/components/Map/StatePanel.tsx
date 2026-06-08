'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowRight, Building2, Sparkles, Loader2, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { StateInfo } from '@/lib/indiaData';
import { getDistrictsByState, DistrictInfo } from '@/lib/districtData';
import { formatNumber } from '@/lib/utils';

interface StatePanelProps {
  state: StateInfo;
  onDistrictSelect: (district: DistrictInfo) => void;
}

export function StatePanel({ state, onDistrictSelect }: StatePanelProps) {
  const districts = getDistrictsByState(state.id);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const visibleDistricts = showAll ? districts : districts.slice(0, 8);

  // Reset insight when state changes — deferred to avoid cascading renders
  useEffect(() => {
    const timer = setTimeout(() => setAiInsight(''), 0);
    return () => clearTimeout(timer);
  }, [state.id]);

  async function fetchAIInsight() {
    setLoadingAI(true);
    try {
      const res = await fetch('/api/state-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stateName: state.name,
          cm: state.chief_minister,
          party: state.cm_party,
        }),
      });
      const data = await res.json();
      setAiInsight(data.insight || 'Insight unavailable.');
    } catch {
      setAiInsight('Unable to fetch AI insight. Please configure GROQ_API_KEY.');
    } finally {
      setLoadingAI(false);
    }
  }

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {/* State + Landmark Hero Card */}
      <div className="glass-card overflow-hidden">
        {/* Party color header stripe */}
        <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${state.cm_party_color}, ${state.cm_party_color}44)` }} />

        <div className="p-4">
          {/* Landmark */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl">{state.landmark_emoji}</span>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">{state.landmark}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{state.landmark_desc}</p>
                </div>
              </div>
            </div>
          </div>

          {/* State stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-slate-800/50 rounded-xl p-2.5 text-center">
              <Building2 className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
              <div className="text-base font-bold text-white">{state.districts_count}</div>
              <div className="text-xs text-slate-500">Districts</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-2.5 text-center">
              <Globe className="w-4 h-4 text-green-400 mx-auto mb-1" />
              <div className="text-base font-bold text-white">{state.formed_year}</div>
              <div className="text-xs text-slate-500">Est.</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-2.5 text-center">
              <span className="text-base">{state.is_ut ? '🏙️' : '🗺️'}</span>
              <div className="text-xs font-bold text-white mt-1">{state.is_ut ? 'UT' : 'State'}</div>
              <div className="text-xs text-slate-500">Type</div>
            </div>
          </div>

          {/* Capital */}
          <div className="flex items-center gap-2 mb-3 text-sm">
            <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-slate-400">Capital:</span>
            <span className="text-amber-400 font-semibold">{state.capital}</span>
          </div>
        </div>
      </div>

      {/* Chief Minister Card */}
      <motion.div
        className="glass-card p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Current {state.is_ut ? 'Lt. Governor / CM' : 'Chief Minister'}
        </div>

        <div className="flex items-center gap-3 mb-3">
          {/* CM Avatar */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${state.cm_party_color}44, ${state.cm_party_color}22)`,
              border: `2px solid ${state.cm_party_color}66`,
            }}
          >
            {state.chief_minister.split(' ').map(w => w[0]).join('').slice(0, 2)}
          </div>

          <div className="flex-1 min-w-0">
            <h2
              className="text-base font-bold text-white leading-tight"
              style={{ fontFamily: 'var(--font-rajdhani)' }}
            >
              {state.chief_minister}
            </h2>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold text-white"
                style={{ backgroundColor: state.cm_party_color }}
              >
                {state.ruling_party}
              </span>
              <span className="text-xs text-slate-400">{state.cm_party}</span>
            </div>
          </div>
        </div>

        {/* AI Insight Button + Result */}
        <AnimatePresence>
          {!aiInsight && !loadingAI && (
            <button
              onClick={fetchAIInsight}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 transition-all text-sm text-violet-300 hover:text-violet-200"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Get Latest AI Insights on {state.chief_minister.split(' ')[0]}
            </button>
          )}

          {loadingAI && (
            <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-slate-800/40 text-sm text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
              Fetching latest info via Groq AI...
            </div>
          )}

          {aiInsight && (
            <motion.div
              className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-slate-300 leading-relaxed"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-violet-400 font-semibold text-xs">Groq AI · LLaMA 3.3 70B</span>
              </div>
              {aiInsight}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Districts List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Select District
          </h3>
          <span className="text-xs text-slate-600">{districts.length} districts</span>
        </div>

        <div className="space-y-1.5">
          {visibleDistricts.map((district, idx) => (
            <motion.button
              key={district.id}
              onClick={() => onDistrictSelect(district)}
              className="w-full glass-card p-3 flex items-center justify-between hover:border-indigo-500/40 hover:bg-slate-800/70 transition-all group text-left"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                  {idx + 1}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{district.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {district.mandals_count} mandals · {district.assembly_seats} Vidhan Sabha seats
                    {district.population && ` · ${formatNumber(district.population)}`}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
            </motion.button>
          ))}
        </div>

        {districts.length > 8 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full mt-2 py-2 rounded-xl border border-slate-700/60 text-sm text-slate-400 hover:text-white hover:border-slate-600 transition-all flex items-center justify-center gap-1.5"
          >
            {showAll ? (
              <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
            ) : (
              <><ChevronDown className="w-3.5 h-3.5" /> Show all {districts.length} districts</>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}
