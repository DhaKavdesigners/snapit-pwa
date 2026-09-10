import { supabase } from '@/lib/supabase';
import { AvailabilityWindow, PreferenceWindowId } from '@/types';

export const AVAILABILITY_WINDOWS: AvailabilityWindow[] = [
  {
    id: 'MORNING',
    label: 'Morning',
    emoji: '🌅',
    timeRange: '7:00 AM – 11:30 AM',
    description: 'Early morning demand',
    startHour: 7,
    startMinute: 0,
    endHour: 11,
    endMinute: 30,
  },
  {
    id: 'AFTERNOON',
    label: 'Afternoon',
    emoji: '☀️',
    timeRange: '11:30 AM – 4:30 PM',
    description: 'Lunch & daytime demand',
    startHour: 11,
    startMinute: 30,
    endHour: 16,
    endMinute: 30,
  },
  {
    id: 'EVENING',
    label: 'Evening',
    emoji: '🌆',
    timeRange: '4:30 PM – 8:00 PM',
    description: 'After college & work',
    startHour: 16,
    startMinute: 30,
    endHour: 20,
    endMinute: 0,
  },
  {
    id: 'NIGHT',
    label: 'Night',
    emoji: '🌙',
    timeRange: '8:00 PM – 11:30 PM',
    description: 'Dinner & late-night demand',
    startHour: 20,
    startMinute: 0,
    endHour: 23,
    endMinute: 30,
  },
];

const LOCAL_STORAGE_KEY_PREFIX = 'minnit_rider_preferences_';
const PENDING_SYNC_KEY = 'minnit_pending_preference_sync';

/** Safe haptic feedback trigger */
export function triggerHaptic(pattern: number | number[] = 10): void {
  if (typeof window !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors
    }
  }
}

/** Get IST minutes from midnight for accurate KGF time calculation */
export function getIstMinutesFromMidnight(date: Date = new Date()): number {
  // Convert date to IST (Asia/Kolkata, UTC+5:30)
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const istOffset = 5.5 * 3600000;
  const istDate = new Date(utc + istOffset);

  return istDate.getHours() * 60 + istDate.getMinutes();
}

/** Determine which availability window is active right now in KGF */
export function getActivePreferenceWindow(date: Date = new Date()): PreferenceWindowId | null {
  const currentMinutes = getIstMinutesFromMidnight(date);

  for (const win of AVAILABILITY_WINDOWS) {
    const startMins = win.startHour * 60 + win.startMinute;
    const endMins = win.endHour * 60 + win.endMinute;

    if (currentMinutes >= startMins && currentMinutes < endMins) {
      return win.id;
    }
  }

  return null;
}

/** Get local preferences from localStorage */
export function getLocalPreferences(phone?: string): PreferenceWindowId[] {
  if (typeof window === 'undefined') return [];

  const key = phone ? `${LOCAL_STORAGE_KEY_PREFIX}${phone}` : `${LOCAL_STORAGE_KEY_PREFIX}guest`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter((id: unknown): id is PreferenceWindowId =>
          typeof id === 'string' && ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'].includes(id)
        );
      }
    }
  } catch {
    // Ignore localStorage parse errors
  }

  return [];
}

/** Save preferences locally to localStorage */
export function saveLocalPreferences(preferences: PreferenceWindowId[], phone?: string): void {
  if (typeof window === 'undefined') return;

  const key = phone ? `${LOCAL_STORAGE_KEY_PREFIX}${phone}` : `${LOCAL_STORAGE_KEY_PREFIX}guest`;
  try {
    localStorage.setItem(key, JSON.stringify(preferences));
  } catch {
    // Ignore localStorage storage errors
  }
}

/** Save rider availability preferences to Supabase with resilient offline fallback */
export async function saveRiderPreferences(
  phone: string,
  preferences: PreferenceWindowId[]
): Promise<{ success: boolean; syncedWithServer: boolean; error?: string }> {
  // Always update local cache first
  saveLocalPreferences(preferences, phone);

  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  if (!cleanPhone) {
    return { success: true, syncedWithServer: false, error: 'No phone number for database sync' };
  }

  try {
    const { error } = await supabase
      .from('rider_profiles')
      .update({
        riding_preferences: preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('phone', cleanPhone);

    if (error) {
      // Queue for later sync if network or schema issue occurs
      queuePendingSync(cleanPhone, preferences);
      return { success: true, syncedWithServer: false, error: error.message };
    }

    clearPendingSync(cleanPhone);
    return { success: true, syncedWithServer: true };
  } catch (err: unknown) {
    queuePendingSync(cleanPhone, preferences);
    const errorMessage = err instanceof Error ? err.message : 'Network error during sync';
    return { success: true, syncedWithServer: false, error: errorMessage };
  }
}

/** Fetch rider availability preferences from Supabase, falling back to localStorage */
export async function fetchRiderPreferences(phone: string): Promise<PreferenceWindowId[]> {
  const local = getLocalPreferences(phone);

  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  if (!cleanPhone) return local;

  try {
    const { data, error } = await supabase
      .from('rider_profiles')
      .select('riding_preferences')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (!error && data?.riding_preferences && Array.isArray(data.riding_preferences)) {
      const serverPreferences = data.riding_preferences.filter((id: unknown): id is PreferenceWindowId =>
        typeof id === 'string' && ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'].includes(id)
      );

      // Save to localStorage for instant offline access
      saveLocalPreferences(serverPreferences, phone);
      return serverPreferences;
    }
  } catch {
    // Fall back to local
  }

  return local;
}

// ─── Offline Queue Helpers ───────────────────────────────────────────────────

function queuePendingSync(phone: string, preferences: PreferenceWindowId[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      PENDING_SYNC_KEY,
      JSON.stringify({ phone, preferences, timestamp: Date.now() })
    );
  } catch {
    // Ignore
  }
}

function clearPendingSync(phone: string): void {
  if (typeof window === 'undefined') return;
  try {
    const pending = localStorage.getItem(PENDING_SYNC_KEY);
    if (pending) {
      const parsed = JSON.parse(pending);
      if (parsed?.phone === phone) {
        localStorage.removeItem(PENDING_SYNC_KEY);
      }
    }
  } catch {
    // Ignore
  }
}

/** Retry pending sync if back online */
export async function flushPendingPreferencesSync(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const pending = localStorage.getItem(PENDING_SYNC_KEY);
    if (!pending) return;

    const { phone, preferences } = JSON.parse(pending);
    if (phone && Array.isArray(preferences)) {
      await saveRiderPreferences(phone, preferences);
    }
  } catch {
    // Ignore
  }
}
