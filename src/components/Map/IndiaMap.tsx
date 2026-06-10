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

const INDIA_STATES_TOPO = '/india-states.json';
const INDIA_DISTRICTS_GEO = '/geojson/india-districts.json';

type ViewMode = 'party' | 'turnout';

interface TooltipState {
  x: number; y: number;
  name: string; capital: string;
  cm?: string; party?: string;
  landmark?: string; landmarkEmoji?: string;
  turnout?: number;
  isDistrict?: boolean; districtName?: string;
}

interface DistrictGeo {
  state_id: string;
  district_name: string;
}

interface IndiaMapProps {
  onStateSelect: (state: State) => void;
  onDistrictSelect?: (district: { id: string; name: string; state_id: string }) => void;
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

export function IndiaMap({ onStateSelect, onDistrictSelect, selectedState }: IndiaMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('party');
  const [zoomLevel, setZoomLevel] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Show district layer when a state is selected OR zoom >= 2.5
  const showDistricts = !!selectedState || zoomLevel >= 2.5;

  const handleStateClick = useCallback(
    (geo: { properties: { NAME_1?: string; st_nm?: string; name?: string } }) => {
      const geoName = geo.properties.NAME_1 || geo.properties.st_nm || geo.properties.name || '';
      const state = INDIA_STATES.find(s => s.geojson_id === geoName || s.name === geoName);
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
      const state = INDIA_STATES.find(s => s.geojson_id === geoName || s.name === geoName);
      if (state) {
        setHoveredState(state.id);
        const rect = containerRef.current?.getBoundingClientRect();
        const si = state as StateInfo;
        setTooltip({
          x: evt.clientX - (rect?.left || 0) + 12,
          y: evt.clientY - (rect?.top || 0) - 10,
          name: state.name, capital: state.capital,
          cm: si.chief_minister, party: si.ruling_party,
          landmark: si.landmark, landmarkEmoji: si.landmark_emoji,
          turnout: getTurnout(state.id),
        });
      }
    },
    []
  );

  const handleDistrictMouseEnter = useCallback(
    (geo: { properties: { state_id?: string; district_name?: string } }, evt: React.MouseEvent) => {
      const dName = geo.properties.district_name || '';
      const sId = geo.properties.state_id || '';
      setHoveredDistrict(dName);
      const rect = containerRef.current?.getBoundingClientRect();
      const state = INDIA_STATES.find(s => s.id === sId);
      setTooltip({
        x: evt.clientX - (rect?.left || 0) + 12,
        y: evt.clientY - (rect?.top || 0) - 10,
        name: state?.name || sId,
        capital: dName,
        isDistrict: true,
        districtName: dName,
      });
    },
    []
  );

  return (
    <div ref={containerRef} className="relative w-full h-full select-none">
      {/* View mode toggle */}
      <div className="absolute top-4 left-4 z-20 flex gap-1 p-1 bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 rounded-xl">
        {(['party', 'turnout'] as ViewMode[]).map(m => (
          <button key={m} onClick={() => setViewMode(m)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === m ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            {m === 'party' ? '🎗 Party' : '🗳 Turnout'}
          </button>
        ))}
      </div>

      {/* District layer indicator */}
      {showDistricts && (
        <div className="absolute top-4 right-4 z-20 bg-slate-900/80 backdrop-blur-sm border border-green-500/30 rounded-xl px-3 py-1.5">
          <span className="text-[10px] text-green-400 font-semibold">● Districts visible</span>
        </div>
      )}

      {/* Zoom hint */}
      {!showDistricts && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <span className="text-[10px] text-slate-500 bg-slate-900/60 rounded px-2 py-1">
            Zoom in or select a state to see districts
          </span>
        </div>
      )}

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            className="map-tooltip"
            style={{ left: tooltip.x, top: tooltip.y }}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            {tooltip.isDistrict ? (
              <>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">District</div>
                <div className="font-bold text-white text-sm">{tooltip.districtName}</div>
                <div className="text-slate-400 text-xs">{tooltip.name}</div>
                <div className="text-indigo-400 text-[10px] mt-1">Click to explore →</div>
              </>
            ) : (
              <>
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
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [82.5, 22.5], scale: 1000 }}
        width={600} height={650}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup
          zoom={1} minZoom={0.8} maxZoom={8}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...{ onMoveEnd: ({ zoom }: { zoom: number }) => setZoomLevel(zoom) } as any}
        >
          {/* ── State boundaries (always visible) ── */}
          <Geographies geography={INDIA_STATES_TOPO}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const geoName = geo.properties.NAME_1 || geo.properties.st_nm || geo.properties.name || '';
                const state = INDIA_STATES.find(s => s.geojson_id === geoName || s.name === geoName);
                const isSelected = selectedState?.id === state?.id;
                const dimmed = showDistricts && selectedState && !isSelected;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => handleStateClick(geo)}
                    onMouseEnter={(evt) => handleMouseEnter(geo, evt)}
                    onMouseLeave={() => { setHoveredState(null); if (!hoveredDistrict) setTooltip(null); }}
                    style={{
                      default: {
                        fill: state ? getStateColor(state.id, isSelected, hoveredState === state?.id, viewMode) : '#1e293b',
                        fillOpacity: dimmed ? 0.3 : 1,
                        stroke: isSelected ? '#818cf8' : '#0f172a',
                        strokeWidth: isSelected ? 1.5 : 0.5,
                        outline: 'none',
                        transition: 'all 0.2s ease',
                      },
                      hover: {
                        fill: state ? getStateColor(state.id, isSelected, true, viewMode) : '#334155',
                        fillOpacity: dimmed ? 0.5 : 1,
                        stroke: '#818cf8',
                        strokeWidth: 1,
                        outline: 'none',
                        cursor: 'pointer',
                        filter: 'brightness(1.2)',
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

          {/* ── District boundaries (shown on zoom or state select) ── */}
          {showDistricts && (
            <Geographies geography={INDIA_DISTRICTS_GEO}>
              {({ geographies }) =>
                geographies
                  .filter(geo => {
                    // Only show districts for the selected state
                    if (selectedState) return geo.properties.state_id === selectedState.id;
                    return true; // when zoomed, show all
                  })
                  .map((geo) => {
                    const dName = geo.properties.district_name || '';
                    const isHov = hoveredDistrict === dName && geo.properties.state_id === selectedState?.id;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={() => {
                          if (onDistrictSelect) {
                            const p = geo.properties as unknown as DistrictGeo;
                            onDistrictSelect({ id: `${p.state_id}-${p.district_name}`, name: p.district_name, state_id: p.state_id });
                          }
                        }}
                        onMouseEnter={(evt) => handleDistrictMouseEnter(geo, evt)}
                        onMouseLeave={() => { setHoveredDistrict(null); setTooltip(null); }}
                        style={{
                          default: {
                            fill: isHov ? 'rgba(129,140,248,0.35)' : 'rgba(129,140,248,0.08)',
                            stroke: '#818cf8',
                            strokeWidth: 0.6,
                            outline: 'none',
                          },
                          hover: {
                            fill: 'rgba(129,140,248,0.4)',
                            stroke: '#a5b4fc',
                            strokeWidth: 1,
                            outline: 'none',
                            cursor: 'pointer',
                          },
                          pressed: { fill: 'rgba(99,102,241,0.5)', outline: 'none' },
                        }}
                      />
                    );
                  })
              }
            </Geographies>
          )}

          {/* ── District name labels (only when state selected and zoomed enough) ── */}
          {showDistricts && selectedState && zoomLevel >= 1.5 && (
            <Geographies geography={INDIA_DISTRICTS_GEO}>
              {({ geographies }) =>
                geographies
                  .filter(geo => geo.properties.state_id === selectedState.id)
                  .map((geo) => {
                    // Compute centroid for label placement
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const geom = geo.geometry as any;
                    const coords = geom?.coordinates;
                    if (!coords) return null;
                    let pts: number[][] = [];
                    if (geom.type === 'Polygon') pts = coords[0];
                    else if (geom.type === 'MultiPolygon') pts = coords[0][0];
                    if (!pts.length) return null;
                    const lng = pts.reduce((s: number, p: number[]) => s + p[0], 0) / pts.length;
                    const lat = pts.reduce((s: number, p: number[]) => s + p[1], 0) / pts.length;
                    const dName = geo.properties.district_name || '';
                    return (
                      <Marker key={`lbl-${dName}`} coordinates={[lng, lat]}>
                        <text
                          textAnchor="middle"
                          style={{ fontSize: `${Math.max(3, 6 / zoomLevel)}px`, fill: '#e2e8f0', fontWeight: 600, pointerEvents: 'none', textShadow: '0 0 3px #0f172a' }}
                        >
                          {dName}
                        </text>
                      </Marker>
                    );
                  })
              }
            </Geographies>
          )}

          {/* ── State capital markers ── */}
          {INDIA_STATES.filter(s => s.capital_lat && s.capital_lng).map((state) => (
            <Marker key={state.id} coordinates={[state.capital_lng, state.capital_lat]}>
              <g onClick={() => onStateSelect(state)} style={{ cursor: 'pointer' }}>
                <circle r={selectedState?.id === state.id ? 5 : 3} fill="none"
                  stroke={selectedState?.id === state.id ? '#818cf8' : '#fbbf24'}
                  strokeWidth={1} opacity={0.7} />
                <circle r={selectedState?.id === state.id ? 2.5 : 1.5}
                  fill={selectedState?.id === state.id ? '#818cf8' : '#fbbf24'} />
              </g>
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* Legend */}
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
        {showDistricts && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700/50">
            <div className="w-3 h-3 rounded-sm bg-indigo-400/20 border border-indigo-400/60" />
            <span className="text-slate-400">District</span>
          </div>
        )}
        <div className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-slate-400">State Capital</span>
        </div>
      </div>
    </div>
  );
}
