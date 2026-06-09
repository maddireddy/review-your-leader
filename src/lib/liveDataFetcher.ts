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
    since: extracted.since,
    sources: [...new Set(search.sources)].slice(0, 5),
    confidence: extracted.name ? 0.7 : 0,  // base; bumped by validation
    reasoning: webContext.slice(0, 600),    // pass web context to validators
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
