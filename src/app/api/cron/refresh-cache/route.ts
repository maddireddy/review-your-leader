import { NextRequest, NextResponse } from 'next/server';
import { INDIA_STATES } from '@/lib/indiaData';
import { getStateById } from '@/lib/indiaData';
import { validateInsight } from '@/lib/aiValidator';

/**
 * Vercel Cron — Nightly AI cache refresh at 2AM IST (20:30 UTC)
 * Configured in vercel.json: { "crons": [{ "path": "/api/cron/refresh-cache", "schedule": "30 20 * * *" }] }
 */
export async function GET(request: NextRequest) {
  // Security: only allow Vercel cron or internal calls
  const authHeader = request.headers.get('authorization');
  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: { stateId: string; status: string }[] = [];
  const start = Date.now();

  for (const state of INDIA_STATES) {
    const stateData = getStateById(state.id);
    if (!stateData) continue;

    try {
      const groundTruth = {
        chief_minister: stateData.chief_minister,
        cm_party: stateData.cm_party,
        ruling_party: stateData.ruling_party,
        capital: stateData.capital,
        state_name: stateData.name,
        landmark: stateData.landmark,
      };

      const userPrompt = `Provide a factual 3-sentence governance briefing on ${stateData.chief_minister}, Chief Minister of ${stateData.name}: one recent policy, one infrastructure achievement, one ongoing project.`;

      await validateInsight('state', state.id, userPrompt, groundTruth, { forceRefresh: true });
      results.push({ stateId: state.id, status: 'refreshed' });

      // Throttle: 1 second between states to respect Groq rate limits
      await new Promise(r => setTimeout(r, 1200));
    } catch (err) {
      results.push({ stateId: state.id, status: `error: ${err instanceof Error ? err.message : 'unknown'}` });
    }
  }

  return NextResponse.json({
    message: `Refreshed ${results.filter(r => r.status === 'refreshed').length}/${INDIA_STATES.length} states`,
    duration_ms: Date.now() - start,
    results,
  });
}
