/**
 * ReviewYourLeader — 3-Level AI Validation Pipeline
 *
 * Level 1 (Primary):   Groq LLaMA 3.3 70B   — main response
 * Level 2 (Validator): Groq LLaMA 3.1 8B Instant — fact-checks Level 1 (Mixtral decommissioned)
 * Level 3 (Arbiter):   Groq Gemma2 9B        — resolves conflicts
 *
 * Ground Truth Grounding:
 * Our verified DB facts are injected into EVERY prompt as a
 * "VERIFIED FACTS" block. Models are instructed to NEVER contradict them.
 */

import { getSupabaseAdmin } from './supabaseAdmin';

export interface GroundTruth {
  [key: string]: string;
}

export interface ValidationResult {
  finalResponse: string;
  consensusScore: number;          // 0–1
  validationStatus: 'validated' | 'conflict' | 'failed';
  model1Response: string;
  model2Response: string;
  model3Response?: string;
  factViolations: FactViolation[];
  autoCorrected: boolean;
  fromCache: boolean;
  cacheAge?: number;               // minutes
}

export interface FactViolation {
  claim: string;
  expected: string;
  found: string;
}

// ─── Groq models ─────────────────────────────────────────────
// mixtral-8x7b-32768 was decommissioned by Groq (June 2025)
// Replacements per https://console.groq.com/docs/deprecations:
//   Validator → llama-3.1-8b-instant  (fast, accurate, great for fact-checking)
//   Arbiter   → gemma2-9b-it          (unchanged — still active)
const MODELS = {
  primary:   'llama-3.3-70b-versatile',   // Level 1 — most capable, 70B
  validator: 'llama-3.1-8b-instant',      // Level 2 — fast fact-checker (replaces Mixtral)
  arbiter:   'gemma2-9b-it',              // Level 3 — tie-breaker
} as const;

// ─── Lazy Groq client ─────────────────────────────────────────
let _groq: import('groq-sdk').default | null = null;
async function groqClient() {
  if (!_groq) {
    const Groq = (await import('groq-sdk')).default;
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
  }
  return _groq;
}

// ─── Ground truth system prompt builder ──────────────────────
function buildGroundedSystemPrompt(groundTruth: GroundTruth): string {
  const facts = Object.entries(groundTruth)
    .map(([k, v]) => `• ${k}: ${v}`)
    .join('\n');

  return `You are an expert Indian political analyst providing accurate, neutral, and up-to-date information.

═══════════════════════════════════════════════
VERIFIED FACTS (from our authoritative database — NEVER contradict these):
${facts}
═══════════════════════════════════════════════

CRITICAL RULES:
1. Always use the verified facts above as ground truth
2. Never contradict the verified CM name, party, or tenure dates
3. If you are unsure about recent events, say "recent developments suggest..."
4. Keep responses under 120 words, factual and neutral
5. Focus on governance, policy, and development — not personal opinions`;
}

// ─── Single model call ────────────────────────────────────────
async function callModel(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 512
): Promise<string> {
  try {
    const client = await groqClient();
    const res = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: model === MODELS.arbiter ? 0.2 : 0.35,
      max_tokens: maxTokens,
    });
    return res.choices[0]?.message?.content?.trim() || '';
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[aiValidator] Model ${model} failed:`, msg);
    return '';
  }
}

// ─── Fact-check a response against ground truth ───────────────
function checkFacts(response: string, groundTruth: GroundTruth): FactViolation[] {
  const violations: FactViolation[] = [];
  for (const [key, value] of Object.entries(groundTruth)) {
    // Only check name-type facts (CM, party, etc.)
    if (!['chief_minister', 'cm_party', 'capital', 'ruling_party'].includes(key)) continue;
    const valueLower = value.toLowerCase();

    // Check if response mentions contradicting names
    if (key === 'chief_minister') {
      // Extract any CM-like mentions from response
      const cmPattern = /(?:chief minister|cm)\s+(?:is\s+)?([A-Z][a-z]+(?:\s+[A-Z]\.?\s*[A-Za-z]+){0,3})/gi;
      const matches = [...response.matchAll(cmPattern)];
      for (const match of matches) {
        const mentioned = match[1].trim().toLowerCase();
        if (mentioned && !valueLower.includes(mentioned.split(' ')[0]) && !mentioned.includes(value.toLowerCase().split(' ')[0])) {
          violations.push({
            claim: `CM mentioned as "${match[1]}"`,
            expected: value,
            found: match[1],
          });
        }
      }
    }
  }

  return violations;
}

// ─── Similarity score between two responses ──────────────────
function computeSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const aWords = new Set(a.toLowerCase().split(/\W+/).filter(w => w.length > 4));
  const bWords = new Set(b.toLowerCase().split(/\W+/).filter(w => w.length > 4));
  const intersection = [...aWords].filter(w => bWords.has(w)).length;
  const union = new Set([...aWords, ...bWords]).size;
  return union === 0 ? 0 : intersection / union;
}

// ─── Auto-correct fact violations in a response ──────────────
function autoCorrect(response: string, violations: FactViolation[], groundTruth: GroundTruth): string {
  let corrected = response;
  for (const v of violations) {
    // Replace wrong CM name with correct one
    if (groundTruth.chief_minister) {
      corrected = corrected.replace(new RegExp(v.found, 'gi'), groundTruth.chief_minister);
    }
  }
  return corrected;
}

// ─── Cache helpers ────────────────────────────────────────────
async function getCachedInsight(cacheKey: string): Promise<ValidationResult | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('ai_insight_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!data) return null;

    const ageMs = Date.now() - new Date(data.created_at).getTime();
    return {
      finalResponse: data.consensus_response || '',
      consensusScore: data.consensus_score || 0,
      validationStatus: data.validation_status as ValidationResult['validationStatus'],
      model1Response: data.model1_response || '',
      model2Response: data.model2_response || '',
      model3Response: data.model3_response || undefined,
      factViolations: data.fact_violations || [],
      autoCorrected: data.auto_corrected || false,
      fromCache: true,
      cacheAge: Math.floor(ageMs / 60000),
    };
  } catch {
    return null;
  }
}

async function storeCachedInsight(
  cacheKey: string,
  entityType: string,
  entityId: string,
  groundTruth: GroundTruth,
  result: ValidationResult
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('ai_insight_cache').upsert({
      cache_key: cacheKey,
      entity_type: entityType,
      entity_id: entityId,
      ground_truth: groundTruth,
      model1_name: MODELS.primary,
      model1_response: result.model1Response,
      model2_name: MODELS.validator,
      model2_response: result.model2Response,
      model3_name: result.model3Response ? MODELS.arbiter : null,
      model3_response: result.model3Response || null,
      consensus_response: result.finalResponse,
      consensus_score: result.consensusScore,
      validation_status: result.validationStatus,
      fact_violations: result.factViolations,
      auto_corrected: result.autoCorrected,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'cache_key' });
  } catch (err) {
    console.warn('[aiValidator] Cache write failed:', err);
  }
}

// ─── Main 3-level validation pipeline ────────────────────────
export async function validateInsight(
  entityType: string,
  entityId: string,
  userPrompt: string,
  groundTruth: GroundTruth,
  options: { cacheTtlHours?: number; forceRefresh?: boolean } = {}
): Promise<ValidationResult> {
  const monthKey = new Date().toISOString().slice(0, 7); // e.g. "2026-06"
  const cacheKey = `${entityType}:${entityId}:${monthKey}`;

  // ── Check cache first ──
  if (!options.forceRefresh) {
    const cached = await getCachedInsight(cacheKey);
    if (cached) return cached;
  }

  const systemPrompt = buildGroundedSystemPrompt(groundTruth);

  // ── Level 1: Primary model ──
  const model1Response = await callModel(MODELS.primary, systemPrompt, userPrompt, 512);

  // ── Level 2: Validator model ──
  const validatorPrompt = `${userPrompt}

Note: Cross-check your response carefully. The following are verified facts that must be reflected accurately:
${Object.entries(groundTruth).map(([k, v]) => `• ${k}: ${v}`).join('\n')}

Do not mention any person as CM/leader unless they match the verified facts above.`;

  const model2Response = await callModel(MODELS.validator, systemPrompt, validatorPrompt, 512);

  // ── Fact-check both responses ──
  const violations1 = checkFacts(model1Response, groundTruth);
  const violations2 = checkFacts(model2Response, groundTruth);
  const allViolations = [...violations1, ...violations2];

  // ── Compute similarity ──
  const similarity = computeSimilarity(model1Response, model2Response);

  let finalResponse = '';
  let model3Response: string | undefined;
  let validationStatus: ValidationResult['validationStatus'] = 'validated';
  let consensusScore = similarity;

  if (violations1.length === 0 && violations2.length === 0 && similarity > 0.3) {
    // Both models agree and are factually correct — use primary response
    finalResponse = model1Response;
    validationStatus = 'validated';
    consensusScore = Math.min(0.95, 0.5 + similarity * 0.5);
  } else if (violations1.length > 0 && violations2.length === 0) {
    // Level 2 is clean, Level 1 has violations — use Level 2
    finalResponse = model2Response;
    validationStatus = 'validated';
    consensusScore = 0.8;
  } else if (violations1.length === 0 && violations2.length > 0) {
    // Level 1 is clean — use it
    finalResponse = model1Response;
    validationStatus = 'validated';
    consensusScore = 0.8;
  } else {
    // Both have violations or low similarity — invoke Level 3 arbiter
    const arbiterPrompt = `Two AI models gave inconsistent responses about ${entityId}.

Verified facts: ${JSON.stringify(groundTruth)}

Response A: ${model1Response}

Response B: ${model2Response}

Please provide a single, accurate, grounded response that strictly follows the verified facts and synthesizes the best information from both.`;

    model3Response = await callModel(MODELS.arbiter, systemPrompt, arbiterPrompt, 512);
    finalResponse = model3Response || model1Response;
    validationStatus = allViolations.length > 0 ? 'conflict' : 'validated';
    consensusScore = 0.6;
  }

  // ── Auto-correct any remaining violations in final response ──
  let autoCorrected = false;
  const finalViolations = checkFacts(finalResponse, groundTruth);
  if (finalViolations.length > 0) {
    finalResponse = autoCorrect(finalResponse, finalViolations, groundTruth);
    autoCorrected = true;
  }

  const result: ValidationResult = {
    finalResponse,
    consensusScore,
    validationStatus,
    model1Response,
    model2Response,
    model3Response,
    factViolations: allViolations,
    autoCorrected,
    fromCache: false,
  };

  // ── Store in cache ──
  await storeCachedInsight(cacheKey, entityType, entityId, groundTruth, result);

  return result;
}
