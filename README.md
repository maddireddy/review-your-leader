# ReviewYourLeader

**India's political intelligence platform** — interactive map drill-down from national → state → district → mandal → constituency, with live CM verification, AI-powered insights, and comprehensive electoral data.

**Live**: https://review-your-leader.vercel.app

---

## Architecture

```
Next.js 15.3.9 (App Router)  +  React 19
Supabase (Postgres + pgvector + RLS)
Groq AI (LLaMA 3.3 70B + LLaMA 3.1 8B + Gemma2 9B consensus)
react-simple-maps v3 (SVG map, TopoJSON)
Vercel (bom1 region, Hobby plan — 2 crons max)
```

---

## Navigation Flow

```
India (country view)
  └── Click state → State panel (CM photo, districts, AI insight)
        └── Click district → District panel (mandals primary)
              └── Click mandal → Assembly constituency + MLA popup
                    └── Click constituency → Representative profile + history
```

Map drill-down also works: click state border → select state; click district overlay → select district.

---

## Map Layers

| Layer | Source | Trigger |
|-------|--------|---------|
| State boundaries | `/india-states.json` (TopoJSON) | Always |
| District overlay | `/geojson/india-districts.json` (GeoJSON, 3.2MB) | State selected or zoom ≥ 2.5 |
| District labels | Computed centroids | State selected + zoom ≥ 1.5 |
| Roads/Highways | OpenStreetMap (iframe embed) | "Roads" toggle |
| State capitals | Marker layer | Always |

View modes: **Party** (ruling party colors) | **Turnout** (2024 voter turnout) | **Roads** (OSM highways)

---

## Database Tables (Supabase)

Run `supabase/schema_FINAL.sql` to create all tables idempotently.

| Table | Purpose |
|-------|---------|
| `states` | 37 states/UTs — id, name, capital, ruling_party, chief_minister |
| `districts` | All districts per state — population, area, seat counts |
| `assembly_constituencies` | Vidhan Sabha seats — MLA, party, reserved status |
| `mandals` | Revenue circles/mandals linked to constituency |
| `representatives` | MPs and MLAs |
| `ground_truth_facts` | Verified CM data (web search + 3-model AI consensus) |
| `politician_profiles` | Wikipedia + AI enriched profiles (cached 6h) |
| `election_results` | Historical election data from ECI/LokDhaba |
| `election_cycles` | State election schedule |
| `ai_insight_cache` | AI-generated state insights (cached) |
| `ai_validation_log` | Multi-model validation audit trail |
| `data_sync_log` | All sync operations log |
| `pipeline_locks` | Prevent concurrent pipeline runs |
| `epics` | Ramayana + Mahabharata metadata |
| `epic_episodes` | Individual episodes with audio |

### Populate DB after schema reset

```bash
# Step 1: In Supabase SQL editor, run supabase/schema_FINAL.sql

# Step 2: Populate all static data (states + districts + constituencies + mandals)
curl -X POST https://reviewyourleader.com/api/admin/populate-db \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

---

## API Routes

### Public
| Route | Description |
|-------|-------------|
| `GET /api/mandals?districtId=` | Mandals for a district (DB then static fallback) |
| `GET /api/constituencies?districtId=` | Assembly seats (DB then static fallback) |
| `POST /api/state-live` | Live CM verification (web search + AI) |
| `GET /api/state-live?stateId=` | Read cached CM from DB |
| `POST /api/state-insight` | AI political insight for a state |
| `GET /api/rep-photo?slug=` | Wikipedia politician photo (cached 7d) |
| `GET /api/politician-journey` | Rich politician profile |
| `GET /api/election-history?stateId=` | Electoral history |
| `GET /api/epics` | Ramayana/Mahabharata episodes |

### Admin (requires `x-cron-secret` header)
| Route | Description |
|-------|-------------|
| `POST /api/admin/populate-db` | Full DB seed from all static TypeScript data |
| `POST /api/admin/seed-constituencies` | Seed only constituency/mandal data |
| `POST /api/admin/sync-eci` | Pull electoral data from ECI/LokDhaba + 3-model AI validate |
| `POST /api/admin/purge-insight` | Clear AI insight cache |
| `POST /api/admin/refresh-state` | Force-refresh a state's CM facts |

### Crons (Vercel, 2 daily)
| Schedule (IST) | Route | Purpose |
|----------------|-------|---------|
| 02:00 AM | `/api/cron/daily-pipeline` | CM refresh all 36 states + AI insight cache purge |
| 02:30 AM | `/api/cron/data-agent` | CM sync to DB, mandal gap detection, expired profile refresh |

---

## Data Sources

| Source | What it provides |
|--------|-----------------|
| ECI (Election Commission) | Official election results |
| LokDhaba (TCPD, Ashoka Univ.) | Historical constituency data since 1962 |
| NDAP | Socioeconomic + demographic data |
| Wikipedia REST API | Politician photos + biographical profiles |
| Groq (LLaMA 3.3 70B) | Primary AI verification |
| Groq (LLaMA 3.1 8B + Gemma2 9B) | Secondary validation models |
| OpenStreetMap | Roads and highways layer |
| geohacker/india | District GeoJSON boundaries (simplified 33MB → 3.2MB) |

---

## Static Data Coverage

### Mandal data (real names, not placeholders)
| State | Districts covered |
|-------|------------------|
| Telangana (TG) | 12 districts |
| Andhra Pradesh (AP) | 3 districts |
| Tamil Nadu (TN) | 3 districts |
| Karnataka (KA) | 4 districts (Bengaluru, Mysuru, Hubli, Ballari) |
| Maharashtra (MH) | 4 districts (Mumbai, Pune, Nashik, Nagpur) |
| Uttar Pradesh (UP) | 5 districts (Lucknow, Agra, Varanasi, Kanpur, Prayagraj) |
| Rajasthan (RJ) | 3 districts |
| Gujarat (GJ) | 3 districts |
| Kerala (KL) | 3 districts |
| Madhya Pradesh (MP) | 3 districts |
| Bihar (BR) | 3 districts |
| West Bengal (WB) | 3 districts |
| Punjab (PB) | 3 districts |
| Odisha (OD) | 2 districts |
| Haryana (HR) | 2 districts |

Other districts auto-generate placeholder names from `mandals_count`.

### CM Photos
All 31 state CMs have Wikipedia slugs configured in `indiaData.ts`. Photos are fetched live from Wikipedia REST API, enhanced via weserv.nl CDN, and cached 7 days.

---

## Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=your-groq-key
CRON_SECRET=your-secure-secret

# Optional
NEXT_PUBLIC_APP_URL=https://reviewyourleader.com
CLOUDINARY_URL=cloudinary://...        # photo CDN enhancement
WHATSAPP_VERIFY_TOKEN=...
WHATSAPP_ACCESS_TOKEN=...
POSTHOG_KEY=...
TAVILY_API_KEY=...                     # news search enrichment
```

---

## Local Development

```bash
npm install --legacy-peer-deps
cp .env.example .env.local   # fill in keys
npm run dev                  # http://localhost:3000
npm run build                # verify no type errors
```

---

## Key Files

```
src/
  app/
    page.tsx                      # Main layout — navigation state machine, breadcrumb, panels
    api/
      state-live/                 # CM live verification + DB cache
      state-insight/              # AI political insight (Groq + 3-model validation)
      mandals/                    # Mandal data API (DB → static fallback)
      constituencies/             # Assembly data API (DB → static fallback)
      rep-photo/                  # Wikipedia photo proxy (cached 7d)
      politician-journey/         # Rich politician profiles
      election-history/           # Electoral results API
      cron/
        daily-pipeline/           # Master daily cron (CM facts + cache purge)
        data-agent/               # Background polling agent (CM sync, gaps, profiles)
      admin/
        populate-db/              # Full DB seed from static TypeScript data
        seed-constituencies/      # Constituency/mandal seed only
        sync-eci/                 # ECI + LokDhaba electoral data sync
  components/
    Map/
      IndiaMap.tsx                # SVG map — state layer, district overlay, roads toggle
      StatePanel.tsx              # State info, CM photo, districts list, AI insight
      DistrictPanel.tsx           # Mandals (primary) + assembly seats (collapsible)
    Profile/
      RepresentativeProfile.tsx   # MLA/MP profile card
      PoliticianJourney.tsx       # CM journey modal (Wikipedia + AI)
    Electoral/
      ElectionHistory.tsx         # Election history visualization
    UI/
      RepPhoto.tsx                # Smart politician photo (Wikipedia → initials fallback)
  lib/
    indiaData.ts                  # 36 states/UTs — CM names, Wikipedia slugs, landmarks
    districtData.ts               # District info + mandal names (15 states)
    constituencyData.ts           # Assembly constituency + MLA data (TG/AP/TN)
    colorSystem.ts                # Party → color mapping
supabase/
  schema_FINAL.sql                # Single idempotent script — all 25 tables + RLS + seeds
public/
  india-states.json               # State boundaries (TopoJSON, ~1.3MB)
  geojson/
    india-districts.json          # District boundaries (GeoJSON, 3.2MB, 594 features)
```

---

## Deployment

Hosted on Vercel, Mumbai (bom1) region.

```bash
git push origin main   # triggers Vercel auto-deploy
```

After schema changes or table drops:
```bash
# 1. In Supabase SQL editor: run schema_FINAL.sql
# 2. Populate all data:
curl -X POST https://reviewyourleader.com/api/admin/populate-db \
  -H "x-cron-secret: $CRON_SECRET"
```

---

## Changelog

| Date | What changed |
|------|-------------|
| 2026-06-10 | District overlay on map (594 features), mandal-first navigation, CM photos via Wikipedia, mandal data for 15 states, background data-agent cron, Roads/OSM overlay, comprehensive README |
| 2026-06 | schema_FINAL.sql — consolidated all 8 schema files into one idempotent script |
| 2026-06 | Full DB pipeline — ECI sync with 3-model AI validation, seed API, constituency/mandal routes |
| 2026-06 | Senior UI redesign — always-visible map, breadcrumb navigation, back button |
| 2026-06 | Rich politician profiles, election history, Epics (Ramayana/Mahabharata) module |
