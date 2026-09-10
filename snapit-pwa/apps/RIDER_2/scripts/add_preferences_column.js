// add_preferences_column.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://satzvkmpatnbxpeiecvg.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Dj9NK5v5Dn1LiNhhg9BKsA_5QN5rtXp';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('--- 1. Testing if riding_preferences column exists on rider_profiles ---');
  const { data, error } = await supabase
    .from('rider_profiles')
    .select('id, riding_preferences')
    .limit(1);

  if (error) {
    console.log('Column might not exist yet or error:', error.message);
  } else {
    console.log('✅ Success! Column riding_preferences is already accessible:', data);
  }
}

run().catch(console.error);
