import Groq from 'groq-sdk';

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function askGroq(prompt: string, systemPrompt?: string): Promise<string> {
  const chat = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content:
          systemPrompt ||
          'You are an expert on Indian politics, governance, and elected representatives. Provide accurate, concise, and up-to-date information. Always mention the source or basis of your information where possible.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 1024,
  });
  return chat.choices[0]?.message?.content || 'No response';
}

export async function getLatestLeaderInfo(
  name: string,
  role: string,
  state: string
): Promise<{
  recentActivity: string;
  keyAchievements: string;
  controversies: string;
  rating: string;
}> {
  const prompt = `For Indian politician ${name}, who is the ${role} of ${state}:
1. Recent Activity (last 6 months): What major policy decisions, announcements, or activities?
2. Key Achievements: Top 3 notable achievements in office
3. Controversies (if any): Any major controversies or criticisms
4. Performance Rating: Give a brief performance assessment (Excellent/Good/Average/Poor) with one-line reason

Respond in JSON format: { "recentActivity": "...", "keyAchievements": "...", "controversies": "...", "rating": "..." }`;

  const raw = await askGroq(prompt);
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch {
    // fallback
  }
  return {
    recentActivity: raw.substring(0, 300),
    keyAchievements: 'Data loading...',
    controversies: 'Data loading...',
    rating: 'Data loading...',
  };
}
