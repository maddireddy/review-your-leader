-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- States table
CREATE TABLE IF NOT EXISTS states (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  capital TEXT NOT NULL,
  capital_lat DOUBLE PRECISION,
  capital_lng DOUBLE PRECISION,
  population BIGINT,
  area_km2 DOUBLE PRECISION,
  chief_minister TEXT,
  ruling_party TEXT,
  geojson_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Districts table
CREATE TABLE IF NOT EXISTS districts (
  id TEXT PRIMARY KEY,
  state_id TEXT REFERENCES states(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  headquarters TEXT,
  population BIGINT,
  area_km2 DOUBLE PRECISION,
  geojson_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constituencies table
CREATE TABLE IF NOT EXISTS constituencies (
  id TEXT PRIMARY KEY,
  district_id TEXT REFERENCES districts(id) ON DELETE CASCADE,
  state_id TEXT REFERENCES states(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('parliament', 'assembly')) NOT NULL,
  reserved TEXT CHECK (reserved IN ('SC', 'ST')),
  geojson_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Representatives table
CREATE TABLE IF NOT EXISTS representatives (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  photo_url TEXT,
  party TEXT NOT NULL,
  party_short TEXT NOT NULL,
  party_color TEXT DEFAULT '#6366f1',
  constituency_id TEXT REFERENCES constituencies(id),
  state_id TEXT REFERENCES states(id),
  tenure_start DATE NOT NULL,
  tenure_end DATE,
  is_active BOOLEAN DEFAULT TRUE,
  education TEXT,
  age INTEGER,
  gender TEXT,
  assets TEXT,
  criminal_cases INTEGER DEFAULT 0,
  attendance_percentage NUMERIC(5,2),
  questions_asked INTEGER DEFAULT 0,
  debates_participated INTEGER DEFAULT 0,
  bills_introduced INTEGER DEFAULT 0,
  contact_email TEXT,
  contact_phone TEXT,
  twitter TEXT,
  website TEXT,
  bio TEXT,
  embedding vector(512),  -- Voyage AI voyage-3-lite dimensions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ministry portfolios
CREATE TABLE IF NOT EXISTS ministries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  representative_id TEXT REFERENCES representatives(id) ON DELETE CASCADE,
  portfolio TEXT NOT NULL,
  level TEXT CHECK (level IN ('cabinet', 'state', 'independent')) NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenure history / election records
CREATE TABLE IF NOT EXISTS tenure_records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  representative_id TEXT REFERENCES representatives(id) ON DELETE CASCADE,
  constituency_id TEXT REFERENCES constituencies(id),
  election_year INTEGER NOT NULL,
  start_year INTEGER NOT NULL,
  end_year INTEGER,
  votes_received INTEGER,
  vote_share NUMERIC(5,2),
  margin INTEGER,
  position TEXT CHECK (position IN ('winner', 'runner_up')) DEFAULT 'winner',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector similarity search function
CREATE OR REPLACE FUNCTION match_representatives(
  query_embedding vector(512),
  match_count INT DEFAULT 10,
  filter_state TEXT DEFAULT NULL
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  party TEXT,
  constituency_id TEXT,
  state_id TEXT,
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    r.id,
    r.name,
    r.party,
    r.constituency_id,
    r.state_id,
    1 - (r.embedding <=> query_embedding) AS similarity
  FROM representatives r
  WHERE
    r.embedding IS NOT NULL
    AND (filter_state IS NULL OR r.state_id = filter_state)
  ORDER BY r.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_representatives_state ON representatives(state_id);
CREATE INDEX IF NOT EXISTS idx_representatives_constituency ON representatives(constituency_id);
CREATE INDEX IF NOT EXISTS idx_representatives_active ON representatives(is_active);
CREATE INDEX IF NOT EXISTS idx_districts_state ON districts(state_id);
CREATE INDEX IF NOT EXISTS idx_constituencies_district ON constituencies(district_id);
CREATE INDEX IF NOT EXISTS idx_constituencies_state ON constituencies(state_id);
CREATE INDEX IF NOT EXISTS idx_ministries_rep ON ministries(representative_id);
CREATE INDEX IF NOT EXISTS idx_ministries_current ON ministries(is_current);
CREATE INDEX IF NOT EXISTS idx_tenure_rep ON tenure_records(representative_id);

-- Vector index (HNSW for fast ANN search)
CREATE INDEX IF NOT EXISTS idx_rep_embedding ON representatives
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Row Level Security
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE constituencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenure_records ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read states" ON states FOR SELECT USING (true);
CREATE POLICY "Public read districts" ON districts FOR SELECT USING (true);
CREATE POLICY "Public read constituencies" ON constituencies FOR SELECT USING (true);
CREATE POLICY "Public read representatives" ON representatives FOR SELECT USING (true);
CREATE POLICY "Public read ministries" ON ministries FOR SELECT USING (true);
CREATE POLICY "Public read tenure" ON tenure_records FOR SELECT USING (true);
