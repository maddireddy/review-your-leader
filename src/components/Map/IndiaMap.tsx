'use client';

import { useState, useCallback, useRef } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';
import { motion, AnimatePresence } from 'framer-motion';
import { INDIA_STATES, StateInfo } from '@/lib/indiaData';
import { State } from '@/types';
import { trackEvent } from '@/lib/posthog';
import { getMapFillColor, MAP_LEGEND } from '@/lib/colorSystem';
import { getTurnout, getTurnoutColor, TURNOUT_LEGEND } from '@/lib/turnoutData';

const INDIA_TOPO_URL = '/india-states.json';

type ViewMode = 'party' | 'turnout';

interface TooltipState {
  x: number;
  y: number;
  cm?: string;
  party?: string;
  landmark?: string;
  landmarkEmoji?: string;
  name: string;
  capital: string;
  turnout?: number;
}

interface IndiaMapProps {
  onStateSelect: (state: State) => void;
  selectedState?: State;
}


function getStateColor(stateId: string, isSelected: boolean, isHovered: boolean, mode: ViewMode) {
  if (mode === 'turnout') {
    const base = getTurnoutColor(getTurnout(stateId));
    if (isSelected) return '#818CF8';
    return isHovered ? base : base + 'C0';
  }
  const state = INDIA_STATES.find(s => s.id === stateId) as StateInfo | undefined;
  return getMapFillColor(state?.ruling_party || 'default', isSelected, isHovered);
}

export function IndiaMap({ onStateSelect, selectedState }: IndiaMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('party');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStateClick = useCallback(
    (geo: { properties: { NAME_1?: string; st_nm?: string; name?: string } }) => {
      const geoName = geo.properties.NAME_1 || geo.properties.st_nm || geo.properties.name || '';
      const state = INDIA_STATES.find(
        (s) => s.geojson_id === geoName || s.name === geoName
      );
      if (state) {
        trackEvent('state_selected', { state: state.name });
        onStateSelect(state);
      }
    },
    [onStateSelect]
  );

  const handleMouseEnter = useCallback(
    (geo: { properties: { NAME_1?: string; st_nm?: string; name?: string } }, evt: React.MouseEvent) => {
      const geoName = geo.properties.NAME_1 || geo.properties.st_nm || geo.properties.name || '';
      const state = INDIA_STATES.find(
        (s) => s.geojson_id === geoName || s.name === geoName
      );
      if (state) {
        setHoveredState(state.id);
        const rect = containerRef.current?.getBoundingClientRect();
        const si = state as StateInfo;
        setTooltip({
          x: evt.clientX - (rect?.left || 0) + 12,
          y: evt.clientY - (rect?.top || 0) - 10,
          name: state.name,
          capital: state.capital,
          cm: si.chief_minister,
          party: si.ruling_party,
          landmark: si.landmark,
          landmarkEmoji: si.landmark_emoji,
          turnout: getTurnout(state.id),
        });
      }
    },
    []
  );

  return (
    <div ref={containerRef} className="relative w-full h-full select-none">
      {/* View mode toggle */}
      <div className="absolute top-4 left-4 z-20 flex gap-1 p-1 bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 rounded-xl">
        {(['party', 'turnout'] as ViewMode[]).map(m => (
          <button
            key={m}
            onClick={() => setViewMode(m)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === m ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            {m === 'party' ? '🎗 Party' : '🗳 Turnout'}
          </button>
        ))}
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            className="map-tooltip"
            style={{ left: tooltip.x, top: tooltip.y }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="font-semibold text-white text-sm">{tooltip.name}</div>
            <div className="text-slate-400 text-xs mt-0.5">🏛 {tooltip.capital}</div>
            {tooltip.cm && (
              <div className="text-slate-300 text-xs mt-1">
                👤 <span className="text-slate-200">{tooltip.cm}</span>
                {tooltip.party && <span className="ml-1 text-indigo-400">({tooltip.party})</span>}
              </div>
            )}
            {tooltip.landmark && (
              <div className="text-slate-400 text-xs mt-0.5">{tooltip.landmarkEmoji} {tooltip.landmark}</div>
            )}
            {viewMode === 'turnout' && tooltip.turnout !== undefined && (
              <div className="text-xs mt-1 font-semibold" style={{ color: getTurnoutColor(tooltip.turnout) }}>
                🗳 Turnout: {tooltip.turnout}%
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [82.5, 22.5], scale: 1000 }}
        width={600}
        height={650}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup zoom={1} minZoom={0.8} maxZoom={6}>
          <Geographies geography={INDIA_TOPO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const geoName =
                  geo.properties.NAME_1 ||
                  geo.properties.st_nm ||
                  geo.properties.name ||
                  '';
                const state = INDIA_STATES.find(
                  (s) => s.geojson_id === geoName || s.name === geoName
                );
                const isSelected = selectedState?.id === state?.id;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const isHovered = hoveredState === state?.id;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => handleStateClick(geo)}
                    onMouseEnter={(evt) => handleMouseEnter(geo, evt)}
                    onMouseLeave={() => {
                      setHoveredState(null);
                      setTooltip(null);
                    }}
                    style={{
                      default: {
                        fill: state
                          ? getStateColor(state.id, isSelected, false, viewMode)
                          : '#1e293b',
                        stroke: '#0f172a',
                        strokeWidth: 0.5,
                        outline: 'none',
                        transition: 'fill 0.2s ease',
                      },
                      hover: {
                        fill: state
                          ? getStateColor(state.id, isSelected, true, viewMode)
                          : '#334155',
                        stroke: '#818cf8',
                        strokeWidth: 1,
                        outline: 'none',
                        cursor: 'pointer',
                        filter: 'brightness(1.3)',
                      },
                      pressed: {
                        fill: '#818cf8',
                        stroke: '#6366f1',
                        strokeWidth: 1.5,
                        outline: 'none',
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* Capital markers */}
          {INDIA_STATES.filter((s) => s.capital_lat && s.capital_lng).map((state) => (
            <Marker key={state.id} coordinates={[state.capital_lng, state.capital_lat]}>
              <g
                onClick={() => onStateSelect(state)}
                style={{ cursor: 'pointer' }}
              >
                {/* Outer ring */}
                <circle
                  r={selectedState?.id === state.id ? 5 : 3}
                  fill="none"
                  stroke={selectedState?.id === state.id ? '#818cf8' : '#fbbf24'}
                  strokeWidth={1}
                  opacity={0.6}
                />
                {/* Inner dot */}
                <circle
                  r={selectedState?.id === state.id ? 2.5 : 1.5}
                  fill={selectedState?.id === state.id ? '#818cf8' : '#fbbf24'}
                  className="capital-dot"
                />
              </g>
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* Legend — switches with view mode */}
      <div className="absolute bottom-4 left-4 glass-card p-3 text-xs space-y-1.5">
        <div className="text-slate-400 font-semibold mb-2 uppercase tracking-wider text-[10px]">
          {viewMode === 'party' ? 'Ruling Party' : 'Voter Turnout 2024'}
        </div>
        {(viewMode === 'party' ? MAP_LEGEND : TURNOUT_LEGEND).map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color + '70', border: `1px solid ${color}` }} />
            <span className="text-slate-300">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700/50">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-slate-400">State Capital</span>
        </div>
      </div>
    </div>
  );
}
