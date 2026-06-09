import { NextResponse } from 'next/server';

/**
 * /api/diagnostics — live health check of every integration.
 * Tells you EXACTLY what is connected and what is not.
 *
 * Visit https://your-app.vercel.app/api/diagnostics
 */

interface Check {
  service: string;
  configured: boolean;
  working: boolean | null;   // null = not tested
  detail: string;
}

function isReal(v: string | undefined, minLen: number, prefix?: string): boolean {
  if (!v) return false;
  if (v.length < minLen) return false;
  if (v.toLowerCase().startsWith('your_') || v.includes('xxxx') || v.includes('placeholder')) return false;
  if (prefix && !v.startsWith(prefix)) return false;
  return true;
}

export async function GET() {
  const checks: Check[] = [];

  // ── 1. Groq (the core of live data) ───────────────────────────
  const groqKey = process.env.GROQ_API_KEY;
  const groqConfigured = isReal(groqKey, 40, 'gsk_');
  let groqWorking: boolean | null = null;
  let groqDetail = '';

  if (!groqKey) {
    groqDetail = 'GROQ_API_KEY not set';
  } else if (!groqConfigured) {
    groqDetail = `GROQ_API_KEY looks like a placeholder ("${groqKey.slice(0, 6)}…", ${groqKey.length} chars). Real keys start with "gsk_" and are ~56 chars.`;
  } else {
    // Test a real call
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: 'ping' }], max_tokens: 5 }),
      });
      groqWorking = r.ok;
      groqDetail = r.ok ? 'Authenticated ✓' : `HTTP ${r.status}: ${(await r.text()).slice(0, 120)}`;
    } catch (e) {
      groqWorking = false;
      groqDetail = `Request failed: ${e instanceof Error ? e.message : 'unknown'}`;
    }
  }

  checks.push({ service: 'Groq (AI insights)', configured: groqConfigured, working: groqWorking, detail: groqDetail });

  // ── 1b. Web search layer (Tavily → Serper → Groq compound) ────
  const tavilyKey = process.env.TAVILY_API_KEY;
  const serperKey = process.env.SERPER_API_KEY;
  let searchWorking: boolean | null = null;
  let searchDetail = '';

  if (tavilyKey || serperKey || groqConfigured) {
    try {
      const { webSearch } = await import('@/lib/webSearch');
      const res = await webSearch('current Prime Minister of India 2026');
      searchWorking = res.ok;
      searchDetail = res.ok
        ? `Working via "${res.provider}" ✓ (${res.sources.length} sources)`
        : `All providers failed. ${res.error}. → Add a FREE Tavily key (tavily.com) as TAVILY_API_KEY for reliable live search.`;
    } catch (e) {
      searchWorking = false;
      searchDetail = `Search error: ${e instanceof Error ? e.message : 'unknown'}`;
    }
  } else {
    searchDetail = 'No web-search provider configured. Add TAVILY_API_KEY (free, no card) — this is what powers live CM updates.';
  }
  checks.push({
    service: 'Live Web Search (CM updates)',
    configured: !!(tavilyKey || serperKey || groqConfigured),
    working: searchWorking,
    detail: searchDetail,
  });

  // ── 2. Supabase (persistence of verified facts) ───────────────
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const sbConfigured = isReal(sbUrl, 30, 'https://') && isReal(sbKey, 100);
  let sbWorking: boolean | null = null;
  let sbDetail = '';

  if (!sbConfigured) {
    sbDetail = `Supabase not configured. URL ${sbUrl ? `(${sbUrl.length} chars)` : 'missing'}, service key ${sbKey ? `(${sbKey.length} chars)` : 'missing'}. Without it, live facts can't persist across users.`;
  } else {
    // Detect the most common misconfig: URL points at the wrong host
    if (!/^https:\/\/[a-z0-9]+\.supabase\.co/i.test(sbUrl!)) {
      sbWorking = false;
      sbDetail = `❌ NEXT_PUBLIC_SUPABASE_URL is "${sbUrl}" — that is NOT a Supabase URL. It must look like https://YOURPROJECT.supabase.co (Supabase → Settings → API → Project URL). Right now it points elsewhere (probably your Vercel app), so every DB call 404s.`;
    } else {
      try {
        const r = await fetch(`${sbUrl}/rest/v1/ground_truth_facts?select=count`, {
          headers: { 'apikey': sbKey!, 'Authorization': `Bearer ${sbKey}` },
        });
        const body = (await r.text()).slice(0, 140);
        if (body.includes('<!DOCTYPE') || body.includes('<html')) {
          sbWorking = false;
          sbDetail = `❌ URL returned an HTML page, not Supabase JSON. NEXT_PUBLIC_SUPABASE_URL is pointing at the wrong server. Set it to https://YOURPROJECT.supabase.co`;
        } else {
          sbWorking = r.ok;
          sbDetail = r.ok ? 'Connected, ground_truth_facts table reachable ✓' : `HTTP ${r.status}: ${body} — run schema_v2_cache.sql + schema_v3_autopipeline.sql`;
        }
      } catch (e) {
        sbWorking = false;
        sbDetail = `Connection failed: ${e instanceof Error ? e.message : 'unknown'}`;
      }
    }
  }
  checks.push({ service: 'Supabase (fact persistence)', configured: sbConfigured, working: sbWorking, detail: sbDetail });

  // ── 3. Anthropic (representative chat) ────────────────────────
  const anthKey = process.env.ANTHROPIC_API_KEY;
  const anthConfigured = isReal(anthKey, 50, 'sk-ant-');
  checks.push({
    service: 'Anthropic (rep AI chat)',
    configured: anthConfigured,
    working: null,
    detail: anthConfigured ? 'Key present (not test-called to save quota)' : `Not configured ${anthKey ? `(${anthKey.length} chars — placeholder?)` : ''}`,
  });

  // ── 4. NewsAPI ────────────────────────────────────────────────
  const newsKey = process.env.NEWS_API_KEY;
  checks.push({
    service: 'NewsAPI (news feed)',
    configured: isReal(newsKey, 20),
    working: null,
    detail: isReal(newsKey, 20) ? 'Key present' : 'Not configured (news feed uses mock data)',
  });

  // ── Summary ───────────────────────────────────────────────────
  const liveDataReady = searchWorking === true;
  const summary = liveDataReady
    ? '✅ Live data pipeline is OPERATIONAL — click "Verify live" on any state to fetch the current CM.'
    : '❌ Live web search is NOT working. Add a free Tavily key (see next_steps) — this is what fetches current CMs.';

  return NextResponse.json({
    summary,
    live_data_ready: liveDataReady,
    persistence_ready: sbWorking === true,
    checks,
    next_steps: [
      liveDataReady ? null : '1. Get a FREE Tavily key at tavily.com (no credit card, 1000 searches/mo). Add as TAVILY_API_KEY in Vercel → Settings → Environment Variables. This powers live CM lookups.',
      sbWorking === true ? null : '2. Fix NEXT_PUBLIC_SUPABASE_URL — it must be https://YOURPROJECT.supabase.co (from Supabase → Settings → API → Project URL). Then run schema_v2_cache.sql + schema_v3_autopipeline.sql in the SQL editor.',
      '3. Redeploy on Vercel after changing any env var (env changes need a fresh build).',
    ].filter(Boolean),
  }, { status: 200 });
}
