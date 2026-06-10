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
import { webSearch } from './webSearch';
import { withRetry } from './retry';

let _groq: Groq | null = null;
function groq(): Groq {
  if (!_groq) {
    if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set');
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

// Reasoning/validation models (web search is handled by webSearch layer)
const MODELS = {
  validator1: 'llama-3.3-70b-versatile',
  validator2: 'llama-3.1-8b-instant',
} as const;

export interface LiveFact {
  key: string;                    // e.g. 'chief_minister'
  value: string;                  // e.g. 'Siddaramaiah'
  party?: string;                 // e.g. 'Indian National Congress'
  party_short?: string;           // e.g. 'INC'
  since?: string;                 // ISO date if known
  sources: string[];             // URLs the web-search model cited
  confidence: number;             // 0–1
  reasoning: string;
  fetched_at: string;
}

// ─── 1. FETCH current CM via live web search ────────────────────
export async function fetchCurrentCM(stateName: string): Promise<LiveFact> {
  const fetched_at = new Date().toISOString();

  // Step 1: live web search (Tavily → Serper → Groq compound fallback)
  const search = await webSearch(
    `current Chief Minister of ${stateName} India ${new Date().getFullYear()} latest`
  );

  if (!search.ok || search.snippets.length === 0) {
    return {
      key: 'chief_minister', value: '', sources: [], confidence: 0,
      reasoning: `Web search failed (${search.provider}): ${search.error || 'no results'}. Add a TAVILY_API_KEY (free at tavily.com) for reliable live search.`,
      fetched_at,
    };
  }

  const webContext = search.snippets.join('\n\n').slice(0, 4000);

  // Step 2: extract structured fact from the search results
  const extracted = await extractCMFact(stateName, webContext);

  return {
    key: 'chief_minister',
    value: extracted.name,
    party: extracted.party,
    party_short: extracted.party_short,
    since: extracted.since,
    sources: [...new Set(search.sources)].slice(0, 5),
    confidence: extracted.name ? 0.7 : 0,  // base; bumped by validation
    reasoning: webContext.slice(0, 600),    // pass web context to validators
    fetched_at,
  };
}

// Canonical Indian political parties — extraction is normalized to these
const CANONICAL_PARTIES: { match: RegExp; full: string; short: string }[] = [
  { match: /bharatiya janata|\bbjp\b/i, full: 'Bharatiya Janata Party', short: 'BJP' },
  { match: /indian national congress|\binc\b|\bcongress\b/i, full: 'Indian National Congress', short: 'INC' },
  { match: /dravida munnetra kazhagam|\bdmk\b/i, full: 'Dravida Munnetra Kazhagam', short: 'DMK' },
  { match: /all india anna dravida|\baiadmk\b/i, full: 'All India Anna Dravida Munnetra Kazhagam', short: 'AIADMK' },
  { match: /telugu desam|\btdp\b/i, full: 'Telugu Desam Party', short: 'TDP' },
  { match: /yuvajana sramika|\bysrcp\b|ysr congress/i, full: 'YSR Congress Party', short: 'YSRCP' },
  { match: /bharat rashtra|telangana rashtra|\bbrs\b|\btrs\b/i, full: 'Bharat Rashtra Samithi', short: 'BRS' },
  { match: /trinamool|\btmc\b|aitc/i, full: 'All India Trinamool Congress', short: 'TMC' },
  { match: /aam aadmi|\baap\b/i, full: 'Aam Aadmi Party', short: 'AAP' },
  { match: /samajwadi|\bsp\b/i, full: 'Samajwadi Party', short: 'SP' },
  { match: /bahujan samaj|\bbsp\b/i, full: 'Bahujan Samaj Party', short: 'BSP' },
  { match: /janata dal \(united\)|\bjdu\b|jd\(u\)/i, full: 'Janata Dal (United)', short: 'JDU' },
  { match: /rashtriya janata|\brjd\b/i, full: 'Rashtriya Janata Dal', short: 'RJD' },
  { match: /communist party.*marxist|cpi\(m\)|\bcpim\b/i, full: 'Communist Party of India (Marxist)', short: 'CPI(M)' },
  { match: /nationalist congress|\bncp\b/i, full: 'Nationalist Congress Party', short: 'NCP' },
  { match: /shiv sena/i, full: 'Shiv Sena', short: 'SS' },
  { match: /national conference|\bjknc\b/i, full: 'Jammu & Kashmir National Conference', short: 'NC' },
  { match: /biju janata|\bbjd\b/i, full: 'Biju Janata Dal', short: 'BJD' },
  { match: /jharkhand mukti|\bjmm\b/i, full: 'Jharkhand Mukti Morcha', short: 'JMM' },
  { match: /national people'?s party|\bnpp\b/i, full: 'National People\'s Party', short: 'NPP' },
  { match: /sikkim krantikari|\bskm\b/i, full: 'Sikkim Krantikari Morcha', short: 'SKM' },
  { match: /tamilaga vettri kazhagam|\btvk\b/i, full: 'Tamilaga Vettri Kazhagam', short: 'TVK' },
];

export function normalizeParty(raw: string | undefined): { full?: string; short?: string } {
  if (!raw) return {};
  for (const p of CANONICAL_PARTIES) {
    if (p.match.test(raw)) return { full: p.full, short: p.short };
  }
  // Unknown/garbage party text (e.g. "Non-Dravidian party") — reject it
  return {};
}

// ─── 2. EXTRACT structured fact from prose ──────────────────────
async function extractCMFact(stateName: string, prose: string): Promise<{
  name: string; party?: string; party_short?: string; since?: string; reasoning: string;
}> {
  try {
    const resp = await withRetry(() => groq().chat.completions.create({
      model: MODELS.validator1,
      messages: [
        {
          role: 'system',
          content: `You extract verified facts from web search results about Indian politics. Respond ONLY with valid JSON. Rules: The "name" must be a real person's full name (e.g. "M. K. Stalin"). The "party" must be an OFFICIAL party name or its abbreviation (e.g. "DMK", "Bharatiya Janata Party") — NEVER a description like "regional party" or "Dravidian party". If you are not certain of the exact party, leave it empty.`,
        },
        {
          role: 'user',
          content: `From these web search results about the Chief Minister of ${stateName}, India, extract the CURRENT Chief Minister.\n\nSearch results:\n"""${prose}"""\n\nReturn JSON: {"name": "person's full name", "party": "official party name or abbreviation only", "since": "YYYY-MM-DD or empty", "reasoning": "one sentence citing what the results say"}`,
        },
      ],
      temperature: 0,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    }));
    const json = JSON.parse(resp.choices[0]?.message?.content || '{}');
    const name = (json.name || '').trim();
    // Reject obviously-bad names
    const looksLikeName = /^[A-Z]/.test(name) && name.length >= 3 && name.length <= 60 && !/party|unknown|n\/?a/i.test(name);
    const partyNorm = normalizeParty((json.party || '').trim());

    return {
      name: looksLikeName ? name : '',
      party: partyNorm.full,           // only canonical party names — no garbage
      party_short: partyNorm.short,
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
      const resp = await withRetry(() => groq().chat.completions.create({
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
      }));
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

// ─── ENRICHMENT — recent developments, heritage, infrastructure ─
// Same web-search → reason pattern, for the "one-stop-shop" content.
export interface StateEnrichment {
  recent_developments: string[];   // latest govt initiatives / news
  infrastructure: string[];        // major projects
  heritage: string[];              // cultural/heritage highlights
  sources: string[];
  fetched_at: string;
}

export async function fetchStateEnrichment(stateName: string): Promise<StateEnrichment> {
  const fetched_at = new Date().toISOString();
  const search = await webSearch(
    `${stateName} India ${new Date().getFullYear()} latest government initiatives infrastructure projects heritage tourism developments`
  );

  const empty: StateEnrichment = { recent_developments: [], infrastructure: [], heritage: [], sources: [], fetched_at };
  if (!search.ok || search.snippets.length === 0) return empty;

  try {
    const resp = await withRetry(() => groq().chat.completions.create({
      model: MODELS.validator1,
      messages: [
        {
          role: 'system',
          content: 'You summarise factual, neutral, civic information about Indian states. Respond ONLY with JSON. Each array item is a short factual phrase (max 15 words). No opinions, no fabrication.',
        },
        {
          role: 'user',
          content: `From these web results about ${stateName}, extract up-to-date civic facts.\n\n"""${search.snippets.join('\n\n').slice(0, 4000)}"""\n\nReturn JSON: {"recent_developments": ["..."], "infrastructure": ["..."], "heritage": ["..."]} — up to 4 items each, only if supported by the results.`,
        },
      ],
      temperature: 0.1,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    }));
    const json = JSON.parse(resp.choices[0]?.message?.content || '{}');
    const arr = (x: unknown): string[] => Array.isArray(x) ? x.filter(s => typeof s === 'string').slice(0, 4) : [];
    return {
      recent_developments: arr(json.recent_developments),
      infrastructure: arr(json.infrastructure),
      heritage: arr(json.heritage),
      sources: [...new Set(search.sources)].slice(0, 5),
      fetched_at,
    };
  } catch {
    return empty;
  }
}
