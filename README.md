# ReviewYourLeader 🗺️

> Know Your Indian Political Representatives — from State to Constituency level

A sophisticated full-stack political intelligence platform featuring an interactive India map drill-down with AI-powered insights on MPs and MLAs.

## Features

- 🗺️ **Interactive India Map** — Color-coded by ruling party, zoomable, state capitals marked
- 🔍 **Drill-Down Navigation** — State → District → Constituency → Representative
- 👤 **Rich Profiles** — Performance stats, attendance, tenure history, ministry portfolios
- 🤖 **AI Insights** — Claude Haiku-powered Q&A about any leader
- 🔎 **Semantic Search** — Voyage AI embeddings + Supabase pgvector
- 📊 **Analytics** — PostHog product analytics

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 + React 19 + Tailwind CSS |
| Map | react-simple-maps + D3 |
| Database | Supabase (PostgreSQL + pgvector) |
| AI Chat | Anthropic Claude Haiku |
| Embeddings | Voyage AI voyage-3-lite |
| Analytics | PostHog |
| Hosting | Vercel (Mumbai region) |
| Domain | Hostinger → reviewyourleader.com |
| CI/CD | GitHub Actions → Vercel auto-deploy |

## Getting Started

```bash
# Install
npm install --legacy-peer-deps

# Configure env
cp .env.example .env.local
# Edit .env.local with your API keys

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `VOYAGE_API_KEY` | dash.voyageai.com |
| `NEXT_PUBLIC_POSTHOG_KEY` | app.posthog.com |

## Supabase Setup

1. Create project at [supabase.com](https://supabase.com) (free tier)
2. SQL Editor → paste contents of `supabase/schema.sql` → Run
3. Schema creates all tables, pgvector HNSW index, and RLS policies

## Deployment to Vercel

1. Push to GitHub
2. Import at [vercel.com](https://vercel.com/new) 
3. Add environment variables in Vercel dashboard
4. Vercel auto-deploys on every push to `main`

**Region**: Set to `bom1` (Mumbai) in `vercel.json` for lowest India latency.

## Custom Domain (Hostinger)

1. Buy `reviewyourleader.com` on Hostinger
2. Vercel → Project → Domains → Add domain
3. Copy Vercel nameservers → Paste into Hostinger DNS management
4. SSL auto-provisioned within minutes

## Database Schema

```
states → districts → constituencies → representatives
                                           ↓
                                       ministries
                                       tenure_records
                                       (embedding vector)
```
