-- ============================================================
-- ReviewYourLeader — AI Cache + Validation Schema (v2)
-- Run this AFTER schema.sql
-- ============================================================

-- AI response cache with multi-model validation tracking
CREATE TABLE IF NOT EXISTS ai_insight_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,          -- e.g. "state_insight:TG:2026-06"
  entity_type TEXT NOT NULL,               -- 'state' | 'representative' | 'constituency'
  entity_id TEXT NOT NULL,                 -- state_id, rep_id, etc.

  -- Ground truth anchors injected into prompts
  ground_truth JSONB NOT NULL DEFAULT '{}',

  -- Model responses (Level 1 — primary)
  model1_name TEXT,
  model1_response TEXT,
  model1_confidence NUMERIC(3,2),          -- 0.00–1.00

  -- Model responses (Level 2 — validator)
  model2_name TEXT,
  model2_response TEXT,
  model2_confidence NUMERIC(3,2),

  -- Model responses (Level 3 — arbiter, only on conflict)
  model3_name TEXT,
  model3_response TEXT,
  model3_confidence NUMERIC(3,2),

  -- Consensus outcome
  consensus_response TEXT,                 -- final blended/chosen response
  consensus_score NUMERIC(3,2),           -- agreement score
  validation_status TEXT DEFAULT 'pending'  -- 'validated' | 'conflict' | 'pending' | 'failed'
    CHECK (validation_status IN ('validated','conflict','pending','failed')),

  -- Fact-check flags
  fact_violations JSONB DEFAULT '[]',      -- array of {claim, expected, found}
  auto_corrected BOOLEAN DEFAULT FALSE,

  -- Cache control
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  refresh_count INTEGER DEFAULT 0,
  last_refreshed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ground truth facts table (authoritative — never overridden by AI)
CREATE TABLE IF NOT EXISTS ground_truth_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  fact_key TEXT NOT NULL,                  -- 'chief_minister' | 'party' | 'tenure_start' etc.
  fact_value TEXT NOT NULL,
  fact_source TEXT DEFAULT 'verified_db',  -- 'verified_db' | 'official_api' | 'manual_entry'
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  verified_by TEXT DEFAULT 'system',
  UNIQUE(entity_type, entity_id, fact_key)
);

-- Seed ground truth from our known data
-- (Run this after seeding states table)
INSERT INTO ground_truth_facts (entity_type, entity_id, fact_key, fact_value, fact_source)
VALUES
  ('state', 'TG', 'chief_minister', 'A. Revanth Reddy', 'verified_db'),
  ('state', 'TG', 'cm_party', 'Indian National Congress', 'verified_db'),
  ('state', 'TG', 'cm_since', '2023-12-07', 'verified_db'),
  ('state', 'TG', 'prev_cm', 'K. Chandrashekar Rao', 'verified_db'),
  ('state', 'TG', 'capital', 'Hyderabad', 'verified_db'),
  ('state', 'AP', 'chief_minister', 'N. Chandrababu Naidu', 'verified_db'),
  ('state', 'AP', 'cm_party', 'Telugu Desam Party', 'verified_db'),
  ('state', 'AP', 'cm_since', '2024-06-12', 'verified_db'),
  ('state', 'MH', 'chief_minister', 'Devendra Fadnavis', 'verified_db'),
  ('state', 'MH', 'cm_party', 'Bharatiya Janata Party', 'verified_db'),
  ('state', 'UP', 'chief_minister', 'Yogi Adityanath', 'verified_db'),
  ('state', 'UP', 'cm_party', 'Bharatiya Janata Party', 'verified_db'),
  ('state', 'KA', 'chief_minister', 'Siddaramaiah', 'verified_db'),
  ('state', 'KA', 'cm_party', 'Indian National Congress', 'verified_db'),
  ('state', 'WB', 'chief_minister', 'Mamata Banerjee', 'verified_db'),
  ('state', 'WB', 'cm_party', 'All India Trinamool Congress', 'verified_db'),
  ('state', 'DL', 'chief_minister', 'Rekha Gupta', 'verified_db'),
  ('state', 'DL', 'cm_party', 'Bharatiya Janata Party', 'verified_db'),
  ('state', 'TN', 'chief_minister', 'M. K. Stalin', 'verified_db'),
  ('state', 'TN', 'cm_party', 'Dravida Munnetra Kazhagam', 'verified_db')
ON CONFLICT (entity_type, entity_id, fact_key) DO UPDATE
  SET fact_value = EXCLUDED.fact_value, verified_at = NOW();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_insight_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_entity ON ai_insight_cache(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ai_insight_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_gt_entity ON ground_truth_facts(entity_type, entity_id);

-- RLS
ALTER TABLE ai_insight_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ground_truth_facts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read cache" ON ai_insight_cache FOR SELECT USING (true);
CREATE POLICY "Public read facts" ON ground_truth_facts FOR SELECT USING (true);
CREATE POLICY "Service write cache" ON ai_insight_cache FOR ALL USING (true);
CREATE POLICY "Service write facts" ON ground_truth_facts FOR ALL USING (true);

-- Auto-cleanup expired cache
CREATE OR REPLACE FUNCTION cleanup_expired_cache() RETURNS void AS $$
  DELETE FROM ai_insight_cache WHERE expires_at < NOW();
$$ LANGUAGE SQL;
