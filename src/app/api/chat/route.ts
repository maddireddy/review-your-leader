import { NextRequest, NextResponse } from 'next/server';
import { generateRepresentativeInsight } from '@/lib/anthropic';

export async function POST(request: NextRequest) {
  try {
    const { question, representative } = await request.json();

    if (!question || !representative) {
      return NextResponse.json({ error: 'Missing question or representative' }, { status: 400 });
    }

    const answer = await generateRepresentativeInsight(representative, question);
    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate insight. Check your Anthropic API key.' },
      { status: 500 }
    );
  }
}
