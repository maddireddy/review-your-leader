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
import { INDIA_STATES } from '@/lib/indiaData';
import { State } from '@/types';
import { trackEvent } from '@/lib/posthog';

const INDIA_TOPO_URL =
  'https://cdn.jsdelivr.net/npm/india-map-topojson@1.0.1/dist/india.topojson';

interface TooltipState {
  x: number;
  y: number;
  name: string;
  capital: string;
}

interface IndiaMapProps {
  onStateSelect: (state: State) => void;
  selectedState?: State;
}

const STATE_COLOR_MAP: Record<string, string> = {
  BJP: '#FF6B00',
  INC: '#19AAED',
  AAP: '#0066FF',
  TMC: '#267EC2',
  SP: '#CC0000',
  BSP: '#1B7F4F',
  DMK: '#CC0000',
  AIADMK: '#00AF12',
  YSRCP: '#0073B1',
  TDP: '#FFD700',
  default: '#4f46e5',
};

// Simplified ruling party map for visual differentiation
const STATE_PARTIES: Record<string, string> = {
  AP: 'TDP', AR: 'BJP', AS: 'BJP', BR: 'BJP', CG: 'BJP', GA: 'BJP',
  GJ: 'BJP', HR: 'BJP', HP: 'INC', JH: 'BJP', KA: 'INC', KL: 'default',
  MP: 'BJP', MH: 'BJP', MN: 'BJP', ML: 'default', MZ: 'default', NL: 'BJP',
  OD: 'BJP', PB: 'AAP', RJ: 'BJP', SK: 'default', TN: 'DMK', TG: 'INC',
  TR: 'BJP', UP: 'BJP', UK: 'BJP', WB: 'TMC', DL: 'AAP', JK: 'BJP',
};

function getStateColor(stateId: string, isSelected: boolean, isHovered: boolean) {
  const party = STATE_PARTIES[stateId] || 'default';
  const base = STATE_COLOR_MAP[party] || STATE_COLOR_MAP.default;
  if (isSelected) return '#818cf8';
  if (isHovered) return base + 'dd';
  return base + '55';
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
        setTooltip({
          x: evt.clientX - (rect?.left || 0) + 12,
          y: evt.clientY - (rect?.top || 0) - 10,
          name: state.name,
          capital: state.capital,
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
            <div className="font-semibold text-white">{tooltip.name}</div>
            <div className="text-slate-400 text-xs mt-0.5">
              🏛 Capital: {tooltip.capital}
            </div>
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
        <div className="text-slate-400 font-medium mb-2">Ruling Party</div>
        {Object.entries({ BJP: '#FF6B00', INC: '#19AAED', AAP: '#0066FF', TMC: '#267EC2', DMK: '#CC0000', Others: '#4f46e5' }).map(
          ([party, color]) => (
            <div key={party} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color + '99', border: `1px solid ${color}` }} />
              <span className="text-slate-300">{party}</span>
            </div>
          )
        )}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700/50">
          <circle className="capital-dot" />
          <span className="text-slate-400">● State Capital</span>
        </div>
      </div>
    </div>
  );
}
