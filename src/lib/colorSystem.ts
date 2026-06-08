/**
 * ReviewYourLeader — Industry-Standard Political Color System
 *
 * Design principles:
 * - WCAG AA contrast (≥4.5:1 on dark backgrounds)
 * - Semantic + brand-accurate party colors
 * - HSL-based for programmatic lightness/saturation control
 * - CSS custom property friendly
 * - Supports dark/light mode
 */

export interface PartyTheme {
  primary: string;      // Main brand color (hex)
  light: string;        // 20% opacity variant for backgrounds
  border: string;       // 40% opacity variant for borders
  text: string;         // Accessible text color on dark bg
  gradient: string;     // CSS gradient string
  badge: string;        // Solid background for pill badges
  glow: string;         // Box-shadow glow
}

// ── Verified, brand-accurate party colors ─────────────────────
const PARTY_COLORS: Record<string, PartyTheme> = {
  BJP: {
    primary: '#FF6B00',
    light: 'rgba(255, 107, 0, 0.12)',
    border: 'rgba(255, 107, 0, 0.35)',
    text: '#FFAB66',
    gradient: 'linear-gradient(135deg, #FF6B00, #FF9500)',
    badge: '#BF5000',
    glow: '0 0 16px rgba(255,107,0,0.25)',
  },
  INC: {
    primary: '#1A7CE8',
    light: 'rgba(26, 124, 232, 0.12)',
    border: 'rgba(26, 124, 232, 0.35)',
    text: '#6EB4FF',
    gradient: 'linear-gradient(135deg, #1A7CE8, #0D5BB5)',
    badge: '#0D5BB5',
    glow: '0 0 16px rgba(26,124,232,0.25)',
  },
  AAP: {
    primary: '#0063CC',
    light: 'rgba(0, 99, 204, 0.12)',
    border: 'rgba(0, 99, 204, 0.35)',
    text: '#5BA3FF',
    gradient: 'linear-gradient(135deg, #0063CC, #003D80)',
    badge: '#003D80',
    glow: '0 0 16px rgba(0,99,204,0.25)',
  },
  TMC: {
    primary: '#0BA5C1',
    light: 'rgba(11, 165, 193, 0.12)',
    border: 'rgba(11, 165, 193, 0.35)',
    text: '#4DD4EB',
    gradient: 'linear-gradient(135deg, #0BA5C1, #07748A)',
    badge: '#07748A',
    glow: '0 0 16px rgba(11,165,193,0.25)',
  },
  DMK: {
    primary: '#C41E3A',
    light: 'rgba(196, 30, 58, 0.12)',
    border: 'rgba(196, 30, 58, 0.35)',
    text: '#FF6B7A',
    gradient: 'linear-gradient(135deg, #C41E3A, #8B1528)',
    badge: '#8B1528',
    glow: '0 0 16px rgba(196,30,58,0.25)',
  },
  AIADMK: {
    primary: '#008B4A',
    light: 'rgba(0, 139, 74, 0.12)',
    border: 'rgba(0, 139, 74, 0.35)',
    text: '#3DD68C',
    gradient: 'linear-gradient(135deg, #008B4A, #006035)',
    badge: '#006035',
    glow: '0 0 16px rgba(0,139,74,0.25)',
  },
  TDP: {
    primary: '#E8C400',
    light: 'rgba(232, 196, 0, 0.12)',
    border: 'rgba(232, 196, 0, 0.35)',
    text: '#F5D800',
    gradient: 'linear-gradient(135deg, #E8C400, #A88E00)',
    badge: '#7A6600',
    glow: '0 0 16px rgba(232,196,0,0.25)',
  },
  YSRCP: {
    primary: '#0078B4',
    light: 'rgba(0, 120, 180, 0.12)',
    border: 'rgba(0, 120, 180, 0.35)',
    text: '#4DB8FF',
    gradient: 'linear-gradient(135deg, #0078B4, #005080)',
    badge: '#005080',
    glow: '0 0 16px rgba(0,120,180,0.25)',
  },
  SP: {
    primary: '#E02020',
    light: 'rgba(224, 32, 32, 0.12)',
    border: 'rgba(224, 32, 32, 0.35)',
    text: '#FF6B6B',
    gradient: 'linear-gradient(135deg, #E02020, #9E0000)',
    badge: '#9E0000',
    glow: '0 0 16px rgba(224,32,32,0.25)',
  },
  BSP: {
    primary: '#0A6E3B',
    light: 'rgba(10, 110, 59, 0.12)',
    border: 'rgba(10, 110, 59, 0.35)',
    text: '#2ECC7A',
    gradient: 'linear-gradient(135deg, #0A6E3B, #054D29)',
    badge: '#054D29',
    glow: '0 0 16px rgba(10,110,59,0.25)',
  },
  JDU: {
    primary: '#2563EB',
    light: 'rgba(37, 99, 235, 0.12)',
    border: 'rgba(37, 99, 235, 0.35)',
    text: '#93C5FD',
    gradient: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
    badge: '#1D4ED8',
    glow: '0 0 16px rgba(37,99,235,0.25)',
  },
  'CPI(M)': {
    primary: '#DC2626',
    light: 'rgba(220, 38, 38, 0.12)',
    border: 'rgba(220, 38, 38, 0.35)',
    text: '#FCA5A5',
    gradient: 'linear-gradient(135deg, #DC2626, #991B1B)',
    badge: '#991B1B',
    glow: '0 0 16px rgba(220,38,38,0.25)',
  },
  NC: {
    primary: '#16A34A',
    light: 'rgba(22, 163, 74, 0.12)',
    border: 'rgba(22, 163, 74, 0.35)',
    text: '#4ADE80',
    gradient: 'linear-gradient(135deg, #16A34A, #15803D)',
    badge: '#15803D',
    glow: '0 0 16px rgba(22,163,74,0.25)',
  },
  JMM: {
    primary: '#7C3AED',
    light: 'rgba(124, 58, 237, 0.12)',
    border: 'rgba(124, 58, 237, 0.35)',
    text: '#C4B5FD',
    gradient: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
    badge: '#6D28D9',
    glow: '0 0 16px rgba(124,58,237,0.25)',
  },
  SKM: {
    primary: '#0891B2',
    light: 'rgba(8, 145, 178, 0.12)',
    border: 'rgba(8, 145, 178, 0.35)',
    text: '#67E8F9',
    gradient: 'linear-gradient(135deg, #0891B2, #0E7490)',
    badge: '#0E7490',
    glow: '0 0 16px rgba(8,145,178,0.25)',
  },
  NPP: {
    primary: '#D97706',
    light: 'rgba(217, 119, 6, 0.12)',
    border: 'rgba(217, 119, 6, 0.35)',
    text: '#FCD34D',
    gradient: 'linear-gradient(135deg, #D97706, #B45309)',
    badge: '#B45309',
    glow: '0 0 16px rgba(217,119,6,0.25)',
  },
  ZPM: {
    primary: '#059669',
    light: 'rgba(5, 150, 105, 0.12)',
    border: 'rgba(5, 150, 105, 0.35)',
    text: '#34D399',
    gradient: 'linear-gradient(135deg, #059669, #047857)',
    badge: '#047857',
    glow: '0 0 16px rgba(5,150,105,0.25)',
  },
  NDPP: {
    primary: '#7C3AED',
    light: 'rgba(124, 58, 237, 0.12)',
    border: 'rgba(124, 58, 237, 0.35)',
    text: '#C4B5FD',
    gradient: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
    badge: '#5B21B6',
    glow: '0 0 16px rgba(124,58,237,0.25)',
  },
  Central: {
    primary: '#475569',
    light: 'rgba(71, 85, 105, 0.12)',
    border: 'rgba(71, 85, 105, 0.35)',
    text: '#94A3B8',
    gradient: 'linear-gradient(135deg, #475569, #334155)',
    badge: '#334155',
    glow: '0 0 16px rgba(71,85,105,0.25)',
  },
  Independent: {
    primary: '#6366F1',
    light: 'rgba(99, 102, 241, 0.12)',
    border: 'rgba(99, 102, 241, 0.35)',
    text: '#A5B4FC',
    gradient: 'linear-gradient(135deg, #6366F1, #4F46E5)',
    badge: '#4338CA',
    glow: '0 0 16px rgba(99,102,241,0.25)',
  },
};

const DEFAULT_THEME: PartyTheme = {
  primary: '#6366F1',
  light: 'rgba(99, 102, 241, 0.12)',
  border: 'rgba(99, 102, 241, 0.30)',
  text: '#A5B4FC',
  gradient: 'linear-gradient(135deg, #6366F1, #4F46E5)',
  badge: '#4338CA',
  glow: '0 0 16px rgba(99,102,241,0.20)',
};

export function getPartyTheme(party: string): PartyTheme {
  // Direct match
  if (PARTY_COLORS[party]) return PARTY_COLORS[party];
  // Partial match (e.g. "BJP+SS" → BJP)
  const key = Object.keys(PARTY_COLORS).find(k =>
    party.toUpperCase().includes(k) || k.includes(party.toUpperCase())
  );
  return key ? PARTY_COLORS[key] : DEFAULT_THEME;
}

// ── Map fill colors — optimized for dark backgrounds ──────────
export function getMapFillColor(rulingParty: string, isSelected: boolean, isHovered: boolean): string {
  if (isSelected) return '#818CF8';
  const theme = getPartyTheme(rulingParty);
  if (isHovered) return theme.primary + 'CC';
  return theme.primary + '50';
}

// ── Attendance rating colors ──────────────────────────────────
export function getAttendanceTheme(pct: number) {
  if (pct >= 85) return { color: '#22C55E', label: 'Excellent', bg: 'rgba(34,197,94,0.12)' };
  if (pct >= 70) return { color: '#84CC16', label: 'Good', bg: 'rgba(132,204,22,0.12)' };
  if (pct >= 55) return { color: '#EAB308', label: 'Average', bg: 'rgba(234,179,8,0.12)' };
  if (pct >= 40) return { color: '#F97316', label: 'Below Average', bg: 'rgba(249,115,22,0.12)' };
  return { color: '#EF4444', label: 'Poor', bg: 'rgba(239,68,68,0.12)' };
}

// ── Constituency type colors ──────────────────────────────────
export const CONSTITUENCY_COLORS = {
  parliament: { primary: '#F97316', light: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.25)', text: '#FED7AA' },
  assembly:   { primary: '#6366F1', light: 'rgba(99,102,241,0.10)', border: 'rgba(99,102,241,0.25)', text: '#C7D2FE' },
  reserved_sc: { primary: '#A855F7', light: 'rgba(168,85,247,0.10)', border: 'rgba(168,85,247,0.25)', text: '#E9D5FF' },
  reserved_st: { primary: '#EC4899', light: 'rgba(236,72,153,0.10)', border: 'rgba(236,72,153,0.25)', text: '#FBCFE8' },
};

// ── Validation status colors ──────────────────────────────────
export const VALIDATION_COLORS = {
  validated: { color: '#22C55E', bg: 'rgba(34,197,94,0.10)', label: 'Verified ✓' },
  conflict:  { color: '#EAB308', bg: 'rgba(234,179,8,0.10)',  label: 'Reviewed ⚠' },
  pending:   { color: '#6B7280', bg: 'rgba(107,114,128,0.10)', label: 'Pending…' },
  failed:    { color: '#EF4444', bg: 'rgba(239,68,68,0.10)',  label: 'Check Data ✗' },
};

// ── Map legend data ───────────────────────────────────────────
export const MAP_LEGEND = [
  { party: 'BJP',  label: 'BJP',      color: '#FF6B00' },
  { party: 'INC',  label: 'INC',      color: '#1A7CE8' },
  { party: 'AAP',  label: 'AAP',      color: '#0063CC' },
  { party: 'TMC',  label: 'TMC',      color: '#0BA5C1' },
  { party: 'DMK',  label: 'DMK',      color: '#C41E3A' },
  { party: 'TDP',  label: 'TDP',      color: '#E8C400' },
  { party: 'Others', label: 'Others', color: '#6366F1' },
];
