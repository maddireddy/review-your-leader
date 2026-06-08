import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      // Return a no-op client if Supabase isn't configured yet
      return {
        from: () => ({
          select: () => ({ eq: () => ({ gt: () => ({ single: () => Promise.resolve({ data: null }) }) }) }),
          upsert: () => Promise.resolve({ error: null }),
        }),
      } as unknown as SupabaseClient;
    }
    _admin = createClient(url, key);
  }
  return _admin;
}
