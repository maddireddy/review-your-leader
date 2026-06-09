# ReviewYourLeader — Data & AI Architecture

This document answers: **Who fetches the data? Who validates accuracy? What models? What's the flow?**

---

## 1. The Agents (who fetches & when)

There is no single always-on daemon — that would burn API quota 24/7. Instead, **three trigger sources** drive the same pipeline:

| Agent / Trigger | When it runs | Scope | File |
|---|---|---|---|
| **Auto-verify on open** | Every time a user opens a state whose verified CM is missing or older than 7 days | 1 state | `StatePanel.tsx` → `runVerify()` |
| **Nightly cron** | 21:00 UTC daily (Vercel cron) | All 36 states | `/api/cron/refresh-facts` |
| **Manual "Verify live"** | User clicks the button | 1 state | `/api/state-live` (POST) |

All three call the **same validation pipeline** below. This is the "continuous agent" — the app self-heals as people browse it, and the nightly cron guarantees full coverage even for unvisited states.

---

## 2. The Pipeline (how a fact becomes trusted)

```
                    ┌─────────────────────────────────────────────┐
   Trigger ───────► │  fetchCurrentCM(stateName)                  │
                    └───────────────────┬─────────────────────────┘
                                        │
              ┌─────────────────────────▼──────────────────────────┐
   STAGE 1    │  LIVE WEB SEARCH  (lib/webSearch.ts)               │
   FETCH      │  Tavily → Serper → Groq-compound  (first that works)│
              │  Returns: real web snippets + source URLs          │
              └─────────────────────────┬──────────────────────────┘
                                        │  raw web text + sources
              ┌─────────────────────────▼──────────────────────────┐
   STAGE 2    │  EXTRACT  (llama-3.3-70b)                          │
   STRUCTURE  │  Pull {name, party, since} as strict JSON          │
              │  → normalizeParty(): reject non-canonical garbage  │
              │    ("Non-Dravidian party" → dropped)               │
              └─────────────────────────┬──────────────────────────┘
                                        │  candidate fact
              ┌─────────────────────────▼──────────────────────────┐
   STAGE 3    │  VALIDATE  (2 independent models)                  │
   CONSENSUS  │  llama-3.3-70b  +  llama-3.1-8b-instant            │
              │  Each answers: "Is X the current CM of Y?"          │
              │  Must be UNANIMOUS to pass                          │
              └─────────────────────────┬──────────────────────────┘
                                        │  agree? + confidence
              ┌─────────────────────────▼──────────────────────────┐
   STAGE 4    │  SCORE                                              │
   GATE       │  confidence = validation_conf × source_count_bonus │
              │  COMMIT only if  ≥ 0.75  AND  validators unanimous  │
              └─────────────────────────┬──────────────────────────┘
                                        │  passed
              ┌─────────────────────────▼──────────────────────────┐
   STAGE 5    │  PERSIST  (Supabase ground_truth_facts)            │
   STORE      │  fact_value, fact_party, confidence, sources,      │
              │  validation_notes, verified_at, verified_by        │
              │  + audit row in fact_refresh_log                   │
              └─────────────────────────┬──────────────────────────┘
                                        │
              ┌─────────────────────────▼──────────────────────────┐
   READ PATH  │  getLiveStateInfo()  overlays verified fact over   │
              │  the static indiaData.ts snapshot.                 │
              │  Defensive normalizeParty() on read too.           │
              │  UI shows: name · confidence% · source hostnames   │
              └─────────────────────────────────────────────────────┘
```

### Why multiple models?
- **One model can hallucinate.** Stage 2 extracts, Stages 3 uses *two different* models that must **both agree**.
- A single dissent drops confidence by 60% → won't commit.
- Garbage party names are structurally rejected (canonical list in `liveDataFetcher.ts`).

### Why a confidence gate?
Nothing reaches the database unless: web search succeeded **and** the extractor produced a real name **and** both validators said "yes" **and** composite confidence ≥ 0.75. Otherwise the static fallback stays.

---

## 3. The Models

| Role | Model | Why |
|---|---|---|
| Live web search | Tavily API (primary) | Purpose-built for LLM search, returns clean snippets + sources |
| Extraction | `llama-3.3-70b-versatile` (Groq) | Strong structured extraction |
| Validator 1 | `llama-3.3-70b-versatile` | Independent confirmation |
| Validator 2 | `llama-3.1-8b-instant` | Fast diverse second opinion |
| State AI insight | LLaMA 3.3 70B + 3.1 8B + Gemma2 | 3-model consensus (separate `aiValidator.ts`) |
| Representative chat | `claude-haiku-4-5` (Anthropic) | Grounded Q&A per MP/MLA |
| Embeddings/search | `voyage-3-lite` | Semantic search over reps |

---

## 4. Database Tables (Supabase)

| Table | Purpose | Written by |
|---|---|---|
| `ground_truth_facts` | Authoritative verified facts (CM, party, …) with confidence + sources | The pipeline |
| `fact_refresh_log` | Audit trail of every pipeline run (committed or not) | The pipeline |
| `ai_insight_cache` | Cached 3-model AI governance briefings (24h TTL) | `aiValidator.ts` |
| `citizen_ratings` | User star ratings per rep | Users |
| `constituency_issues` | User-reported local issues | Users |

---

## 5. Health & Debugging

`GET /api/diagnostics` test-calls every integration and reports green/red with exact fixes. This is the single source of truth for "is it working?".

---

## 6. Future Extensions (same pattern)

The pipeline is generic — `fetchCurrentCM` is one fact type. To add more, replicate the 5 stages with a new fetcher + extractor:

- **MP/MLA records** — `fetchRepresentative(constituency)` → name, party, recent activity
- **Ministry changes** — `fetchMinistry(person)` → portfolio, since-date
- **Election results** — `fetchElectionResult(constituency, year)` → winner, margin, turnout
- **Heritage / infrastructure** — `fetchStateEnrichment(state)` → landmarks, projects, achievements

Each writes to `ground_truth_facts` with its own `fact_key`, so the overlay + confidence + audit machinery is reused as-is.
