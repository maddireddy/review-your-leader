import Anthropic from '@anthropic-ai/sdk';

// Lazy singleton — instantiated at runtime, not at build time
let _anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set. Get a key at https://console.anthropic.com');
    }
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

/**
 * Generate a grounded answer about an MP/MLA.
 *
 * Ground-truth anchoring: the representative's verified DB record is injected
 * into the system prompt as a VERIFIED FACTS block. Claude Haiku is instructed
 * to never contradict it — the same anti-hallucination philosophy as the
 * state-insight validation pipeline.
 */
export async function generateRepresentativeInsight(
  representative: Record<string, unknown>,
  question: string
): Promise<string> {
  const client = getAnthropicClient();

  // Build a clean VERIFIED FACTS block from the representative record
  const facts = buildFactsBlock(representative);

  const systemPrompt = `You are an expert, non-partisan political analyst for India who helps citizens understand their elected representatives.

═══════════════════════════════════════════
VERIFIED FACTS (authoritative — NEVER contradict these)
═══════════════════════════════════════════
${facts}
═══════════════════════════════════════════

RULES:
1. Treat the VERIFIED FACTS above as ground truth. Never state anything that contradicts them.
2. If you don't know something beyond these facts, say so — do not fabricate statistics, scandals, or achievements.
3. Be balanced and neutral. Present both strengths and criticisms fairly.
4. Keep answers concise (2-4 sentences unless asked for detail).
5. Never invent quotes, specific bill numbers, or vote counts not present in the facts.
6. Frame everything from a civic-education standpoint to help voters make informed decisions.`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: question,
      },
    ],
  });

  return message.content[0].type === 'text' ? message.content[0].text : '';
}

// ─── Build a readable facts block from the rep record ──────────
function buildFactsBlock(rep: Record<string, unknown>): string {
  const lines: string[] = [];
  const get = (k: string) => rep[k];

  if (get('name')) lines.push(`• Name: ${get('name')}`);
  if (get('party')) lines.push(`• Party: ${get('party')} (${get('party_short') ?? ''})`);
  if (get('constituency_name')) {
    const type = get('constituency_type') === 'parliament' ? 'MP (Lok Sabha)' : 'MLA (Vidhan Sabha)';
    lines.push(`• Position: ${type} for ${get('constituency_name')}`);
  }
  if (get('state_name')) lines.push(`• State: ${get('state_name')}`);
  if (get('tenure_start')) lines.push(`• In office since: ${get('tenure_start')}`);
  if (get('age')) lines.push(`• Age: ${get('age')}`);
  if (get('education')) lines.push(`• Education: ${get('education')}`);
  if (get('assets')) lines.push(`• Declared assets: ${get('assets')}`);
  if (typeof get('criminal_cases') === 'number') lines.push(`• Criminal cases declared: ${get('criminal_cases')}`);
  if (typeof get('attendance_percentage') === 'number') lines.push(`• Parliament attendance: ${get('attendance_percentage')}%`);
  if (typeof get('questions_asked') === 'number') lines.push(`• Questions asked: ${get('questions_asked')}`);
  if (typeof get('debates_participated') === 'number') lines.push(`• Debates participated: ${get('debates_participated')}`);
  if (typeof get('bills_introduced') === 'number') lines.push(`• Bills introduced: ${get('bills_introduced')}`);

  // Ministry portfolios
  const ministry = get('ministry');
  if (Array.isArray(ministry) && ministry.length > 0) {
    const current = ministry.filter((m: { is_current?: boolean }) => m.is_current);
    if (current.length > 0) {
      lines.push(`• Current ministry: ${current.map((m: { portfolio?: string }) => m.portfolio).join(', ')}`);
    }
  }

  // Election results
  const results = get('election_results');
  if (Array.isArray(results) && results.length > 0) {
    const latest = results[results.length - 1] as Record<string, unknown>;
    lines.push(`• ${latest.year} election: won with ${latest.vote_share}% vote share, margin of ${latest.margin} votes over ${latest.runner_up} (${latest.runner_up_party})`);
  }

  if (get('bio')) lines.push(`• Background: ${get('bio')}`);

  return lines.length > 0 ? lines.join('\n') : 'No verified data available for this representative.';
}
