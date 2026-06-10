-- ============================================================
-- ReviewYourLeader — Schema v5: Rich Politician Profiles
-- Run AFTER schema_v4_epics_locks.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS politician_profiles (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  slug            TEXT NOT NULL UNIQUE,       -- e.g. 'c-joseph-vijay-tn' | 'mk-stalin-tn'
  name            TEXT NOT NULL,
  name_native     TEXT,                       -- name in regional script
  state_id        TEXT,
  role            TEXT,                       -- 'Chief Minister' | 'MP' | 'MLA' etc.
  party           TEXT,
  party_short     TEXT,
  photo_url       TEXT,                       -- Wikipedia/Wikimedia photo

  -- Wikipedia data
  wikipedia_slug  TEXT,
  wikipedia_extract TEXT,                     -- intro paragraph
  wikipedia_url   TEXT,
  birth_date      TEXT,
  birth_place     TEXT,
  education       TEXT[],
  net_worth       TEXT,

  -- Structured career data (AI-generated from Wikipedia + web)
  career_timeline JSONB DEFAULT '[]',         -- [{year, event, role, party}]
  key_achievements JSONB DEFAULT '[]',        -- [{title, description, year}]
  controversies   JSONB DEFAULT '[]',         -- [{title, year, description}]

  -- AI personality analysis (Claude)
  personality_analysis JSONB DEFAULT '{}',   -- {leadership_style, known_for, quote, traits[]}

  -- Recent news (Tavily)
  recent_news     JSONB DEFAULT '[]',         -- [{title, url, published_at, snippet}]

  -- Meta
  fetched_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '6 hours',
  fetch_version   INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_politician_slug  ON politician_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_politician_state ON politician_profiles(state_id);
CREATE INDEX IF NOT EXISTS idx_politician_exp   ON politician_profiles(expires_at);

ALTER TABLE politician_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read profiles" ON politician_profiles FOR SELECT USING (true);
CREATE POLICY "Service write profiles" ON politician_profiles FOR ALL USING (true);
