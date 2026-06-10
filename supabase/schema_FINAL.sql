-- ============================================================
--  ReviewYourLeader — FINAL CONSOLIDATED SCHEMA
--  Single script — safe to run on a fresh Supabase project.
--  All IF NOT EXISTS / DO NOTHING guards make it idempotent.
--  Run order: extensions → core tables → caches → electoral →
--             constituencies/mandals → epics → seed data → RLS
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- 0. EXTENSIONS
-- ════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS vector;       -- pgvector (semantic search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;      -- trigram fuzzy search on names


-- ════════════════════════════════════════════════════════════
-- 1. CORE POLITICAL HIERARCHY
-- ════════════════════════════════════════════════════════════

-- ── 1a. States ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS states (
  id              TEXT PRIMARY KEY,          -- 'TG' | 'AP' | 'TN' etc.
  name            TEXT NOT NULL,
  capital         TEXT NOT NULL,
  capital_lat     DOUBLE PRECISION,
  capital_lng     DOUBLE PRECISION,
  population      BIGINT,
  area_km2        DOUBLE PRECISION,
  chief_minister  TEXT,
  cm_party        TEXT,
  ruling_party    TEXT,
  geojson_id      TEXT,
  landmark        TEXT,
  landmark_emoji  TEXT,
  language_code   TEXT,                      -- 'te' | 'ta' | 'kn' etc.
  language_name   TEXT,                      -- 'Telugu' | 'Tamil' etc.
  language_native TEXT,                      -- 'తెలుగు' | 'தமிழ்' etc.
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 1b. Districts ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS districts (
  id              TEXT PRIMARY KEY,          -- 'TG-KHM' | 'TN-CHN' etc.
  state_id        TEXT NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  headquarters    TEXT,
  population      BIGINT,
  area_km2        DOUBLE PRECISION,
  mandals_count   INTEGER DEFAULT 0,
  assembly_seats  INTEGER DEFAULT 0,
  lok_sabha_seats INTEGER DEFAULT 1,
  geojson_id      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_districts_state ON districts(state_id);

-- ── 1c. Assembly & Lok Sabha constituencies ──────────────────
CREATE TABLE IF NOT EXISTS assembly_constituencies (
  id                  TEXT PRIMARY KEY,      -- 'TG-117' | 'TN-001' etc.
  state_id            TEXT NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  district_id         TEXT NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  number              INTEGER NOT NULL,
  name                TEXT NOT NULL,
  type                TEXT NOT NULL DEFAULT 'assembly'
                        CHECK (type IN ('assembly', 'parliament')),
  reserved            TEXT CHECK (reserved IN ('SC', 'ST')),
  current_mla         TEXT,
  mla_party           TEXT,
  current_mp          TEXT,
  mp_party            TEXT,
  eci_code            TEXT,                  -- Official ECI constituency code
  voters_2024         INTEGER,
  voters_2019         INTEGER,
  last_election_year  INTEGER,
  -- AI validation
  ai_validated        BOOLEAN DEFAULT FALSE,
  ai_confidence       NUMERIC(4,3),
  validated_at        TIMESTAMPTZ,
  source              TEXT DEFAULT 'static', -- 'static' | 'ECI' | 'LokDhaba' | 'AI'
  raw_eci_data        JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(state_id, number, type)
);

CREATE INDEX IF NOT EXISTS idx_ac_state      ON assembly_constituencies(state_id);
CREATE INDEX IF NOT EXISTS idx_ac_district   ON assembly_constituencies(district_id);
CREATE INDEX IF NOT EXISTS idx_ac_mla        ON assembly_constituencies(current_mla);
CREATE INDEX IF NOT EXISTS idx_ac_party      ON assembly_constituencies(mla_party);

-- ── 1d. Mandals (revenue circles / talukas) ──────────────────
CREATE TABLE IF NOT EXISTS mandals (
  id              TEXT PRIMARY KEY,          -- 'TG-KHM-SATHUPALLI'
  state_id        TEXT NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  district_id     TEXT NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  constituency_id TEXT REFERENCES assembly_constituencies(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  headquarters    TEXT,
  village_count   INTEGER,
  population      BIGINT,
  area_sq_km      NUMERIC(10,2),
  pincode         TEXT,
  source          TEXT DEFAULT 'static',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(district_id, name)
);

CREATE INDEX IF NOT EXISTS idx_mandals_state        ON mandals(state_id);
CREATE INDEX IF NOT EXISTS idx_mandals_district     ON mandals(district_id);
CREATE INDEX IF NOT EXISTS idx_mandals_constituency ON mandals(constituency_id);

-- ── 1e. Representatives (elected officials) ──────────────────
CREATE TABLE IF NOT EXISTS representatives (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name                  TEXT NOT NULL,
  photo_url             TEXT,
  party                 TEXT NOT NULL,
  party_short           TEXT NOT NULL,
  party_color           TEXT DEFAULT '#6366f1',
  constituency_id       TEXT REFERENCES assembly_constituencies(id),
  state_id              TEXT REFERENCES states(id),
  tenure_start          DATE NOT NULL,
  tenure_end            DATE,
  is_active             BOOLEAN DEFAULT TRUE,
  education             TEXT,
  age                   INTEGER,
  gender                TEXT,
  assets                TEXT,
  criminal_cases        INTEGER DEFAULT 0,
  attendance_percentage NUMERIC(5,2),
  questions_asked       INTEGER DEFAULT 0,
  debates_participated  INTEGER DEFAULT 0,
  bills_introduced      INTEGER DEFAULT 0,
  contact_email         TEXT,
  contact_phone         TEXT,
  twitter               TEXT,
  website               TEXT,
  bio                   TEXT,
  embedding             vector(512),        -- Voyage AI semantic search
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_representatives_state        ON representatives(state_id);
CREATE INDEX IF NOT EXISTS idx_representatives_constituency ON representatives(constituency_id);
CREATE INDEX IF NOT EXISTS idx_representatives_active       ON representatives(is_active);
CREATE INDEX IF NOT EXISTS idx_representatives_name         ON representatives USING gin(name gin_trgm_ops);

-- HNSW vector index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_rep_embedding ON representatives
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Semantic similarity search function
CREATE OR REPLACE FUNCTION match_representatives(
  query_embedding vector(512),
  match_count     INT DEFAULT 10,
  filter_state    TEXT DEFAULT NULL
)
RETURNS TABLE (id TEXT, name TEXT, party TEXT, constituency_id TEXT, state_id TEXT, similarity FLOAT)
LANGUAGE SQL STABLE AS $$
  SELECT r.id, r.name, r.party, r.constituency_id, r.state_id,
         1 - (r.embedding <=> query_embedding) AS similarity
  FROM representatives r
  WHERE r.embedding IS NOT NULL
    AND (filter_state IS NULL OR r.state_id = filter_state)
  ORDER BY r.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ── 1f. Ministry portfolios ──────────────────────────────────
CREATE TABLE IF NOT EXISTS ministries (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  representative_id TEXT REFERENCES representatives(id) ON DELETE CASCADE,
  portfolio         TEXT NOT NULL,
  level             TEXT CHECK (level IN ('cabinet', 'state', 'independent')) NOT NULL,
  from_date         DATE NOT NULL,
  to_date           DATE,
  is_current        BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ministries_rep     ON ministries(representative_id);
CREATE INDEX IF NOT EXISTS idx_ministries_current ON ministries(is_current);

-- ── 1g. Tenure / election records per representative ─────────
CREATE TABLE IF NOT EXISTS tenure_records (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  representative_id TEXT REFERENCES representatives(id) ON DELETE CASCADE,
  constituency_id   TEXT REFERENCES assembly_constituencies(id),
  election_year     INTEGER NOT NULL,
  start_year        INTEGER NOT NULL,
  end_year          INTEGER,
  votes_received    INTEGER,
  vote_share        NUMERIC(5,2),
  margin            INTEGER,
  position          TEXT CHECK (position IN ('winner', 'runner_up')) DEFAULT 'winner',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenure_rep         ON tenure_records(representative_id);
CREATE INDEX IF NOT EXISTS idx_tenure_year        ON tenure_records(election_year);

-- ── 1h. MLA legislative performance ─────────────────────────
CREATE TABLE IF NOT EXISTS mla_performance (
  id                      BIGSERIAL PRIMARY KEY,
  constituency_id         TEXT REFERENCES assembly_constituencies(id) ON DELETE CASCADE,
  mla_name                TEXT NOT NULL,
  mla_party               TEXT NOT NULL,
  tenure_start            DATE,
  tenure_end              DATE,
  assembly_attendance_pct NUMERIC(5,2),
  questions_raised        INTEGER DEFAULT 0,
  debates_participated    INTEGER DEFAULT 0,
  bills_introduced        INTEGER DEFAULT 0,
  mplads_utilized_pct     NUMERIC(5,2),
  works_sanctioned        INTEGER DEFAULT 0,
  works_completed         INTEGER DEFAULT 0,
  sentiment_score         NUMERIC(4,3),      -- -1 to 1
  news_mentions_30d       INTEGER DEFAULT 0,
  source                  TEXT DEFAULT 'AI',
  fetched_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mla_perf_constituency ON mla_performance(constituency_id);
CREATE INDEX IF NOT EXISTS idx_mla_perf_mla          ON mla_performance(mla_name);


-- ════════════════════════════════════════════════════════════
-- 2. ELECTORAL DATA (ECI / LokDhaba / NDAP)
-- ════════════════════════════════════════════════════════════

-- ── 2a. Election cycles ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS election_cycles (
  id                  TEXT PRIMARY KEY,      -- 'GE-2024' | 'TN-2021' | 'TG-2023'
  election_type       TEXT NOT NULL,         -- 'general' | 'state' | 'bypolls'
  state_id            TEXT REFERENCES states(id),  -- NULL for general elections
  year                INTEGER NOT NULL,
  phase_count         INTEGER DEFAULT 1,
  schedule_start      DATE,
  schedule_end        DATE,
  result_date         DATE,
  total_seats         INTEGER,
  total_voters        BIGINT,
  total_votes_polled  BIGINT,
  turnout_percent     NUMERIC(5,2),
  ruling_alliance     TEXT,                  -- 'NDA' | 'INDIA' | 'UPA' etc.
  source              TEXT DEFAULT 'ECI',
  fetched_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(election_type, state_id, year)
);

CREATE INDEX IF NOT EXISTS idx_ec_state ON election_cycles(state_id, year DESC);

-- ── 2b. Election results — candidate level ───────────────────
CREATE TABLE IF NOT EXISTS election_results (
  id                  BIGSERIAL PRIMARY KEY,
  cycle_id            TEXT REFERENCES election_cycles(id) ON DELETE CASCADE,
  state_id            TEXT NOT NULL,
  constituency_id     TEXT,                  -- FK to assembly_constituencies
  constituency_name   TEXT NOT NULL,
  constituency_type   TEXT NOT NULL,         -- 'parliament' | 'assembly'
  candidate_name      TEXT NOT NULL,
  candidate_gender    TEXT,
  party               TEXT NOT NULL,
  party_short         TEXT,
  alliance            TEXT,                  -- 'NDA' | 'INDIA' | 'UPA' | independent
  votes               INTEGER,
  vote_share          NUMERIC(5,2),
  margin              INTEGER,
  margin_percent      NUMERIC(5,2),
  position            INTEGER,               -- 1=winner, 2=runner-up, etc.
  is_winner           BOOLEAN DEFAULT FALSE,
  total_votes_cast    INTEGER,
  total_electors      INTEGER,
  turnout_percent     NUMERIC(5,2),
  evm_votes           INTEGER,
  postal_votes        INTEGER,
  nota_votes          INTEGER,
  source              TEXT DEFAULT 'ECI',
  raw_data            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_er_state        ON election_results(state_id);
CREATE INDEX IF NOT EXISTS idx_er_constituency ON election_results(constituency_id);
CREATE INDEX IF NOT EXISTS idx_er_party        ON election_results(party);
CREATE INDEX IF NOT EXISTS idx_er_cycle        ON election_results(cycle_id);
CREATE INDEX IF NOT EXISTS idx_er_winner       ON election_results(is_winner, state_id);
CREATE INDEX IF NOT EXISTS idx_er_candidate    ON election_results(candidate_name);

-- ── 2c. Candidate profiles (ADR / MyNeta affidavit data) ─────
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id                    BIGSERIAL PRIMARY KEY,
  candidate_name        TEXT NOT NULL,
  state_id              TEXT,
  party                 TEXT,
  constituency          TEXT,
  election_year         INTEGER,
  -- Personal details
  age                   INTEGER,
  gender                TEXT,
  education             TEXT,
  profession            TEXT,
  -- Financial disclosure (INR)
  total_assets          BIGINT,
  total_liabilities     BIGINT,
  movable_assets        BIGINT,
  immovable_assets      BIGINT,
  income_declared       BIGINT,
  -- Criminal record
  criminal_cases        INTEGER DEFAULT 0,
  serious_criminal_cases INTEGER DEFAULT 0,
  criminal_details      JSONB DEFAULT '[]', -- [{ipc_section, description, status}]
  -- Campaign finance
  expenditure_declared  BIGINT,
  affidavit_url         TEXT,
  source                TEXT DEFAULT 'ADR',
  fetched_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(candidate_name, state_id, election_year, constituency)
);

CREATE INDEX IF NOT EXISTS idx_cp_state  ON candidate_profiles(state_id);
CREATE INDEX IF NOT EXISTS idx_cp_name   ON candidate_profiles(candidate_name);
CREATE INDEX IF NOT EXISTS idx_cp_party  ON candidate_profiles(party);

-- ── 2d. Party performance per election ───────────────────────
CREATE TABLE IF NOT EXISTS party_performance (
  id                BIGSERIAL PRIMARY KEY,
  cycle_id          TEXT REFERENCES election_cycles(id) ON DELETE CASCADE,
  state_id          TEXT,
  party             TEXT NOT NULL,
  party_short       TEXT,
  alliance          TEXT,
  seats_contested   INTEGER DEFAULT 0,
  seats_won         INTEGER DEFAULT 0,
  total_votes       BIGINT DEFAULT 0,
  vote_share        NUMERIC(5,2),
  avg_margin        NUMERIC(10,2),
  seats_change      INTEGER,                -- vs previous election
  vote_share_change NUMERIC(5,2),
  source            TEXT DEFAULT 'ECI',
  fetched_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cycle_id, state_id, party)
);

CREATE INDEX IF NOT EXISTS idx_pp_party ON party_performance(party, state_id);
CREATE INDEX IF NOT EXISTS idx_pp_cycle ON party_performance(cycle_id);

-- ── 2e. Constituency demographics (Census + ECI voter rolls) ─
CREATE TABLE IF NOT EXISTS constituency_demographics (
  id                    BIGSERIAL PRIMARY KEY,
  constituency_id       TEXT NOT NULL,
  constituency_name     TEXT NOT NULL,
  state_id              TEXT NOT NULL,
  constituency_type     TEXT NOT NULL,
  -- Electoral roll (ECI)
  total_electors        BIGINT,
  male_electors         BIGINT,
  female_electors       BIGINT,
  third_gender_electors BIGINT,
  new_voters            INTEGER,            -- 18–19 year olds
  reference_year        INTEGER,
  -- Census demographics
  total_population      BIGINT,
  sc_population         BIGINT,
  st_population         BIGINT,
  literacy_rate         NUMERIC(5,2),
  urban_percent         NUMERIC(5,2),
  sex_ratio             INTEGER,            -- females per 1000 males
  -- Geographic
  area_sq_km            NUMERIC(10,2),
  districts_covered     TEXT[],
  -- Reservation
  is_sc_reserved        BOOLEAN DEFAULT FALSE,
  is_st_reserved        BOOLEAN DEFAULT FALSE,
  is_general            BOOLEAN DEFAULT TRUE,
  census_year           INTEGER DEFAULT 2011,
  source                TEXT DEFAULT 'ECI+Census',
  fetched_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(constituency_id, reference_year)
);

CREATE INDEX IF NOT EXISTS idx_cd_state        ON constituency_demographics(state_id);
CREATE INDEX IF NOT EXISTS idx_cd_constituency ON constituency_demographics(constituency_id);

-- ── 2f. Historical voter turnout per constituency ─────────────
CREATE TABLE IF NOT EXISTS voter_turnout_history (
  id               BIGSERIAL PRIMARY KEY,
  constituency_id  TEXT NOT NULL,
  state_id         TEXT NOT NULL,
  election_year    INTEGER NOT NULL,
  election_type    TEXT NOT NULL,
  total_electors   BIGINT,
  votes_polled     BIGINT,
  turnout_percent  NUMERIC(5,2),
  male_turnout     NUMERIC(5,2),
  female_turnout   NUMERIC(5,2),
  source           TEXT DEFAULT 'ECI',
  UNIQUE(constituency_id, election_year, election_type)
);

CREATE INDEX IF NOT EXISTS idx_vth_constituency ON voter_turnout_history(constituency_id);
CREATE INDEX IF NOT EXISTS idx_vth_state        ON voter_turnout_history(state_id, election_year);

-- ── 2g. NDAP datasets catalogue ──────────────────────────────
CREATE TABLE IF NOT EXISTS ndap_datasets (
  id            TEXT PRIMARY KEY,            -- NDAP dataset ID
  title         TEXT NOT NULL,
  description   TEXT,
  sector        TEXT,
  ministry      TEXT,
  granularity   TEXT,
  last_updated  DATE,
  api_endpoint  TEXT,
  schema_fields JSONB DEFAULT '[]',
  record_count  BIGINT,
  fetched_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ════════════════════════════════════════════════════════════
-- 3. AI / VALIDATION LAYER
-- ════════════════════════════════════════════════════════════

-- ── 3a. Ground truth facts (authoritative — AI never overrides)
CREATE TABLE IF NOT EXISTS ground_truth_facts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type      TEXT NOT NULL,
  entity_id        TEXT NOT NULL,
  fact_key         TEXT NOT NULL,            -- 'chief_minister' | 'party' | 'cm_since'
  fact_value       TEXT NOT NULL,
  fact_party       TEXT,
  fact_source      TEXT DEFAULT 'verified_db',
  confidence       NUMERIC(3,2) DEFAULT 1.0,
  sources          JSONB DEFAULT '[]',
  validation_notes TEXT,
  verified_at      TIMESTAMPTZ DEFAULT NOW(),
  verified_by      TEXT DEFAULT 'system',
  UNIQUE(entity_type, entity_id, fact_key)
);

CREATE INDEX IF NOT EXISTS idx_gt_entity ON ground_truth_facts(entity_type, entity_id);

-- ── 3b. Multi-model AI response cache ────────────────────────
CREATE TABLE IF NOT EXISTS ai_insight_cache (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key         TEXT NOT NULL UNIQUE,    -- 'state_insight:TG:2026-06'
  entity_type       TEXT NOT NULL,
  entity_id         TEXT NOT NULL,
  ground_truth      JSONB NOT NULL DEFAULT '{}',
  -- Model 1 (primary)
  model1_name       TEXT,
  model1_response   TEXT,
  model1_confidence NUMERIC(3,2),
  -- Model 2 (validator)
  model2_name       TEXT,
  model2_response   TEXT,
  model2_confidence NUMERIC(3,2),
  -- Model 3 (arbiter — only on conflict)
  model3_name       TEXT,
  model3_response   TEXT,
  model3_confidence NUMERIC(3,2),
  -- Consensus
  consensus_response  TEXT,
  consensus_score     NUMERIC(3,2),
  validation_status   TEXT DEFAULT 'pending'
    CHECK (validation_status IN ('validated','conflict','pending','failed')),
  fact_violations     JSONB DEFAULT '[]',
  auto_corrected      BOOLEAN DEFAULT FALSE,
  -- Cache control
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  expires_at          TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  refresh_count       INTEGER DEFAULT 0,
  last_refreshed_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_key    ON ai_insight_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_entity ON ai_insight_cache(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_cache_exp    ON ai_insight_cache(expires_at);

CREATE OR REPLACE FUNCTION cleanup_expired_cache() RETURNS void AS $$
  DELETE FROM ai_insight_cache WHERE expires_at < NOW();
$$ LANGUAGE SQL;

-- ── 3c. AI validation log (per-record 3-model audit trail) ───
CREATE TABLE IF NOT EXISTS ai_validation_log (
  id               BIGSERIAL PRIMARY KEY,
  entity_type      TEXT NOT NULL,
  entity_id        TEXT NOT NULL,
  model_1          TEXT,
  model_1_result   JSONB,
  model_2          TEXT,
  model_2_result   JSONB,
  model_3          TEXT,
  model_3_result   JSONB,
  consensus        BOOLEAN,
  consensus_score  NUMERIC(4,3),
  correction_made  BOOLEAN DEFAULT FALSE,
  correction_detail TEXT,
  validated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_avl_entity ON ai_validation_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_avl_date   ON ai_validation_log(validated_at DESC);

-- ── 3d. Fact refresh audit log ───────────────────────────────
CREATE TABLE IF NOT EXISTS fact_refresh_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type      TEXT NOT NULL,
  entity_id        TEXT NOT NULL,
  fact_key         TEXT NOT NULL,
  old_value        TEXT,
  candidate_value  TEXT,
  confidence       NUMERIC(3,2),
  committed        BOOLEAN DEFAULT FALSE,
  changed          BOOLEAN DEFAULT FALSE,
  validation_notes TEXT,
  sources          JSONB DEFAULT '[]',
  run_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_log_entity ON fact_refresh_log(entity_type, entity_id, run_at DESC);

-- ── 3e. Data sync log (ETL audit) ────────────────────────────
CREATE TABLE IF NOT EXISTS data_sync_log (
  id              BIGSERIAL PRIMARY KEY,
  source          TEXT NOT NULL,             -- 'ECI' | 'NDAP' | 'LokDhaba' | 'ADR' | 'Census'
  entity_type     TEXT NOT NULL,
  entity_id       TEXT,
  status          TEXT NOT NULL,             -- 'success' | 'partial' | 'failed' | 'running'
  records_synced  INTEGER DEFAULT 0,
  error_message   TEXT,
  duration_ms     INTEGER,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_dsl_source ON data_sync_log(source, started_at DESC);


-- ════════════════════════════════════════════════════════════
-- 4. PIPELINE INFRASTRUCTURE
-- ════════════════════════════════════════════════════════════

-- ── 4a. Dedup locks (prevent concurrent pipelines) ───────────
CREATE TABLE IF NOT EXISTS pipeline_locks (
  entity_id   TEXT PRIMARY KEY,
  locked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE OR REPLACE FUNCTION cleanup_expired_locks() RETURNS void AS $$
  DELETE FROM pipeline_locks WHERE expires_at < NOW();
$$ LANGUAGE SQL;

-- ── 4b. Politician rich profiles cache ───────────────────────
CREATE TABLE IF NOT EXISTS politician_profiles (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  slug                 TEXT NOT NULL UNIQUE,  -- 'mk-stalin-tn' | 'revanth-reddy-tg'
  name                 TEXT NOT NULL,
  name_native          TEXT,
  state_id             TEXT,
  role                 TEXT,
  party                TEXT,
  party_short          TEXT,
  photo_url            TEXT,
  enhanced_photo_url   TEXT,
  wikipedia_slug       TEXT,
  wikipedia_extract    TEXT,
  wikipedia_url        TEXT,
  birth_date           TEXT,
  birth_place          TEXT,
  education            TEXT[],
  net_worth            TEXT,
  career_timeline      JSONB DEFAULT '[]',    -- [{year, event, role, party}]
  key_achievements     JSONB DEFAULT '[]',    -- [{title, description, year}]
  controversies        JSONB DEFAULT '[]',    -- [{title, year, description}]
  personality_analysis JSONB DEFAULT '{}',   -- {leadership_style, known_for, traits[]}
  recent_news          JSONB DEFAULT '[]',    -- [{title, url, published_at, snippet}]
  fetched_at           TIMESTAMPTZ DEFAULT NOW(),
  expires_at           TIMESTAMPTZ DEFAULT NOW() + INTERVAL '6 hours',
  fetch_version        INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_politician_slug  ON politician_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_politician_state ON politician_profiles(state_id);
CREATE INDEX IF NOT EXISTS idx_politician_exp   ON politician_profiles(expires_at);


-- ════════════════════════════════════════════════════════════
-- 5. EPICS MODULE (Ramayana · Mahabharata audio)
-- ════════════════════════════════════════════════════════════

-- ── 5a. Epic metadata ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS epics (
  id              TEXT PRIMARY KEY,          -- 'ramayana' | 'mahabharata'
  title           TEXT NOT NULL,
  title_hindi     TEXT,
  description     TEXT,
  book_count      INTEGER,
  total_slokas    INTEGER,
  language        TEXT DEFAULT 'Sanskrit',
  author          TEXT,
  period          TEXT,
  cover_image_url TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5b. Episodes / chapters ──────────────────────────────────
CREATE TABLE IF NOT EXISTS epic_episodes (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  epic_id           TEXT NOT NULL REFERENCES epics(id) ON DELETE CASCADE,
  book_number       INTEGER NOT NULL,
  book_name         TEXT NOT NULL,
  book_name_hindi   TEXT,
  episode_number    INTEGER NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  duration_seconds  INTEGER,
  audio_url         TEXT NOT NULL,
  archive_id        TEXT,
  transcript_excerpt TEXT,
  language          TEXT DEFAULT 'Hindi',
  narrator          TEXT,
  tags              TEXT[] DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(epic_id, book_number, episode_number)
);

CREATE INDEX IF NOT EXISTS idx_epic_episodes_epic ON epic_episodes(epic_id);
CREATE INDEX IF NOT EXISTS idx_epic_episodes_book ON epic_episodes(epic_id, book_number);

-- ── 5c. User playback progress ───────────────────────────────
CREATE TABLE IF NOT EXISTS user_epic_progress (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  session_id       TEXT NOT NULL,
  epic_id          TEXT NOT NULL REFERENCES epics(id),
  episode_id       TEXT NOT NULL REFERENCES epic_episodes(id),
  position_seconds INTEGER DEFAULT 0,
  completed        BOOLEAN DEFAULT FALSE,
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, episode_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_session ON user_epic_progress(session_id, epic_id);


-- ════════════════════════════════════════════════════════════
-- 6. UTILITY TRIGGERS
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_states_updated_at') THEN
    CREATE TRIGGER trg_states_updated_at
      BEFORE UPDATE ON states FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_districts_updated_at') THEN
    CREATE TRIGGER trg_districts_updated_at
      BEFORE UPDATE ON districts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ac_updated_at') THEN
    CREATE TRIGGER trg_ac_updated_at
      BEFORE UPDATE ON assembly_constituencies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════
-- 7. ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════

ALTER TABLE states                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE assembly_constituencies   ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandals                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE representatives           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministries                ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenure_records            ENABLE ROW LEVEL SECURITY;
ALTER TABLE mla_performance           ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_cycles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_results          ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_performance         ENABLE ROW LEVEL SECURITY;
ALTER TABLE constituency_demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE voter_turnout_history     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ndap_datasets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ground_truth_facts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insight_cache          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_validation_log         ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_refresh_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sync_log             ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_locks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE politician_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE epics                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE epic_episodes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_epic_progress        ENABLE ROW LEVEL SECURITY;

-- Public read (anon key can read everything)
CREATE POLICY IF NOT EXISTS "public_read_states"                    ON states                    FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_districts"                 ON districts                 FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_assembly_constituencies"   ON assembly_constituencies   FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_mandals"                   ON mandals                   FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_representatives"           ON representatives           FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_ministries"                ON ministries                FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_tenure_records"            ON tenure_records            FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_mla_performance"           ON mla_performance           FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_election_cycles"           ON election_cycles           FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_election_results"          ON election_results          FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_candidate_profiles"        ON candidate_profiles        FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_party_performance"         ON party_performance         FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_constituency_demographics" ON constituency_demographics FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_voter_turnout_history"     ON voter_turnout_history     FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_ndap_datasets"             ON ndap_datasets             FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_ground_truth_facts"        ON ground_truth_facts        FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_ai_insight_cache"          ON ai_insight_cache          FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_ai_validation_log"         ON ai_validation_log         FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_fact_refresh_log"          ON fact_refresh_log          FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_data_sync_log"             ON data_sync_log             FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_politician_profiles"       ON politician_profiles       FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_epics"                     ON epics                     FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_epic_episodes"             ON epic_episodes             FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_user_epic_progress"        ON user_epic_progress        FOR SELECT USING (true);

-- Service role write (backend API with service key can write everything)
CREATE POLICY IF NOT EXISTS "service_write_states"                    ON states                    FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_write_districts"                 ON districts                 FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_write_assembly_constituencies"   ON assembly_constituencies   FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_write_mandals"                   ON mandals                   FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_write_representatives"           ON representatives           FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_write_ministries"                ON ministries                FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_write_tenure_records"            ON tenure_records            FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_write_mla_performance"           ON mla_performance           FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_write_election_cycles"           ON election_cycles           FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_write_election_results"          ON election_results          FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_write_candidate_profiles"        ON candidate_profiles        FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_write_party_performance"         ON party_performance         FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_write_constituency_demographics" ON constituency_demographics FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_write_voter_turnout_history"     ON voter_turnout_history     FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_write_ndap_datasets"             ON ndap_datasets             FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_write_ground_truth_facts"        ON ground_truth_facts        FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_write_ai_insight_cache"          ON ai_insight_cache          FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_write_ai_validation_log"         ON ai_validation_log         FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_write_fact_refresh_log"          ON fact_refresh_log          FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_write_data_sync_log"             ON data_sync_log             FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_write_pipeline_locks"            ON pipeline_locks            FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_write_politician_profiles"       ON politician_profiles       FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_write_epics"                     ON epics                     FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_write_epic_episodes"             ON epic_episodes             FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_write_user_epic_progress"        ON user_epic_progress        FOR ALL USING (true);


-- ════════════════════════════════════════════════════════════
-- 8. SEED DATA
-- ════════════════════════════════════════════════════════════

-- ── 8a. Election cycles (ECI official schedule) ──────────────
INSERT INTO election_cycles (id, election_type, state_id, year, result_date, total_seats, source)
VALUES
  ('GE-2024', 'general', NULL, 2024, '2024-06-04', 543, 'ECI'),
  ('GE-2019', 'general', NULL, 2019, '2019-05-23', 543, 'ECI'),
  ('GE-2014', 'general', NULL, 2014, '2014-05-16', 543, 'ECI'),
  ('GE-2009', 'general', NULL, 2009, '2009-05-16', 543, 'ECI'),
  ('GE-2004', 'general', NULL, 2004, '2004-05-13', 543, 'ECI'),
  ('TG-2023', 'state', 'TG', 2023, '2023-12-03', 119, 'ECI'),
  ('TG-2018', 'state', 'TG', 2018, '2018-12-11', 119, 'ECI'),
  ('AP-2024', 'state', 'AP', 2024, '2024-06-04', 175, 'ECI'),
  ('AP-2019', 'state', 'AP', 2019, '2019-05-23', 175, 'ECI'),
  ('TN-2021', 'state', 'TN', 2021, '2021-05-02', 234, 'ECI'),
  ('TN-2016', 'state', 'TN', 2016, '2016-05-19', 234, 'ECI'),
  ('KA-2023', 'state', 'KA', 2023, '2023-05-13', 224, 'ECI'),
  ('KA-2018', 'state', 'KA', 2018, '2018-05-15', 224, 'ECI'),
  ('MH-2024', 'state', 'MH', 2024, '2024-11-23', 288, 'ECI'),
  ('MH-2019', 'state', 'MH', 2019, '2019-10-24', 288, 'ECI'),
  ('KL-2021', 'state', 'KL', 2021, '2021-05-02', 140, 'ECI'),
  ('WB-2021', 'state', 'WB', 2021, '2021-05-02', 294, 'ECI'),
  ('UP-2022', 'state', 'UP', 2022, '2022-03-10', 403, 'ECI'),
  ('UP-2017', 'state', 'UP', 2017, '2017-03-11', 403, 'ECI'),
  ('RJ-2023', 'state', 'RJ', 2023, '2023-12-03', 200, 'ECI'),
  ('MP-2023', 'state', 'MP', 2023, '2023-12-03', 230, 'ECI'),
  ('CG-2023', 'state', 'CG', 2023, '2023-12-03', 90,  'ECI'),
  ('GJ-2022', 'state', 'GJ', 2022, '2022-12-08', 182, 'ECI'),
  ('DL-2020', 'state', 'DL', 2020, '2020-02-11', 70,  'ECI'),
  ('BR-2020', 'state', 'BR', 2020, '2020-11-10', 243, 'ECI'),
  ('PB-2022', 'state', 'PB', 2022, '2022-03-10', 117, 'ECI'),
  ('HR-2019', 'state', 'HR', 2019, '2019-10-24', 90,  'ECI'),
  ('JH-2019', 'state', 'JH', 2019, '2019-12-23', 81,  'ECI'),
  ('AS-2021', 'state', 'AS', 2021, '2021-05-02', 126, 'ECI'),
  ('OR-2024', 'state', 'OR', 2024, '2024-06-04', 147, 'ECI'),
  ('UK-2022', 'state', 'UK', 2022, '2022-03-10', 70,  'ECI'),
  ('HP-2022', 'state', 'HP', 2022, '2022-12-08', 68,  'ECI'),
  ('GA-2022', 'state', 'GA', 2022, '2022-03-10', 40,  'ECI'),
  ('MN-2022', 'state', 'MN', 2022, '2022-03-10', 60,  'ECI'),
  ('PY-2021', 'state', 'PY', 2021, '2021-05-02', 30,  'ECI'),
  ('SK-2024', 'state', 'SK', 2024, '2024-06-02', 32,  'ECI'),
  ('AR-2024', 'state', 'AR', 2024, '2024-06-04', 60,  'ECI')
ON CONFLICT (election_type, state_id, year) DO NOTHING;

-- ── 8b. Ground truth — verified Chief Ministers (as of June 2026) ─
INSERT INTO ground_truth_facts (entity_type, entity_id, fact_key, fact_value, fact_source, confidence)
VALUES
  -- Telangana
  ('state','TG','chief_minister',  'A. Revanth Reddy',         'verified_db', 1.0),
  ('state','TG','cm_party',        'Indian National Congress',  'verified_db', 1.0),
  ('state','TG','cm_since',        '2023-12-07',                'verified_db', 1.0),
  ('state','TG','capital',         'Hyderabad',                 'verified_db', 1.0),
  ('state','TG','prev_cm',         'K. Chandrashekar Rao',      'verified_db', 1.0),
  -- Andhra Pradesh
  ('state','AP','chief_minister',  'N. Chandrababu Naidu',      'verified_db', 1.0),
  ('state','AP','cm_party',        'Telugu Desam Party',        'verified_db', 1.0),
  ('state','AP','cm_since',        '2024-06-12',                'verified_db', 1.0),
  ('state','AP','capital',         'Amaravati',                 'verified_db', 1.0),
  -- Tamil Nadu
  ('state','TN','chief_minister',  'M. K. Stalin',              'verified_db', 1.0),
  ('state','TN','cm_party',        'Dravida Munnetra Kazhagam', 'verified_db', 1.0),
  ('state','TN','cm_since',        '2021-05-07',                'verified_db', 1.0),
  ('state','TN','capital',         'Chennai',                   'verified_db', 1.0),
  -- Karnataka
  ('state','KA','chief_minister',  'Siddaramaiah',              'verified_db', 1.0),
  ('state','KA','cm_party',        'Indian National Congress',  'verified_db', 1.0),
  ('state','KA','cm_since',        '2023-05-20',                'verified_db', 1.0),
  ('state','KA','capital',         'Bengaluru',                 'verified_db', 1.0),
  -- Maharashtra
  ('state','MH','chief_minister',  'Devendra Fadnavis',         'verified_db', 1.0),
  ('state','MH','cm_party',        'Bharatiya Janata Party',    'verified_db', 1.0),
  ('state','MH','cm_since',        '2024-12-05',                'verified_db', 1.0),
  ('state','MH','capital',         'Mumbai',                    'verified_db', 1.0),
  -- Kerala
  ('state','KL','chief_minister',  'Pinarayi Vijayan',          'verified_db', 1.0),
  ('state','KL','cm_party',        'Communist Party of India (Marxist)', 'verified_db', 1.0),
  ('state','KL','cm_since',        '2021-05-20',                'verified_db', 1.0),
  ('state','KL','capital',         'Thiruvananthapuram',        'verified_db', 1.0),
  -- Uttar Pradesh
  ('state','UP','chief_minister',  'Yogi Adityanath',           'verified_db', 1.0),
  ('state','UP','cm_party',        'Bharatiya Janata Party',    'verified_db', 1.0),
  ('state','UP','cm_since',        '2022-03-25',                'verified_db', 1.0),
  ('state','UP','capital',         'Lucknow',                   'verified_db', 1.0),
  -- West Bengal
  ('state','WB','chief_minister',  'Mamata Banerjee',           'verified_db', 1.0),
  ('state','WB','cm_party',        'All India Trinamool Congress','verified_db',1.0),
  ('state','WB','cm_since',        '2021-05-05',                'verified_db', 1.0),
  ('state','WB','capital',         'Kolkata',                   'verified_db', 1.0),
  -- Delhi
  ('state','DL','chief_minister',  'Rekha Gupta',               'verified_db', 1.0),
  ('state','DL','cm_party',        'Bharatiya Janata Party',    'verified_db', 1.0),
  ('state','DL','cm_since',        '2025-02-20',                'verified_db', 1.0),
  ('state','DL','capital',         'New Delhi',                 'verified_db', 1.0),
  -- Rajasthan
  ('state','RJ','chief_minister',  'Bhajan Lal Sharma',         'verified_db', 1.0),
  ('state','RJ','cm_party',        'Bharatiya Janata Party',    'verified_db', 1.0),
  ('state','RJ','cm_since',        '2023-12-15',                'verified_db', 1.0),
  ('state','RJ','capital',         'Jaipur',                    'verified_db', 1.0),
  -- Madhya Pradesh
  ('state','MP','chief_minister',  'Mohan Yadav',               'verified_db', 1.0),
  ('state','MP','cm_party',        'Bharatiya Janata Party',    'verified_db', 1.0),
  ('state','MP','cm_since',        '2023-12-13',                'verified_db', 1.0),
  ('state','MP','capital',         'Bhopal',                    'verified_db', 1.0),
  -- Gujarat
  ('state','GJ','chief_minister',  'Bhupendra Patel',           'verified_db', 1.0),
  ('state','GJ','cm_party',        'Bharatiya Janata Party',    'verified_db', 1.0),
  ('state','GJ','cm_since',        '2022-12-12',                'verified_db', 1.0),
  ('state','GJ','capital',         'Gandhinagar',               'verified_db', 1.0),
  -- Bihar
  ('state','BR','chief_minister',  'Nitish Kumar',              'verified_db', 1.0),
  ('state','BR','cm_party',        'Janata Dal (United)',       'verified_db', 1.0),
  ('state','BR','capital',         'Patna',                     'verified_db', 1.0),
  -- Odisha
  ('state','OR','chief_minister',  'Mohan Charan Majhi',        'verified_db', 1.0),
  ('state','OR','cm_party',        'Bharatiya Janata Party',    'verified_db', 1.0),
  ('state','OR','cm_since',        '2024-06-12',                'verified_db', 1.0),
  ('state','OR','capital',         'Bhubaneswar',               'verified_db', 1.0),
  -- Punjab
  ('state','PB','chief_minister',  'Bhagwant Mann',             'verified_db', 1.0),
  ('state','PB','cm_party',        'Aam Aadmi Party',           'verified_db', 1.0),
  ('state','PB','cm_since',        '2022-03-16',                'verified_db', 1.0),
  ('state','PB','capital',         'Chandigarh',                'verified_db', 1.0),
  -- Chhattisgarh
  ('state','CG','chief_minister',  'Vishnu Deo Sai',            'verified_db', 1.0),
  ('state','CG','cm_party',        'Bharatiya Janata Party',    'verified_db', 1.0),
  ('state','CG','cm_since',        '2023-12-13',                'verified_db', 1.0),
  ('state','CG','capital',         'Raipur',                    'verified_db', 1.0),
  -- Jharkhand
  ('state','JH','chief_minister',  'Hemant Soren',              'verified_db', 1.0),
  ('state','JH','cm_party',        'Jharkhand Mukti Morcha',    'verified_db', 1.0),
  ('state','JH','cm_since',        '2024-11-28',                'verified_db', 1.0),
  ('state','JH','capital',         'Ranchi',                    'verified_db', 1.0),
  -- Haryana
  ('state','HR','chief_minister',  'Nayab Singh Saini',         'verified_db', 1.0),
  ('state','HR','cm_party',        'Bharatiya Janata Party',    'verified_db', 1.0),
  ('state','HR','cm_since',        '2024-10-17',                'verified_db', 1.0),
  ('state','HR','capital',         'Chandigarh',                'verified_db', 1.0),
  -- Assam
  ('state','AS','chief_minister',  'Himanta Biswa Sarma',       'verified_db', 1.0),
  ('state','AS','cm_party',        'Bharatiya Janata Party',    'verified_db', 1.0),
  ('state','AS','cm_since',        '2021-05-10',                'verified_db', 1.0),
  ('state','AS','capital',         'Dispur',                    'verified_db', 1.0)
ON CONFLICT (entity_type, entity_id, fact_key) DO UPDATE
  SET fact_value = EXCLUDED.fact_value, verified_at = NOW();

-- ── 8c. Epics seed ───────────────────────────────────────────
INSERT INTO epics (id, title, title_hindi, description, book_count, total_slokas, author, period) VALUES
(
  'ramayana', 'Valmiki Ramayana', 'वाल्मीकि रामायण',
  'The ancient Sanskrit epic narrating the life of Rama, prince of Ayodhya. Composed by sage Valmiki, it consists of 7 Kandas and approximately 24,000 slokas.',
  7, 24000, 'Valmiki', '5th–4th century BCE'
),
(
  'mahabharata', 'Mahabharata', 'महाभारत',
  'The longest epic poem ever written, authored by sage Vyasa. It narrates the Kurukshetra War and contains 18 Parvas and over 100,000 slokas including the Bhagavad Gita.',
  18, 100000, 'Vyasa', '8th–9th century BCE (traditional)'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO epic_episodes (epic_id, book_number, book_name, book_name_hindi, episode_number, title, description, audio_url, archive_id, language, narrator) VALUES
-- Ramayana — 7 Kandas
('ramayana',1,'Bala Kanda','बाल काण्ड',1,'Birth of Rama','Sage Valmiki composes the Ramayana. King Dasharatha performs the Putrakameshti yajna and Rama is born.','https://archive.org/download/ramayana-valmiki-hindi/bala-kanda-01.mp3','ramayana-valmiki-hindi','Hindi','Traditional'),
('ramayana',1,'Bala Kanda','बाल काण्ड',2,'Childhood of Rama','Rama and his brothers grow up in Ayodhya. Vishwamitra takes Rama and Lakshmana to protect his yajna from demons.','https://archive.org/download/ramayana-valmiki-hindi/bala-kanda-02.mp3','ramayana-valmiki-hindi','Hindi','Traditional'),
('ramayana',1,'Bala Kanda','बाल काण्ड',3,'Swayamvar of Sita','Rama lifts the divine bow of Shiva at King Janaka''s court and wins Sita''s hand in marriage.','https://archive.org/download/ramayana-valmiki-hindi/bala-kanda-03.mp3','ramayana-valmiki-hindi','Hindi','Traditional'),
('ramayana',2,'Ayodhya Kanda','अयोध्या काण्ड',1,'Exile of Rama','Kaikeyi demands her two boons: the throne for Bharata and exile for Rama. Rama accepts with grace.','https://archive.org/download/ramayana-valmiki-hindi/ayodhya-kanda-01.mp3','ramayana-valmiki-hindi','Hindi','Traditional'),
('ramayana',2,'Ayodhya Kanda','अयोध्या काण्ड',2,'Death of Dasharatha','Rama, Sita and Lakshmana leave Ayodhya. King Dasharatha, heartbroken, passes away.','https://archive.org/download/ramayana-valmiki-hindi/ayodhya-kanda-02.mp3','ramayana-valmiki-hindi','Hindi','Traditional'),
('ramayana',3,'Aranya Kanda','अरण्य काण्ड',1,'Forest Life','Rama and Sita live in the Dandaka forest. Shurpanakha, sister of Ravana, is humiliated.','https://archive.org/download/ramayana-valmiki-hindi/aranya-kanda-01.mp3','ramayana-valmiki-hindi','Hindi','Traditional'),
('ramayana',3,'Aranya Kanda','अरण्य काण्ड',2,'Abduction of Sita','Ravana abducts Sita by deception. Jatayu, the divine eagle, tries to save her and falls.','https://archive.org/download/ramayana-valmiki-hindi/aranya-kanda-02.mp3','ramayana-valmiki-hindi','Hindi','Traditional'),
('ramayana',4,'Kishkindha Kanda','किष्किन्धा काण्ड',1,'Alliance with Sugriva','Rama meets Hanuman and forms an alliance with Sugriva. The monkey army will search for Sita.','https://archive.org/download/ramayana-valmiki-hindi/kishkindha-kanda-01.mp3','ramayana-valmiki-hindi','Hindi','Traditional'),
('ramayana',5,'Sundara Kanda','सुन्दर काण्ड',1,'Hanuman''s Leap to Lanka','Hanuman leaps across the ocean, finds Sita in the Ashoka garden, and delivers Rama''s ring.','https://archive.org/download/ramayana-valmiki-hindi/sundara-kanda-01.mp3','ramayana-valmiki-hindi','Hindi','Traditional'),
('ramayana',5,'Sundara Kanda','सुन्दर काण्ड',2,'Hanuman''s Return','Hanuman burns Lanka and returns with news of Sita''s whereabouts.','https://archive.org/download/ramayana-valmiki-hindi/sundara-kanda-02.mp3','ramayana-valmiki-hindi','Hindi','Traditional'),
('ramayana',6,'Yuddha Kanda','युद्ध काण्ड',1,'Building the Bridge','The Vanara army builds a bridge across the ocean. Vibhishana defects from Ravana and joins Rama.','https://archive.org/download/ramayana-valmiki-hindi/yuddha-kanda-01.mp3','ramayana-valmiki-hindi','Hindi','Traditional'),
('ramayana',6,'Yuddha Kanda','युद्ध काण्ड',2,'The Great Battle','Kumbhakarna and Indrajit fall. Lakshmana is gravely wounded. The epic battle reaches its climax.','https://archive.org/download/ramayana-valmiki-hindi/yuddha-kanda-02.mp3','ramayana-valmiki-hindi','Hindi','Traditional'),
('ramayana',6,'Yuddha Kanda','युद्ध काण्ड',3,'Defeat of Ravana','Rama slays Ravana. Sita''s purity is proved. Rama, Sita and Lakshmana return to Ayodhya.','https://archive.org/download/ramayana-valmiki-hindi/yuddha-kanda-03.mp3','ramayana-valmiki-hindi','Hindi','Traditional'),
('ramayana',7,'Uttara Kanda','उत्तर काण्ड',1,'Rama''s Reign','Rama rules as the ideal king. Under public pressure, Sita is exiled. She gives birth to twins Lava and Kusha.','https://archive.org/download/ramayana-valmiki-hindi/uttara-kanda-01.mp3','ramayana-valmiki-hindi','Hindi','Traditional'),
('ramayana',7,'Uttara Kanda','उत्तर काण्ड',2,'Ascension','Lava and Kusha recite the Ramayana before Rama. Sita returns to Mother Earth. Rama attains moksha.','https://archive.org/download/ramayana-valmiki-hindi/uttara-kanda-02.mp3','ramayana-valmiki-hindi','Hindi','Traditional'),
-- Mahabharata — 18 Parvas
('mahabharata',1,'Adi Parva','आदि पर्व',1,'Origin of the Kuru Dynasty','Birth of Bhishma, his terrible oath of celibacy, and the origin of the Pandavas and Kauravas.','https://archive.org/download/mahabharata-hindi-narration/adi-parva-01.mp3','mahabharata-hindi-narration','Hindi','Traditional'),
('mahabharata',1,'Adi Parva','आदि पर्व',2,'Birth of the Pandavas','Pandu''s curse, Kunti''s mantra, and the miraculous birth of the five Pandavas and hundred Kauravas.','https://archive.org/download/mahabharata-hindi-narration/adi-parva-02.mp3','mahabharata-hindi-narration','Hindi','Traditional'),
('mahabharata',1,'Adi Parva','आदि पर्व',3,'Education and Early Rivalry','Drona trains both sides. Arjuna emerges as the greatest archer. Ekalavya''s sacrifice. Karna''s entry.','https://archive.org/download/mahabharata-hindi-narration/adi-parva-03.mp3','mahabharata-hindi-narration','Hindi','Traditional'),
('mahabharata',2,'Sabha Parva','सभा पर्व',1,'The Game of Dice','Yudhishthira loses everything to Shakuni''s cheating — kingdom, brothers, and Draupadi.','https://archive.org/download/mahabharata-hindi-narration/sabha-parva-01.mp3','mahabharata-hindi-narration','Hindi','Traditional'),
('mahabharata',2,'Sabha Parva','सभा पर्व',2,'Disrobing of Draupadi','Krishna''s divine intervention saves Draupadi''s honour. The Pandavas vow revenge.','https://archive.org/download/mahabharata-hindi-narration/sabha-parva-02.mp3','mahabharata-hindi-narration','Hindi','Traditional'),
('mahabharata',3,'Vana Parva','वन पर्व',1,'Twelve Years of Exile','The Pandavas'' 12-year forest exile. Arjuna obtains divine weapons from the gods.','https://archive.org/download/mahabharata-hindi-narration/vana-parva-01.mp3','mahabharata-hindi-narration','Hindi','Traditional'),
('mahabharata',4,'Virata Parva','विराट पर्व',1,'Year of Disguise','The Pandavas spend their 13th year in disguise at King Virata''s court.','https://archive.org/download/mahabharata-hindi-narration/virata-parva-01.mp3','mahabharata-hindi-narration','Hindi','Traditional'),
('mahabharata',5,'Udyoga Parva','उद्योग पर्व',1,'Preparations for War','Peace negotiations fail. Krishna''s Vishwaroopa diplomacy. Both sides gather armies.','https://archive.org/download/mahabharata-hindi-narration/udyoga-parva-01.mp3','mahabharata-hindi-narration','Hindi','Traditional'),
('mahabharata',6,'Bhishma Parva','भीष्म पर्व',1,'The Bhagavad Gita','Arjuna''s despair on the battlefield. Krishna reveals 18 chapters of eternal wisdom on duty and liberation.','https://archive.org/download/mahabharata-hindi-narration/bhishma-parva-gita.mp3','mahabharata-hindi-narration','Hindi','Traditional'),
('mahabharata',6,'Bhishma Parva','भीष्म पर्व',2,'Fall of Bhishma','Bhishma commands the Kaurava army with terrifying power. He falls on a bed of arrows on day ten.','https://archive.org/download/mahabharata-hindi-narration/bhishma-parva-02.mp3','mahabharata-hindi-narration','Hindi','Traditional'),
('mahabharata',7,'Drona Parva','द्रोण पर्व',1,'Death of Drona','Abhimanyu is killed in the Chakravyuha. The false news of Ashwatthama''s death breaks Drona''s will.','https://archive.org/download/mahabharata-hindi-narration/drona-parva-01.mp3','mahabharata-hindi-narration','Hindi','Traditional'),
('mahabharata',8,'Karna Parva','कर्ण पर्व',1,'Karna as Commander','The final duel between Arjuna and Karna. Karna''s wheel gets stuck. Arjuna slays the greatest warrior.','https://archive.org/download/mahabharata-hindi-narration/karna-parva-01.mp3','mahabharata-hindi-narration','Hindi','Traditional'),
('mahabharata',9,'Shalya Parva','शल्य पर्व',1,'End of the Kaurava Army','Shalya falls. The Kaurava army is destroyed. Duryodhana flees and hides in a lake.','https://archive.org/download/mahabharata-hindi-narration/shalya-parva-01.mp3','mahabharata-hindi-narration','Hindi','Traditional'),
('mahabharata',10,'Sauptika Parva','सौप्तिक पर्व',1,'Night Massacre','Ashwatthama kills the Pandava camp at night. Krishna saves Uttara''s unborn child Parikshit.','https://archive.org/download/mahabharata-hindi-narration/sauptika-parva-01.mp3','mahabharata-hindi-narration','Hindi','Traditional'),
('mahabharata',11,'Stri Parva','स्त्री पर्व',1,'Women''s Lament','Gandhari, Kunti and the women of Hastinapura mourn the fallen. The dead are cremated with honour.','https://archive.org/download/mahabharata-hindi-narration/stri-parva-01.mp3','mahabharata-hindi-narration','Hindi','Traditional'),
('mahabharata',12,'Shanti Parva','शान्ति पर्व',1,'Bhishma''s Teachings','Bhishma on his bed of arrows imparts vast wisdom on statecraft and dharma to Yudhishthira.','https://archive.org/download/mahabharata-hindi-narration/shanti-parva-01.mp3','mahabharata-hindi-narration','Hindi','Traditional'),
('mahabharata',13,'Anushasana Parva','अनुशासन पर्व',1,'Laws of Dharma','Bhishma''s discourse on charity, truth, duties of a king, and the path to moksha. His final passing.','https://archive.org/download/mahabharata-hindi-narration/anushasana-parva-01.mp3','mahabharata-hindi-narration','Hindi','Traditional'),
('mahabharata',14,'Ashvamedha Parva','अश्वमेध पर्व',1,'Horse Sacrifice','Yudhishthira performs the Ashvamedha Yajna to atone for the war. Arjuna escorts the horse.','https://archive.org/download/mahabharata-hindi-narration/ashvamedha-parva-01.mp3','mahabharata-hindi-narration','Hindi','Traditional'),
('mahabharata',15,'Ashramavasika Parva','आश्रमवासिक पर्व',1,'Retirement','Dhritarashtra, Gandhari and Kunti retire to the forest. They perish in a forest fire.','https://archive.org/download/mahabharata-hindi-narration/ashramavasika-parva-01.mp3','mahabharata-hindi-narration','Hindi','Traditional'),
('mahabharata',16,'Mausala Parva','मौसल पर्व',1,'Destruction of the Yadavas','Gandhari''s curse bears fruit. The Yadavas destroy themselves. Krishna leaves his mortal form.','https://archive.org/download/mahabharata-hindi-narration/mausala-parva-01.mp3','mahabharata-hindi-narration','Hindi','Traditional'),
('mahabharata',17,'Mahaprasthanika Parva','महाप्रस्थानिक पर्व',1,'The Great Journey','The Pandavas walk northward to the Himalayas. One by one they fall — until only Yudhishthira remains.','https://archive.org/download/mahabharata-hindi-narration/mahaprasthanika-parva-01.mp3','mahabharata-hindi-narration','Hindi','Traditional'),
('mahabharata',18,'Svargarohana Parva','स्वर्गारोहण पर्व',1,'Ascent to Heaven','Yudhishthira is tested in heaven and hell. The Pandavas and Kauravas are united. The dog reveals itself as Dharma.','https://archive.org/download/mahabharata-hindi-narration/svargarohana-parva-01.mp3','mahabharata-hindi-narration','Hindi','Traditional')
ON CONFLICT (epic_id, book_number, episode_number) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- END OF SCHEMA
-- ════════════════════════════════════════════════════════════
-- After running this script, call the seed API to populate
-- states, districts, constituencies, and mandals from the app:
--
--   curl -X POST https://review-your-leader.vercel.app/api/admin/seed-constituencies \
--     -H "Authorization: Bearer YOUR_CRON_SECRET"
--
-- Then trigger ECI sync per state (e.g. Telangana 2023 election):
--
--   curl -X POST https://review-your-leader.vercel.app/api/admin/sync-eci \
--     -H "Authorization: Bearer YOUR_CRON_SECRET" \
--     -H "Content-Type: application/json" \
--     -d '{"stateId":"TG","electionYear":2023}'
-- ════════════════════════════════════════════════════════════
