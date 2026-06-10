import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  const epicId = request.nextUrl.searchParams.get('epicId');
  const bookNumber = request.nextUrl.searchParams.get('book');

  if (!epicId) return NextResponse.json({ error: 'epicId required' }, { status: 400 });

  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('epic_episodes')
      .select('*')
      .eq('epic_id', epicId)
      .order('book_number')
      .order('episode_number');

    if (bookNumber) {
      query = query.eq('book_number', parseInt(bookNumber));
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ episodes: data });
  } catch {
    return NextResponse.json({ episodes: [] });
  }
}
