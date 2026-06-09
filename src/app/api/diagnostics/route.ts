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
  let compoundDetail = '';

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

    // Test the compound (web search) model specifically
    if (groqWorking) {
      for (const model of ['groq/compound', 'compound-beta']) {
        try {
          const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Who is the current PM of India? One word.' }], max_tokens: 30 }),
          });
          if (r.ok) { compoundDetail = `Web-search model "${model}" works ✓`; break; }
          else compoundDetail = `"${model}" → HTTP ${r.status}`;
        } catch { compoundDetail = 'compound request failed'; }
      }
    }
  }

  checks.push({ service: 'Groq (AI insights)', configured: groqConfigured, working: groqWorking, detail: groqDetail });
  checks.push({ service: 'Groq Compound (LIVE web search)', configured: groqConfigured, working: groqWorking ? compoundDetail.includes('✓') : null, detail: compoundDetail || 'Not tested (Groq auth failed)' });

  // ── 2. Supabase (persistence of verified facts) ───────────────
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const sbConfigured = isReal(sbUrl, 30, 'https://') && isReal(sbKey, 100);
  let sbWorking: boolean | null = null;
  let sbDetail = '';

  if (!sbConfigured) {
    sbDetail = `Supabase not configured. URL ${sbUrl ? `(${sbUrl.length} chars)` : 'missing'}, service key ${sbKey ? `(${sbKey.length} chars)` : 'missing'}. Without it, live facts can't persist across users.`;
  } else {
    try {
      const r = await fetch(`${sbUrl}/rest/v1/ground_truth_facts?select=count`, {
        headers: { 'apikey': sbKey!, 'Authorization': `Bearer ${sbKey}` },
      });
      sbWorking = r.ok;
      sbDetail = r.ok ? 'Connected, ground_truth_facts table reachable ✓' : `HTTP ${r.status}: ${(await r.text()).slice(0, 120)} — did you run schema_v2 + v3 SQL?`;
    } catch (e) {
      sbWorking = false;
      sbDetail = `Connection failed: ${e instanceof Error ? e.message : 'unknown'}`;
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
  const liveDataReady = groqWorking === true && compoundDetail.includes('✓');
  const summary = liveDataReady
    ? '✅ Live data pipeline is OPERATIONAL — click "Verify live" on any state.'
    : '❌ Live data pipeline is NOT working. Fix the Groq key (and ideally Supabase) below.';

  return NextResponse.json({
    summary,
    live_data_ready: liveDataReady,
    persistence_ready: sbWorking === true,
    checks,
    next_steps: liveDataReady ? [] : [
      groqConfigured ? null : '1. Get a FREE Groq key at console.groq.com (starts with gsk_), add as GROQ_API_KEY in Vercel → Settings → Environment Variables',
      sbConfigured ? null : '2. (Optional) Create a Supabase project, run supabase/schema_v2_cache.sql + schema_v3_autopipeline.sql, add the 3 Supabase env vars — needed to persist live facts across users',
      '3. Redeploy on Vercel after adding env vars',
    ].filter(Boolean),
  }, { status: 200 });
}
