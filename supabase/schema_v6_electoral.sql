-- ============================================================
-- ReviewYourLeader — Schema v6: Comprehensive Electoral Data
-- Sources: ECI · NDAP · LokDhaba · ADR/MyNeta · Census · API Setu
-- Run AFTER schema_v5b_photo_enhancement.sql
-- ============================================================

-- ── Election cycles (each general/state election) ─────────────
CREATE TABLE IF NOT EXISTS election_cycles (
  id              TEXT PRIMARY KEY,            -- e.g. 'GE-2024', 'TN-2021', 'MH-2024'
  election_type   TEXT NOT NULL,               -- 'general' | 'state' | 'bypolls'
  state_id        TEXT,                        -- NULL for general elections
  year            INTEGER NOT NULL,
  phase_count     INTEGER DEFAULT 1,
  schedule_start  DATE,
  schedule_end    DATE,
  result_date     DATE,
  total_seats     INTEGER,
  total_voters    BIGINT,
  total_votes_polled BIGINT,
  turnout_percent NUMERIC(5,2),
  source          TEXT DEFAULT 'ECI',
  fetched_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(election_type, state_id, year)
);

-- ── Election results (candidate-level, per constituency) ──────
CREATE TABLE IF NOT EXISTS election_results (
  id              BIGSERIAL PRIMARY KEY,
  cycle_id        TEXT REFERENCES election_cycles(id) ON DELETE CASCADE,
  state_id        TEXT NOT NULL,
  constituency_id TEXT NOT NULL,              -- e.g. 'TN-001', 'MH-022'
  constituency_name TEXT NOT NULL,
  constituency_type TEXT NOT NULL,            -- 'parliament' | 'assembly'
  candidate_name  TEXT NOT NULL,
  candidate_gender TEXT,
  party           TEXT NOT NULL,
  party_short     TEXT,
  alliance        TEXT,                       -- NDA | INDIA | UPA | etc.
  votes           INTEGER,
  vote_share      NUMERIC(5,2),
  margin          INTEGER,
  margin_percent  NUMERIC(5,2),
  position        INTEGER,                    -- 1=winner, 2=runner-up, etc.
  is_winner       BOOLEAN DEFAULT FALSE,
  total_votes_cast INTEGER,
  total_electors  INTEGER,
  turnout_percent NUMERIC(5,2),
  evm_votes       INTEGER,
  postal_votes    INTEGER,
  nota_votes      INTEGER,
  source          TEXT DEFAULT 'ECI',
  raw_data        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_er_state       ON election_results(state_id);
CREATE INDEX IF NOT EXISTS idx_er_constituency ON election_results(constituency_id);
CREATE INDEX IF NOT EXISTS idx_er_party       ON election_results(party);
CREATE INDEX IF NOT EXISTS idx_er_cycle       ON election_results(cycle_id);
CREATE INDEX IF NOT EXISTS idx_er_winner      ON election_results(is_winner, state_id);
CREATE INDEX IF NOT EXISTS idx_er_candidate   ON election_results(candidate_name);

-- ── Candidate profiles (from ADR/MyNeta affidavits) ──────────
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id              BIGSERIAL PRIMARY KEY,
  candidate_name  TEXT NOT NULL,
  state_id        TEXT,
  party           TEXT,
  constituency    TEXT,
  election_year   INTEGER,

  -- Personal details (from affidavit)
  age             INTEGER,
  gender          TEXT,
  education       TEXT,
  profession      TEXT,

  -- Financial disclosure
  total_assets    BIGINT,                     -- in INR
  total_liabilities BIGINT,
  movable_assets  BIGINT,
  immovable_assets BIGINT,
  income_declared BIGINT,

  -- Criminal record
  criminal_cases  INTEGER DEFAULT 0,
  serious_criminal_cases INTEGER DEFAULT 0,
  criminal_details JSONB DEFAULT '[]',        -- [{ipc_section, description, status}]

  -- Campaign finance
  expenditure_declared BIGINT,

  -- Metadata
  affidavit_url   TEXT,
  source          TEXT DEFAULT 'ADR',
  fetched_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(candidate_name, state_id, election_year, constituency)
);

CREATE INDEX IF NOT EXISTS idx_cp_state  ON candidate_profiles(state_id);
CREATE INDEX IF NOT EXISTS idx_cp_name   ON candidate_profiles(candidate_name);
CREATE INDEX IF NOT EXISTS idx_cp_party  ON candidate_profiles(party);

-- ── Party performance (aggregated per state/election) ─────────
CREATE TABLE IF NOT EXISTS party_performance (
  id              BIGSERIAL PRIMARY KEY,
  cycle_id        TEXT REFERENCES election_cycles(id) ON DELETE CASCADE,
  state_id        TEXT,
  party           TEXT NOT NULL,
  party_short     TEXT,
  alliance        TEXT,

  -- Results
  seats_contested INTEGER DEFAULT 0,
  seats_won       INTEGER DEFAULT 0,
  total_votes     BIGINT DEFAULT 0,
  vote_share      NUMERIC(5,2),
  avg_margin      NUMERIC(10,2),

  -- Trends (vs previous election)
  seats_change    INTEGER,                    -- +/- vs last election
  vote_share_change NUMERIC(5,2),

  source          TEXT DEFAULT 'ECI',
  fetched_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cycle_id, state_id, party)
);

CREATE INDEX IF NOT EXISTS idx_pp_party  ON party_performance(party, state_id);
CREATE INDEX IF NOT EXISTS idx_pp_cycle  ON party_performance(cycle_id);

-- ── Constituency demographics (Census + ECI voter data) ───────
CREATE TABLE IF NOT EXISTS constituency_demographics (
  id              BIGSERIAL PRIMARY KEY,
  constituency_id TEXT NOT NULL,
  constituency_name TEXT NOT NULL,
  state_id        TEXT NOT NULL,
  constituency_type TEXT NOT NULL,

  -- Electoral roll (ECI)
  total_electors  BIGINT,
  male_electors   BIGINT,
  female_electors BIGINT,
  third_gender_electors BIGINT,
  new_voters      INTEGER,                    -- 18-19 year olds
  reference_year  INTEGER,

  -- Census demographics (MHA)
  total_population BIGINT,
  sc_population   BIGINT,
  st_population   BIGINT,
  literacy_rate   NUMERIC(5,2),
  urban_percent   NUMERIC(5,2),
  sex_ratio       INTEGER,                    -- females per 1000 males

  -- Geographic
  area_sq_km      NUMERIC(10,2),
  districts_covered TEXT[],

  -- Reserved category
  is_sc_reserved  BOOLEAN DEFAULT FALSE,
  is_st_reserved  BOOLEAN DEFAULT FALSE,
  is_general      BOOLEAN DEFAULT TRUE,

  census_year     INTEGER DEFAULT 2011,
  source          TEXT DEFAULT 'ECI+Census',
  fetched_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(constituency_id, reference_year)
);

CREATE INDEX IF NOT EXISTS idx_cd_state        ON constituency_demographics(state_id);
CREATE INDEX IF NOT EXISTS idx_cd_constituency ON constituency_demographics(constituency_id);

-- ── Historical voter turnout (time series per constituency) ───
CREATE TABLE IF NOT EXISTS voter_turnout_history (
  id              BIGSERIAL PRIMARY KEY,
  constituency_id TEXT NOT NULL,
  state_id        TEXT NOT NULL,
  election_year   INTEGER NOT NULL,
  election_type   TEXT NOT NULL,
  total_electors  BIGINT,
  votes_polled    BIGINT,
  turnout_percent NUMERIC(5,2),
  male_turnout    NUMERIC(5,2),
  female_turnout  NUMERIC(5,2),
  source          TEXT DEFAULT 'ECI',
  UNIQUE(constituency_id, election_year, election_type)
);

CREATE INDEX IF NOT EXISTS idx_vth_constituency ON voter_turnout_history(constituency_id);
CREATE INDEX IF NOT EXISTS idx_vth_state        ON voter_turnout_history(state_id, election_year);

-- ── NDAP datasets index (NITI Aayog) ──────────────────────────
CREATE TABLE IF NOT EXISTS ndap_datasets (
  id              TEXT PRIMARY KEY,           -- NDAP dataset ID
  title           TEXT NOT NULL,
  description     TEXT,
  sector          TEXT,                       -- 'Agriculture' | 'Education' | 'Health' etc.
  ministry        TEXT,
  granularity     TEXT,                       -- 'district' | 'state' | 'national'
  last_updated    DATE,
  api_endpoint    TEXT,
  schema_fields   JSONB DEFAULT '[]',
  record_count    BIGINT,
  fetched_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Data sync log (track what was synced from where) ─────────
CREATE TABLE IF NOT EXISTS data_sync_log (
  id              BIGSERIAL PRIMARY KEY,
  source          TEXT NOT NULL,              -- 'ECI' | 'NDAP' | 'LokDhaba' | 'ADR' | 'Census'
  entity_type     TEXT NOT NULL,              -- 'election_results' | 'candidates' | 'demographics'
  entity_id       TEXT,                       -- state_id or cycle_id
  status          TEXT NOT NULL,              -- 'success' | 'partial' | 'failed'
  records_synced  INTEGER DEFAULT 0,
  error_message   TEXT,
  duration_ms     INTEGER,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_dsl_source ON data_sync_log(source, started_at DESC);

-- ── RLS policies ──────────────────────────────────────────────
ALTER TABLE election_cycles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_results         ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_performance        ENABLE ROW LEVEL SECURITY;
ALTER TABLE constituency_demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE voter_turnout_history    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ndap_datasets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sync_log            ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read election_cycles"           ON election_cycles           FOR SELECT USING (true);
CREATE POLICY "Public read election_results"          ON election_results          FOR SELECT USING (true);
CREATE POLICY "Public read candidate_profiles"        ON candidate_profiles        FOR SELECT USING (true);
CREATE POLICY "Public read party_performance"         ON party_performance         FOR SELECT USING (true);
CREATE POLICY "Public read constituency_demographics" ON constituency_demographics FOR SELECT USING (true);
CREATE POLICY "Public read voter_turnout_history"     ON voter_turnout_history     FOR SELECT USING (true);
CREATE POLICY "Public read ndap_datasets"             ON ndap_datasets             FOR SELECT USING (true);
CREATE POLICY "Service write election_cycles"         ON election_cycles           FOR ALL USING (true);
CREATE POLICY "Service write election_results"        ON election_results          FOR ALL USING (true);
CREATE POLICY "Service write candidate_profiles"      ON candidate_profiles        FOR ALL USING (true);
CREATE POLICY "Service write party_performance"       ON party_performance         FOR ALL USING (true);
CREATE POLICY "Service write constituency_demographics" ON constituency_demographics FOR ALL USING (true);
CREATE POLICY "Service write voter_turnout_history"   ON voter_turnout_history     FOR ALL USING (true);
CREATE POLICY "Service write ndap_datasets"           ON ndap_datasets             FOR ALL USING (true);
CREATE POLICY "Service write data_sync_log"           ON data_sync_log             FOR ALL USING (true);

-- ── Seed initial election cycles ─────────────────────────────
INSERT INTO election_cycles (id, election_type, state_id, year, result_date, total_seats, source)
VALUES
  ('GE-2024', 'general', NULL, 2024, '2024-06-04', 543, 'ECI'),
  ('GE-2019', 'general', NULL, 2019, '2019-05-23', 543, 'ECI'),
  ('GE-2014', 'general', NULL, 2014, '2014-05-16', 543, 'ECI'),
  ('GE-2009', 'general', NULL, 2009, '2009-05-16', 543, 'ECI'),
  ('GE-2004', 'general', NULL, 2004, '2004-05-13', 543, 'ECI'),
  ('TN-2021',  'state', 'TN',  2021, '2021-05-02', 234, 'ECI'),
  ('TN-2016',  'state', 'TN',  2016, '2016-05-19', 234, 'ECI'),
  ('MH-2024',  'state', 'MH',  2024, '2024-11-23', 288, 'ECI'),
  ('MH-2019',  'state', 'MH',  2019, '2019-10-24', 288, 'ECI'),
  ('UP-2022',  'state', 'UP',  2022, '2022-03-10', 403, 'ECI'),
  ('UP-2017',  'state', 'UP',  2017, '2017-03-11', 403, 'ECI'),
  ('RJ-2023',  'state', 'RJ',  2023, '2023-12-03', 200, 'ECI'),
  ('MP-2023',  'state', 'MP',  2023, '2023-12-03', 230, 'ECI'),
  ('CG-2023',  'state', 'CG',  2023, '2023-12-03', 90,  'ECI'),
  ('TS-2023',  'state', 'TS',  2023, '2023-12-03', 119, 'ECI'),
  ('KA-2023',  'state', 'KA',  2023, '2023-05-13', 224, 'ECI'),
  ('HP-2022',  'state', 'HP',  2022, '2022-12-08', 68,  'ECI'),
  ('GJ-2022',  'state', 'GJ',  2022, '2022-12-08', 182, 'ECI'),
  ('PB-2022',  'state', 'PB',  2022, '2022-03-10', 117, 'ECI'),
  ('GA-2022',  'state', 'GA',  2022, '2022-03-10', 40,  'ECI'),
  ('UK-2022',  'state', 'UK',  2022, '2022-03-10', 70,  'ECI'),
  ('MN-2022',  'state', 'MN',  2022, '2022-03-10', 60,  'ECI'),
  ('WB-2021',  'state', 'WB',  2021, '2021-05-02', 294, 'ECI'),
  ('AS-2021',  'state', 'AS',  2021, '2021-05-02', 126, 'ECI'),
  ('KL-2021',  'state', 'KL',  2021, '2021-05-02', 140, 'ECI'),
  ('PY-2021',  'state', 'PY',  2021, '2021-05-02', 30,  'ECI'),
  ('DL-2020',  'state', 'DL',  2020, '2020-02-11', 70,  'ECI'),
  ('BR-2020',  'state', 'BR',  2020, '2020-11-10', 243, 'ECI'),
  ('JH-2019',  'state', 'JH',  2019, '2019-12-23', 81,  'ECI'),
  ('HR-2019',  'state', 'HR',  2019, '2019-10-24', 90,  'ECI'),
  ('AP-2024',  'state', 'AP',  2024, '2024-06-04', 175, 'ECI'),
  ('OR-2024',  'state', 'OR',  2024, '2024-06-04', 147, 'ECI'),
  ('SK-2024',  'state', 'SK',  2024, '2024-06-02', 32,  'ECI'),
  ('AR-2024',  'state', 'AR',  2024, '2024-06-04', 60,  'ECI')
ON CONFLICT (election_type, state_id, year) DO NOTHING;
