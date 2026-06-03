import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateRepresentativeInsight(
  representative: Record<string, unknown>,
  question: string
): Promise<string> {
  const context = JSON.stringify(representative, null, 2);

  const message = await anthropic.messages.create({
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
