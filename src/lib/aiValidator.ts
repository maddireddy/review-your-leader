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
import { withRetry } from './retry';

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
  const cm = groundTruth.chief_minister || '';
  const party = groundTruth.cm_party || groundTruth.ruling_party || '';
  const state = groundTruth.state_name || '';

  const facts = Object.entries(groundTruth)
    .map(([k, v]) => `• ${k}: ${v}`)
    .join('\n');

  return `You are an expert Indian political analyst providing accurate, neutral, and up-to-date information.

═══════════════════════════════════════════════
⚠ MANDATORY VERIFIED FACTS — DATABASE AUTHORITATIVE — OVERRIDE YOUR TRAINING DATA:
${facts}
═══════════════════════════════════════════════

⛔ ABSOLUTE PROHIBITION: Do NOT mention any previous Chief Ministers of ${state}.
   The CURRENT Chief Minister is ${cm} (${party}). This is final and non-negotiable.
   Your training data may be outdated. Trust ONLY the verified facts above.

CRITICAL RULES:
1. ONLY refer to "${cm}" as Chief Minister — NEVER use any other person's name as CM
2. If your training data contradicts the verified CM name, your training data is WRONG — ignore it
3. Build your entire response around ${cm} and ${party}'s governance
4. Keep responses under 120 words, factual and neutral
5. Never mention the name of any former Chief Minister of ${state}`;
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
    const res = await withRetry(() => client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: model === MODELS.arbiter ? 0.2 : 0.35,
      max_tokens: maxTokens,
    }));
    return res.choices[0]?.message?.content?.trim() || '';
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[aiValidator] Model ${model} failed:`, msg);
    return '';
  }
}

// ─── Fact-check a response against ground truth ───────────────
// Detects ANY occurrence of a wrong person being called CM, or any
// known former CM name appearing in a CM context.
function checkFacts(response: string, groundTruth: GroundTruth): FactViolation[] {
  const violations: FactViolation[] = [];
  const correctCM = groundTruth.chief_minister || '';
  if (!correctCM) return violations;

  const responseLower = response.toLowerCase();
  const correctLower = correctCM.toLowerCase();

  // Extract all significant words from the correct CM name (length > 2, not initials)
  const correctNameWords = correctLower.split(/\s+/).filter(w => w.replace(/\./g, '').length > 2);

  // Pattern 1: "Chief Minister <Name>" or "CM <Name>" — any name that isn't the correct CM
  const cmPattern = /(?:chief\s+minister|(?<!\w)cm(?!\w))\s+(?:is\s+)?([A-Z][a-zA-Z.]+(?:\s+[A-Z][a-zA-Z.]+){0,4})/gi;
  for (const match of response.matchAll(cmPattern)) {
    const mentioned = match[1].trim();
    const mentionedLower = mentioned.toLowerCase();
    const isCorrect = correctNameWords.some(w => mentionedLower.includes(w)) ||
                      mentionedLower.split(/\s+/).some(w => correctLower.includes(w));
    if (!isCorrect) {
      violations.push({ claim: `CM named as "${mentioned}"`, expected: correctCM, found: mentioned });
    }
  }

  // Pattern 2: Any proper name appearing alongside "chief minister" in a 10-word window
  const sentences = response.split(/[.!?]/);
  for (const sentence of sentences) {
    if (!sentence.toLowerCase().includes('chief minister') && !sentence.toLowerCase().includes(' cm ')) continue;
    // Look for capitalized names in this sentence that aren't the correct CM
    const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-zA-Z.]*){1,3})\b/g;
    for (const match of sentence.matchAll(namePattern)) {
      const cand = match[1].toLowerCase();
      const isCorrect = correctNameWords.some(w => cand.includes(w));
      // Skip common non-person words
      const skipWords = ['chief minister', 'prime minister', 'india', 'state', 'government',
        'party', 'development', 'initiative', 'tamil', 'andhra', 'karnataka', 'kerala'];
      if (!isCorrect && !skipWords.some(sw => cand.includes(sw)) && cand.split(' ').length >= 2) {
        violations.push({ claim: `Name "${match[1]}" near CM mention`, expected: correctCM, found: match[1] });
      }
    }
  }

  // Pattern 3: Direct name check — if any word from a known-wrong CM name appears
  // Detect by checking if the response contains the correct CM name at all
  const containsCorrectName = correctNameWords.length > 0 &&
    correctNameWords.some(w => responseLower.includes(w));

  if (!containsCorrectName && response.trim().length > 30) {
    violations.push({
      claim: 'Response does not mention the correct CM',
      expected: correctCM,
      found: '(missing)',
    });
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
// Comprehensive rewrite: strips every wrong name and rewrites CM references
function autoCorrect(response: string, violations: FactViolation[], groundTruth: GroundTruth): string {
  const correctCM = groundTruth.chief_minister;
  if (!correctCM) return response;

  let corrected = response;

  // Collect all wrong names found
  const wrongNames = [...new Set(
    violations
      .map(v => v.found)
      .filter(f => f !== '(missing)' && f.length > 2)
  )];

  // Replace each wrong name occurrence with the correct CM name
  for (const wrong of wrongNames) {
    // Escape regex special chars
    const escaped = wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    corrected = corrected.replace(new RegExp(escaped, 'gi'), correctCM);
  }

  // If the response still doesn't contain the correct CM name after substitution,
  // prepend a corrective sentence to anchor the response
  const correctLower = correctCM.toLowerCase();
  const correctedLower = corrected.toLowerCase();
  const nameWords = correctLower.split(/\s+/).filter(w => w.replace(/\./g, '').length > 2);
  const stillMissing = nameWords.length > 0 && !nameWords.some(w => correctedLower.includes(w));

  if (stillMissing) {
    const party = groundTruth.cm_party || groundTruth.ruling_party || '';
    corrected = `${correctCM} (${party}) serves as the current Chief Minister. ` + corrected;
  }

  return corrected;
}

// ─── Cache helpers ────────────────────────────────────────────
async function getCachedInsight(
  cacheKey: string,
  groundTruth: GroundTruth
): Promise<ValidationResult | null> {
  try {
    const supabase = getSupabaseAdmin();

    // Also scan for any older cache entries for this entity (any key prefix)
    // and bust them if the CM name in the cached response contradicts the live CM.
    const entityParts = cacheKey.split(':');
    const entityType = entityParts[0];
    const entityId = entityParts[1];

    const { data } = await supabase
      .from('ai_insight_cache')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;

    // Stale-content guard: if the cached response mentions a different CM than
    // the current ground truth, bust this entry immediately.
    const currentCM = groundTruth.chief_minister?.toLowerCase() ?? '';
    const cachedText = (data.consensus_response ?? '').toLowerCase();
    if (currentCM && cachedText.length > 0) {
      const cmFirstName = currentCM.split(/\s+/)[0];
      const cmLastName = currentCM.split(/\s+/).pop() ?? '';
      const containsCM = cachedText.includes(cmFirstName) || cachedText.includes(cmLastName);
      if (!containsCM) {
        // Cached insight doesn't mention the live CM — bust it
        await supabase.from('ai_insight_cache').delete().eq('id', data.id);
        return null;
      }
    }

    // Also verify exact cache key match (new key format includes verified_at date)
    if (data.cache_key !== cacheKey) {
      // Different version slot — delete the stale one, return null to regenerate
      await supabase.from('ai_insight_cache').delete().eq('id', data.id);
      return null;
    }

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
export async function invalidateInsightCache(entityType: string, entityId: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    await supabase
      .from('ai_insight_cache')
      .delete()
      .like('cache_key', `${entityType}:${entityId}:%`);
  } catch { /* best effort */ }
}

export async function validateInsight(
  entityType: string,
  entityId: string,
  userPrompt: string,
  groundTruth: GroundTruth,
  options: { cacheTtlHours?: number; forceRefresh?: boolean; groundTruthVersion?: string } = {}
): Promise<ValidationResult> {
  // Cache key includes a ground-truth version hash so a CM change immediately busts the cache.
  // groundTruthVersion should be the verified_at timestamp of the primary fact.
  const versionSlug = options.groundTruthVersion
    ? options.groundTruthVersion.slice(0, 10)           // YYYY-MM-DD of last verification
    : new Date().toISOString().slice(0, 10);             // fallback: today's date (daily bust)
  const cacheKey = `${entityType}:${entityId}:${versionSlug}`;

  // ── Check cache first ──
  if (!options.forceRefresh) {
    const cached = await getCachedInsight(cacheKey, groundTruth);
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
