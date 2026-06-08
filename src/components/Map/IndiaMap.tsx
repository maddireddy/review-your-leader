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

const INDIA_TOPO_URL = '/india-states.json';

interface TooltipState {
  x: number;
  y: number;
  cm?: string;
  party?: string;
  landmark?: string;
  landmarkEmoji?: string;
  name: string;
  capital: string;
}

interface IndiaMapProps {
  onStateSelect: (state: State) => void;
  selectedState?: State;
}


function getStateColor(stateId: string, isSelected: boolean, isHovered: boolean) {
  const state = INDIA_STATES.find(s => s.id === stateId) as StateInfo | undefined;
  const base = state?.cm_party_color || '#4f46e5';
  if (isSelected) return '#818cf8';
  if (isHovered) return base + 'cc';
  return base + '44';
}

export function IndiaMap({ onStateSelect, selectedState }: IndiaMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
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
        });
      }
    },
    []
  );

  return (
    <div ref={containerRef} className="relative w-full h-full select-none">
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
                          ? getStateColor(state.id, isSelected, false)
                          : '#1e293b',
                        stroke: '#0f172a',
                        strokeWidth: 0.5,
                        outline: 'none',
                        transition: 'fill 0.2s ease',
                      },
                      hover: {
                        fill: state
                          ? getStateColor(state.id, isSelected, true)
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

      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass-card p-3 text-xs space-y-1.5">
        <div className="text-slate-400 font-semibold mb-2 uppercase tracking-wider">Ruling Party</div>
        {[
          { label: 'BJP', color: '#FF6B00' },
          { label: 'INC', color: '#19AAED' },
          { label: 'AAP', color: '#0066FF' },
          { label: 'TMC', color: '#267EC2' },
          { label: 'DMK', color: '#CC0000' },
          { label: 'TDP', color: '#FFDE00' },
          { label: 'Others', color: '#4f46e5' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color + '88', border: `1px solid ${color}` }} />
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
