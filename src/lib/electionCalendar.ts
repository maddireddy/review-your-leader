/**
 * Upcoming elections calendar — ECI schedule
 * Updated as Election Commission announces dates.
 */

export interface ElectionEvent {
  id: string;
  title: string;
  type: 'assembly' | 'lok_sabha' | 'by_election' | 'local_body' | 'rajya_sabha';
  state?: string;
  expected_date: string;    // ISO date or "Q3 2026" style
  status: 'announced' | 'expected' | 'tentative';
  seats?: number;
  description: string;
}

export const ELECTION_CALENDAR: ElectionEvent[] = [
  {
    id: 'wb-2026',
    title: 'West Bengal Assembly Election',
    type: 'assembly',
    state: 'West Bengal',
    expected_date: '2026-04-15',
    status: 'expected',
    seats: 294,
    description: 'TMC seeks to retain power. Major contest with BJP for 294 assembly seats.',
  },
  {
    id: 'tn-2026',
    title: 'Tamil Nadu Assembly Election',
    type: 'assembly',
    state: 'Tamil Nadu',
    expected_date: '2026-05-10',
    status: 'expected',
    seats: 234,
    description: 'DMK-led alliance vs AIADMK-BJP. 234 assembly constituencies in play.',
  },
  {
    id: 'kl-2026',
    title: 'Kerala Assembly Election',
    type: 'assembly',
    state: 'Kerala',
    expected_date: '2026-05-10',
    status: 'expected',
    seats: 140,
    description: 'LDF (Left) vs UDF (Congress-led). Historic anti-incumbency battle.',
  },
  {
    id: 'as-2026',
    title: 'Assam Assembly Election',
    type: 'assembly',
    state: 'Assam',
    expected_date: '2026-04-05',
    status: 'expected',
    seats: 126,
    description: 'BJP-led NDA seeks third term. 126 assembly seats.',
  },
  {
    id: 'pondy-2026',
    title: 'Puducherry Assembly Election',
    type: 'assembly',
    state: 'Puducherry',
    expected_date: '2026-05-10',
    status: 'tentative',
    seats: 30,
    description: 'Union Territory assembly election for 30 seats.',
  },
  {
    id: 'rajya-sabha-2026',
    title: 'Rajya Sabha Biennial Elections',
    type: 'rajya_sabha',
    expected_date: '2026-06-20',
    status: 'tentative',
    seats: 68,
    description: 'Biennial elections for ~68 Rajya Sabha seats across multiple states.',
  },
];

export function getUpcomingElections(): ElectionEvent[] {
  return [...ELECTION_CALENDAR].sort(
    (a, b) => new Date(a.expected_date).getTime() - new Date(b.expected_date).getTime()
  );
}

export function daysUntil(dateStr: string, fromDate = new Date('2026-06-09')): number {
  const diff = new Date(dateStr).getTime() - fromDate.getTime();
  return Math.ceil(diff / 86400000);
}
