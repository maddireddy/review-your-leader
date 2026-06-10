import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('epics')
      .select('*')
      .order('id');

    if (error) throw error;
    return NextResponse.json({ epics: data });
  } catch {
    // Fallback static data if Supabase not yet set up
    return NextResponse.json({
      epics: [
        {
          id: 'ramayana',
          title: 'Valmiki Ramayana',
          title_hindi: 'वाल्मीकि रामायण',
          description: 'The ancient Sanskrit epic narrating the life of Rama. 7 Kandas, ~24,000 slokas.',
          book_count: 7,
          total_slokas: 24000,
          author: 'Valmiki',
          period: '5th–4th century BCE',
        },
        {
          id: 'mahabharata',
          title: 'Mahabharata',
          title_hindi: 'महाभारत',
          description: 'The longest epic poem ever written. 18 Parvas, 100,000+ slokas including the Bhagavad Gita.',
          book_count: 18,
          total_slokas: 100000,
          author: 'Vyasa',
          period: '8th–9th century BCE (traditional)',
        },
      ],
    });
  }
}
