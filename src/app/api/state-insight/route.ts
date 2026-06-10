import { NextRequest, NextResponse } from 'next/server';
import { validateInsight } from '@/lib/aiValidator';
import { getStateById } from '@/lib/indiaData';
import { getLiveStateInfo } from '@/lib/groundTruthStore';

export async function POST(request: NextRequest) {
  try {
    const { stateId, forceRefresh } = await request.json();

    const state = getStateById(stateId);
    if (!state) {
      return NextResponse.json({ error: 'State not found' }, { status: 404 });
    }

    // Use live verified facts when available so AI reflects the latest CM
    const live = await getLiveStateInfo(stateId);
    const cmName = live?.chief_minister || state.chief_minister;
    const cmParty = live?.cm_party || state.cm_party;

    // ── Ground truth — injected into ALL model prompts ──────────
    const groundTruth = {
      chief_minister: cmName,
      cm_party: cmParty,
      ruling_party: state.ruling_party,
      capital: state.capital,
      state_name: state.name,
      landmark: state.landmark,
    };

    // ── User prompt ──────────────────────────────────────────────
    const userPrompt = `Provide a factual 3-sentence governance briefing on ${cmName},
Chief Minister of ${state.name} (${cmParty}):
1. What major policy or development initiative has been launched recently?
2. What is a notable achievement or challenge in infrastructure/economy/welfare?
3. What is one key ongoing project or campaign in the state?

Stay grounded in verified facts. Be specific, neutral, and informative.`;

    // ── Run 3-level validation pipeline ─────────────────────────
    // Pass verified_at as groundTruthVersion so the cache busts whenever CM changes
    const result = await validateInsight(
      'state',
      stateId,
      userPrompt,
      groundTruth,
      { forceRefresh: forceRefresh === true, groundTruthVersion: live?.cm_verified_at }
    );

    return NextResponse.json({
      insight: result.finalResponse,
      validation: {
        status: result.validationStatus,
        consensusScore: result.consensusScore,
        modelsUsed: result.model3Response ? 3 : 2,
        autoCorrected: result.autoCorrected,
        factViolations: result.factViolations.length,
        fromCache: result.fromCache,
        cacheAge: result.cacheAge,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[state-insight]', msg);
    return NextResponse.json(
      { insight: `AI service unavailable: ${msg.includes('GROQ') ? 'Add GROQ_API_KEY in Vercel settings.' : msg}` },
      { status: 200 }
    );
  }
}
