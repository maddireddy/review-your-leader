import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { webSearch } from '@/lib/webSearch';
import { withRetry } from '@/lib/retry';
import Anthropic from '@anthropic-ai/sdk';
import { resolvePoliticianPhoto } from '@/lib/politicianPhoto';

/**
 * GET /api/politician?name=C.+Joseph+Vijay&stateId=TN&role=Chief+Minister
 *
 * Returns a rich politician profile built from:
 *   1. Wikipedia REST API  — bio extract, photo, birth info
 *   2. Tavily web search   — recent news, achievements
 *   3. Claude Haiku        — structured personality analysis + career timeline
 *
 * Results cached in Supabase politician_profiles (6h TTL).
 */

export const maxDuration = 60;

function slugify(name: string, stateId: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + stateId.toLowerCase();
}

// ── Wikipedia REST API ────────────────────────────────────────
async function fetchWikipedia(name: string): Promise<{
  extract: string; photo: string; url: string;
  birthDate: string; birthPlace: string;
  wikiSlug: string;
} | null> {
  // Try exact slug first, then with underscores
  const candidates = [
    name.replace(/\s+/g, '_'),
    name.replace(/\./g, '').replace(/\s+/g, '_'),
    // For politicians like "M. K. Stalin" try "M._K._Stalin"
    name.trim(),
  ];

  for (const slug of candidates) {
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`,
        { headers: { 'User-Agent': 'ReviewYourLeader/1.0 (civic-tech)' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      if (data.type === 'disambiguation') continue;
      return {
        extract: data.extract || '',
        photo: data.thumbnail?.source || data.originalimage?.source || '',
        url: data.content_urls?.desktop?.page || '',
        birthDate: data.description?.match(/born?\s*(\d{4})/i)?.[1] || '',
        birthPlace: '',
        wikiSlug: data.title || slug,
      };
    } catch { /* try next */ }
  }
  return null;
}

// ── Claude personality analysis ───────────────────────────────
async function generatePersonalityAnalysis(
  name: string,
  role: string,
  party: string,
  wikiExtract: string,
  newsSnippets: string[]
): Promise<{
  leadership_style: string;
  known_for: string[];
  quote: string;
  traits: string[];
  governance_focus: string;
  political_journey_summary: string;
  career_timeline: Array<{ year: string; event: string; significance: string }>;
  key_achievements: Array<{ title: string; description: string; year?: string }>;
}> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return {
      leadership_style: 'Information unavailable',
      known_for: [],
      quote: '',
      traits: [],
      governance_focus: '',
      political_journey_summary: wikiExtract.slice(0, 200),
      career_timeline: [],
      key_achievements: [],
    };
  }

  const client = new Anthropic({ apiKey: key });
  const context = [
    wikiExtract.slice(0, 2000),
    ...newsSnippets.slice(0, 3),
  ].join('\n\n');

  const prompt = `You are a political analyst. Based on the following information about ${name} (${role}, ${party}), provide a structured JSON analysis.

Information:
"""
${context}
"""

Return ONLY valid JSON with this exact structure:
{
  "leadership_style": "2-3 sentence description of their leadership approach",
  "known_for": ["3-5 things they are most known for, each under 8 words"],
  "quote": "A real or representative quote attributed to them, or empty string",
  "traits": ["4-6 personality/political traits as single words or short phrases"],
  "governance_focus": "Their primary policy focus area in 1 sentence",
  "political_journey_summary": "3-4 sentence narrative of their political rise",
  "career_timeline": [
    {"year": "YYYY", "event": "Brief event description", "significance": "Why it mattered"}
  ],
  "key_achievements": [
    {"title": "Achievement title", "description": "1-2 sentence description", "year": "YYYY or empty"}
  ]
}

Provide 4-6 career_timeline entries and 3-5 key_achievements. Only include factual information.`;

  try {
    const msg = await withRetry(() => client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }));

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('no json');
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      leadership_style: '',
      known_for: [],
      quote: '',
      traits: [],
      governance_focus: '',
      political_journey_summary: wikiExtract.slice(0, 300),
      career_timeline: [],
      key_achievements: [],
    };
  }
}

// ── Main handler ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name') || '';
  const stateId = request.nextUrl.searchParams.get('stateId') || '';
  const role = request.nextUrl.searchParams.get('role') || 'Politician';
  const party = request.nextUrl.searchParams.get('party') || '';
  const forceRefresh = request.nextUrl.searchParams.get('force') === '1';

  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const slug = slugify(name, stateId || 'in');

  // ── Check Supabase cache ────────────────────────────────────
  if (!forceRefresh) {
    try {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from('politician_profiles')
        .select('*')
        .eq('slug', slug)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (data) {
        return NextResponse.json({ profile: data, fromCache: true });
      }
    } catch { /* cache miss — fetch fresh */ }
  }

  // ── Fetch Wikipedia ─────────────────────────────────────────
  const wiki = await fetchWikipedia(name);

  // ── Resolve best photo (multi-source + Claude vision + CDN enhance) ──────
  const photoResult = await resolvePoliticianPhoto(name, wiki?.wikiSlug);

  // ── Fetch recent news via Tavily ────────────────────────────
  const searchResult = await webSearch(
    `${name} ${role} ${stateId} India ${new Date().getFullYear()} latest news achievements`
  );

  const recentNews = searchResult.sources.slice(0, 5).map((url, i) => ({
    title: searchResult.snippets[i]?.split('.')[0]?.trim() || url,
    url,
    snippet: searchResult.snippets[i]?.slice(0, 200) || '',
    published_at: new Date().toISOString(),
  }));

  // ── Claude personality analysis ─────────────────────────────
  const analysis = await generatePersonalityAnalysis(
    name, role, party,
    wiki?.extract || `${name} is a ${role} from ${stateId}, India, representing ${party}.`,
    searchResult.snippets
  );

  // ── Assemble profile ────────────────────────────────────────
  const profile = {
    slug,
    name,
    name_native: null,
    state_id: stateId,
    role,
    party,
    party_short: null,
    photo_url: photoResult?.original || wiki?.photo || null,
    enhanced_photo_url: photoResult?.enhanced || null,
    wikipedia_slug: wiki?.wikiSlug || null,
    wikipedia_extract: wiki?.extract || null,
    wikipedia_url: wiki?.url || null,
    birth_date: wiki?.birthDate || null,
    birth_place: wiki?.birthPlace || null,
    education: [],
    net_worth: null,
    career_timeline: analysis.career_timeline || [],
    key_achievements: analysis.key_achievements || [],
    controversies: [],
    personality_analysis: {
      leadership_style: analysis.leadership_style,
      known_for: analysis.known_for,
      quote: analysis.quote,
      traits: analysis.traits,
      governance_focus: analysis.governance_focus,
      political_journey_summary: analysis.political_journey_summary,
    },
    recent_news: recentNews,
    fetched_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  };

  // ── Persist to Supabase ─────────────────────────────────────
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('politician_profiles').upsert(profile, { onConflict: 'slug' });
  } catch { /* best effort */ }

  return NextResponse.json({ profile, fromCache: false });
}
