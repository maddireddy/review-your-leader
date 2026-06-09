/**
 * Party-level aggregate statistics
 * Computed from REPRESENTATIVES + INDIA_STATES.
 */

import { REPRESENTATIVES } from './representativesData';
import { INDIA_STATES, StateInfo } from './indiaData';
import { getPartyTheme } from './colorSystem';

export interface PartyScorecard {
  party: string;
  party_short: string;
  color: string;
  mp_count: number;
  states_governed: number;
  avg_attendance: number;
  total_questions: number;
  total_bills: number;
  total_debates: number;
  avg_criminal_cases: number;
  ministers: number;
}

export function getPartyScorecards(): PartyScorecard[] {
  const map = new Map<string, {
    short: string;
    reps: typeof REPRESENTATIVES;
  }>();

  // Group reps by party_short
  for (const rep of REPRESENTATIVES) {
    if (!rep.is_active) continue;
    const key = rep.party_short;
    if (!map.has(key)) map.set(key, { short: key, reps: [] });
    map.get(key)!.reps.push(rep);
  }

  // Count states governed per ruling party
  const statesGoverned = new Map<string, number>();
  for (const state of INDIA_STATES as StateInfo[]) {
    const rp = state.ruling_party;
    if (rp) statesGoverned.set(rp, (statesGoverned.get(rp) ?? 0) + 1);
  }

  const cards: PartyScorecard[] = [];

  for (const [short, { reps }] of map) {
    const n = reps.length;
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

    cards.push({
      party: reps[0].party,
      party_short: short,
      color: getPartyTheme(short).primary,
      mp_count: n,
      states_governed: statesGoverned.get(short) ?? 0,
      avg_attendance: Math.round(avg(reps.map(r => r.attendance_percentage ?? 0))),
      total_questions: sum(reps.map(r => r.questions_asked ?? 0)),
      total_bills: sum(reps.map(r => r.bills_introduced ?? 0)),
      total_debates: sum(reps.map(r => r.debates_participated ?? 0)),
      avg_criminal_cases: Math.round(avg(reps.map(r => r.criminal_cases ?? 0)) * 10) / 10,
      ministers: reps.filter(r => r.ministry && r.ministry.some(m => m.is_current)).length,
    });
  }

  // Sort by MP count desc
  return cards.sort((a, b) => b.mp_count - a.mp_count);
}
