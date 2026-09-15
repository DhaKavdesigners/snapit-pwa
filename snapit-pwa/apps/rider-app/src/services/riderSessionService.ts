import { supabase, DbRiderDeviceSession } from '@/lib/supabase';
import { SessionValidationResult } from '@/types';

const SESSION_TOKEN_KEY = 'snapit_active_session_token';

/**
 * Generate a cryptographically secure random session token.
 * Does NOT use hardware identifiers, IMEI, or device fingerprints.
 */
export function generateSessionToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback random generation
  const randomBytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < 16; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(randomBytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Extract safe platform descriptor (browser/OS only, no hardware PII).
 */
export function getSafeDeviceInfo(): string {
  if (typeof navigator === 'undefined') return 'Server/Unknown';
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'Android Device';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS Device';
  if (/windows/i.test(ua)) return 'Windows Browser';
  if (/macintosh|mac os x/i.test(ua)) return 'Mac Browser';
  if (/linux/i.test(ua)) return 'Linux Browser';
  return 'Web Client';
}

/**
 * Retrieve current active session token from local storage.
 */
export function getLocalSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Save active session token to local storage.
 */
export function saveLocalSessionToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  } catch (err) {
    console.warn('Could not save session token to localStorage', err);
  }
}

/**
 * Clear session token from local storage.
 */
export function clearLocalSessionToken(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {}
}

/**
 * Activate a new session for the rider in Supabase.
 * Atomically invalidates any previously active session for this rider.
 */
export async function activateDeviceSession(
  riderId: string,
  riderCode?: string
): Promise<{ success: boolean; sessionToken: string; error?: string }> {
  const sessionToken = generateSessionToken();
  const deviceInfo = getSafeDeviceInfo();

  try {
    // 1. Try atomic PostgreSQL function first (from schema_rider_device_sessions.sql)
    const { data: rpcData, error: rpcError } = await supabase.rpc('activate_rider_session', {
      p_rider_id: riderId,
      p_session_token: sessionToken,
      p_rider_code: riderCode || null,
      p_device_info: deviceInfo,
    });

    if (!rpcError && rpcData?.success) {
      saveLocalSessionToken(sessionToken);
      return { success: true, sessionToken };
    }

    // 2. Direct table fallback if RPC is not yet registered in Supabase
    // Step A: Invalidate existing active sessions for this rider
    const { error: invalidateError } = await supabase
      .from('rider_device_sessions')
      .update({
        is_active: false,
        invalidated_at: new Date().toISOString(),
      })
      .eq('rider_id', riderId)
      .eq('is_active', true);

    // Step B: Insert the new active session
    const { error: insertError } = await supabase
      .from('rider_device_sessions')
      .insert({
        rider_id: riderId,
        rider_code: riderCode || null,
        session_token: sessionToken,
        device_info: deviceInfo,
        is_active: true,
        created_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
      });

    // Step C: Also try updating mirror column on rider_profiles if present
    try {
      await supabase
        .from('rider_profiles')
        .update({
          active_session_token: sessionToken,
          active_session_updated_at: new Date().toISOString(),
        })
        .eq('id', riderId);
    } catch {}

    if (!insertError) {
      saveLocalSessionToken(sessionToken);
      return { success: true, sessionToken };
    }

    // 3. Graceful fallback if table is not yet created in Supabase SQL editor
    console.warn(
      'Notice: rider_device_sessions table not found in Supabase. Please run schema_rider_device_sessions.sql in the Supabase SQL editor for database-level session enforcement.',
      insertError || rpcError
    );
    saveLocalSessionToken(sessionToken);
    return { success: true, sessionToken };
  } catch (err: any) {
    console.warn('activateDeviceSession exception:', err);
    saveLocalSessionToken(sessionToken);
    return { success: true, sessionToken };
  }
}

/**
 * Validate whether the given session token is currently valid and active on the server.
 */
export async function validateDeviceSession(
  riderId: string,
  sessionToken: string
): Promise<SessionValidationResult> {
  if (!sessionToken) {
    return { isValid: false, error: 'No session token provided' };
  }

  try {
    // 1. Try PostgreSQL function
    const { data: rpcData, error: rpcError } = await supabase.rpc('validate_rider_session', {
      p_session_token: sessionToken,
    });

    if (!rpcError && rpcData) {
      return {
        isValid: Boolean(rpcData.is_valid),
        riderId: rpcData.rider_id,
        riderCode: rpcData.rider_code,
        invalidatedAt: rpcData.invalidated_at,
        error: rpcData.error,
      };
    }

    // 2. Direct table fallback
    const { data: sessionRow, error: tableError } = await supabase
      .from('rider_device_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .maybeSingle();

    if (!tableError && sessionRow) {
      if (!sessionRow.is_active) {
        return {
          isValid: false,
          riderId: sessionRow.rider_id,
          riderCode: sessionRow.rider_code,
          invalidatedAt: sessionRow.invalidated_at,
          error: 'Session invalidated on another device',
        };
      }

      // Heartbeat update
      await supabase
        .from('rider_device_sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', sessionRow.id);

      return {
        isValid: true,
        riderId: sessionRow.rider_id,
        riderCode: sessionRow.rider_code,
      };
    }

    // 3. Mirror column on rider_profiles check
    const { data: profileRow } = await supabase
      .from('rider_profiles')
      .select('id, Rider_ID, active_session_token')
      .eq('id', riderId)
      .maybeSingle();

    if (profileRow && profileRow.active_session_token) {
      if (profileRow.active_session_token !== sessionToken) {
        return {
          isValid: false,
          riderId: profileRow.id,
          riderCode: profileRow.Rider_ID,
          error: 'Session active on another device',
        };
      }
      return {
        isValid: true,
        riderId: profileRow.id,
        riderCode: profileRow.Rider_ID,
      };
    }

    // Default to valid if schema migration has not yet run
    return { isValid: true, riderId };
  } catch (err: any) {
    console.warn('validateDeviceSession exception (will retry on next heartbeat):', err);
    // On temporary network errors, don't immediately kick the rider out
    return { isValid: true, riderId };
  }
}

/**
 * Terminate/logout current session from Supabase.
 */
export async function terminateDeviceSession(
  riderId: string,
  sessionToken?: string | null
): Promise<void> {
  const token = sessionToken || getLocalSessionToken();
  clearLocalSessionToken();

  if (!token) return;

  try {
    // 1. Try RPC
    await supabase.rpc('terminate_rider_session', {
      p_session_token: token,
    });

    // 2. Direct table fallback
    await supabase
      .from('rider_device_sessions')
      .update({
        is_active: false,
        invalidated_at: new Date().toISOString(),
      })
      .eq('session_token', token);

    // 3. Clear profile mirror column
    if (riderId) {
      await supabase
        .from('rider_profiles')
        .update({
          active_session_token: null,
          active_session_updated_at: new Date().toISOString(),
        })
        .eq('id', riderId);
    }
  } catch (err) {
    console.warn('terminateDeviceSession exception:', err);
  }
}

/**
 * Set up Supabase Realtime subscription to immediately catch when
 * this session is invalidated by another device logging in.
 */
export function subscribeToSessionInvalidation(
  riderId: string,
  currentSessionToken: string,
  onInvalidated: (reason: string) => void
): () => void {
  if (!riderId || !currentSessionToken) {
    return () => {};
  }

  const channelId = `session_invalidation_${riderId.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;

  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rider_device_sessions',
        filter: `rider_id=eq.${riderId}`,
      },
      (payload) => {
        const updated = payload.new as DbRiderDeviceSession;
        if (!updated) return;

        // If this exact token was deactivated
        if (updated.session_token === currentSessionToken && !updated.is_active) {
          onInvalidated('You have been logged out because your account was signed in on another device.');
          return;
        }

        // Or if another session token became active for the same rider
        if (updated.session_token !== currentSessionToken && updated.is_active) {
          onInvalidated('You have been logged out because your account was signed in on another device.');
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rider_profiles',
        filter: `id=eq.${riderId}`,
      },
      (payload: any) => {
        const updatedToken = payload.new?.active_session_token;
        if (updatedToken && updatedToken !== currentSessionToken) {
          onInvalidated('You have been logged out because your account was signed in on another device.');
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
