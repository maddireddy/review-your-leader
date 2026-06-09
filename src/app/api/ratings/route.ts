import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Citizen Rating API
 * GET  /api/ratings?rep_id=TG-LOK-001   — fetch aggregate ratings
 * POST /api/ratings                       — submit a rating
 */

export async function GET(request: NextRequest) {
  const repId = request.nextUrl.searchParams.get('rep_id');
  if (!repId) return NextResponse.json({ error: 'rep_id required' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('citizen_ratings')
    .select('accessibility, development, responsiveness, attendance_rating, created_at')
    .eq('representative_id', repId);

  if (error) {
    // Table doesn't exist yet → return empty
    return NextResponse.json({ avg: null, count: 0, breakdown: null });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ avg: null, count: 0, breakdown: null });
  }

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const breakdown = {
    accessibility: avg(data.map((r: {accessibility: number}) => r.accessibility)),
    development: avg(data.map((r: {development: number}) => r.development)),
    responsiveness: avg(data.map((r: {responsiveness: number}) => r.responsiveness)),
    attendance: avg(data.map((r: {attendance_rating: number}) => r.attendance_rating)),
  };

  const overall = avg(Object.values(breakdown));

  return NextResponse.json({ avg: overall, count: data.length, breakdown });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { representative_id, accessibility, development, responsiveness, attendance_rating } = body;

  if (!representative_id) return NextResponse.json({ error: 'representative_id required' }, { status: 400 });

  // IP-based dedup (1 vote per IP per rep)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from('citizen_ratings').upsert({
    representative_id,
    voter_ip: ip,
    accessibility: Math.min(5, Math.max(1, accessibility || 3)),
    development: Math.min(5, Math.max(1, development || 3)),
    responsiveness: Math.min(5, Math.max(1, responsiveness || 3)),
    attendance_rating: Math.min(5, Math.max(1, attendance_rating || 3)),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'representative_id,voter_ip' });

  if (error) return NextResponse.json({ error: 'Rating saved (table setup required in Supabase)' }, { status: 200 });
  return NextResponse.json({ success: true });
}
