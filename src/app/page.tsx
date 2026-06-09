'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { StatePanel } from '@/components/Map/StatePanel';
import { DistrictPanel } from '@/components/Map/DistrictPanel';
import { BreadcrumbNav } from '@/components/Map/BreadcrumbNav';
import { RepresentativeProfile } from '@/components/Profile/RepresentativeProfile';
import { MapView, State, Constituency } from '@/types';
import { StateInfo } from '@/lib/indiaData';
import { DistrictInfo } from '@/lib/districtData';
import { Info, RotateCcw, ChevronRight } from 'lucide-react';
import { SearchBar } from '@/components/Search/SearchBar';
import { ElectionCalendar } from '@/components/Civic/ElectionCalendar';
import { INDIA_STATES } from '@/lib/indiaData';
import Link from 'next/link';
import { BarChart3 } from 'lucide-react';

// Dynamic import to avoid SSR issues with react-simple-maps
const IndiaMap = dynamic(
  () => import('@/components/Map/IndiaMap').then((mod) => mod.IndiaMap),
  { ssr: false, loading: () => <MapSkeleton /> }
);

function MapSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin mx-auto" />
        <p className="text-slate-400 text-sm">Loading India Map...</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [view, setView] = useState<MapView>({ level: 'country' });

  const handleStateSelect = useCallback((state: State) => {
    setView({ level: 'state', selectedState: state });
  }, []);

  const handleDistrictSelect = useCallback((district: DistrictInfo) => {
    setView((prev) => ({ ...prev, level: 'district', selectedDistrict: district as unknown as import('@/types').District }));
  }, []);

  const handleConstituencySelect = useCallback((constituency: Constituency) => {
    setView((prev) => ({
      ...prev,
      level: 'constituency',
      selectedConstituency: constituency,
    }));
  }, []);

  const handleNavigate = useCallback((level: MapView['level']) => {
    setView((prev) => {
      if (level === 'country') return { level: 'country' };
      if (level === 'state') return { level: 'state', selectedState: prev.selectedState };
      if (level === 'district')
        return { level: 'district', selectedState: prev.selectedState, selectedDistrict: prev.selectedDistrict };
      return prev;
    });
  }, []);

  const showPanel = view.level !== 'country';

  return (
    <main className="animated-gradient min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-64px)] flex flex-col gap-4">
        {/* Page header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold text-white leading-tight"
              style={{ fontFamily: 'var(--font-rajdhani)' }}
            >
              {view.level === 'country' && 'Explore India'}
              {view.level === 'state' && view.selectedState?.name}
              {view.level === 'district' && view.selectedDistrict?.name}
              {view.level === 'constituency' && view.selectedConstituency?.name}
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {view.level === 'country' && 'Click any state to explore districts and representatives'}
              {view.level === 'state' && 'Select a district to view constituencies'}
              {view.level === 'district' && 'Select a constituency to view your representative'}
              {view.level === 'constituency' && 'Your elected representative'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SearchBar
              onStateSelect={(stateId) => {
                const state = INDIA_STATES.find(s => s.id === stateId);
                if (state) handleStateSelect(state);
              }}
            />
            <Link
              href="/dashboard/parties"
              className="hidden sm:flex items-center gap-1.5 text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/60 transition-all whitespace-nowrap"
            >
              <BarChart3 className="w-3.5 h-3.5" /> Dashboard
            </Link>
            {view.level !== 'country' && (
              <button
                onClick={() => setView({ level: 'country' })}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/60 transition-all whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Breadcrumb */}
        {showPanel && (
          <div className="flex-shrink-0">
            <BreadcrumbNav
              view={view}
              onNavigate={handleNavigate}
              rulingParty={(view.selectedState as StateInfo | undefined)?.ruling_party}
            />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-h-0 flex gap-4">
          {/* Map panel */}
          <motion.div
            className={`relative rounded-2xl overflow-hidden border border-slate-800/60 bg-slate-900/40 backdrop-blur-sm ${
              showPanel ? 'hidden lg:flex lg:flex-1' : 'flex flex-1'
            }`}
            layout
          >
            {/* Gradient overlays */}
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-slate-950/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950/40 to-transparent" />
            </div>

            {/* Instructions overlay */}
            {view.level === 'country' && (
              <motion.div
                className="absolute top-4 right-4 z-20 glass-card p-3 text-xs max-w-[200px]"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1.5">
                  <Info className="w-3.5 h-3.5" /> How to explore
                </div>
                <ul className="text-slate-400 space-y-1 leading-relaxed">
                  <li className="flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 text-orange-400" /> Click a state
                  </li>
                  <li className="flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 text-indigo-400" /> Pick a district
                  </li>
                  <li className="flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 text-green-400" /> Choose constituency
                  </li>
                  <li className="flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 text-violet-400" /> View your leader
                  </li>
                </ul>
              </motion.div>
            )}

            <IndiaMap onStateSelect={handleStateSelect} selectedState={view.selectedState} />
          </motion.div>

          {/* Country-level election calendar panel */}
          {view.level === 'country' && (
            <motion.div
              className="hidden lg:block w-[340px] flex-shrink-0 overflow-y-auto"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ElectionCalendar />
            </motion.div>
          )}

          {/* Side panel */}
          <AnimatePresence mode="wait">
            {showPanel && (
              <motion.div
                className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 overflow-y-auto"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
