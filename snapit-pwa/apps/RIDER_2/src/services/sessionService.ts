import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SessionStatus = 'ACTIVE' | 'COMPLETED' | 'ENDED_EARLY' | 'CANCELLED';

export interface RiderSession {
  id: string;
  riderId: string;
  zoneId: string;
  zoneName: string;
  startedAt: number;       // epoch ms
  committedUntil: number;  // epoch ms
  endedAt: number | null;
  plannedDurationMins: number;   // 120 | 240 | 360
  actualDurationMins: number | null;
  status: SessionStatus;
  endedEarly: boolean;
  ordersCompleted: number;
}

export interface StartSessionParams {
  riderId: string;       // phone number (the rider_profiles.id)
  zoneId: string;
  zoneName: string;
  durationMins: number;  // 120 | 240 | 360
  lat?: number;
  lng?: number;
}

// ─── Start a new session ─────────────────────────────────────────────────────

export async function startRiderSession(
  params: StartSessionParams
): Promise<{ session?: RiderSession; error?: string }> {
  try {
    const now = new Date();
    const committedUntil = new Date(now.getTime() + params.durationMins * 60 * 1000);

    // 1. Insert into rider_shift_sessions log table
    const { data: sessionRow, error: insertError } = await supabase
      .from('rider_shift_sessions')
      .insert({
        rider_id: params.riderId,
        zone_id: params.zoneId,
        zone_name: params.zoneName,
        started_at: now.toISOString(),
        committed_until: committedUntil.toISOString(),
        planned_duration_mins: params.durationMins,
        status: 'ACTIVE',
        ended_early: false,
        orders_completed: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.warn('[sessionService] Failed to insert session:', insertError);
      // Don't block the rider — proceed anyway with local state
    }

    const sessionId = sessionRow?.id || `local-${Date.now()}`;

    // 2. Update rider_profiles live state
    const profileUpdate: Record<string, unknown> = {
      is_online: true,
      available_for_order: true,
      session_started_at: now.toISOString(),
      session_ends_at: committedUntil.toISOString(),
      session_duration_mins: params.durationMins,
      current_session_id: sessionId,
      selected_zone_id: params.zoneId,
      selected_zone_name: params.zoneName,
      updated_at: now.toISOString(),
    };

    if (params.lat !== undefined) profileUpdate.current_lat = params.lat;
    if (params.lng !== undefined) profileUpdate.current_lng = params.lng;

    await supabase
      .from('rider_profiles')
      .update(profileUpdate)
      .eq('id', params.riderId);

    const session: RiderSession = {
      id: sessionId,
      riderId: params.riderId,
      zoneId: params.zoneId,
      zoneName: params.zoneName,
      startedAt: now.getTime(),
      committedUntil: committedUntil.getTime(),
      endedAt: null,
      plannedDurationMins: params.durationMins,
      actualDurationMins: null,
      status: 'ACTIVE',
      endedEarly: false,
      ordersCompleted: 0,
    };

    return { session };
  } catch (err: any) {
    console.warn('[sessionService] startRiderSession error:', err);
    // Return a local session so the rider can still work even if DB is down
    const now = Date.now();
    return {
      session: {
        id: `local-${now}`,
        riderId: params.riderId,
        zoneId: params.zoneId,
        zoneName: params.zoneName,
        startedAt: now,
        committedUntil: now + params.durationMins * 60 * 1000,
        endedAt: null,
        plannedDurationMins: params.durationMins,
        actualDurationMins: null,
        status: 'ACTIVE',
        endedEarly: false,
        ordersCompleted: 0,
      },
    };
  }
}

// ─── End a session ───────────────────────────────────────────────────────────

export async function endRiderSession(
  sessionId: string,
  riderId: string,
  endedEarly: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date();

    // 1. Update the session log
    if (!sessionId.startsWith('local-')) {
      await supabase
        .from('rider_shift_sessions')
        .update({
          ended_at: now.toISOString(),
          status: endedEarly ? 'ENDED_EARLY' : 'COMPLETED',
          ended_early: endedEarly,
          updated_at: now.toISOString(),
        })
        .eq('id', sessionId);
    }

    // 2. Clear session fields on rider_profiles
    await supabase
      .from('rider_profiles')
      .update({
        is_online: false,
        available_for_order: false,
        session_started_at: null,
        session_ends_at: null,
        session_duration_mins: null,
        current_session_id: null,
        updated_at: now.toISOString(),
      })
      .eq('id', riderId);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Update availability (busy vs available) ─────────────────────────────────

export async function setRiderAvailability(
  riderId: string,
  available: boolean
): Promise<void> {
  try {
    await supabase
      .from('rider_profiles')
      .update({
        available_for_order: available,
        updated_at: new Date().toISOString(),
      })
      .eq('id', riderId);
  } catch (err) {
    console.warn('[sessionService] setRiderAvailability error:', err);
  }
}

// ─── Record completed order in session ───────────────────────────────────────

export async function recordSessionOrderCompleted(sessionId: string): Promise<void> {
  try {
    if (!sessionId || sessionId.startsWith('local-')) return;
    const { data } = await supabase
      .from('rider_shift_sessions')
      .select('orders_completed')
      .eq('id', sessionId)
      .maybeSingle();

    if (data) {
      await supabase
        .from('rider_shift_sessions')
        .update({
          orders_completed: (data.orders_completed || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    }
  } catch (err) {
    console.warn('[sessionService] recordSessionOrderCompleted error:', err);
  }
}


// ─── Restore session from DB on app reopen ───────────────────────────────────

export async function fetchActiveSession(
  riderId: string
): Promise<RiderSession | null> {
  try {
    const { data, error } = await supabase
      .from('rider_shift_sessions')
      .select('*')
      .eq('rider_id', riderId)
      .eq('status', 'ACTIVE')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    const committedUntil = new Date(data.committed_until).getTime();
    // If already expired, return null (session over)
    if (committedUntil < Date.now()) return null;

    return {
      id: data.id,
      riderId: data.rider_id,
      zoneId: data.zone_id,
      zoneName: data.zone_name,
      startedAt: new Date(data.started_at).getTime(),
      committedUntil,
      endedAt: data.ended_at ? new Date(data.ended_at).getTime() : null,
      plannedDurationMins: data.planned_duration_mins,
      actualDurationMins: data.actual_duration_mins,
      status: data.status as SessionStatus,
      endedEarly: data.ended_early,
      ordersCompleted: data.orders_completed || 0,
    };
  } catch (err) {
    return null;
  }
}

// ─── Format remaining time ────────────────────────────────────────────────────

export function formatSessionRemaining(committedUntil: number): string {
  const remaining = committedUntil - Date.now();
  if (remaining <= 0) return 'Ended';
  const totalMins = Math.floor(remaining / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m}m`;
}

export function formatTime12h(ts: number): string {
  const d = new Date(ts);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}
