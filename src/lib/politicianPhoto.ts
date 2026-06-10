/**
 * Politician photo pipeline:
 *   1. Wikipedia REST API originalimage (highest quality)
 *   2. Wikimedia Commons search (finds formal portraits)
 *   3. Wikidata image claim (Q-item lookup)
 *   4. Claude vision: pick most professional headshot from candidates
 *   5. Enhance via weserv.nl (free CDN proxy: face-crop, sharpen, denoise, upscale)
 */

import Anthropic from '@anthropic-ai/sdk';

const UA = 'ReviewYourLeader/1.0 (civic-tech; contact@reviewyourleader.in)';

// ── Source 1: Wikipedia REST (already in main route but gets low-res thumbnail)
// We re-fetch here to grab originalimage (full resolution) ─────────────────────
export async function fetchWikipediaPhoto(wikiSlug: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiSlug)}`,
      { headers: { 'User-Agent': UA } }
    );
    if (!res.ok) return null;
    const d = await res.json();
    // Prefer originalimage (full resolution) over thumbnail
    return d.originalimage?.source || d.thumbnail?.source || null;
  } catch { return null; }
}

// ── Source 2: Wikimedia Commons search — looks for formal portraits ───────────
export async function fetchCommonsPhoto(name: string): Promise<string[]> {
  const urls: string[] = [];
  try {
    // Search Commons for files matching the name, preferring portrait categories
    const query = `${name} politician India portrait official`;
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=5&format=json`,
      { headers: { 'User-Agent': UA } }
    );
    if (!res.ok) return urls;
    const d = await res.json();
    const titles: string[] = (d.query?.search ?? []).map((s: { title: string }) => s.title);

    for (const title of titles.slice(0, 3)) {
      try {
        const imgRes = await fetch(
          `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|mime&format=json`,
          { headers: { 'User-Agent': UA } }
        );
        const imgData = await imgRes.json();
        const pages = Object.values(imgData.query?.pages ?? {}) as Array<{ imageinfo?: Array<{ url: string; mime: string }> }>;
        for (const page of pages) {
          const info = page.imageinfo?.[0];
          // Only accept JPEG/PNG images (not SVG, PDF, audio)
          if (info?.url && (info.mime === 'image/jpeg' || info.mime === 'image/png')) {
            urls.push(info.url);
          }
        }
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
  return urls;
}

// ── Source 3: Wikidata image claim ────────────────────────────────────────────
export async function fetchWikidataPhoto(name: string): Promise<string | null> {
  try {
    // Search Wikidata for the entity
    const searchRes = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&limit=3&format=json`,
      { headers: { 'User-Agent': UA } }
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const entityId = searchData.search?.[0]?.id;
    if (!entityId) return null;

    // Fetch entity claims for image (P18)
    const entityRes = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${entityId}&property=P18&format=json`,
      { headers: { 'User-Agent': UA } }
    );
    if (!entityRes.ok) return null;
    const entityData = await entityRes.json();
    const fileName = entityData.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    if (!fileName) return null;

    // Convert filename to Commons URL
    const encoded = encodeURIComponent(fileName.replace(/ /g, '_'));
    const md5 = await md5Hex(fileName.replace(/ /g, '_'));
    return `https://upload.wikimedia.org/wikipedia/commons/${md5[0]}/${md5[0]}${md5[1]}/${encoded}`;
  } catch { return null; }
}

// Simple MD5 for Wikimedia path (Web Crypto)
async function md5Hex(str: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // MD5 not available in all environments — use a simple fallback
    return 'ab/ab';
  }
}

// ── Claude vision: pick best professional headshot ────────────────────────────
export async function pickBestPhoto(
  candidates: string[],
  name: string
): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || candidates.length === 0) return candidates[0] ?? null;
  if (candidates.length === 1) return candidates[0];

  // Only pass up to 4 candidates to Claude
  const pool = candidates.slice(0, 4);

  try {
    const client = new Anthropic({ apiKey: key });

    // Build image content blocks
    const imageContents: Anthropic.ImageBlockParam[] = [];
    const validUrls: string[] = [];

    for (const url of pool) {
      try {
        const imgRes = await fetch(url, { headers: { 'User-Agent': UA } });
        if (!imgRes.ok) continue;
        const contentType = imgRes.headers.get('content-type') ?? 'image/jpeg';
        if (!contentType.startsWith('image/')) continue;
        const buffer = await imgRes.arrayBuffer();
        const b64 = Buffer.from(buffer).toString('base64');
        const mediaType = contentType.split(';')[0] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
        imageContents.push({
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: b64 },
        });
        validUrls.push(url);
      } catch { /* skip */ }
    }

    if (imageContents.length === 0) return candidates[0];
    if (imageContents.length === 1) return validUrls[0];

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 20,
      messages: [{
        role: 'user',
        content: [
          ...imageContents,
          {
            type: 'text',
            text: `These are ${imageContents.length} candidate photos for ${name}, an Indian politician.
Reply with ONLY a single digit (1, 2, 3, or 4) — the number of the photo that is:
- A formal headshot or official portrait
- Clear face, professional attire
- No protests, rallies, or controversial contexts
- Highest quality and most recent-looking
If none are suitable, reply "1".`,
          },
        ],
      }],
    });

    const choice = parseInt((msg.content[0] as Anthropic.TextBlock).text.trim(), 10);
    const idx = Number.isFinite(choice) && choice >= 1 && choice <= validUrls.length
      ? choice - 1
      : 0;
    return validUrls[idx];
  } catch {
    return candidates[0];
  }
}

// ── Enhancement: weserv.nl free CDN proxy ─────────────────────────────────────
// Applies: face-aware crop, sharpen, denoise, contrast boost, upscale to 400px
// Completely free, no API key, works with any public image URL.
// Docs: https://images.weserv.nl/docs/
export function enhancePhotoUrl(originalUrl: string): string {
  if (!originalUrl) return originalUrl;

  // Cloudinary (if configured) gives the best results with AI enhancement
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (cloudName) {
    // e_improve: AI auto-enhance, e_sharpen:80, c_fill g_face: face-centered crop
    // q_auto:best: best quality, f_auto: auto format (webp/avif)
    const encoded = encodeURIComponent(originalUrl);
    return `https://res.cloudinary.com/${cloudName}/image/fetch/w_400,h_400,c_fill,g_face,e_improve,e_sharpen:80,e_vibrance:30,q_auto:best,f_auto/${encoded}`;
  }

  // Fallback: weserv.nl (always available, no key needed)
  // w=400,h=400: size | we=1: smart crop (entropy) | sharp=3: sharpening
  // brightness=2: slight lift | con=5: contrast boost | sat=10: saturation
  // output=jpg: stable format
  const encoded = encodeURIComponent(originalUrl);
  return `https://images.weserv.nl/?url=${encoded}&w=400&h=400&fit=cover&a=attention&sharp=4&brightness=2&contrast=6&saturation=12&output=jpg&il`;
}

// ── Master pipeline ────────────────────────────────────────────────────────────
export async function resolvePoliticianPhoto(
  name: string,
  wikiSlug?: string | null
): Promise<{ original: string; enhanced: string } | null> {
  const candidates: string[] = [];

  // 1. Wikipedia original (highest res, most reliable)
  if (wikiSlug) {
    const wikiPhoto = await fetchWikipediaPhoto(wikiSlug);
    if (wikiPhoto) candidates.push(wikiPhoto);
  }

  // 2. Wikimedia Commons search
  const commonsPhotos = await fetchCommonsPhoto(name);
  candidates.push(...commonsPhotos);

  // 3. Wikidata P18 claim (only if we have no candidates yet)
  if (candidates.length === 0) {
    const wdPhoto = await fetchWikidataPhoto(name);
    if (wdPhoto) candidates.push(wdPhoto);
  }

  if (candidates.length === 0) return null;

  // 4. Claude picks best professional headshot
  const best = await pickBestPhoto(candidates, name);
  if (!best) return null;

  // 5. Enhance via CDN proxy
  const enhanced = enhancePhotoUrl(best);

  return { original: best, enhanced };
}
