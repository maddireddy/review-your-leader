import { NextRequest, NextResponse } from 'next/server';
import { enhancePhotoUrl } from '@/lib/politicianPhoto';

// ─── Wikipedia photo proxy + CDN enhancement ────────────────────
// Fetches politician photo from Wikipedia REST API, then wraps it
// in weserv.nl (or Cloudinary if configured) for professional enhancement.
// Cached for 7 days via CDN headers.

const MEM_CACHE = new Map<string, { url: string | null; enhanced: string | null; ts: number }>();
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ url: null }, { status: 400 });

  const cached = MEM_CACHE.get(slug);
  if (cached && Date.now() - cached.ts < TTL_MS) {
    return NextResponse.json({ url: cached.enhanced ?? cached.url }, {
      headers: { 'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400' },
    });
  }

  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`,
      {
        headers: { 'User-Agent': 'ReviewYourLeader/1.0 (https://review-your-leader.vercel.app)' },
        next: { revalidate: 604800 },
      }
    );

    if (!res.ok) {
      MEM_CACHE.set(slug, { url: null, enhanced: null, ts: Date.now() });
      return NextResponse.json({ url: null });
    }

    const data = await res.json();
    // Use originalimage for higher resolution input to the enhancer
    const original: string | null =
      data.originalimage?.source ||
      data.thumbnail?.source?.replace(/\/\d+px-/, '/400px-') ||
      null;

    const enhanced = original ? enhancePhotoUrl(original) : null;

    MEM_CACHE.set(slug, { url: original, enhanced, ts: Date.now() });
    return NextResponse.json({ url: enhanced ?? original }, {
      headers: { 'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400' },
    });
  } catch {
    MEM_CACHE.set(slug, { url: null, enhanced: null, ts: Date.now() });
    return NextResponse.json({ url: null });
  }
}
