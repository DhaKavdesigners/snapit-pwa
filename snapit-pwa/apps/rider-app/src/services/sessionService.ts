import { supabase, DbShiftSession } from '@/lib/supabase';
import { RiderShiftSession, RiderShiftSessionStatus } from '@/types';

const LOCAL_SESSION_KEY = 'minnit_active_shift_session';

/** Map database shift session to app RiderShiftSession */
export function mapDbSessionToApp(dbSession: DbShiftSession): RiderShiftSession {
  return {
    id: dbSession.id,
    rider_id: dbSession.rider_id,
    zone_id: dbSession.zone_id,
    zone_name: dbSession.zone_name,
    started_at: dbSession.started_at,
    committed_until: dbSession.committed_until,
    ended_at: dbSession.ended_at,
    planned_duration_mins: dbSession.planned_duration_mins,
    actual_duration_mins: dbSession.actual_duration_mins,
    status: dbSession.status,
    ended_early: dbSession.ended_early,
    orders_completed: dbSession.orders_completed,
  };
}

/** Get cached local active shift session */
export function getLocalShiftSession(): RiderShiftSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (raw) {
      return JSON.parse(raw) as RiderShiftSession;
    }
  } catch {
    // Ignore error
  }
  return null;
}

/** Save active shift session locally */
export function saveLocalShiftSession(session: RiderShiftSession | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (session) {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
  } catch {
    // Ignore error
  }
}

/** Create a new shift session (persisted to Supabase and cached locally) */
export async function createShiftSession(params: {
  riderId: string;
  zoneId: string;
  zoneName: string;
  durationHours: number;
}): Promise<RiderShiftSession> {
  const startedAt = new Date();
  const durationMins = params.durationHours * 60;
  const committedUntil = new Date(startedAt.getTime() + durationMins * 60000);
  const sessionId = `session_${params.riderId}_${startedAt.getTime()}`;

  const session: RiderShiftSession = {
    id: sessionId,
    rider_id: params.riderId,
    zone_id: params.zoneId,
    zone_name: params.zoneName,
    started_at: startedAt.toISOString(),
    committed_until: committedUntil.toISOString(),
    planned_duration_mins: durationMins,
    status: 'ACTIVE',
    ended_early: false,
    orders_completed: 0,
  };

  saveLocalShiftSession(session);

  try {
    const { error } = await supabase.from('rider_shift_sessions').insert({
      id: session.id,
      rider_id: session.rider_id,
      zone_id: session.zone_id,
      zone_name: session.zone_name,
      started_at: session.started_at,
      committed_until: session.committed_until,
      planned_duration_mins: session.planned_duration_mins,
      status: session.status,
      ended_early: false,
      orders_completed: 0,
    });

    if (error) {
      console.warn('Shift session saved locally (Supabase table rider_shift_sessions not reachable):', error.message);
    }
  } catch (err) {
    console.warn('Network exception while saving shift session to Supabase:', err);
  }

  return session;
}

/** End a shift session */
export async function endShiftSession(
  sessionId: string,
  endedEarly: boolean = false,
  ordersCompleted: number = 0
): Promise<void> {
  const endedAt = new Date().toISOString();
  const localSession = getLocalShiftSession();

  if (localSession && localSession.id === sessionId) {
    saveLocalShiftSession(null);
  }

  try {
    await supabase
      .from('rider_shift_sessions')
      .update({
        ended_at: endedAt,
        status: (endedEarly ? 'ENDED_EARLY' : 'COMPLETED') as RiderShiftSessionStatus,
        ended_early: endedEarly,
        orders_completed: ordersCompleted,
        updated_at: endedAt,
      })
      .eq('id', sessionId);
  } catch {
    // Ignore network error
  }
}
