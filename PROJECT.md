# ReviewYourLeader — India Political Intelligence Platform

> Comprehensive civic platform — drill from India → State → District → Assembly Constituency → Mandal, see every elected representative with real names, live AI-verified data, and full political history.

**Live:** https://review-your-leader.vercel.app  
**Repo:** github.com/maddireddy/review-your-leader

---

## Vision

Help every Indian citizen know — at a glance — **who represents them, how they perform, and what's happening in their state**. Real data from real elections, verified by multiple AI models, updated daily with zero manual maintenance.

Administrative drill-down:
```
India → State → District → Assembly Constituency → Mandal → [Gram Panchayat — future]
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.3.9 (App Router) + React 19 |
| Styling | Tailwind CSS, glass-morphism design system, Framer Motion |
| Database | Supabase (Postgres + RLS) |
| AI — fact verification | Groq: LLaMA 3.3 70B + LLaMA 3.1 8B + Gemma2 9B |
| AI — profiles/photos | Anthropic Claude Haiku (personality, vision, photo selection) |
| Hosting | Vercel Hobby (2 daily crons max) |
| Photo enhancement | weserv.nl CDN (optional: Cloudinary via env var) |

---

## Modules

### M1 · Interactive India Map
**Files:** `src/app/page.tsx`, `src/components/Map/IndiaMap.tsx`
- SVG clickable India map, all 36 states/UTs
- Click any state → StatePanel slides in
- Live ticker bar: recent CM verifications with confidence %
- SSE connection to `/api/live-events` for real-time updates

### M2 · State Panel
**File:** `src/components/Map/StatePanel.tsx`
- Current CM: photo, party badge (color-coded), tenure
- Confidence indicator: % + source hostnames + verified timestamp
- AI governance briefing: 3-sentence, 3-model consensus, ground-truth anchored
- "View Full Profile" button → PoliticianJourney modal for CM
- Overview / Elections tab toggle
- ElectionHistory component shown in Elections tab
- District list → click any district → DistrictPanel

### M3 · District Panel
**File:** `src/components/Map/DistrictPanel.tsx`
- Header: headquarters, Lok Sabha seats, Vidhan Sabha seats, mandal count, population
- **Lok Sabha constituency cards** — clickable → RepresentativeProfile
- **Assembly constituency cards** — real ECI names (not generated), shows MLA name + party badge per card
  - `(data loading)` label shown for states not yet in constituencyData.ts
- **Mandal section** — expandable grid of clickable mandal chips
  - For districts with real data: clicking a mandal opens a popup showing which constituency it belongs to + current MLA + party
  - Falls back to generic `Mandal 1, 2...` for districts not yet covered

### M4 · Constituency Data Layer
**File:** `src/lib/constituencyData.ts`
- 200+ real assembly constituencies with ECI numbers, names, current MLA, party, and mandal lists
- Coverage (with election results):
  - **Telangana** — 2023 (INC majority), CM Revanth Reddy from Kodangal
  - **Andhra Pradesh** — 2024 (TDP+NDA majority), CM Chandrababu Naidu
  - **Tamil Nadu** — 2021 (DMK majority), CM M.K. Stalin
  - **Karnataka** — 2023 (INC majority), CM Siddaramaiah
  - **Maharashtra** — 2024 (Mahayuti majority), CM Devendra Fadnavis
  - **Kerala** — 2021 (LDF majority), CM Pinarayi Vijayan
  - **Delhi** — 2025 (BJP majority)
  - Key constituencies in RJ, GJ, UP, WB
- Example — Khammam district, TG: Sathupalli → Matta Ragamayee (INC), Wyra → Sandra Venkata Veeraiah (INC), Madhira, Palair, Khammam, Yellandu with real 2023 results
- Party color map: INC/BJP/DMK/AIADMK/TDP/YSRCP/BRS/AIMIM/CPM/TMC/AAP/NCP/Shiv Sena etc.
- `getAssemblyByDistrict(districtId)` — returns real seats
- `getPartyColor(party)` — returns bg/text/border colors

### M5 · Representative Profile
**File:** `src/components/Profile/RepresentativeProfile.tsx`
- Full MP/MLA card: photo (AI-enhanced), party color theme, constituency, tenure
- Stats: attendance %, questions asked, debates, bills introduced, ministry
- Education, declared assets, criminal cases
- "View Full Political Journey" → PoliticianJourney modal
- Election tab → ElectionHistory component

### M6 · Politician Journey Modal
**File:** `src/components/Profile/PoliticianJourney.tsx`
- Full-screen slide-up modal (Wikipedia-style rich profile)
- Hero photo: AI-enhanced via weserv.nl, violet sparkle badge if enhanced, verified shield icon
- Party color theme throughout
- Personality traits chips, leadership style description
- Signature quote
- 3 tabs:
  - **Timeline** — animated vertical career milestones with color-coded nodes
  - **Achievements** — key accomplishments list
  - **News** — recent news items
- Entry points: StatePanel (CM), RepresentativeProfile (MP/MLA), SearchBar (any search result)

### M7 · Politician Photo Pipeline
**File:** `src/lib/politicianPhoto.ts`
- 5-stage pipeline:
  1. Wikipedia REST API `originalimage` (high-res)
  2. Wikimedia Commons search (formal portraits)
  3. Wikidata P18 claim lookup
  4. Claude Haiku vision → picks most professional headshot from candidates
  5. weserv.nl CDN: `w=400&h=400&fit=cover&a=attention&sharp=4&brightness=2&contrast=6&saturation=12`
- Optional Cloudinary: `w_400,h_400,c_fill,g_face,e_improve,e_sharpen:80,e_vibrance:30` (set `CLOUDINARY_CLOUD_NAME`)
- Stored as `photo_url` (original) + `enhanced_photo_url` in `politician_profiles` table

### M8 · AI Fact Verification Pipeline
**File:** `src/lib/aiValidator.ts`, `src/lib/liveDataFetcher.ts`
- Model chain: Groq LLaMA 3.3 70B → LLaMA 3.1 8B → Gemma2 9B
- Confidence gate: commit only if ≥75% + unanimous
- `checkFacts()` — scans every sentence for wrong CM names
- `autoCorrect()` — replaces ALL wrong names, prepends anchor sentence
- Daily `versionSlug` (YYYY-MM-DD) busts stale AI cache
- `buildGroundedSystemPrompt()` — ⛔ ABSOLUTE PROHIBITION block prevents models from reverting to training data CMs
- State insight prompt repeats CM name 4× to anchor all 3 models

### M9 · Election History
**File:** `src/components/Electoral/ElectionHistory.tsx`
- 3 tabs: Results / Trends / Affidavits
- VoteBar sub-component: animated % bars per candidate with winner highlight
- TurnoutSparkline: SVG line chart of historical voter turnout
- Year filter chips: 2024 / 2019 / 2014 / 2009
- APIs: `/api/electoral/results`, `/api/electoral/trends`, `/api/electoral/candidates`
- Shown in RepresentativeProfile election tab + StatePanel elections tab

### M10 · Search
**File:** `src/components/Search/SearchBar.tsx`
- Type any politician name → search across all representatives
- Each result: photo, name, party badge, constituency, "Journey" chip button
- Journey chip → opens PoliticianJourney modal inline in search results

### M11 · AI Insight Panel
**File:** `src/components/Profile/AIInsightPanel.tsx`
- 3-sentence governance briefing per state
- Shows model badges (LLaMA 3.3 70B + LLaMA 3.1 8B + Gemma2), consensus %, auto-corrected label
- Cached 24h, busted daily, purge-able via `/api/admin/purge-insight`

### M12 · Citizen Engagement
**Files:** `src/components/Civic/`
- **CitizenRating** — 1–5 stars across 4 categories per politician
- **IssueTracker** — file civic issues per constituency (road, water, power...)
- **ElectionCalendar** — upcoming elections per state with countdown
- **NewsFeed** — politician-specific news from multiple sources

### M13 · Epics Module (`/epics`)
**Files:** `src/app/epics/page.tsx`, `/api/epics/`
- Audio player for Valmiki Ramayana (7 Kandas, ~24k slokas) and Mahabharata (18 Parvas, 100k+ slokas)
- Chapter navigation, progress tracking per user
- Tricolor-themed UI, Sanskrit/Hindi titles

### M14 · Party Dashboard (`/dashboard/parties`)
- Party-level performance across states
- Recharts: bar charts, radar, seat count scorecards

### M15 · WhatsApp Bot
**File:** `src/app/api/whatsapp/route.ts`
- Webhook for Meta WhatsApp Cloud API
- Text a state/constituency → get CM/MLA profile back
- Signature verification via HMAC-SHA256

---

## Data Architecture

### Static Snapshot Files (`src/lib/`)
| File | What it holds |
|---|---|
| `indiaData.ts` | All 36 states — CM, party, capital, coordinates (updated manually for elections) |
| `districtData.ts` | All districts per state — headquarters, mandal count, assembly/LS seat counts, population |
| `constituencyData.ts` | 200+ real assembly constituencies — ECI number, name, current MLA, party, mandals[] |
| `representativesData.ts` | ~30 MP/MLA profiles with full stats for demo/fallback |
| `colorSystem.ts` | Party color palette (WCAG-compliant) |
| `electionCalendar.ts` | Scheduled election dates per state |

### Ground Truth Override Pattern
Live Supabase facts always override static snapshot:
```
Static indiaData.ts snapshot  ←  overridden by  →  ground_truth_facts (Supabase)
                                                    └─ confidence, sources, verified_at shown in UI
```

### Supabase Tables
| Table | Purpose |
|---|---|
| `ground_truth_facts` | Verified CM/party/confidence per state |
| `fact_refresh_log` | Audit trail of every pipeline run |
| `ai_insight_cache` | Cached governance briefings (24h TTL) |
| `politician_profiles` | Wikipedia + AI profile cache + photo URLs |
| `election_cycles` | 34 seeded cycles (GE 2004–2024 + state elections) |
| `election_results` | Candidate-level results synced from LokDhaba |
| `candidate_profiles` | ADR affidavit data (assets, criminal cases) |
| `party_performance` | Aggregated party seat counts per election |
| `constituency_demographics` | Census data per constituency |
| `voter_turnout_history` | Historical turnout per constituency |
| `ndap_datasets` | NITI Aayog NDAP linked datasets |
| `data_sync_log` | ETL sync audit log |
| `pipeline_locks` | Dedup locks preventing concurrent cron conflicts |
| `ratings` | Citizen star ratings |
| `issues` | Civic issues per constituency |
| `epics` | Epic metadata (Ramayana, Mahabharata) |
| `epic_episodes` | Chapter data |

---

## API Routes

### Core
| Route | Method | Purpose |
|---|---|---|
| `/api/state-live` | GET | Live-verified CM + party for any state |
| `/api/state-insight` | GET | 3-model AI governance briefing |
| `/api/politician` | GET | Full politician profile + photo |
| `/api/rep-photo` | GET | Enhanced politician photo |
| `/api/search` | GET | Politician search |
| `/api/chat` | POST | Conversational AI about any politician |
| `/api/ratings` | GET/POST | Citizen ratings |
| `/api/issues` | GET/POST | Civic issues |
| `/api/news` | GET | News feed |
| `/api/live-events` | GET | SSE stream of recent verifications |
| `/api/diagnostics` | GET | Full health check of all services |

### Electoral
| Route | Purpose |
|---|---|
| `/api/electoral/results` | Constituency results (stateId/year/type) |
| `/api/electoral/trends` | Party performance + turnout history |
| `/api/electoral/candidates` | ADR affidavit / background data |
| `/api/electoral/demographics` | Census demographics |

### Cron (2 daily — Vercel Hobby plan limit)
| Route | Schedule (UTC) | What it does |
|---|---|---|
| `/api/cron/daily-pipeline` | 8:30 PM | Smart-refresh stale states → 6 geo-batches → electoral sync → cache purge → cache refresh |
| `/api/cron/sync-electoral` | 9:30 PM | Pick 4 most-stale states → LokDhaba sync → party performance aggregation |

### Admin
| Route | Purpose |
|---|---|
| `/api/admin/purge-insight` | POST — purge AI cache for one state or ALL (protected by CRON_SECRET) |

---

## Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
ANTHROPIC_API_KEY=
CRON_SECRET=

# Optional — better photo enhancement
CLOUDINARY_CLOUD_NAME=

# Optional — voter registration stats
API_SETU_KEY=

# Optional — live web search for CM updates
TAVILY_API_KEY=
```

---

## Supabase Migrations (run in order in SQL editor)

1. `supabase/schema.sql` — core tables
2. `supabase/schema_v2_cache.sql` — AI cache + ground truth
3. `supabase/schema_v3_autopipeline.sql` — pipeline audit
4. `supabase/schema_v4_enrichment.sql` — enrichment + epics
5. `supabase/schema_v5b_photo_enhancement.sql` — `enhanced_photo_url` column ← **run if not done**
6. `supabase/schema_v6_electoral.sql` — 8 electoral tables ← **run if not done**

---

## Module Status

| Module | Status | Notes |
|---|---|---|
| Interactive India map | ✅ | All 36 states |
| State Panel + CM profiles | ✅ | Live-verified, ground-truth anchored |
| AI fact verification pipeline | ✅ | 3-model consensus, daily bust |
| District Panel | ✅ | Real constituency names + MLA data |
| Constituency data (TG/AP/TN/KA/MH/KL/DL) | ✅ | 200+ real seats with current MLA |
| Mandal drill-down (clickable) | ✅ | Popup shows constituency + MLA |
| Politician Journey modal | ✅ | 3-tab, all 3 entry points wired |
| AI photo pipeline (5-stage) | ✅ | weserv.nl + optional Cloudinary |
| Election History (3-tab) | ✅ | Results/Trends/Affidavits |
| Electoral data sync (LokDhaba) | ✅ | Daily cron |
| Search + Journey chip | ✅ | All search results have Journey button |
| AI governance briefings | ✅ | CM-anchored, daily cache bust |
| Citizen ratings + issues | ✅ | |
| Epics audio player | ✅ | Ramayana + Mahabharata |
| Party dashboard | ✅ | |
| WhatsApp bot | ✅ | With HMAC signature verification |
| Vercel Hobby cron (2/day limit) | ✅ | Consolidated from 13 → 2 daily jobs |
| Remaining states constituency data | 🔄 | BR, MP, RJ (complete), PB, HR, AS... |
| Gram Panchayat level | 📋 | Below mandal — not started |
| All 543 Lok Sabha MPs | 📋 | Currently key MPs only |
| Cloudinary photo enhancement | 📋 | Needs CLOUDINARY_CLOUD_NAME env var |

---

## Local Setup

```bash
npm install --legacy-peer-deps
# copy .env.local with required vars
npm run dev
```

Visit `/api/diagnostics` — tests every service, reports green/red with fixes.

Push to `main` → Vercel auto-deploys.
