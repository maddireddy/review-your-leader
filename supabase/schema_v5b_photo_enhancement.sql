-- ============================================================
-- ReviewYourLeader — Schema v5b: Enhanced photo column
-- Run in Supabase SQL editor after schema_v5_politician_profiles.sql
-- ============================================================

-- Add enhanced_photo_url column (AI-selected + CDN-enhanced headshot)
ALTER TABLE politician_profiles
  ADD COLUMN IF NOT EXISTS enhanced_photo_url TEXT;

-- Comment for clarity
COMMENT ON COLUMN politician_profiles.photo_url          IS 'Original Wikipedia/Wikimedia photo URL';
COMMENT ON COLUMN politician_profiles.enhanced_photo_url IS 'AI-selected best headshot, enhanced via CDN (weserv.nl or Cloudinary)';
