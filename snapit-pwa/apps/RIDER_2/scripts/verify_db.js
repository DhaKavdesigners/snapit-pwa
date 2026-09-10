// verify_db.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://satzvkmpatnbxpeiecvg.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Dj9NK5v5Dn1LiNhhg9BKsA_5QN5rtXp';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('--- 1. Testing query on rider_profiles with new session columns ---');
  const { data: profileCols, error: profileErr } = await supabase
    .from('rider_profiles')
    .select('id, name, phone, is_online, session_started_at, session_ends_at, session_duration_mins, available_for_order, current_session_id')
    .limit(1);

  if (profileErr) {
    console.error('❌ Error reading rider_profiles with session columns:', profileErr);
  } else {
    console.log('✅ Success! rider_profiles session columns exist and readable.');
    console.log('Sample profile record:', profileCols);
  }

  console.log('\n--- 2. Testing query on rider_shift_sessions table ---');
  const { data: sessionRows, error: sessionErr } = await supabase
    .from('rider_shift_sessions')
    .select('*')
    .limit(3);

  if (sessionErr) {
    console.error('❌ Error querying rider_shift_sessions:', sessionErr);
  } else {
    console.log('✅ Success! rider_shift_sessions exists and is readable.');
    console.log('Existing sessions count/sample:', sessionRows?.length, sessionRows);
  }

  console.log('\n--- 3. Testing end-to-end Session insert & update lifecycle test ---');
  // Use a test rider phone or an existing phone
  const testRiderId = profileCols && profileCols[0] ? profileCols[0].id : null;
  if (!testRiderId) {
    console.log('No rider profile found to test FK reference, skipping insert test.');
    return;
  }

  const testSessionId = 'verify-session-' + Date.now();

  const { data: inserted, error: insertErr } = await supabase
    .from('rider_shift_sessions')
    .insert({
      id: testSessionId,
      rider_id: testRiderId,
      zone_id: 'zone-1',
      zone_name: 'Robertsonpet',
      started_at: new Date().toISOString(),
      committed_until: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      planned_duration_mins: 120,
      status: 'ACTIVE',
      ended_early: false,
      orders_completed: 0,
    })
    .select()
    .single();

  if (insertErr) {
    console.warn('⚠️ Insert test check:', insertErr.message);
  } else {
    console.log('✅ Session INSERT verified successfully! Inserted ID:', inserted.id);

    // Update test session to COMPLETED
    const { error: updateErr } = await supabase
      .from('rider_shift_sessions')
      .update({
        ended_at: new Date().toISOString(),
        status: 'COMPLETED',
        actual_duration_mins: 120,
      })
      .eq('id', testSessionId);

    if (updateErr) {
      console.error('❌ Error updating test session:', updateErr);
    } else {
      console.log('✅ Session UPDATE verified successfully!');
    }

    // Clean up test session
    await supabase.from('rider_shift_sessions').delete().eq('id', testSessionId);
    console.log('✅ Cleaned up verification test row.');
  }

  console.log('\n--- Verification Finished ---');
}

run().catch(console.error);
