import Groq from 'groq-sdk';

// Lazy singleton — only instantiated when first called at runtime, not at build time
let _groq: Groq | null = null;

function getGroqClient(): Groq {
  if (!_groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not set. Get a free key at https://console.groq.com');
    }
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

export async function askGroq(prompt: string, systemPrompt?: string): Promise<string> {
  const client = getGroqClient();
  const chat = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content:
          systemPrompt ||
          'You are an expert on Indian politics, governance, and elected representatives. Provide accurate, concise, and up-to-date information.',
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
1. Recent Activity (last 6 months): What major policy decisions or initiatives?
2. Key Achievements: Top 3 notable achievements in office
3. Controversies (if any): Any major controversies or criticisms
4. Performance Rating: Excellent/Good/Average/Poor with one-line reason

Respond in JSON format: { "recentActivity": "...", "keyAchievements": "...", "controversies": "...", "rating": "..." }`;

  const raw = await askGroq(prompt);
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch {
    // fallback to plain text
  }
  return {
    recentActivity: raw.substring(0, 300),
    keyAchievements: 'See full response above.',
    controversies: 'See full response above.',
    rating: 'See full response above.',
  };
}
