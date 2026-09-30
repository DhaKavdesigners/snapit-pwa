import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://satzvkmpatnbxpeiecvg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Dj9NK5v5Dn1LiNhhg9BKsA_5QN5rtXp';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

