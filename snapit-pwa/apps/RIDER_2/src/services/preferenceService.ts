import { supabase } from '@/lib/supabase';

export type PreferenceWindowId = 'morning' | 'afternoon' | 'evening' | 'night';

export interface PreferenceWindow {
  id: PreferenceWindowId;
  title: string;
  timeRange: string;
  startHour: number; // 24h decimal, e.g. 16.5 for 4:30 PM
  endHour: number;   // 24h decimal, e.g. 20.0 for 8:00 PM
  emoji: string;
  badge: string;
  description: string;
}

export const PREFERENCE_WINDOWS: PreferenceWindow[] = [
  {
    id: 'morning',
    title: 'Morning',
    timeRange: '07:00 AM – 11:00 AM',
    startHour: 7.0,
    endHour: 11.0,
    emoji: '🌅',
    badge: 'Breakfast & Groceries',
    description: 'Tiffin, bakery items, milk & daily morning essentials.',
  },
  {
    id: 'afternoon',
    title: 'Afternoon',
    timeRange: '12:00 PM – 03:30 PM',
    startHour: 12.0,
    endHour: 15.5,
    emoji: '☀️',
    badge: 'Lunch Peak',
    description: 'Hot restaurant meals, thalis & quick meal deliveries.',
  },
  {
    id: 'evening',
    title: 'Evening',
    timeRange: '04:30 PM – 08:00 PM',
    startHour: 16.5,
    endHour: 20.0,
    emoji: '🌆',
    badge: 'Tea & Snacks Rush',
    description: 'Evening tea, snacks, chaats & evening grocery mart runs.',
  },
  {
    id: 'night',
    title: 'Night',
    timeRange: '08:00 PM – 11:30 PM',
    startHour: 20.0,
    endHour: 23.5,
    emoji: '🌙',
    badge: 'Dinner Peak',
    description: 'Dinner delivery, biryanis & late evening food orders.',
  },
];

/**
 * Returns the window currently matching the real clock time, if any.
 */
export function getCurrentWindow(date: Date = new Date()): PreferenceWindow | null {
  const currentDecimalHour = date.getHours() + date.getMinutes() / 60;
  for (const win of PREFERENCE_WINDOWS) {
    if (currentDecimalHour >= win.startHour && currentDecimalHour < win.endHour) {
      return win;
    }
  }
  return null;
}

/**
 * Check if the current time matches one of the rider's saved preferences
 */
export function isCurrentlyInPreferredWindow(
  preferences: string[],
  date: Date = new Date()
): { inWindow: boolean; activeWindow: PreferenceWindow | null } {
  const activeWindow = getCurrentWindow(date);
  if (!activeWindow) {
    return { inWindow: false, activeWindow: null };
  }
  const inWindow = preferences.includes(activeWindow.id);
  return { inWindow, activeWindow };
}

/**
 * Persist riding preferences to Supabase with local fallback
 */
export async function savePreferencesToSupabase(
  riderPhone: string,
  preferences: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanPhone = riderPhone.replace(/[^0-9+]/g, '');
    if (!cleanPhone) return { success: false, error: 'No phone provided' };

    // Try updating DB column
    const { error } = await supabase
      .from('rider_profiles')
      .update({
        riding_preferences: preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('phone', cleanPhone);

    if (error) {
      console.warn('[preferenceService] Notice saving preferences to DB:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.warn('[preferenceService] Exception saving preferences:', err);
    return { success: false, error: err.message };
  }
}
