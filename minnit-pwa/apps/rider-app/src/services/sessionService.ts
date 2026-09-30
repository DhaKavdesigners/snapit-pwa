import { supabase, DbShiftSession } from '@/lib/supabase';
import { RiderShiftSession, RiderShiftSessionStatus } from '@/types';

export const LOCAL_SESSION_KEY = 'minnit_active_shift_session';

/** Supported session durations in hours */
export const ALLOWED_SESSION_DURATIONS = [2, 3, 4] as const;
export type SessionDurationHours = (typeof ALLOWED_SESSION_DURATIONS)[number];
export const DEFAULT_SESSION_DURATION: SessionDurationHours = 3;

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

/** Check if session is currently within its active validity window */
export function isSessionValidAndActive(
  session: RiderShiftSession | null,
  now: number = Date.now()
): boolean {
  if (!session || session.status !== 'ACTIVE') return false;
  const endMs = new Date(session.committed_until).getTime();
  return now < endMs;
}

/** Calculate remaining milliseconds from timestamps */
export function getSessionRemainingMs(
  session: RiderShiftSession | null,
  now: number = Date.now()
): number {
  if (!session) return 0;
  const endMs = new Date(session.committed_until).getTime();
  return Math.max(0, endMs - now);
}

/** Format remaining time as "Xh Ym remaining" */
export function formatRemainingSessionTime(remainingMs: number): string {
  if (remainingMs <= 0) return '0h 00m remaining';
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${mins.toString().padStart(2, '0')}m remaining`;
  }
  return `${mins}m remaining`;
}

/**
 * Break duration allowance in minutes based on planned riding session duration:
 * - 2 Hours -> 15 min break (single break)
 * - 3 Hours -> 25 min break
 * - 4 Hours -> 30 min break
 */
export function getSessionBreakAllowanceMinutes(plannedDurationMins?: number): number {
  if (!plannedDurationMins) return 25; // default for 3h
  if (plannedDurationMins <= 120) return 15; // 2h -> 15 min
  if (plannedDurationMins <= 180) return 25; // 3h -> 25 min
  return 30; // 4h -> 30 min
}

/**
 * Format remaining break time countdown as "Xm Ys"
 */
export function formatRemainingBreakTime(remainingMs: number): string {
  if (remainingMs <= 0) return '0m 00s';
  const totalSecs = Math.ceil(remainingMs / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

/** Create a new riding session (2, 3, or 4 hours) */
export async function createShiftSession(params: {
  riderId: string;
  zoneId: string;
  zoneName: string;
  durationHours: number;
}): Promise<RiderShiftSession> {
  const duration = ALLOWED_SESSION_DURATIONS.includes(params.durationHours as SessionDurationHours)
    ? params.durationHours
    : DEFAULT_SESSION_DURATION;

  const startedAt = new Date();
  const durationMins = duration * 60;
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

  // Sync with Supabase (non-blocking with graceful local fallback)
  try {
    const cleanPhone = params.riderId.replace(/[^0-9+]/g, '');

    await Promise.allSettled([
      supabase.from('rider_shift_sessions').insert({
        id: session.id,
        rider_id: cleanPhone || session.rider_id,
        zone_id: session.zone_id,
        zone_name: session.zone_name,
        started_at: session.started_at,
        committed_until: session.committed_until,
        planned_duration_mins: session.planned_duration_mins,
        status: session.status,
        ended_early: false,
        orders_completed: 0,
      }),
      cleanPhone
        ? supabase
            .from('rider_profiles')
            .update({
              session_started_at: session.started_at,
              session_ends_at: session.committed_until,
              session_duration_mins: session.planned_duration_mins,
              available_for_order: true,
              current_session_id: session.id,
              selected_zone_id: session.zone_id,
              selected_zone_name: session.zone_name,
              is_online: true,
              updated_at: new Date().toISOString(),
            })
            .eq('phone', cleanPhone)
        : Promise.resolve(),
    ]);
  } catch (err) {
    console.warn('Shift session stored locally (Supabase sync exception):', err);
  }

  return session;
}

/** Extend an active session by 1 hour (+60 minutes) */
export async function extendShiftSession(
  sessionId: string,
  addHours: number = 1
): Promise<RiderShiftSession | null> {
  const localSession = getLocalShiftSession();
  if (!localSession || localSession.id !== sessionId) {
    return null;
  }

  const currentEndMs = new Date(localSession.committed_until).getTime();
  const additionalMs = addHours * 60 * 60000;
  const newEndMs = Math.max(Date.now(), currentEndMs) + additionalMs;
  const newCommittedUntil = new Date(newEndMs).toISOString();
  const newPlannedDuration = localSession.planned_duration_mins + addHours * 60;

  const updatedSession: RiderShiftSession = {
    ...localSession,
    committed_until: newCommittedUntil,
    planned_duration_mins: newPlannedDuration,
  };

  saveLocalShiftSession(updatedSession);

  try {
    const cleanPhone = updatedSession.rider_id.replace(/[^0-9+]/g, '');

    await Promise.allSettled([
      supabase
        .from('rider_shift_sessions')
        .update({
          committed_until: newCommittedUntil,
          planned_duration_mins: newPlannedDuration,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId),
      cleanPhone
        ? supabase
            .from('rider_profiles')
            .update({
              session_ends_at: newCommittedUntil,
              session_duration_mins: newPlannedDuration,
              updated_at: new Date().toISOString(),
            })
            .eq('phone', cleanPhone)
        : Promise.resolve(),
    ]);
  } catch (err) {
    console.warn('Session extension stored locally (Supabase sync exception):', err);
  }

  return updatedSession;
}

/** Increment orders completed count in current session */
export async function incrementSessionOrders(
  sessionId: string,
  newOrderCount: number
): Promise<void> {
  const localSession = getLocalShiftSession();
  if (localSession && localSession.id === sessionId) {
    const updated = { ...localSession, orders_completed: newOrderCount };
    saveLocalShiftSession(updated);
  }

  try {
    await supabase
      .from('rider_shift_sessions')
      .update({
        orders_completed: newOrderCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);
  } catch {
    // Non-blocking
  }
}

/** End a shift session (normal expiry or early ending) */
export async function endShiftSession(
  sessionId: string,
  endedEarly: boolean = false,
  ordersCompleted: number = 0,
  riderPhone?: string
): Promise<{
  ordersCompleted: number;
  actualDurationMins: number;
  plannedDurationMins: number;
}> {
  const endedAt = new Date().toISOString();
  const localSession = getLocalShiftSession();

  let actualDurationMins = 0;
  let plannedDurationMins = 180;
  let finalOrdersCompleted = ordersCompleted;

  if (localSession && localSession.id === sessionId) {
    const startMs = new Date(localSession.started_at).getTime();
    actualDurationMins = Math.max(1, Math.round((Date.now() - startMs) / 60000));
    plannedDurationMins = localSession.planned_duration_mins;
    finalOrdersCompleted = Math.max(ordersCompleted, localSession.orders_completed);
    saveLocalShiftSession(null);
  }

  try {
    const cleanPhone = (riderPhone || localSession?.rider_id || '').replace(/[^0-9+]/g, '');

    await Promise.allSettled([
      supabase
        .from('rider_shift_sessions')
        .update({
          ended_at: endedAt,
          actual_duration_mins: actualDurationMins,
          status: (endedEarly ? 'ENDED_EARLY' : 'COMPLETED') as RiderShiftSessionStatus,
          ended_early: endedEarly,
          orders_completed: finalOrdersCompleted,
          updated_at: endedAt,
        })
        .eq('id', sessionId),
      cleanPhone
        ? supabase
            .from('rider_profiles')
            .update({
              is_online: false,
              available_for_order: false,
              current_session_id: null,
              session_ends_at: endedAt,
              updated_at: endedAt,
            })
            .eq('phone', cleanPhone)
        : Promise.resolve(),
    ]);
  } catch (err) {
    console.warn('Session termination exception in Supabase:', err);
  }

  return {
    ordersCompleted: finalOrdersCompleted,
    actualDurationMins,
    plannedDurationMins,
  };
}
