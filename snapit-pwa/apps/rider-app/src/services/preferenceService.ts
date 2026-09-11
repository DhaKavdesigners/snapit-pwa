import { supabase } from '@/lib/supabase';
import { AvailabilityWindow, PreferenceWindowId } from '@/types';

export const AVAILABILITY_WINDOWS: AvailabilityWindow[] = [
  {
    id: 'MORNING',
    label: 'Morning',
    emoji: '🌅',
    timeRange: '07:00 AM – 11:00 AM',
    description: 'Breakfast & morning rush',
    startHour: 7,
    startMinute: 0,
    endHour: 11,
    endMinute: 0,
  },
  {
    id: 'AFTERNOON',
    label: 'Afternoon',
    emoji: '☀️',
    timeRange: '11:00 AM – 04:00 PM',
    description: 'Lunch & daytime peak',
    startHour: 11,
    startMinute: 0,
    endHour: 16,
    endMinute: 0,
  },
  {
    id: 'EVENING',
    label: 'Evening',
    emoji: '🌆',
    timeRange: '04:00 PM – 07:00 PM',
    description: 'Snacks & teatime orders',
    startHour: 16,
    startMinute: 0,
    endHour: 19,
    endMinute: 0,
  },
  {
    id: 'NIGHT',
    label: 'Night',
    emoji: '🌙',
    timeRange: '07:00 PM – 11:30 PM',
    description: 'Dinner & late-night feast',
    startHour: 19,
    startMinute: 0,
    endHour: 23,
    endMinute: 30,
  },
];

// ─── Cutoff Definitions ───────────────────────────────────────────────────────
// Rules:
// - Afternoon, Evening, Night: rider must select at least 2 hours before window start.
// - Morning: exceptional cutoff until 08:00 AM.
// - If cutoff has passed for today: cannot select for today, next day only.

export interface WindowCutoffConfig {
  hour: number;
  minute: number;
  label: string;
  explanation: string;
}

export const WINDOW_CUTOFFS: Record<PreferenceWindowId, WindowCutoffConfig> = {
  MORNING: {
    hour: 8,
    minute: 0,
    label: '08:00 AM',
    explanation: 'Special morning exception (till 08:00 AM)',
  },
  AFTERNOON: {
    hour: 9,
    minute: 0,
    label: '09:00 AM',
    explanation: '2 hours before 11:00 AM start',
  },
  EVENING: {
    hour: 14,
    minute: 0,
    label: '02:00 PM',
    explanation: '2 hours before 04:00 PM start',
  },
  NIGHT: {
    hour: 17,
    minute: 0,
    label: '05:00 PM',
    explanation: '2 hours before 07:00 PM start',
  },
};

const LOCAL_STORAGE_KEY_PREFIX = 'minnit_rider_preferences_';
const MULTIDAY_STORAGE_KEY_PREFIX = 'minnit_multiday_preferences_';
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

/** Get IST Date YYYY-MM-DD string with optional day offset */
export function getIstDateString(date: Date = new Date(), dayOffset: number = 0): string {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const istOffset = 5.5 * 3600000;
  const istDate = new Date(utc + istOffset + dayOffset * 86400000);
  const year = istDate.getFullYear();
  const month = (istDate.getMonth() + 1).toString().padStart(2, '0');
  const day = istDate.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Get user friendly formatted date label, e.g. "Today, 12 Sep" / "Tomorrow, 13 Sep" */
export function getFormattedDayLabel(target: 'today' | 'tomorrow', date: Date = new Date()): string {
  const offset = target === 'today' ? 0 : 1;
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const istOffset = 5.5 * 3600000;
  const istDate = new Date(utc + istOffset + offset * 86400000);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayName = target === 'today' ? 'Today' : 'Tomorrow';
  return `${dayName}, ${istDate.getDate()} ${months[istDate.getMonth()]}`;
}

/** Get IST cutoff minutes from midnight for a given preference window */
export function getWindowCutoffMinutes(windowId: PreferenceWindowId): number {
  const cutoff = WINDOW_CUTOFFS[windowId];
  return cutoff.hour * 60 + cutoff.minute;
}

/** Formatted cutoff label */
export function getWindowCutoffLabel(windowId: PreferenceWindowId): string {
  return WINDOW_CUTOFFS[windowId]?.label || '';
}

/**
 * Check if the same-day selection cutoff has passed for a given window.
 * If true, this window cannot be selected for today; next day only.
 */
export function isWindowCutoffPassed(windowId: PreferenceWindowId, date: Date = new Date()): boolean {
  const currentMinutes = getIstMinutesFromMidnight(date);
  const cutoffMinutes = getWindowCutoffMinutes(windowId);
  return currentMinutes >= cutoffMinutes;
}

/** Check whether all windows for today have already passed their selection cutoff */
export function areAllTodayCutoffsPassed(date: Date = new Date()): boolean {
  return (['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'] as PreferenceWindowId[]).every((id) =>
    isWindowCutoffPassed(id, date)
  );
}

/** Detailed cutoff status for UI rendering */
export interface WindowCutoffStatus {
  isPassed: boolean;
  cutoffLabel: string;
  explanation: string;
  canSelectForToday: boolean;
  badgeText: string;
}

export function getWindowCutoffStatus(
  windowId: PreferenceWindowId,
  isSelectedForToday: boolean,
  date: Date = new Date()
): WindowCutoffStatus {
  const isPassed = isWindowCutoffPassed(windowId, date);
  const cutoff = WINDOW_CUTOFFS[windowId];

  if (isPassed) {
    return {
      isPassed: true,
      cutoffLabel: cutoff.label,
      explanation: cutoff.explanation,
      canSelectForToday: false,
      badgeText: isSelectedForToday
        ? 'Locked in for Today'
        : `Cutoff passed (${cutoff.label}) • Next day only`,
    };
  }

  return {
    isPassed: false,
    cutoffLabel: cutoff.label,
    explanation: cutoff.explanation,
    canSelectForToday: true,
    badgeText: `Cutoff: ${cutoff.label} (${windowId === 'MORNING' ? 'Exception' : '2h before'})`,
  };
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

// ─── Multi-Day Storage Schema ─────────────────────────────────────────────────

export interface MultiDayPreferences {
  todayDate: string;
  todayPreferences: PreferenceWindowId[];
  tomorrowDate: string;
  tomorrowPreferences: PreferenceWindowId[];
}

/** Get multi-day preferences with automatic midnight rollover */
export function getMultiDayPreferences(phone?: string, now: Date = new Date()): MultiDayPreferences {
  const todayStr = getIstDateString(now, 0);
  const tomorrowStr = getIstDateString(now, 1);
  const fallbackKey = phone ? `${LOCAL_STORAGE_KEY_PREFIX}${phone}` : `${LOCAL_STORAGE_KEY_PREFIX}guest`;
  const multiKey = phone ? `${MULTIDAY_STORAGE_KEY_PREFIX}${phone}` : `${MULTIDAY_STORAGE_KEY_PREFIX}guest`;

  if (typeof window === 'undefined') {
    return {
      todayDate: todayStr,
      todayPreferences: [],
      tomorrowDate: tomorrowStr,
      tomorrowPreferences: [],
    };
  }

  try {
    const savedMulti = localStorage.getItem(multiKey);
    if (savedMulti) {
      const parsed: MultiDayPreferences = JSON.parse(savedMulti);
      // Case 1: Same day
      if (parsed.todayDate === todayStr) {
        return {
          todayDate: todayStr,
          todayPreferences: parsed.todayPreferences || [],
          tomorrowDate: tomorrowStr,
          tomorrowPreferences: parsed.tomorrowDate === tomorrowStr ? parsed.tomorrowPreferences || [] : [],
        };
      }
      // Case 2: Rollover! Yesterday's tomorrow is today
      if (parsed.tomorrowDate === todayStr) {
        const rolledToday = parsed.tomorrowPreferences || [];
        const updated: MultiDayPreferences = {
          todayDate: todayStr,
          todayPreferences: rolledToday,
          tomorrowDate: tomorrowStr,
          tomorrowPreferences: [],
        };
        localStorage.setItem(multiKey, JSON.stringify(updated));
        localStorage.setItem(fallbackKey, JSON.stringify(rolledToday));
        return updated;
      }
    }

    // Case 3: Initial migration or new day
    const legacy = localStorage.getItem(fallbackKey);
    const legacyPrefs = legacy ? JSON.parse(legacy) : [];
    const validLegacy = Array.isArray(legacyPrefs)
      ? legacyPrefs.filter((id: unknown): id is PreferenceWindowId =>
          typeof id === 'string' && ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'].includes(id)
        )
      : [];

    const initial: MultiDayPreferences = {
      todayDate: todayStr,
      todayPreferences: validLegacy,
      tomorrowDate: tomorrowStr,
      tomorrowPreferences: [],
    };
    localStorage.setItem(multiKey, JSON.stringify(initial));
    return initial;
  } catch {
    return {
      todayDate: todayStr,
      todayPreferences: [],
      tomorrowDate: tomorrowStr,
      tomorrowPreferences: [],
    };
  }
}

/** Save multi-day preferences */
export function saveMultiDayPreferences(
  data: MultiDayPreferences,
  phone?: string
): void {
  if (typeof window === 'undefined') return;
  const multiKey = phone ? `${MULTIDAY_STORAGE_KEY_PREFIX}${phone}` : `${MULTIDAY_STORAGE_KEY_PREFIX}guest`;
  const fallbackKey = phone ? `${LOCAL_STORAGE_KEY_PREFIX}${phone}` : `${LOCAL_STORAGE_KEY_PREFIX}guest`;

  try {
    localStorage.setItem(multiKey, JSON.stringify(data));
    // Always keep legacy key in sync with today's preferences for backward compatibility
    localStorage.setItem(fallbackKey, JSON.stringify(data.todayPreferences));
  } catch {
    // Ignore storage errors
  }
}

/** Get local preferences for today (backward-compatible) */
export function getLocalPreferences(phone?: string): PreferenceWindowId[] {
  const multi = getMultiDayPreferences(phone);
  return multi.todayPreferences;
}

/** Get local preferences for tomorrow */
export function getLocalTomorrowPreferences(phone?: string): PreferenceWindowId[] {
  const multi = getMultiDayPreferences(phone);
  return multi.tomorrowPreferences;
}

/** Save preferences locally to localStorage (today) */
export function saveLocalPreferences(preferences: PreferenceWindowId[], phone?: string): void {
  const multi = getMultiDayPreferences(phone);
  multi.todayPreferences = preferences;
  saveMultiDayPreferences(multi, phone);
}

/** Save preferences locally for specific target day */
export function saveLocalDayPreferences(
  target: 'today' | 'tomorrow',
  preferences: PreferenceWindowId[],
  phone?: string
): void {
  const multi = getMultiDayPreferences(phone);
  if (target === 'today') {
    multi.todayPreferences = preferences;
  } else {
    multi.tomorrowPreferences = preferences;
  }
  saveMultiDayPreferences(multi, phone);
}

/** Save rider availability preferences to Supabase with resilient offline fallback */
export async function saveRiderPreferences(
  phone: string,
  preferences: PreferenceWindowId[],
  target: 'today' | 'tomorrow' = 'today'
): Promise<{ success: boolean; syncedWithServer: boolean; error?: string }> {
  // Update local multi-day cache
  saveLocalDayPreferences(target, preferences, phone);

  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  if (!cleanPhone) {
    return { success: true, syncedWithServer: false, error: 'No phone number for database sync' };
  }

  // Only today's preferences sync to rider_profiles.riding_preferences column in Supabase
  if (target === 'today') {
    try {
      const { error } = await supabase
        .from('rider_profiles')
        .update({
          riding_preferences: preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('phone', cleanPhone);

      if (error) {
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

  return { success: true, syncedWithServer: true };
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
      await saveRiderPreferences(phone, preferences, 'today');
    }
  } catch {
    // Ignore
  }
}
