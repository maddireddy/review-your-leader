'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { StatePanel } from '@/components/Map/StatePanel';
import { DistrictPanel } from '@/components/Map/DistrictPanel';
import { RepresentativeProfile } from '@/components/Profile/RepresentativeProfile';
import { MapView, State, Constituency, District } from '@/types';
import { StateInfo, INDIA_STATES } from '@/lib/indiaData';
import { DistrictInfo } from '@/lib/districtData';
import { ArrowLeft, Search, BarChart3, Globe2, Map, Building2, Landmark, ChevronRight } from 'lucide-react';
import { SearchBar } from '@/components/Search/SearchBar';
import { ElectionCalendar } from '@/components/Civic/ElectionCalendar';
import Link from 'next/link';

const IndiaMap = dynamic(
  () => import('@/components/Map/IndiaMap').then((mod) => mod.IndiaMap),
  { ssr: false, loading: () => <MapSkeleton /> }
);

function MapSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin mx-auto" />
        <p className="text-slate-400 text-sm">Loading India Map…</p>
      </div>
    </div>
  );
}

// Level metadata for breadcrumb + back button
const LEVEL_META = {
  country: { icon: <Globe2 className="w-3.5 h-3.5" />, label: 'India' },
  state:   { icon: <Map className="w-3.5 h-3.5" />,   label: 'State' },
  district:{ icon: <Building2 className="w-3.5 h-3.5" />, label: 'District' },
  constituency: { icon: <Landmark className="w-3.5 h-3.5" />, label: 'Constituency' },
};

export default function HomePage() {
  const [view, setView] = useState<MapView>({ level: 'country' });
  const [showSearch, setShowSearch] = useState(false);

  const handleStateSelect = useCallback((state: State) => {
    setView({ level: 'state', selectedState: state });
  }, []);

  const handleDistrictSelect = useCallback((district: DistrictInfo) => {
    setView(prev => ({ ...prev, level: 'district', selectedDistrict: district as unknown as District }));
  }, []);

  const handleConstituencySelect = useCallback((constituency: Constituency) => {
    setView(prev => ({ ...prev, level: 'constituency', selectedConstituency: constituency }));
  }, []);

  const goBack = useCallback(() => {
    setView(prev => {
      if (prev.level === 'constituency') return { ...prev, level: 'district' };
      if (prev.level === 'district')     return { level: 'state', selectedState: prev.selectedState };
      if (prev.level === 'state')        return { level: 'country' };
      return prev;
    });
  }, []);

  const goTo = useCallback((level: MapView['level']) => {
    setView(prev => {
      if (level === 'country')  return { level: 'country' };
      if (level === 'state')    return { level: 'state', selectedState: prev.selectedState };
      if (level === 'district') return { level: 'district', selectedState: prev.selectedState, selectedDistrict: prev.selectedDistrict };
      return prev;
    });
  }, []);

  const showPanel = view.level !== 'country';
  const stateInfo = view.selectedState as StateInfo | undefined;

  // Breadcrumb trail
  const crumbs = [
    { level: 'country' as const, label: 'India' },
    ...(view.selectedState  ? [{ level: 'state' as const,        label: view.selectedState.name }] : []),
    ...(view.selectedDistrict ? [{ level: 'district' as const,   label: view.selectedDistrict.name }] : []),
    ...(view.selectedConstituency ? [{ level: 'constituency' as const, label: view.selectedConstituency.name }] : []),
  ];

  return (
    <main className="animated-gradient min-h-screen pt-16">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-3 h-[calc(100vh-64px)] flex flex-col gap-3">

        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Back button — visible whenever drilled in */}
          {showPanel && (
            <motion.button
              onClick={goBack}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/70 border border-slate-700/60 text-slate-300 hover:text-white hover:border-indigo-500/40 transition-all text-sm font-medium flex-shrink-0"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              whileTap={{ scale: 0.96 }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">
                {crumbs.length >= 2 ? crumbs[crumbs.length - 2].label : 'Back'}
              </span>
            </motion.button>
          )}

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
            {crumbs.map((c, i) => (
              <div key={c.level} className="flex items-center gap-1 min-w-0">
                {i > 0 && <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />}
                <button
                  onClick={() => goTo(c.level)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all truncate flex-shrink-0 ${
                    i === crumbs.length - 1
                      ? 'text-white bg-indigo-500/20 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {LEVEL_META[c.level].icon}
                  <span className={i > 0 ? 'hidden sm:inline' : ''}>{c.label}</span>
                </button>
              </div>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Search toggle */}
            <button
              onClick={() => setShowSearch(s => !s)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white text-sm transition-all"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </button>
            <Link
              href="/dashboard/parties"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white text-sm transition-all"
            >
              <BarChart3 className="w-4 h-4" /> Dashboard
            </Link>
          </div>
        </div>

        {/* Search bar (collapsible) */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden flex-shrink-0"
            >
              <SearchBar
                onStateSelect={(stateId) => {
                  const state = INDIA_STATES.find(s => s.id === stateId);
                  if (state) { handleStateSelect(state); setShowSearch(false); }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main 3-column layout ─────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 flex gap-3">

          {/* LEFT — India Map (always visible on desktop) */}
          <motion.div
            className={`relative rounded-2xl overflow-hidden border border-white/5 bg-slate-900/40 shadow-2xl shadow-black/40 ${
              showPanel
                ? 'hidden lg:flex lg:w-[44%] xl:w-[48%] flex-shrink-0'
                : 'flex flex-1'
            }`}
            layout
          >
            {/* Map overlay: selected state label */}
            {stateInfo && (
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-md border border-white/10">
                <span className="text-lg">{stateInfo.landmark_emoji || '🗺️'}</span>
                <div>
                  <div className="text-white text-xs font-bold leading-tight">{stateInfo.name}</div>
                  <div className="text-slate-400 text-[10px]">{stateInfo.capital}</div>
                </div>
              </div>
            )}

            {/* How-to overlay at country level */}
            {view.level === 'country' && (
              <motion.div
                className="absolute bottom-4 left-4 z-20 bg-black/50 backdrop-blur-md rounded-xl p-3 text-xs border border-white/10"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
              >
                <div className="text-indigo-400 font-semibold mb-1.5">How to explore</div>
                <div className="space-y-1 text-slate-400">
                  <div className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-orange-400" /> Click any state</div>
                  <div className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-indigo-400" /> Pick a district</div>
                  <div className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-green-400" /> Choose constituency</div>
                  <div className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-violet-400" /> View your MLA / MP</div>
                </div>
              </motion.div>
            )}

            <IndiaMap onStateSelect={handleStateSelect} selectedState={view.selectedState} />
          </motion.div>

          {/* CENTER — Election calendar (country view only, desktop) */}
          {view.level === 'country' && (
            <motion.div
              className="hidden xl:flex flex-col w-[280px] flex-shrink-0 gap-3 overflow-y-auto"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            >
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Upcoming Elections</div>
              <ElectionCalendar />
            </motion.div>
          )}

          {/* RIGHT — Drill-down panel */}
          <AnimatePresence mode="wait">
            {showPanel ? (
              <motion.div
                key="drill-panel"
                className="flex-1 min-w-0 lg:w-[56%] xl:w-[50%] flex-shrink-0 overflow-y-auto rounded-2xl"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              >
                <AnimatePresence mode="wait">
                  {view.level === 'state' && view.selectedState && (
                    <StatePanel
                      key={view.selectedState.id}
                      state={view.selectedState as unknown as StateInfo}
                      onDistrictSelect={handleDistrictSelect}
                    />
                  )}
                  {view.level === 'district' && view.selectedDistrict && (
                    <DistrictPanel
                      key={view.selectedDistrict.id}
                      district={view.selectedDistrict as unknown as DistrictInfo}
                      onConstituencySelect={handleConstituencySelect}
                    />
                  )}
                  {view.level === 'constituency' && view.selectedConstituency && (
                    <RepresentativeProfile
                      key={view.selectedConstituency.id}
                      constituency={view.selectedConstituency}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              /* Country view — wide map, no panel — show summary stats strip */
              <motion.div
                key="country-stats"
                className="hidden lg:flex flex-col gap-3 w-[300px] flex-shrink-0"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              >
                <div className="glass-card p-4 space-y-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">India at a glance</div>
                  {[
                    { label: 'States & UTs', value: '36', color: '#6366f1' },
                    { label: 'Lok Sabha MPs', value: '543', color: '#f59e0b' },
                    { label: 'Assembly MLAs', value: '4,120+', color: '#22c55e' },
                    { label: 'Districts', value: '780+', color: '#ec4899' },
                    { label: 'Constituencies', value: '545+', color: '#0ea5e9' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between">
                      <span className="text-slate-400 text-xs">{s.label}</span>
                      <span className="font-bold text-sm" style={{ color: s.color }}>{s.value}</span>
                    </div>
                  ))}
                </div>
                <div className="glass-card p-4 space-y-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Quick Links</div>
                  <Link href="/dashboard/parties" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-all py-1.5 px-2 rounded-lg hover:bg-slate-800/60">
                    <BarChart3 className="w-3.5 h-3.5 text-indigo-400" /> Party Dashboard
                  </Link>
                  <Link href="/epics" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-all py-1.5 px-2 rounded-lg hover:bg-slate-800/60">
                    <span className="text-base">📖</span> Epic Audio (Ramayana · Mahabharata)
                  </Link>
                  <button
                    onClick={() => setShowSearch(true)}
                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-all py-1.5 px-2 rounded-lg hover:bg-slate-800/60 w-full text-left"
                  >
                    <Search className="w-3.5 h-3.5 text-green-400" /> Search any politician
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
