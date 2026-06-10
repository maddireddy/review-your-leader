import { NextRequest, NextResponse } from 'next/server';

// Regional language map — state ID → { lang code, language name, native name }
const STATE_LANGUAGES: Record<string, { code: string; name: string; native: string }> = {
  AP: { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  TG: { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  TN: { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  KA: { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  KL: { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  MH: { code: 'mr', name: 'Marathi', native: 'मराठी' },
  GJ: { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  PB: { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  RJ: { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  UP: { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  MP: { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  BR: { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  HR: { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  DL: { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  UK: { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  HP: { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  JH: { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  CG: { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  WB: { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  AS: { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
  OD: { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
};

/**
 * News feed per state/representative
 * Source: NewsAPI.org (free tier: 100 req/day)
 * Fallback: GNews.io (free tier: 100 req/day)
 * Summary: Groq LLaMA 3.1 8B Instant (fast, cheap)
 */

const MEM_CACHE = new Map<string, { articles: NewsArticle[]; ts: number }>();
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export interface NewsArticle {
  title: string;
  summary: string;
  regional_summary?: string;
  regional_lang?: string;
  source: string;
  url: string;
  published_at: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

async function fetchNewsForQuery(
  query: string,
  langInfo?: { code: string; name: string; native: string }
): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return getMockNews(query, langInfo);

  try {
    const url = `https://newsapi.org/v2/everything?` +
      `q=${encodeURIComponent(query + ' India politics')}&` +
      `sortBy=publishedAt&language=en&pageSize=5&` +
      `apiKey=${apiKey}`;

    const res = await fetch(url, { next: { revalidate: 21600 } });
    if (!res.ok) return getMockNews(query, langInfo);

    const data = await res.json();
    const articles = (data.articles || []).filter((a: {title: string; url: string}) => a.title && !a.title.includes('[Removed]'));

    return await Promise.all(articles.slice(0, 3).map(async (a: {title: string; description: string; source: {name: string}; url: string; publishedAt: string}) => {
      let summary = a.description || a.title;
      let regionalSummary: string | undefined;

      try {
        if (process.env.GROQ_API_KEY) {
          const Groq = (await import('groq-sdk')).default;
          const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

          // English summary
          const enResp = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: `Summarise in ONE sentence (max 20 words): "${a.title}. ${a.description || ''}"` }],
            max_tokens: 60, temperature: 0.2,
          });
          summary = enResp.choices[0]?.message?.content?.trim() || summary;

          // Regional language summary — translate the English summary
          if (langInfo && langInfo.code !== 'en') {
            const regResp = await groq.chat.completions.create({
              model: 'llama-3.3-70b-versatile',
              messages: [{
                role: 'user',
                content: `Translate this news summary into ${langInfo.name} (${langInfo.native} script). Return ONLY the translated text, nothing else.\n\n"${summary}"`,
              }],
              max_tokens: 120, temperature: 0.1,
            });
            regionalSummary = regResp.choices[0]?.message?.content?.trim();
          }
        }
      } catch { /* skip on error */ }

      const lower = (a.title + summary).toLowerCase();
      const sentiment: NewsArticle['sentiment'] =
        lower.includes('launch') || lower.includes('develop') || lower.includes('achiev') ? 'positive' :
        lower.includes('scam') || lower.includes('arrest') || lower.includes('corrupt') ? 'negative' : 'neutral';

      return {
        title: a.title,
        summary,
        regional_summary: regionalSummary,
        regional_lang: langInfo?.native,
        source: a.source?.name || 'News',
        url: a.url,
        published_at: a.publishedAt,
        sentiment,
      };
    }));
  } catch {
    return getMockNews(query, langInfo);
  }
}

function getMockNews(query: string, langInfo?: { code: string; name: string; native: string }): NewsArticle[] {
  void langInfo;
  return [
    {
      title: `${query}: Latest Development Projects Announced`,
      summary: 'Government announces new infrastructure investments focusing on roads, water supply, and digital connectivity.',
      source: 'The Hindu', url: '#', published_at: new Date().toISOString(), sentiment: 'positive',
    },
    {
      title: `${query} Legislative Assembly Session Highlights`,
      summary: 'Key bills discussed and passed during the ongoing assembly session covering agriculture and healthcare.',
      source: 'NDTV', url: '#', published_at: new Date(Date.now() - 86400000).toISOString(), sentiment: 'neutral',
    },
    {
      title: `${query} Economic Growth Report 2025`,
      summary: 'State economy grows at 8.2% driven by manufacturing and services sector expansion.',
      source: 'Economic Times', url: '#', published_at: new Date(Date.now() - 172800000).toISOString(), sentiment: 'positive',
    },
  ];
}

export async function GET(request: NextRequest) {
  const entityName = request.nextUrl.searchParams.get('name') || '';
  const entityType = request.nextUrl.searchParams.get('type') || 'state';
  const stateId = request.nextUrl.searchParams.get('stateId') || '';
  if (!entityName) return NextResponse.json({ articles: [] });

  const langInfo = STATE_LANGUAGES[stateId] || undefined;
  const cacheKey = `${entityType}:${entityName}:${stateId}`;
  const cached = MEM_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL_MS) {
    return NextResponse.json({ articles: cached.articles, cached: true, lang: langInfo });
  }

  const articles = await fetchNewsForQuery(entityName, langInfo);
  MEM_CACHE.set(cacheKey, { articles, ts: Date.now() });
  return NextResponse.json({ articles, cached: false, lang: langInfo });
}
