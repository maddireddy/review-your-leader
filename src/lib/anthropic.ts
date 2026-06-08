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

export async function generateRepresentativeInsight(
  representative: Record<string, unknown>,
  question: string
): Promise<string> {
  const client = getAnthropicClient();
  const context = JSON.stringify(representative, null, 2);

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: `You are an expert political analyst for India. Provide factual, balanced, and insightful analysis about Indian politicians and their performance. Use the provided data to answer questions accurately. Be concise but comprehensive.`,
    messages: [
      {
        role: 'user',
        content: `Based on this representative's data:\n${context}\n\nQuestion: ${question}`,
      },
    ],
  });

  return message.content[0].type === 'text' ? message.content[0].text : '';
}
