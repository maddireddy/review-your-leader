import { NextRequest, NextResponse } from 'next/server';
import { INDIA_STATES, MOCK_REPRESENTATIVES } from '@/lib/indiaData';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.toLowerCase() || '';

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = [
    ...INDIA_STATES
      .filter((s) => s.name.toLowerCase().includes(query) || s.capital.toLowerCase().includes(query))
      .slice(0, 4)
      .map((s) => ({ type: 'state', id: s.id, name: s.name, subtitle: `Capital: ${s.capital}` })),
    ...MOCK_REPRESENTATIVES
      .filter((r) => r.name.toLowerCase().includes(query) || r.constituency_name.toLowerCase().includes(query))
      .slice(0, 4)
      .map((r) => ({
        type: 'representative',
        id: r.id,
        name: r.name,
        subtitle: `${r.party_short} · ${r.constituency_name}`,
      })),
  ];

  return NextResponse.json({ results });
}
