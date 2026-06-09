import { NextRequest, NextResponse } from 'next/server';
import { INDIA_STATES } from '@/lib/indiaData';
import { searchReps } from '@/lib/representativesData';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.toLowerCase().trim() || '';
  if (query.length < 2) return NextResponse.json({ results: [] });

  const stateMatches = INDIA_STATES.filter(s =>
    s.name.toLowerCase().includes(query) || s.capital.toLowerCase().includes(query)
  ).slice(0, 3).map(s => ({
    type: 'state' as const, id: s.id, name: s.name,
    subtitle: `Capital: ${s.capital}`, score: 0.95,
  }));

  const repMatches = searchReps(query).slice(0, 6).map(r => ({
    type: 'representative' as const, id: r.id, name: r.name,
    subtitle: `${r.party_short} · ${r.constituency_name} · ${r.state_name}`,
    score: 0.85, wikipedia_slug: r.wikipedia_slug,
  }));

  let vectorResults: typeof repMatches = [];
  if (process.env.VOYAGE_API_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { generateEmbedding } = await import('@/lib/voyage');
      const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
      const embedding = await generateEmbedding(query);
      const supabase = getSupabaseAdmin();
      const { data } = await supabase.rpc('match_representatives', {
        query_embedding: embedding, match_count: 5, similarity_threshold: 0.65,
      });
      if (data) {
        vectorResults = (data as Array<{id:string;name:string;party_short:string;constituency_name:string;state_name:string;similarity:number}>)
          .map(r => ({ type: 'representative' as const, id: r.id, name: r.name,
            subtitle: `${r.party_short} · ${r.constituency_name} · semantic match`, score: r.similarity, wikipedia_slug: undefined }));
      }
    } catch { /* Voyage not configured */ }
  }

  const seen = new Set<string>();
  const results = [...stateMatches, ...vectorResults, ...repMatches]
    .filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 8);

  return NextResponse.json({ results, query });
}
