export interface State {
  id: string;
  name: string;
  capital: string;
  capital_lat: number;
  capital_lng: number;
  population?: number;
  area_km2?: number;
  chief_minister?: string;
  party?: string;
  geojson_id: string;
}

export interface District {
  id: string;
  state_id: string;
  name: string;
  headquarters: string;
  population?: number;
  geojson_id: string;
}

export interface Constituency {
  id: string;
  district_id: string;
  state_id: string;
  name: string;
  type: 'parliament' | 'assembly';
  reserved?: 'SC' | 'ST' | null;
  geojson_id: string;
  current_mla?: string;
  mla_party?: string;
}

export interface Representative {
  id: string;
  name: string;
  photo_url?: string;
  party: string;
  party_short: string;
  party_color: string;
  constituency_id: string;
  constituency_name: string;
  constituency_type: 'parliament' | 'assembly';
  state_id: string;
  state_name: string;
  tenure_start: string;
  tenure_end?: string;
  is_active: boolean;
  ministry?: Ministry[];
  education?: string;
  age?: number;
  gender?: string;
  assets?: string;
  criminal_cases?: number;
  attendance_percentage?: number;
  questions_asked?: number;
  debates_participated?: number;
  bills_introduced?: number;
  contact_email?: string;
  contact_phone?: string;
  twitter?: string;
  website?: string;
  bio?: string;
  embedding?: number[];
}

export interface Ministry {
  id: string;
  representative_id: string;
  portfolio: string;
  level: 'cabinet' | 'state' | 'independent';
  from_date: string;
  to_date?: string;
  is_current: boolean;
}

export interface TenureRecord {
  id: string;
  representative_id: string;
  constituency_id: string;
  start_year: number;
  end_year?: number;
  election_year: number;
  votes_received?: number;
  vote_share?: number;
  margin?: number;
  position: 'winner' | 'runner_up';
}

export interface MapView {
  level: 'country' | 'state' | 'district' | 'constituency';
  selectedState?: State;
  selectedDistrict?: District;
  selectedConstituency?: Constituency;
  selectedRepresentative?: Representative;
}

export interface SearchResult {
  type: 'representative' | 'constituency' | 'state' | 'district';
  id: string;
  name: string;
  subtitle?: string;
  score?: number;
}
