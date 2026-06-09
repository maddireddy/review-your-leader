/**
 * State-wise voter turnout — 2024 Lok Sabha General Election
 * Source: Election Commission of India
 */

export const STATE_TURNOUT: Record<string, number> = {
  TG: 65.7, AP: 80.7, UP: 56.9, MH: 61.4, KA: 71.8, TN: 69.7,
  WB: 81.7, DL: 58.7, RJ: 61.4, GJ: 60.1, MP: 66.9, PB: 62.8,
  KL: 71.3, BR: 56.2, JH: 66.0, AS: 81.6, OD: 74.4, CG: 72.8,
  HR: 64.8, JK: 58.6, UK: 56.0, HP: 70.0, TR: 81.5, ML: 71.4,
  MN: 79.6, MZ: 56.9, NL: 57.7, AR: 78.6, SK: 79.9, GA: 76.0,
  CH: 67.7, PY: 78.8, AN: 64.1, LD: 84.2, DN: 70.0, LA: 71.8,
};

export function getTurnout(stateId: string): number | undefined {
  return STATE_TURNOUT[stateId];
}

// Color scale for turnout heatmap (red→yellow→green)
export function getTurnoutColor(turnout: number | undefined): string {
  if (turnout === undefined) return '#1e293b';
  if (turnout >= 80) return '#15803d';  // dark green
  if (turnout >= 72) return '#22c55e';  // green
  if (turnout >= 65) return '#84cc16';  // lime
  if (turnout >= 58) return '#eab308';  // yellow
  if (turnout >= 50) return '#f97316';  // orange
  return '#ef4444';                      // red
}

export const TURNOUT_LEGEND = [
  { label: '80%+', color: '#15803d' },
  { label: '72–80%', color: '#22c55e' },
  { label: '65–72%', color: '#84cc16' },
  { label: '58–65%', color: '#eab308' },
  { label: '50–58%', color: '#f97316' },
  { label: '<50%', color: '#ef4444' },
];
