import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');
  const epicId = request.nextUrl.searchParams.get('epicId');

  if (!sessionId) return NextResponse.json({ progress: [] });

  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('user_epic_progress')
      .select('episode_id, position_seconds, completed, updated_at')
      .eq('session_id', sessionId);

    if (epicId) query = query.eq('epic_id', epicId);

    const { data } = await query;
    return NextResponse.json({ progress: data || [] });
  } catch {
    return NextResponse.json({ progress: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, epicId, episodeId, positionSeconds, completed } = await request.json();
    if (!sessionId || !epicId || !episodeId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    await supabase.from('user_epic_progress').upsert(
      {
        session_id: sessionId,
        epic_id: epicId,
        episode_id: episodeId,
        position_seconds: positionSeconds || 0,
        completed: completed || false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'session_id,episode_id' }
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
