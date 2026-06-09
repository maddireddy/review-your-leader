/**
 * ReviewYourLeader — Ground Truth Store
 *
 * The authoritative, self-updating fact layer. Reads verified facts from
 * Supabase (written by the autonomous refresh pipeline) and OVERLAYS them
 * on top of the static indiaData.ts snapshot.
 *
 * Frontend → getLiveStateInfo() → live verified facts (if fresh) || static fallback
 *
 * This means: when the pipeline learns Karnataka's CM changed, the new fact
 * lands in Supabase and the UI reflects it WITHOUT a code change or redeploy.
 */

import { getSupabaseAdmin } from './supabaseAdmin';
import { getStateById, StateInfo } from './indiaData';

export interface VerifiedFact {
  entity_type: string;
  entity_id: string;
  fact_key: string;
  fact_value: string;
  fact_party?: string;
  confidence: number;
  sources: string[];
  validation_notes?: string;
  verified_at: string;
}

// In-memory cache of the whole verified-facts table (refreshed every 5 min)
let _factsCache: { facts: Map<string, VerifiedFact>; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

function cacheKey(entityType: string, entityId: string, factKey: string) {
  return `${entityType}:${entityId}:${factKey}`;
}

// ─── Load all verified facts (cached) ───────────────────────────
async function loadFacts(): Promise<Map<string, VerifiedFact>> {
  if (_factsCache && Date.now() - _factsCache.ts < CACHE_TTL) {
    return _factsCache.facts;
  }

  const facts = new Map<string, VerifiedFact>();
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('ground_truth_facts')
      .select('entity_type, entity_id, fact_key, fact_value, fact_party, confidence, sources, validation_notes, verified_at');

    if (data) {
      for (const row of data as VerifiedFact[]) {
        facts.set(cacheKey(row.entity_type, row.entity_id, row.fact_key), row);
      }
    }
  } catch {
    // Supabase not configured — fall through to static data
  }

  _factsCache = { facts, ts: Date.now() };
  return facts;
}

export function invalidateFactsCache() {
  _factsCache = null;
}

// ─── Read a single verified fact ────────────────────────────────
export async function getVerifiedFact(
  entityType: string,
  entityId: string,
  factKey: string,
  minConfidence = 0.6
): Promise<VerifiedFact | null> {
  const facts = await loadFacts();
  const fact = facts.get(cacheKey(entityType, entityId, factKey));
  if (fact && fact.confidence >= minConfidence) return fact;
  return null;
}

// ─── Get state info with LIVE overlay ───────────────────────────
export interface LiveStateInfo extends StateInfo {
  cm_is_live: boolean;          // true if CM came from live pipeline
  cm_confidence?: number;
  cm_sources?: string[];
  cm_verified_at?: string;
}

export async function getLiveStateInfo(stateId: string): Promise<LiveStateInfo | null> {
  const base = getStateById(stateId);
  if (!base) return null;

  const cmFact = await getVerifiedFact('state', stateId, 'chief_minister');

  if (cmFact && cmFact.fact_value) {
    return {
      ...base,
      chief_minister: cmFact.fact_value,
      cm_party: cmFact.fact_party || base.cm_party,
      cm_is_live: true,
      cm_confidence: cmFact.confidence,
      cm_sources: cmFact.sources,
      cm_verified_at: cmFact.verified_at,
    };
  }

  return { ...base, cm_is_live: false };
}

// ─── Write a verified fact (called by the pipeline) ─────────────
export async function writeVerifiedFact(fact: {
  entity_type: string;
  entity_id: string;
  fact_key: string;
  fact_value: string;
  fact_party?: string;
  confidence: number;
  sources: string[];
  validation_notes?: string;
}): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('ground_truth_facts').upsert(
      {
        ...fact,
        sources: fact.sources,
        verified_at: new Date().toISOString(),
        verified_by: 'auto_pipeline',
        fact_source: 'web_search_validated',
      },
      { onConflict: 'entity_type,entity_id,fact_key' }
    );
    invalidateFactsCache();
    return !error;
  } catch {
    return false;
  }
}
