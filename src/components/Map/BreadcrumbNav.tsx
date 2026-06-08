'use client';

import { ChevronRight, Home, Map, Building2, Landmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { MapView } from '@/types';
import { getPartyTheme } from '@/lib/colorSystem';

interface BreadcrumbNavProps {
  view: MapView;
  onNavigate: (level: MapView['level']) => void;
  rulingParty?: string;
}

export function BreadcrumbNav({ view, onNavigate, rulingParty }: BreadcrumbNavProps) {
  const theme = getPartyTheme(rulingParty || 'default');
  const crumbs = [
    { level: 'country' as const, label: 'India', icon: <Home className="w-3.5 h-3.5" /> },
    ...(view.selectedState
      ? [{ level: 'state' as const, label: view.selectedState.name, icon: <Map className="w-3.5 h-3.5" /> }]
      : []),
    ...(view.selectedDistrict
      ? [{ level: 'district' as const, label: view.selectedDistrict.name, icon: <Building2 className="w-3.5 h-3.5" /> }]
      : []),
    ...(view.selectedConstituency
      ? [{ level: 'constituency' as const, label: view.selectedConstituency.name, icon: <Landmark className="w-3.5 h-3.5" /> }]
      : []),
  ];

  return (
    <motion.div
      className="flex items-center gap-1 flex-wrap"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {crumbs.map((crumb, idx) => (
        <div key={crumb.level} className="flex items-center gap-1">
          {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
          <button
            onClick={() => onNavigate(crumb.level)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium transition-all ${
              idx === crumbs.length - 1
                ? 'cursor-default'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60 cursor-pointer'
            }`}
            style={idx === crumbs.length - 1 ? {
              background: theme.light,
              color: theme.text,
              border: `1px solid ${theme.border}`,
            } : {}}
          >
            {crumb.icon}
            {crumb.label}
          </button>
        </div>
      ))}
    </motion.div>
  );
}
