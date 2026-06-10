/**
 * ReviewYourLeader — Multi-Source Electoral Data Fetchers
 *
 * Source priority chain:
 *   1. NDAP (NITI Aayog)      — standardised, JSON API
 *   2. LokDhaba (Ashoka Univ) — candidate-level, structured
 *   3. ECI Direct             — authoritative, CSV/HTML scrape
 *   4. ADR / MyNeta           — affidavit data
 *   5. India Data Project     — harmonised open datasets
 *   6. Census / MHA           — demographic overlays
 *   7. API Setu               — e-governance APIs
 */

const UA = 'ReviewYourLeader/1.0 (civic-tech; contact@reviewyourleader.in)';
const TIMEOUT_MS = 20_000;

async function fetchJson(url: string, options: RequestInit = {}): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...options,
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, Accept: 'application/json', ...options.headers },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

// ══════════════════════════════════════════════════════════════
// 1. NDAP — NITI Aayog National Data and Analytics Platform
//    https://ndap.niti.gov.in/api/
// ══════════════════════════════════════════════════════════════
export interface NdapDataset {
  id: string;
  title: string;
  description: string;
  sector: string;
  ministry: string;
  granularity: string;
  lastUpdated: string;
  apiEndpoint: string;
  recordCount: number;
}

export async function fetchNdapDatasets(sector?: string): Promise<NdapDataset[]> {
  try {
    const url = sector
      ? `https://ndap.niti.gov.in/api/dataset/search?sector=${encodeURIComponent(sector)}&size=50`
      : 'https://ndap.niti.gov.in/api/dataset/search?keyword=election+constituency&size=50';
    const data = await fetchJson(url) as { datasets?: NdapDataset[]; content?: NdapDataset[] };
    return data?.datasets ?? data?.content ?? [];
  } catch {
    return [];
  }
}

export async function fetchNdapRecords(datasetId: string, stateCode?: string): Promise<unknown[]> {
  try {
    const filters = stateCode ? `&state_code=${encodeURIComponent(stateCode)}` : '';
    const url = `https://ndap.niti.gov.in/api/dataset/${datasetId}/records?size=500${filters}`;
    const data = await fetchJson(url) as { records?: unknown[]; data?: unknown[] };
    return data?.records ?? data?.data ?? [];
  } catch {
    return [];
  }
}

// ══════════════════════════════════════════════════════════════
// 2. LokDhaba — Ashoka University Political Science Database
//    https://lokdhaba.ashoka.edu.in/api/
// ══════════════════════════════════════════════════════════════
export interface LokDhabaResult {
  State_Name: string;
  Constituency_No: string;
  Constituency_Name: string;
  Assembly_No: string;
  Year: string;
  Month: string;
  Position: string;
  Candidate: string;
  Sex: string;
  Age: string;
  Category: string;
  Party_Abbreviation: string;
  Votes: string;
  Vote_Share_Percentage: string;
  Margin: string;
  ENOP: string;                   // Effective Number of Parties
  Turnout_Percentage: string;
  Total_Votes_Polled: string;
  Total_Electors: string;
}

export async function fetchLokDhabaResults(
  stateCode: string,
  year?: number,
  electionType: 'AE' | 'GE' = 'AE'   // AE = Assembly, GE = General
): Promise<LokDhabaResult[]> {
  try {
    // LokDhaba public API endpoint
    const params = new URLSearchParams({
      State_Name: stateCode,
      Election_Type: electionType,
      ...(year ? { Year: String(year) } : {}),
    });
    const url = `https://lokdhaba.ashoka.edu.in/api/GetElectionData?${params}`;
    const data = await fetchJson(url) as { data?: LokDhabaResult[]; results?: LokDhabaResult[] };
    return data?.data ?? data?.results ?? [];
  } catch {
    return [];
  }
}

export async function fetchLokDhabaPartyPerformance(
  stateCode: string,
  year?: number
): Promise<unknown[]> {
  try {
    const params = new URLSearchParams({
      State_Name: stateCode,
      Election_Type: 'AE',
      ...(year ? { Year: String(year) } : {}),
    });
    const url = `https://lokdhaba.ashoka.edu.in/api/GetPartyPerformance?${params}`;
    const data = await fetchJson(url) as { data?: unknown[] };
    return data?.data ?? [];
  } catch {
    return [];
  }
}

// ══════════════════════════════════════════════════════════════
// 3. ECI — Election Commission of India
//    Results API via results.eci.gov.in
// ══════════════════════════════════════════════════════════════
export interface EciConstituencyResult {
  st_code: string;
  pc_no?: string;
  ac_no?: string;
  constituency: string;
  candidate: string;
  party: string;
  votes: number;
  total_electors: number;
  total_votes: number;
}

// ECI doesn't have a public REST API — we use the India Data Project
// mirror which provides clean JSON exports of ECI data.
export async function fetchEciViaIndiaDataProject(
  stateCode: string,
  year: number,
  electionType: 'parliament' | 'assembly'
): Promise<EciConstituencyResult[]> {
  try {
    // India Data Project open API — harmonised ECI data
    // https://data.indiandataproject.com/api/elections/
    const type = electionType === 'parliament' ? 'LS' : 'AS';
    const url = `https://api.indianelectiondata.in/v1/results?state=${encodeURIComponent(stateCode)}&year=${year}&type=${type}`;
    const data = await fetchJson(url) as { results?: EciConstituencyResult[] };
    return data?.results ?? [];
  } catch {
    return [];
  }
}

// ══════════════════════════════════════════════════════════════
// 4. ADR / MyNeta — Candidate affidavit data
//    https://myneta.info/api/
// ══════════════════════════════════════════════════════════════
export interface AdrCandidate {
  candidate_name: string;
  constituency: string;
  state: string;
  party: string;
  year: number;
  age: number;
  gender: string;
  education: string;
  total_assets: number;
  total_liabilities: number;
  criminal_cases: number;
  serious_criminal_cases: number;
  affidavit_url: string;
}

export async function fetchAdrCandidates(
  stateName: string,
  year: number
): Promise<AdrCandidate[]> {
  try {
    // ADR open data endpoint
    const url = `https://myneta.info/api/candidates?state=${encodeURIComponent(stateName)}&year=${year}`;
    const data = await fetchJson(url) as { candidates?: AdrCandidate[] };
    return data?.candidates ?? [];
  } catch {
    return [];
  }
}

// ══════════════════════════════════════════════════════════════
// 5. Census / MHA — Constituency demographics
//    https://censusindia.gov.in + https://api.mospi.gov.in
// ══════════════════════════════════════════════════════════════
export interface CensusConstituencyData {
  constituency_id: string;
  constituency_name: string;
  state_id: string;
  total_population: number;
  sc_population: number;
  st_population: number;
  literacy_rate: number;
  urban_percent: number;
  sex_ratio: number;
  area_sq_km: number;
  census_year: number;
}

export async function fetchCensusDemographics(stateCode: string): Promise<CensusConstituencyData[]> {
  try {
    // MOSPI / Census Digital Library API
    const url = `https://api.mospi.gov.in/Deta/getDeta?lang=english&StateCode=${encodeURIComponent(stateCode)}&TableType=constituency`;
    const data = await fetchJson(url) as { data?: CensusConstituencyData[] };
    return data?.data ?? [];
  } catch {
    return [];
  }
}

// ══════════════════════════════════════════════════════════════
// 6. API Setu — e-governance APIs (voter registration etc.)
//    https://apisetu.gov.in/api-catalogue
// ══════════════════════════════════════════════════════════════
export async function fetchApiSetuVoterStats(stateCode: string): Promise<unknown> {
  try {
    const apiKey = process.env.API_SETU_KEY;
    if (!apiKey) return null;
    const url = `https://api.apisetu.gov.in/eci/v1/voter-stats?state=${encodeURIComponent(stateCode)}`;
    return fetchJson(url, { headers: { 'X-API-Key': apiKey } });
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════════════════════════
// Transform helpers — normalise data from all sources
// ══════════════════════════════════════════════════════════════

// LokDhaba state name → our state ID mapping
const LOKDHABA_STATE_MAP: Record<string, string> = {
  'Andhra Pradesh': 'AP', 'Arunachal Pradesh': 'AR', 'Assam': 'AS', 'Bihar': 'BR',
  'Chhattisgarh': 'CG', 'Goa': 'GA', 'Gujarat': 'GJ', 'Haryana': 'HR',
  'Himachal Pradesh': 'HP', 'Jharkhand': 'JH', 'Karnataka': 'KA', 'Kerala': 'KL',
  'Madhya Pradesh': 'MP', 'Maharashtra': 'MH', 'Manipur': 'MN', 'Meghalaya': 'ML',
  'Mizoram': 'MZ', 'Nagaland': 'NL', 'Odisha': 'OR', 'Punjab': 'PB',
  'Rajasthan': 'RJ', 'Sikkim': 'SK', 'Tamil Nadu': 'TN', 'Telangana': 'TS',
  'Tripura': 'TR', 'Uttar Pradesh': 'UP', 'Uttarakhand': 'UK', 'West Bengal': 'WB',
  'Jammu & Kashmir': 'JK', 'Delhi': 'DL', 'Puducherry': 'PY',
};

export function stateNameToId(name: string): string {
  return LOKDHABA_STATE_MAP[name] ?? name.slice(0, 2).toUpperCase();
}

export function normaliseLokDhabaResult(r: LokDhabaResult, cycleId: string) {
  const stateId = stateNameToId(r.State_Name);
  return {
    cycle_id: cycleId,
    state_id: stateId,
    constituency_id: `${stateId}-A-${r.Constituency_No?.padStart(3, '0')}`,
    constituency_name: r.Constituency_Name ?? '',
    constituency_type: 'assembly' as const,
    candidate_name: r.Candidate ?? '',
    candidate_gender: r.Sex === 'F' ? 'Female' : r.Sex === 'M' ? 'Male' : null,
    party: r.Party_Abbreviation ?? '',
    party_short: r.Party_Abbreviation ?? '',
    votes: parseInt(r.Votes ?? '0', 10) || 0,
    vote_share: parseFloat(r.Vote_Share_Percentage ?? '0') || 0,
    margin: parseInt(r.Margin ?? '0', 10) || 0,
    position: parseInt(r.Position ?? '99', 10) || 99,
    is_winner: (parseInt(r.Position ?? '99', 10) || 99) === 1,
    total_votes_cast: parseInt(r.Total_Votes_Polled ?? '0', 10) || 0,
    total_electors: parseInt(r.Total_Electors ?? '0', 10) || 0,
    turnout_percent: parseFloat(r.Turnout_Percentage ?? '0') || 0,
    source: 'LokDhaba',
    raw_data: r,
  };
}
