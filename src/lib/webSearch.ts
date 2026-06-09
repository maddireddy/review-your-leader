/**
 * ReviewYourLeader — Web Search Layer
 *
 * Reliable live-internet search, decoupled from any single LLM.
 * Provider priority:
 *   1. Tavily      — purpose-built for LLM live search (free tier, no card)
 *   2. Serper      — Google results via API (free tier)
 *   3. Groq compound — agentic web search (if available on the account)
 *
 * Returns clean text snippets + source URLs that downstream models reason over.
 */

export interface WebSearchResult {
  provider: string;
  query: string;
  snippets: string[];
  sources: string[];
  ok: boolean;
  error?: string;
}

// ─── Tavily (primary) ───────────────────────────────────────────
async function tavilySearch(query: string): Promise<WebSearchResult | null> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: key,
        query,
        search_depth: 'basic',
        max_results: 6,
        include_answer: true,
      }),
    });
    if (!r.ok) return { provider: 'tavily', query, snippets: [], sources: [], ok: false, error: `HTTP ${r.status}` };
    const data = await r.json();
    const snippets: string[] = [];
    if (data.answer) snippets.push(data.answer);
    const sources: string[] = [];
    for (const res of data.results ?? []) {
      if (res.content) snippets.push(res.content);
      if (res.url) sources.push(res.url);
    }
    return { provider: 'tavily', query, snippets, sources, ok: snippets.length > 0 };
  } catch (e) {
    return { provider: 'tavily', query, snippets: [], sources: [], ok: false, error: e instanceof Error ? e.message : 'error' };
  }
}

// ─── Serper (Google, fallback) ──────────────────────────────────
async function serperSearch(query: string): Promise<WebSearchResult | null> {
  const key = process.env.SERPER_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num: 6 }),
    });
    if (!r.ok) return { provider: 'serper', query, snippets: [], sources: [], ok: false, error: `HTTP ${r.status}` };
    const data = await r.json();
    const snippets: string[] = [];
    const sources: string[] = [];
    if (data.answerBox?.answer) snippets.push(data.answerBox.answer);
    if (data.answerBox?.snippet) snippets.push(data.answerBox.snippet);
    if (data.knowledgeGraph?.description) snippets.push(data.knowledgeGraph.description);
    for (const res of data.organic ?? []) {
      if (res.snippet) snippets.push(res.snippet);
      if (res.link) sources.push(res.link);
    }
    return { provider: 'serper', query, snippets, sources, ok: snippets.length > 0 };
  } catch (e) {
    return { provider: 'serper', query, snippets: [], sources: [], ok: false, error: e instanceof Error ? e.message : 'error' };
  }
}

// ─── Groq compound (agentic, last resort) ───────────────────────
async function groqCompoundSearch(query: string): Promise<WebSearchResult | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const models = ['groq/compound', 'groq/compound-mini'];
  for (const model of models) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: query }],
          max_tokens: 600,
          temperature: 0.1,
        }),
      });
      if (!r.ok) continue;
      const data = await r.json();
      const content: string = data.choices?.[0]?.message?.content || '';
      const sources: string[] = (content.match(/https?:\/\/[^\s)"']+/g) || []).map(u => u.replace(/[.,;]+$/, ''));
      const exec = data.choices?.[0]?.message?.executed_tools;
      if (Array.isArray(exec)) {
        for (const tool of exec) {
          for (const res of tool.search_results?.results ?? []) {
            if (res.url) sources.push(res.url);
          }
        }
      }
      if (content) return { provider: model, query, snippets: [content], sources, ok: true };
    } catch { /* try next */ }
  }
  return { provider: 'groq-compound', query, snippets: [], sources: [], ok: false, error: 'compound models unavailable' };
}

// ─── Public: search with automatic provider fallback ────────────
export async function webSearch(query: string): Promise<WebSearchResult> {
  const providers = [tavilySearch, serperSearch, groqCompoundSearch];
  let lastError = 'no search provider configured';

  for (const provider of providers) {
    const result = await provider(query);
    if (result === null) continue;       // provider not configured
    if (result.ok) return result;         // success
    lastError = `${result.provider}: ${result.error || 'no results'}`;
  }

  return { provider: 'none', query, snippets: [], sources: [], ok: false, error: lastError };
}

export function anyWebSearchConfigured(): boolean {
  return !!(process.env.TAVILY_API_KEY || process.env.SERPER_API_KEY || process.env.GROQ_API_KEY);
}
