/**
 * ReviewYourLeader — Live Data Fetcher
 *
 * Autonomous fact acquisition using Groq's `compound` model, which has
 * BUILT-IN LIVE WEB SEARCH. This is what lets the system learn that a CM
 * changed last week without any human input.
 *
 * Pipeline per fact:
 *   1. FETCH    — groq/compound (web search) pulls current fact + sources
 *   2. EXTRACT  — structured JSON {value, party, since, sources, confidence}
 *   3. VALIDATE — 2 independent models cross-check the extracted claim
 *   4. SCORE    — consensus + source-count → final confidence
 *   5. COMMIT   — only persisted if confidence ≥ threshold (see pipeline)
 */

import Groq from 'groq-sdk';

let _groq: Groq | null = null;
function groq(): Groq {
  if (!_groq) {
    if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set');
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

// Models — compound has web search; the others are pure validators
const MODELS = {
  websearch: 'groq/compound',          // agentic web search (live internet)
  websearchFast: 'groq/compound-mini', // faster, single search
  validator1: 'llama-3.3-70b-versatile',
  validator2: 'llama-3.1-8b-instant',
} as const;

export interface LiveFact {
  key: string;                    // e.g. 'chief_minister'
  value: string;                  // e.g. 'Siddaramaiah'
  party?: string;                 // e.g. 'Indian National Congress'
  since?: string;                 // ISO date if known
  sources: string[];             // URLs the web-search model cited
  confidence: number;             // 0–1
  reasoning: string;
  fetched_at: string;
}

// ─── 1. FETCH current CM via live web search ────────────────────
export async function fetchCurrentCM(stateName: string): Promise<LiveFact> {
  const fetched_at = new Date().toISOString();

  // Step 1: web-search model pulls the live fact
  let raw = '';
  let sources: string[] = [];
  try {
    const resp = await groq().chat.completions.create({
      model: MODELS.websearch,
      messages: [
        {
          role: 'system',
          content: `You are a precise political-data researcher. Use web search to find the CURRENT, most up-to-date answer. Today's date matters — always prefer the most recent verified information. Cite your sources.`,
        },
        {
          role: 'user',
          content: `Who is the CURRENT Chief Minister of ${stateName}, India, as of today? Search the web for the latest information — there may have been a recent election or change. Provide: (1) full name, (2) their political party, (3) the date they took office if known. Be precise and cite sources.`,
        },
      ],
      temperature: 0.1,
      max_tokens: 800,
    });
    raw = resp.choices[0]?.message?.content || '';
    // Groq compound returns executed tool info; extract any cited URLs
    sources = extractUrls(raw);
    // Some SDK versions expose executed_tools with search results
    const exec = (resp.choices[0]?.message as { executed_tools?: { search_results?: { results?: { url: string }[] } }[] })?.executed_tools;
    if (exec) {
      for (const tool of exec) {
        for (const r of tool.search_results?.results ?? []) {
          if (r.url) sources.push(r.url);
        }
      }
    }
  } catch (err) {
    return {
      key: 'chief_minister', value: '', sources: [], confidence: 0,
      reasoning: `Web search failed: ${err instanceof Error ? err.message : 'unknown'}`,
      fetched_at,
    };
  }

  // Step 2: extract structured fact from the web-search prose
  const extracted = await extractCMFact(stateName, raw);

  return {
    key: 'chief_minister',
    value: extracted.name,
    party: extracted.party,
    since: extracted.since,
    sources: [...new Set(sources)].slice(0, 5),
    confidence: extracted.name ? 0.7 : 0,  // base; bumped by validation
    reasoning: extracted.reasoning,
    fetched_at,
  };
}

// ─── 2. EXTRACT structured fact from prose ──────────────────────
async function extractCMFact(stateName: string, prose: string): Promise<{
  name: string; party?: string; since?: string; reasoning: string;
}> {
  try {
    const resp = await groq().chat.completions.create({
      model: MODELS.validator1,
      messages: [
        {
          role: 'system',
          content: 'Extract structured data. Respond ONLY with valid JSON, no markdown.',
        },
        {
          role: 'user',
          content: `From this research about the Chief Minister of ${stateName}, extract the CURRENT CM.\n\nResearch:\n"""${prose}"""\n\nReturn JSON: {"name": "full name", "party": "full party name", "since": "YYYY-MM-DD or empty", "reasoning": "one sentence on certainty"}`,
        },
      ],
      temperature: 0,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });
    const json = JSON.parse(resp.choices[0]?.message?.content || '{}');
    return {
      name: (json.name || '').trim(),
      party: (json.party || '').trim() || undefined,
      since: (json.since || '').trim() || undefined,
      reasoning: json.reasoning || '',
    };
  } catch {
    return { name: '', reasoning: 'extraction failed' };
  }
}

// ─── 3. VALIDATE — two models independently confirm ─────────────
export async function validateFact(
  stateName: string,
  factKey: string,
  candidateValue: string,
  candidateParty: string | undefined,
  webContext: string
): Promise<{ agree: boolean; confidence: number; notes: string }> {
  const question = factKey === 'chief_minister'
    ? `Is "${candidateValue}"${candidateParty ? ` (${candidateParty})` : ''} the current Chief Minister of ${stateName}, India?`
    : `Is "${candidateValue}" correct for ${factKey} of ${stateName}?`;

  const validators = [MODELS.validator1, MODELS.validator2];
  const verdicts: { yes: boolean; conf: number }[] = [];

  for (const model of validators) {
    try {
      const resp = await groq().chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You verify political facts. Respond ONLY with JSON: {"answer": "yes"|"no"|"unsure", "confidence": 0.0-1.0}',
          },
          {
            role: 'user',
            content: `${question}\n\nContext from recent web search:\n"""${webContext.slice(0, 1500)}"""\n\nBased on the context and your knowledge, answer.`,
          },
        ],
        temperature: 0,
        max_tokens: 80,
        response_format: { type: 'json_object' },
      });
      const json = JSON.parse(resp.choices[0]?.message?.content || '{}');
      verdicts.push({
        yes: json.answer === 'yes',
        conf: typeof json.confidence === 'number' ? json.confidence : 0.5,
      });
    } catch {
      verdicts.push({ yes: false, conf: 0 });
    }
  }

  const agreeCount = verdicts.filter(v => v.yes).length;
  const avgConf = verdicts.reduce((s, v) => s + v.conf, 0) / verdicts.length;
  const agree = agreeCount === validators.length; // unanimous

  return {
    agree,
    confidence: agree ? avgConf : avgConf * 0.4,
    notes: `${agreeCount}/${validators.length} validators agree (avg conf ${(avgConf * 100).toFixed(0)}%)`,
  };
}

// ─── helper: extract URLs from text ─────────────────────────────
function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s)"']+/g) || [];
  return matches.map(u => u.replace(/[.,;]+$/, ''));
}
