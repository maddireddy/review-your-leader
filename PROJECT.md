# 🇮🇳 ReviewYourLeader — India Political Intelligence Platform

> A sophisticated, self-updating civic platform to explore India's political landscape —
> interactive map, live-verified representative data, AI insights, and citizen engagement.
> **One-stop shop for governance, heritage, and democratic accountability.**

**Live:** https://review-your-leader.vercel.app
**Repo:** github.com/maddireddy/review-your-leader

---

## 1. Vision

Help every Indian citizen know — at a glance — **who represents them, how they perform, and what's happening in their state**. The data must always be current, accurate, and trustworthy, without manual maintenance. Multiple AI models cross-check every fact before it's shown.

---

## 2. What It Does (Feature Map)

### 🗺️ Interactive India Map
- All 36 states/UTs with party-colour-coded boundaries + capital markers
- **Two views:** Ruling Party ⇄ Voter Turnout heatmap (2024 Lok Sabha)
- Drill-down: **Country → State → District → Constituency → MP/MLA profile**
- Hover tooltips with CM, party, landmark, turnout

### 👤 Representative Profiles
- Real 2024 Lok Sabha MPs with **Wikipedia photos** (auto-fetched, 3-layer fallback)
- Tabs: Profile · Stats · Election · History · AI Chat
- Attendance %, questions, debates, bills, ministry portfolios, declared assets, criminal cases
- 2024 election results: vote share, winning margin, runner-up, turnout

### 🤖 AI Intelligence
- **3-model state insight** (LLaMA 3.3 70B → 3.1 8B → Gemma2) — consensus-validated governance briefings
- **Representative chat** (Claude Haiku) — grounded Q&A per MP/MLA
- **Semantic search** (Voyage AI + pgvector) — "find MPs who worked on water"
- All AI is **ground-truth anchored** — never contradicts verified DB facts

### 📡 Self-Healing Live Data ⭐ (the core innovation)
- **Autonomous pipeline** keeps CM/political data current with **zero manual input**
- Live web search (Tavily) → 2-model validation → confidence gate → DB persist
- Auto-refreshes when you open a stale state; nightly cron covers all 36
- Full provenance shown: confidence %, source hostnames, verified timestamp
- See `ARCHITECTURE.md` for the complete flow

### 🏛️ Civic Engagement
- **Citizen ratings** — 1–5 stars across 4 categories (1 vote per user)
- **Issue tracker** — report local problems (roads, water, power…) per constituency
- **Comparison mode** — side-by-side rep scorecard with shareable URL
- **Election calendar** — upcoming 2026 elections + Web Push alerts
- **Live news feed** — NewsAPI + Groq summaries per state/rep

### 📊 Analytics
- **Party dashboard** — Recharts bar/radar/scorecard across parties
- **Asset growth tracker** — election-over-election wealth comparison
- **PostHog** — usage analytics

### 🇮🇳 Patriotic Experience
- **National Anthem** — Jana Gana Mana orchestral instrumental (tap-to-play, tricolor player)
- **Indian flag background** — ambient saffron/green glows + rotating Ashoka Chakra
- Tricolor accents throughout

### 🌍 Reach & Platform
- **6 languages** — English, Hindi, Telugu, Tamil, Kannada, Marathi
- **PWA** — installable, offline-capable, home-screen icon
- **WhatsApp bot** — text a constituency/state name, get the profile
- Mobile-responsive, dark premium UI

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.3.9 (App Router) + React 19 |
| Styling | Tailwind CSS v4, custom glass-morphism design system |
| Maps | react-simple-maps + local TopoJSON (1.3MB, 36 states) |
| Animation | Framer Motion |
| Charts | Recharts |
| Live web search | Tavily (→ Serper → Groq compound fallback) |
| AI — insights | Groq: LLaMA 3.3 70B, LLaMA 3.1 8B, Gemma2 9B |
| AI — chat | Anthropic Claude Haiku 4.5 |
| Embeddings | Voyage AI (voyage-3-lite) |
| Database | Supabase (Postgres + pgvector) |
| Analytics | PostHog |
| Hosting | Vercel (Mumbai region, bom1) + Cron |
| Notifications | Web Push API + Meta WhatsApp Cloud API |

---

## 4. Architecture (Summary)

The standout is the **self-healing data pipeline** — see `ARCHITECTURE.md` for full detail.

```
Triggers:  auto-on-open  |  nightly cron  |  manual button
                          ↓ (same pipeline)
1. FETCH    Tavily live web search → snippets + source URLs
2. EXTRACT  LLaMA 3.3 70B → {name, party} strict JSON → canonical normalize
3. VALIDATE LLaMA 3.3 70B + LLaMA 3.1 8B → must BOTH agree
4. GATE     commit only if confidence ≥75% AND unanimous
5. PERSIST  Supabase ground_truth_facts (+ audit log)
                          ↓
Read path:  verified facts OVERLAY static snapshot (defensive normalize)
            → UI shows name · confidence% · sources
```

**Why it's trustworthy:** no single model decides; garbage values are structurally rejected; nothing below the confidence bar reaches the UI; everything is auditable.

### Database Tables
| Table | Purpose |
|---|---|
| `ground_truth_facts` | Verified facts (CM, party, enrichment) + confidence + sources |
| `fact_refresh_log` | Audit trail of every pipeline run |
| `ai_insight_cache` | Cached 3-model governance briefings (24h TTL) |
| `citizen_ratings` | User star ratings |
| `constituency_issues` | User-reported local issues |

---

## 5. Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Home — map + drill-down
│   ├── layout.tsx                  # Root — providers, flag bg, anthem
│   ├── compare/[id1]/[id2]/        # Head-to-head comparison
│   ├── dashboard/parties/          # Party analytics
│   └── api/
│       ├── diagnostics/            # ⚕️ Live health check of all services
│       ├── state-live/             # On-demand live CM verification
│       ├── state-insight/          # 3-model AI briefing
│       ├── cron/refresh-facts/     # Nightly autonomous refresh
│       ├── cron/refresh-cache/     # Nightly AI cache warm
│       ├── search/ chat/ news/     # Search, AI chat, news feed
│       ├── ratings/ issues/        # Civic engagement
│       ├── rep-photo/ whatsapp/    # Wikipedia photos, WhatsApp bot
├── components/
│   ├── Map/                        # IndiaMap, StatePanel, DistrictPanel, Breadcrumb
│   ├── Profile/                    # RepresentativeProfile, AIInsightPanel, Tenure
│   ├── Civic/                      # CitizenRating, IssueTracker, NewsFeed, ElectionCalendar
│   ├── Search/                     # SearchBar (semantic + text)
│   ├── Patriotic/                  # NationalAnthem, FlagBackground
│   ├── Layout/                     # Navbar, LanguageSwitcher, ServiceWorker
│   └── UI/                         # RepPhoto
├── lib/
│   ├── liveDataFetcher.ts          # ⭐ Web search + extract + validate pipeline
│   ├── groundTruthStore.ts         # ⭐ Supabase overlay over static data
│   ├── webSearch.ts                # Tavily/Serper/Groq search abstraction
│   ├── aiValidator.ts              # 3-model consensus for AI insights
│   ├── colorSystem.ts              # WCAG party theme system
│   ├── indiaData.ts                # Static 36-state snapshot (fallback)
│   ├── representativesData.ts      # MP/MLA records + photo resolver
│   ├── districtData.ts             # Districts + mandals
│   ├── partyStats.ts turnoutData.ts electionCalendar.ts
│   ├── groq.ts anthropic.ts voyage.ts supabaseAdmin.ts posthog.ts
│   └── i18n/                       # 6-language translations + context
└── supabase/
    ├── schema.sql                  # Core tables
    ├── schema_v2_cache.sql         # AI cache + ground truth
    └── schema_v3_autopipeline.sql  # Pipeline columns + audit log
```

---

## 6. Setup & Deployment

### Environment Variables (Vercel → Settings → Environment Variables)

| Variable | Required for | Get it |
|---|---|---|
| `GROQ_API_KEY` | AI insights, validation | console.groq.com (free) |
| `TAVILY_API_KEY` | **Live CM updates** | tavily.com (free, 1000/mo) |
| `NEXT_PUBLIC_SUPABASE_URL` | Persistence | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Persistence | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Pipeline writes | Supabase → Settings → API |
| `ANTHROPIC_API_KEY` | Rep AI chat | console.anthropic.com |
| `VOYAGE_API_KEY` | Semantic search | voyageai.com |
| `NEWS_API_KEY` | News feed | newsapi.org (free) |
| `NEXT_PUBLIC_POSTHOG_KEY` / `_HOST` | Analytics | posthog.com |
| `CRON_SECRET` | Secure nightly cron | any random string |
| `WHATSAPP_*` | WhatsApp bot (optional) | Meta for Developers |

### Database Setup
Run in Supabase SQL editor, in order:
1. `supabase/schema.sql`
2. `supabase/schema_v2_cache.sql`
3. `supabase/schema_v3_autopipeline.sql`

### Verify Everything
Visit `/api/diagnostics` — it test-calls every service and reports green/red with exact fixes. **This is the single source of truth for "is it working?"**

### Local Dev
```bash
npm install --legacy-peer-deps
npm run dev
```

### Deploy
Push to `main` → Vercel auto-deploys. **Env var changes require a redeploy.**

---

## 7. Module Tracker (all delivered)

| # | Module | Status |
|---|---|---|
| P1 | Real MP/MLA DB + Wikipedia photos | ✅ |
| P1 | 2024 election results | ✅ |
| P1 | Attendance/bills/debates stats | ✅ |
| P2 | Voyage semantic search | ✅ |
| P2 | Claude Haiku rep chat (grounded) | ✅ |
| P2 | News feed (NewsAPI + Groq) | ✅ |
| P2 | Nightly AI cache cron | ✅ |
| P3 | Citizen ratings | ✅ |
| P3 | Issue tracker | ✅ |
| P3 | Comparison mode | ✅ |
| P3 | Election calendar + Web Push | ✅ |
| P4 | Party dashboard (charts) | ✅ |
| P4 | Asset growth tracker | ✅ |
| P4 | Turnout heatmap | ✅ |
| P5 | PWA | ✅ |
| P5 | 6-language i18n | ✅ |
| P5 | WhatsApp bot | ✅ |
| ADP | Autonomous live-data pipeline | ✅ |
| ADP | Continuous auto-verify on open | ✅ |
| FIX | CM extraction accuracy + party normalization | ✅ |
| 🇮🇳 | National anthem + flag theme | ✅ |
| 📄 | Architecture + project docs | ✅ |

---

## 8. Roadmap (next)

- Extend live pipeline to **MP/MLA records, ministry changes, election results**
- **Heritage/tourism panel** surfacing the enrichment data (developments, infrastructure, heritage)
- All 543 Lok Sabha MPs (currently key MPs per state)
- Voter registration deep-links
- B2B API access for media/researchers

---

## 9. Data Sources & Credits

- **Election Commission of India** — constituencies, results, affidavits
- **Wikipedia / Wikimedia Commons** — photos, national anthem (public domain)
- **Tavily** — live web search
- **PRS India / Lok Sabha** — parliamentary performance
- National Anthem: *Jana Gana Mana* by Rabindranath Tagore (public domain)

---

*Built with Next.js + a multi-model AI validation pipeline. Civic-tech for an informed democracy.* 🇮🇳
