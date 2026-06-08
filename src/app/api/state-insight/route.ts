import { NextRequest, NextResponse } from 'next/server';
import { askGroq } from '@/lib/groq';

export async function POST(request: NextRequest) {
  try {
    const { stateName, cm, party } = await request.json();

    const prompt = `Give me a concise 3-4 sentence update on ${cm}, Chief Minister of ${stateName} (${party}):
- What major governance initiatives have been launched recently?
- What is the state's current economic or development status?
- Any notable achievements or challenges in the last 6 months?
Keep it factual, neutral, and under 120 words.`;

    const insight = await askGroq(prompt,
      'You are a political journalist providing neutral, factual briefings on Indian state politicians. Be concise and informative.'
    );

    return NextResponse.json({ insight });
  } catch (error) {
    console.error('State insight error:', error);
    return NextResponse.json(
      { insight: 'AI insight unavailable. Please add GROQ_API_KEY to your environment variables.' },
      { status: 200 }
    );
  }
}
