-- ============================================================
-- ReviewYourLeader — Autonomous Data Pipeline Schema (v3)
-- Run this AFTER schema_v2_cache.sql
-- Adds columns the self-healing fact pipeline writes.
-- ============================================================

-- Extend ground_truth_facts for live-fetched, multi-model-validated facts
ALTER TABLE ground_truth_facts
  ADD COLUMN IF NOT EXISTS fact_party       TEXT,
  ADD COLUMN IF NOT EXISTS confidence       NUMERIC(3,2) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS sources          JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS validation_notes TEXT;

-- Audit log — every pipeline run records what it found (even if not committed)
CREATE TABLE IF NOT EXISTS fact_refresh_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  fact_key TEXT NOT NULL,
  old_value TEXT,
  candidate_value TEXT,
  confidence NUMERIC(3,2),
  committed BOOLEAN DEFAULT FALSE,
  changed BOOLEAN DEFAULT FALSE,
  validation_notes TEXT,
  sources JSONB DEFAULT '[]',
  run_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_log_entity ON fact_refresh_log(entity_type, entity_id, run_at DESC);

-- RLS
ALTER TABLE fact_refresh_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read refresh log" ON fact_refresh_log FOR SELECT USING (true);
CREATE POLICY "Service write refresh log" ON fact_refresh_log FOR ALL USING (true);

-- Update the existing TG seed to include confidence (manual entries = highest trust)
UPDATE ground_truth_facts SET confidence = 1.0 WHERE verified_by = 'system';
