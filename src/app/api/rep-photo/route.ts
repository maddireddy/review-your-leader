import { NextRequest, NextResponse } from 'next/server';

// ─── Wikipedia photo proxy + cache ──────────────────────────────
// Fetches politician photo from Wikipedia REST API.
// Cached for 7 days via CDN headers (photos don't change often).

const MEM_CACHE = new Map<string, { url: string | null; ts: number }>();
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ url: null }, { status: 400 });

  const cached = MEM_CACHE.get(slug);
  if (cached && Date.now() - cached.ts < TTL_MS) {
    return NextResponse.json({ url: cached.url }, {
      headers: { 'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400' },
    });
  }

  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`,
      {
        headers: { 'User-Agent': 'ReviewYourLeader/1.0 (https://review-your-leader.vercel.app)' },
        next: { revalidate: 604800 }, // Next.js 15 fetch cache 7 days
      }
    );

    if (!res.ok) {
      MEM_CACHE.set(slug, { url: null, ts: Date.now() });
      return NextResponse.json({ url: null });
    }

    const data = await res.json();
    // Prefer thumbnail (400px) over original (can be huge)
    const url: string | null =
      data.thumbnail?.source?.replace(/\/\d+px-/, '/300px-') ||
      data.originalimage?.source ||
      null;

    MEM_CACHE.set(slug, { url, ts: Date.now() });
    return NextResponse.json({ url }, {
      headers: { 'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400' },
    });
  } catch {
    MEM_CACHE.set(slug, { url: null, ts: Date.now() });
    return NextResponse.json({ url: null });
  }
}
