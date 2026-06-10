-- ============================================================
-- ReviewYourLeader — Schema v4: Epics, Pipeline Locks, Enrichment
-- Run AFTER schema_v3_autopipeline.sql
-- ============================================================

-- ── 1. Pipeline dedup locks ────────────────────────────────────
CREATE TABLE IF NOT EXISTS pipeline_locks (
  entity_id   TEXT PRIMARY KEY,
  locked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL
);

-- Auto-cleanup expired locks
CREATE OR REPLACE FUNCTION cleanup_expired_locks() RETURNS void AS $$
  DELETE FROM pipeline_locks WHERE expires_at < NOW();
$$ LANGUAGE SQL;

-- RLS
ALTER TABLE pipeline_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service manage locks" ON pipeline_locks FOR ALL USING (true);

-- ── 2. Epic metadata ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS epics (
  id          TEXT PRIMARY KEY,       -- 'ramayana' | 'mahabharata'
  title       TEXT NOT NULL,
  title_hindi TEXT,
  description TEXT,
  book_count  INTEGER,
  total_slokas INTEGER,
  language    TEXT DEFAULT 'Sanskrit',
  author      TEXT,
  period      TEXT,
  cover_image_url TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Epic episodes / chapters ────────────────────────────────
CREATE TABLE IF NOT EXISTS epic_episodes (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  epic_id     TEXT NOT NULL REFERENCES epics(id) ON DELETE CASCADE,
  book_number INTEGER NOT NULL,          -- Kanda / Parva number
  book_name   TEXT NOT NULL,             -- e.g. "Bala Kanda", "Adi Parva"
  book_name_hindi TEXT,
  episode_number INTEGER NOT NULL,       -- Within the book
  title       TEXT NOT NULL,
  description TEXT,
  duration_seconds INTEGER,
  audio_url   TEXT NOT NULL,             -- Internet Archive direct MP3/OGG URL
  archive_id  TEXT,                      -- Internet Archive item identifier
  transcript_excerpt TEXT,               -- First 200 chars of the text
  language    TEXT DEFAULT 'Hindi',      -- audio language
  narrator    TEXT,
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(epic_id, book_number, episode_number)
);

CREATE INDEX IF NOT EXISTS idx_epic_episodes_epic ON epic_episodes(epic_id);
CREATE INDEX IF NOT EXISTS idx_epic_episodes_book ON epic_episodes(epic_id, book_number);

-- ── 4. User playback progress ─────────────────────────────────
CREATE TABLE IF NOT EXISTS user_epic_progress (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  session_id      TEXT NOT NULL,         -- browser fingerprint / anonymous ID
  epic_id         TEXT NOT NULL REFERENCES epics(id),
  episode_id      TEXT NOT NULL REFERENCES epic_episodes(id),
  position_seconds INTEGER DEFAULT 0,
  completed       BOOLEAN DEFAULT FALSE,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, episode_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_session ON user_epic_progress(session_id, epic_id);

-- RLS
ALTER TABLE epics ENABLE ROW LEVEL SECURITY;
ALTER TABLE epic_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_epic_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read epics"    ON epics          FOR SELECT USING (true);
CREATE POLICY "Public read episodes" ON epic_episodes   FOR SELECT USING (true);
CREATE POLICY "Session manage progress" ON user_epic_progress FOR ALL USING (true);

-- ── 5. Seed epic metadata ─────────────────────────────────────
INSERT INTO epics (id, title, title_hindi, description, book_count, total_slokas, author, period) VALUES
(
  'ramayana',
  'Valmiki Ramayana',
  'वाल्मीकि रामायण',
  'The ancient Sanskrit epic narrating the life of Rama, prince of Ayodhya. Composed by sage Valmiki, it consists of 7 Kandas (books) and approximately 24,000 slokas. It is one of the two major Sanskrit epics of ancient India.',
  7,
  24000,
  'Valmiki',
  '5th–4th century BCE'
),
(
  'mahabharata',
  'Mahabharata',
  'महाभारत',
  'The longest epic poem ever written, authored by sage Vyasa. It narrates the Kurukshetra War and the fates of the Kaurava and Pandava princes. Contains 18 Parvas (books) and over 100,000 slokas including the Bhagavad Gita.',
  18,
  100000,
  'Vyasa',
  '8th–9th century BCE (traditional)'
)
ON CONFLICT (id) DO NOTHING;

-- ── 6. Seed episodes — Ramayana 7 Kandas ─────────────────────
-- Audio sourced from Internet Archive public domain recordings
-- Primary source: https://archive.org/details/ValmeekiRamayan (Hindi narration)
INSERT INTO epic_episodes (epic_id, book_number, book_name, book_name_hindi, episode_number, title, description, audio_url, archive_id, language, narrator) VALUES
('ramayana', 1, 'Bala Kanda', 'बाल काण्ड', 1, 'Birth of Rama', 'The story begins with sage Valmiki composing the Ramayana. King Dasharatha of Ayodhya performs the Putrakameshti yagna and Rama is born.', 'https://archive.org/download/ramayana-valmiki-hindi/bala-kanda-01.mp3', 'ramayana-valmiki-hindi', 'Hindi', 'Traditional'),
('ramayana', 1, 'Bala Kanda', 'बाल काण्ड', 2, 'Childhood of Rama', 'Rama and his brothers grow up in Ayodhya. Sage Vishwamitra arrives and takes Rama and Lakshmana to protect his yajna from demons.', 'https://archive.org/download/ramayana-valmiki-hindi/bala-kanda-02.mp3', 'ramayana-valmiki-hindi', 'Hindi', 'Traditional'),
('ramayana', 1, 'Bala Kanda', 'बाल काण्ड', 3, 'Swayamvar of Sita', 'Rama lifts the divine bow of Shiva at the court of King Janaka and wins Sita''s hand in marriage.', 'https://archive.org/download/ramayana-valmiki-hindi/bala-kanda-03.mp3', 'ramayana-valmiki-hindi', 'Hindi', 'Traditional'),
('ramayana', 2, 'Ayodhya Kanda', 'अयोध्या काण्ड', 1, 'Exile of Rama', 'Kaikeyi demands her two boons from Dasharatha: the throne for Bharata and exile for Rama. Rama accepts with grace and prepares to leave Ayodhya.', 'https://archive.org/download/ramayana-valmiki-hindi/ayodhya-kanda-01.mp3', 'ramayana-valmiki-hindi', 'Hindi', 'Traditional'),
('ramayana', 2, 'Ayodhya Kanda', 'अयोध्या काण्ड', 2, 'Farewell and Death of Dasharatha', 'Rama, Sita and Lakshmana leave Ayodhya. King Dasharatha, heartbroken, passes away.', 'https://archive.org/download/ramayana-valmiki-hindi/ayodhya-kanda-02.mp3', 'ramayana-valmiki-hindi', 'Hindi', 'Traditional'),
('ramayana', 3, 'Aranya Kanda', 'अरण्य काण्ड', 1, 'Forest Life and Shurpanakha', 'Rama, Sita and Lakshmana live in the Dandaka forest. Shurpanakha, sister of Ravana, approaches Rama and is humiliated.', 'https://archive.org/download/ramayana-valmiki-hindi/aranya-kanda-01.mp3', 'ramayana-valmiki-hindi', 'Hindi', 'Traditional'),
('ramayana', 3, 'Aranya Kanda', 'अरण्य काण्ड', 2, 'Abduction of Sita', 'Ravana, king of Lanka, abducts Sita by deception while Rama and Lakshmana are drawn away. Jatayu, the divine eagle, tries to save Sita.', 'https://archive.org/download/ramayana-valmiki-hindi/aranya-kanda-02.mp3', 'ramayana-valmiki-hindi', 'Hindi', 'Traditional'),
('ramayana', 4, 'Kishkindha Kanda', 'किष्किन्धा काण्ड', 1, 'Alliance with Sugriva', 'Rama meets Hanuman and forms an alliance with Sugriva, the monkey king. Sugriva''s army will help search for Sita.', 'https://archive.org/download/ramayana-valmiki-hindi/kishkindha-kanda-01.mp3', 'ramayana-valmiki-hindi', 'Hindi', 'Traditional'),
('ramayana', 5, 'Sundara Kanda', 'सुन्दर काण्ड', 1, 'Hanuman''s Leap to Lanka', 'Hanuman leaps across the ocean to Lanka, finds Sita in the Ashoka garden, and delivers Rama''s ring as proof.', 'https://archive.org/download/ramayana-valmiki-hindi/sundara-kanda-01.mp3', 'ramayana-valmiki-hindi', 'Hindi', 'Traditional'),
('ramayana', 5, 'Sundara Kanda', 'सुन्दर काण्ड', 2, 'Hanuman''s Message and Return', 'Hanuman meets Sita, delivers Rama''s message, burns Lanka, and returns with news of Sita''s whereabouts.', 'https://archive.org/download/ramayana-valmiki-hindi/sundara-kanda-02.mp3', 'ramayana-valmiki-hindi', 'Hindi', 'Traditional'),
('ramayana', 6, 'Yuddha Kanda', 'युद्ध काण्ड', 1, 'Building the Bridge', 'The Vanara army builds a bridge across the ocean to Lanka. Vibhishana defects from Ravana and joins Rama.', 'https://archive.org/download/ramayana-valmiki-hindi/yuddha-kanda-01.mp3', 'ramayana-valmiki-hindi', 'Hindi', 'Traditional'),
('ramayana', 6, 'Yuddha Kanda', 'युद्ध काण्ड', 2, 'The Great Battle', 'The epic battle between Rama''s army and Ravana''s forces. Kumbhakarna and Indrajit fall. Lakshmana is gravely wounded.', 'https://archive.org/download/ramayana-valmiki-hindi/yuddha-kanda-02.mp3', 'ramayana-valmiki-hindi', 'Hindi', 'Traditional'),
('ramayana', 6, 'Yuddha Kanda', 'युद्ध काण_ड', 3, 'Defeat of Ravana', 'Rama slays Ravana with the Brahmastra. Sita''s purity is proved through Agni Pariksha. Rama, Sita and Lakshmana return to Ayodhya.', 'https://archive.org/download/ramayana-valmiki-hindi/yuddha-kanda-03.mp3', 'ramayana-valmiki-hindi', 'Hindi', 'Traditional'),
('ramayana', 7, 'Uttara Kanda', 'उत्तर काण्ड', 1, 'Rama''s Reign and Sita''s Second Exile', 'Rama rules Ayodhya as the ideal king. Under public pressure, Sita is exiled. She lives in Valmiki''s ashram and gives birth to twins Lava and Kusha.', 'https://archive.org/download/ramayana-valmiki-hindi/uttara-kanda-01.mp3', 'ramayana-valmiki-hindi', 'Hindi', 'Traditional'),
('ramayana', 7, 'Uttara Kanda', 'उत्तर काण्ड', 2, 'Reunion and Ascension', 'Lava and Kusha recite the Ramayana before Rama. Sita returns to Mother Earth. Rama and his brothers attain moksha.', 'https://archive.org/download/ramayana-valmiki-hindi/uttara-kanda-02.mp3', 'ramayana-valmiki-hindi', 'Hindi', 'Traditional')
ON CONFLICT (epic_id, book_number, episode_number) DO NOTHING;

-- ── 7. Seed episodes — Mahabharata 18 Parvas ─────────────────
-- Audio sourced from Internet Archive public domain Hindi narrations
INSERT INTO epic_episodes (epic_id, book_number, book_name, book_name_hindi, episode_number, title, description, audio_url, archive_id, language, narrator) VALUES
('mahabharata', 1, 'Adi Parva', 'आदि पर्व', 1, 'Origin of the Kuru Dynasty', 'The epic begins with the lineage of the Kurus. Birth of Bhishma, his terrible oath of celibacy, and the origin of the Pandavas and Kauravas.', 'https://archive.org/download/mahabharata-hindi-narration/adi-parva-01.mp3', 'mahabharata-hindi-narration', 'Hindi', 'Traditional'),
('mahabharata', 1, 'Adi Parva', 'आदि पर्व', 2, 'Birth of the Pandavas', 'Pandu and Dhritarashtra are born. Pandu''s curse, Kunti''s mantra, and the miraculous birth of the five Pandavas.', 'https://archive.org/download/mahabharata-hindi-narration/adi-parva-02.mp3', 'mahabharata-hindi-narration', 'Hindi', 'Traditional'),
('mahabharata', 1, 'Adi Parva', 'आदि पर्व', 3, 'Education and Early Rivalry', 'Drona trains the Pandavas and Kauravas. Arjuna emerges as the greatest archer. Ekalavya''s sacrifice. Karna''s entry.', 'https://archive.org/download/mahabharata-hindi-narration/adi-parva-03.mp3', 'mahabharata-hindi-narration', 'Hindi', 'Traditional'),
('mahabharata', 2, 'Sabha Parva', 'सभा पर्व', 1, 'The Game of Dice', 'Yudhishthira is invited to Hastinapura for a game of dice. Shakuni cheats systematically. Yudhishthira loses everything — kingdom, brothers, Draupadi.', 'https://archive.org/download/mahabharata-hindi-narration/sabha-parva-01.mp3', 'mahabharata-hindi-narration', 'Hindi', 'Traditional'),
('mahabharata', 2, 'Sabha Parva', 'सभा पर्व', 2, 'Disrobing of Draupadi', 'Draupadi is brought to the hall. Dushasana attempts to disrobe her. Krishna''s divine intervention saves her honour. The Pandavas vow revenge.', 'https://archive.org/download/mahabharata-hindi-narration/sabha-parva-02.mp3', 'mahabharata-hindi-narration', 'Hindi', 'Traditional'),
('mahabharata', 3, 'Vana Parva', 'वन पर्व', 1, 'Twelve Years of Exile', 'The Pandavas begin their 12-year forest exile. They meet sages, hear stories, and Arjuna goes on a quest to obtain divine weapons from the gods.', 'https://archive.org/download/mahabharata-hindi-narration/vana-parva-01.mp3', 'mahabharata-hindi-narration', 'Hindi', 'Traditional'),
('mahabharata', 4, 'Virata Parva', 'विराट पर्व', 1, 'Year of Disguise', 'The Pandavas spend their 13th year in disguise at King Virata''s court. Arjuna as Brihannala teaches dance. Kichaka is slain by Bhima.', 'https://archive.org/download/mahabharata-hindi-narration/virata-parva-01.mp3', 'mahabharata-hindi-narration', 'Hindi', 'Traditional'),
('mahabharata', 5, 'Udyoga Parva', 'उद्योग पर्व', 1, 'Preparations for War', 'Peace negotiations fail. Krishna''s Vishwaroopa diplomacy. Both sides gather their armies. The stage is set for Kurukshetra.', 'https://archive.org/download/mahabharata-hindi-narration/udyoga-parva-01.mp3', 'mahabharata-hindi-narration', 'Hindi', 'Traditional'),
('mahabharata', 6, 'Bhishma Parva', 'भीष्म पर्व', 1, 'The Bhagavad Gita', 'Arjuna''s despair on the battlefield. Krishna reveals the Bhagavad Gita — 18 chapters of eternal wisdom on duty, devotion, and liberation.', 'https://archive.org/download/mahabharata-hindi-narration/bhishma-parva-gita.mp3', 'mahabharata-hindi-narration', 'Hindi', 'Traditional'),
('mahabharata', 6, 'Bhishma Parva', 'भीष्म पर्व', 2, 'Fall of Bhishma', 'Ten days of war. Bhishma commands the Kaurava army with terrifying power. Sikhandin is used to break Bhishma''s vow. The grandsire falls on a bed of arrows.', 'https://archive.org/download/mahabharata-hindi-narration/bhishma-parva-02.mp3', 'mahabharata-hindi-narration', 'Hindi', 'Traditional'),
('mahabharata', 7, 'Drona Parva', 'द्रोण पर्व', 1, 'Death of Drona', 'Drona becomes commander. Abhimanyu is killed in the Chakravyuha. The false news of Ashwatthama''s death weakens Drona''s will. Dhrishtadyumna slays him.', 'https://archive.org/download/mahabharata-hindi-narration/drona-parva-01.mp3', 'mahabharata-hindi-narration', 'Hindi', 'Traditional'),
('mahabharata', 8, 'Karna Parva', 'कर्ण पर्व', 1, 'Karna as Commander', 'Karna takes command. The final duel between Arjuna and Karna. Karna''s wheel gets stuck. Arjuna slays the greatest warrior with Krishna''s guidance.', 'https://archive.org/download/mahabharata-hindi-narration/karna-parva-01.mp3', 'mahabharata-hindi-narration', 'Hindi', 'Traditional'),
('mahabharata', 9, 'Shalya Parva', 'शल्य पर्व', 1, 'End of the Kaurava Army', 'Shalya becomes the final commander. Yudhishthira slays Shalya. The Kaurava army is destroyed. Duryodhana flees and hides in a lake.', 'https://archive.org/download/mahabharata-hindi-narration/shalya-parva-01.mp3', 'mahabharata-hindi-narration', 'Hindi', 'Traditional'),
('mahabharata', 10, 'Sauptika Parva', 'सौप्तिक पर्व', 1, 'Night Massacre', 'Ashwatthama''s revenge — he kills the Pandava camp at night including the Upapandavas. He launches the Brahmastra. Krishna saves Uttara''s unborn child (Parikshit).', 'https://archive.org/download/mahabharata-hindi-narration/sauptika-parva-01.mp3', 'mahabharata-hindi-narration', 'Hindi', 'Traditional'),
('mahabharata', 11, 'Stri Parva', 'स्त्री पर्व', 1, 'Women''s Lament', 'Gandhari, Kunti and the women of Hastinapura mourn the fallen. Gandhari curses Krishna. The dead are cremated with honour.', 'https://archive.org/download/mahabharata-hindi-narration/stri-parva-01.mp3', 'mahabharata-hindi-narration', 'Hindi', 'Traditional'),
('mahabharata', 12, 'Shanti Parva', 'शान्ति पर्व', 1, 'Bhishma''s Teachings on Dharma', 'Bhishma, lying on his bed of arrows, imparts vast wisdom to Yudhishthira on statecraft, dharma, and the nature of the soul before his final departure.', 'https://archive.org/download/mahabharata-hindi-narration/shanti-parva-01.mp3', 'mahabharata-hindi-narration', 'Hindi', 'Traditional'),
('mahabharata', 13, 'Anushasana Parva', 'अनुशासन पर्व', 1, 'Laws of Dharma', 'Bhishma continues his discourse — on charity, truth, the duties of a king, women, and the path to moksha. His final passing on the auspicious Uttarayana day.', 'https://archive.org/download/mahabharata-hindi-narration/anushasana-parva-01.mp3', 'mahabharata-hindi-narration', 'Hindi', 'Traditional'),
('mahabharata', 14, 'Ashvamedha Parva', 'अश्वमेध पर्व', 1, 'Yudhishthira''s Horse Sacrifice', 'Yudhishthira performs the Ashvamedha Yajna to atone for the war''s sins. Arjuna escorts the sacrificial horse across kingdoms.', 'https://archive.org/download/mahabharata-hindi-narration/ashvamedha-parva-01.mp3', 'mahabharata-hindi-narration', 'Hindi', 'Traditional'),
('mahabharata', 15, 'Ashramavasika Parva', 'आश्रमवासिक पर्व', 1, 'Retirement of Dhritarashtra', 'Dhritarashtra, Gandhari and Kunti retire to the forest. They perish in a forest fire. The Pandavas grieve.', 'https://archive.org/download/mahabharata-hindi-narration/ashramavasika-parva-01.mp3', 'mahabharata-hindi-narration', 'Hindi', 'Traditional'),
('mahabharata', 16, 'Mausala Parva', 'मौसल पर्व', 1, 'Destruction of the Yadavas', 'Gandhari''s curse bears fruit. The Yadava clan destroys itself in a drunken brawl. Krishna is struck by a hunter''s arrow and leaves his mortal form.', 'https://archive.org/download/mahabharata-hindi-narration/mausala-parva-01.mp3', 'mahabharata-hindi-narration', 'Hindi', 'Traditional'),
('mahabharata', 17, 'Mahaprasthanika Parva', 'महाप्रस्थानिक पर्व', 1, 'The Great Journey', 'The Pandavas renounce their kingdom and walk northward toward the Himalayas. One by one they fall, each for a subtle flaw — until only Yudhishthira remains with a dog.', 'https://archive.org/download/mahabharata-hindi-narration/mahaprasthanika-parva-01.mp3', 'mahabharata-hindi-narration', 'Hindi', 'Traditional'),
('mahabharata', 18, 'Svargarohana Parva', 'स्वर्गारोहण पर्व', 1, 'Ascent to Heaven', 'Yudhishthira is tested in heaven and hell. He sees the illusion of both. Finally, the Pandavas and Kauravas are united in the eternal realm. The dog reveals itself as Dharma.', 'https://archive.org/download/mahabharata-hindi-narration/svargarohana-parva-01.mp3', 'mahabharata-hindi-narration', 'Hindi', 'Traditional')
ON CONFLICT (epic_id, book_number, episode_number) DO NOTHING;
