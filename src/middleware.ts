import { NextRequest, NextResponse } from 'next/server';

// Sliding-window rate limiter (in-memory, per edge instance).
// Good enough for serverless: each cold-start resets the window, which is
// fine because cold-starts are infrequent relative to the limits set here.
const windows = new Map<string, { count: number; resetAt: number }>();

const LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/api/chat':        { max: 20,  windowMs: 60_000 },   // 20 req/min per IP
  '/api/search':      { max: 30,  windowMs: 60_000 },
  '/api/state-live':  { max: 10,  windowMs: 60_000 },   // POST pipeline — expensive
  '/api/news':        { max: 30,  windowMs: 60_000 },
  '/api/state-insight':{ max: 15, windowMs: 60_000 },
  '/api/ratings':     { max: 20,  windowMs: 60_000 },
  '/api/issues':      { max: 20,  windowMs: 60_000 },
};

function getLimit(pathname: string) {
  for (const [prefix, cfg] of Object.entries(LIMITS)) {
    if (pathname.startsWith(prefix)) return cfg;
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const limit = getLimit(pathname);
  if (!limit) return NextResponse.next();

  // Only rate-limit POST/PUT/DELETE on expensive routes; GET is cheaper
  if (pathname === '/api/state-live' && request.method === 'GET') {
    return NextResponse.next();
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const key = `${ip}:${pathname}`;
  const now = Date.now();
  const entry = windows.get(key);

  if (!entry || now > entry.resetAt) {
    windows.set(key, { count: 1, resetAt: now + limit.windowMs });
    return NextResponse.next();
  }

  entry.count++;
  if (entry.count > limit.max) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
          'X-RateLimit-Limit': String(limit.max),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(limit.max));
  response.headers.set('X-RateLimit-Remaining', String(limit.max - entry.count));
  return response;
}

export const config = {
  matcher: [
    '/api/chat/:path*',
    '/api/search/:path*',
    '/api/state-live/:path*',
    '/api/news/:path*',
    '/api/state-insight/:path*',
    '/api/ratings/:path*',
    '/api/issues/:path*',
  ],
};
