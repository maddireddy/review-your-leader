import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Constituency Issue Tracker API
 * GET  /api/issues?constituency_id=TG-LOK-BHONGIR  — list issues
 * POST /api/issues                                   — submit new issue
 */

export type IssueCategory = 'roads' | 'water' | 'power' | 'healthcare' | 'education' | 'employment' | 'environment' | 'other';
export type IssueStatus = 'open' | 'in_progress' | 'resolved';

export async function GET(request: NextRequest) {
  const constituencyId = request.nextUrl.searchParams.get('constituency_id');
  const stateId = request.nextUrl.searchParams.get('state_id');

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('constituency_issues')
    .select('id, title, category, status, upvotes, created_at, constituency_id, state_id')
    .order('upvotes', { ascending: false })
    .limit(20);

  if (constituencyId) query = query.eq('constituency_id', constituencyId);
  else if (stateId) query = query.eq('state_id', stateId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ issues: [], total: 0 });
  return NextResponse.json({ issues: data || [], total: data?.length || 0 });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { constituency_id, state_id, title, description, category } = body;

  if (!constituency_id || !title) {
    return NextResponse.json({ error: 'constituency_id and title required' }, { status: 400 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.from('constituency_issues').insert({
    constituency_id,
    state_id,
    title: title.slice(0, 200),
    description: description?.slice(0, 1000),
    category: category || 'other',
    status: 'open',
    upvotes: 1,
    reporter_ip: ip,
    created_at: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: 'Issue submitted (Supabase setup required)', mock: true }, { status: 200 });
  return NextResponse.json({ success: true, issue: data });
}
