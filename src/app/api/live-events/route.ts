import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Server-Sent Events endpoint — streams recent fact updates to the client.
 * Clients connect once and receive a snapshot of recent changes, then
 * the connection closes. For true real-time, reconnect every 30s.
 *
 * GET /api/live-events
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        const line = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(line));
      };

      try {
        const supabase = getSupabaseAdmin();

        // Fetch last 10 verified fact updates from the past 24 hours
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: facts } = await supabase
          .from('ground_truth_facts')
          .select('entity_id, fact_key, fact_value, fact_party, confidence, verified_at')
          .eq('entity_type', 'state')
          .gt('verified_at', since)
          .order('verified_at', { ascending: false })
          .limit(10);

        // Fetch last 10 audit log entries
        const { data: logs } = await supabase
          .from('fact_refresh_log')
          .select('entity_id, candidate_value, confidence, committed, changed, run_at')
          .eq('entity_type', 'state')
          .gt('run_at', since)
          .eq('committed', true)
          .order('run_at', { ascending: false })
          .limit(10);

        send({
          type: 'snapshot',
          recent_verifications: (facts || []).map(f => ({
            stateId: f.entity_id,
            cm: f.fact_value,
            party: f.fact_party,
            confidence: f.confidence,
            verifiedAt: f.verified_at,
          })),
          recent_commits: (logs || []).map(l => ({
            stateId: l.entity_id,
            newValue: l.candidate_value,
            confidence: l.confidence,
            changed: l.changed,
            at: l.run_at,
          })),
          generatedAt: new Date().toISOString(),
        });
      } catch {
        send({ type: 'error', message: 'Live events unavailable' });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
