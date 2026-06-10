-- ============================================================
-- ReviewYourLeader — Schema v7: Constituencies & Mandals
-- Replaces static TypeScript files with proper DB tables
-- Run AFTER schema_v6_electoral.sql
-- ============================================================

-- ── Assembly / Lok Sabha constituencies (master) ─────────────
CREATE TABLE IF NOT EXISTS assembly_constituencies (
  id              TEXT PRIMARY KEY,          -- e.g. 'TG-117'
  state_id        TEXT NOT NULL,
  district_id     TEXT NOT NULL,
  number          INTEGER NOT NULL,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'assembly',  -- 'assembly' | 'parliament'
  reserved        TEXT CHECK (reserved IN ('SC', 'ST')),
  current_mla     TEXT,
  mla_party       TEXT,
  current_mp      TEXT,
  mp_party        TEXT,
  eci_code        TEXT,                      -- Official ECI constituency code
  voters_2024     INTEGER,
  voters_2019     INTEGER,
  last_election_year INTEGER,
  ai_validated    BOOLEAN DEFAULT FALSE,
  ai_confidence   NUMERIC(4,3),
  validated_at    TIMESTAMPTZ,
  source          TEXT DEFAULT 'static',     -- 'static' | 'ECI' | 'LokDhaba' | 'AI'
  raw_eci_data    JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(state_id, number, type)
);

CREATE INDEX IF NOT EXISTS idx_ac_state    ON assembly_constituencies(state_id);
CREATE INDEX IF NOT EXISTS idx_ac_district ON assembly_constituencies(district_id);
CREATE INDEX IF NOT EXISTS idx_ac_mla      ON assembly_constituencies(current_mla);
CREATE INDEX IF NOT EXISTS idx_ac_party    ON assembly_constituencies(mla_party);

-- ── Mandals (revenue circles) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS mandals (
  id              TEXT PRIMARY KEY,          -- e.g. 'TG-KHM-SATHUPALLI'
  state_id        TEXT NOT NULL,
  district_id     TEXT NOT NULL,
  constituency_id TEXT REFERENCES assembly_constituencies(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  headquarters    TEXT,
  village_count   INTEGER,
  population      BIGINT,
  area_sq_km      NUMERIC(10,2),
  pincode         TEXT,
  tehsil          TEXT,                      -- alias in some states
  taluka          TEXT,                      -- alias in Gujarat/MH
  source          TEXT DEFAULT 'static',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(district_id, name)
);

CREATE INDEX IF NOT EXISTS idx_mandals_state        ON mandals(state_id);
CREATE INDEX IF NOT EXISTS idx_mandals_district     ON mandals(district_id);
CREATE INDEX IF NOT EXISTS idx_mandals_constituency ON mandals(constituency_id);

-- ── Districts (enriched from districtData.ts) ─────────────────
ALTER TABLE districts ADD COLUMN IF NOT EXISTS mandals_count   INTEGER DEFAULT 0;
ALTER TABLE districts ADD COLUMN IF NOT EXISTS assembly_seats  INTEGER DEFAULT 0;
ALTER TABLE districts ADD COLUMN IF NOT EXISTS lok_sabha_seats INTEGER DEFAULT 1;
ALTER TABLE districts ADD COLUMN IF NOT EXISTS state_name      TEXT;
ALTER TABLE districts ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT NOW();

-- ── MLA performance index (tracks metrics over time) ──────────
CREATE TABLE IF NOT EXISTS mla_performance (
  id              BIGSERIAL PRIMARY KEY,
  constituency_id TEXT REFERENCES assembly_constituencies(id) ON DELETE CASCADE,
  mla_name        TEXT NOT NULL,
  mla_party       TEXT NOT NULL,
  tenure_start    DATE,
  tenure_end      DATE,
  -- Legislative performance
  assembly_attendance_pct NUMERIC(5,2),
  questions_raised        INTEGER DEFAULT 0,
  debates_participated    INTEGER DEFAULT 0,
  bills_introduced        INTEGER DEFAULT 0,
  -- Development work
  mplads_utilized_pct     NUMERIC(5,2),
  works_sanctioned        INTEGER DEFAULT 0,
  works_completed         INTEGER DEFAULT 0,
  -- Public perception (AI-derived from news/social)
  sentiment_score         NUMERIC(4,3),   -- -1 to 1
  news_mentions_30d       INTEGER DEFAULT 0,
  -- Source
  source          TEXT DEFAULT 'AI',
  fetched_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mla_perf_constituency ON mla_performance(constituency_id);
CREATE INDEX IF NOT EXISTS idx_mla_perf_mla          ON mla_performance(mla_name);

-- ── AI validation log (tracks every validation run) ───────────
CREATE TABLE IF NOT EXISTS ai_validation_log (
  id              BIGSERIAL PRIMARY KEY,
  entity_type     TEXT NOT NULL,   -- 'constituency' | 'mla' | 'mandal' | 'district'
  entity_id       TEXT NOT NULL,
  model_1         TEXT,            -- e.g. 'llama-3.3-70b-versatile'
  model_1_result  JSONB,
  model_2         TEXT,
  model_2_result  JSONB,
  model_3         TEXT,
  model_3_result  JSONB,
  consensus       BOOLEAN,
  consensus_score NUMERIC(4,3),
  correction_made BOOLEAN DEFAULT FALSE,
  correction_detail TEXT,
  validated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_avl_entity ON ai_validation_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_avl_date   ON ai_validation_log(validated_at DESC);

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE assembly_constituencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandals                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE mla_performance         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_validation_log       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read assembly_constituencies" ON assembly_constituencies FOR SELECT USING (true);
CREATE POLICY "Service write assembly_constituencies" ON assembly_constituencies FOR ALL USING (true);
CREATE POLICY "Public read mandals"  ON mandals  FOR SELECT USING (true);
CREATE POLICY "Service write mandals" ON mandals FOR ALL USING (true);
CREATE POLICY "Public read mla_performance"   ON mla_performance   FOR SELECT USING (true);
CREATE POLICY "Service write mla_performance" ON mla_performance   FOR ALL USING (true);
CREATE POLICY "Public read ai_validation_log" ON ai_validation_log FOR SELECT USING (true);
CREATE POLICY "Service write ai_validation_log" ON ai_validation_log FOR ALL USING (true);

-- ── Trigger: auto-update updated_at ───────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ac_updated_at ON assembly_constituencies;
CREATE TRIGGER trg_ac_updated_at
  BEFORE UPDATE ON assembly_constituencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
