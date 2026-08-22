import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.info(
    '⚡ [SnapIt Merchant] Running in Local Counter Demo mode. Connect real Supabase by setting VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in apps/merchant-app/.env'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-snapit.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
