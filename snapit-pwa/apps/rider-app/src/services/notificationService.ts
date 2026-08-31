import { AlertNotification, AlertNotificationType, RiderSlot, RiderBreak } from '@/types';
import { supabase, DbNotification } from '@/lib/supabase';
import { formatTimeAMPM } from './slotService';

/** Show native browser/PWA push notification if permitted */
export function showBrowserNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/snapit-rider-logo.png',
        badge: '/snapit-rider-logo.png',
      });
    } catch (e) {
      console.warn('Browser notification error:', e);
    }
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification(title, { body, icon: '/snapit-rider-logo.png' });
      }
    });
  }
}

function makeAlert(
  type: AlertNotificationType,
  title: string,
  message: string,
  extras?: Partial<AlertNotification>
): AlertNotification {
  // Trigger browser notification for high/critical priority alerts
  if (extras?.priority === 'high' || extras?.priority === 'critical') {
    showBrowserNotification(title, message);
  }

  return {
    id: `alert-${type}-${Date.now()}`,
    type,
    title,
    message,
    time: 'Just now',
    read: false,
    priority: 'normal',
    ...extras,
  };
}

export function createSlotBookedAlert(slot: RiderSlot): AlertNotification {
  return makeAlert(
    'slot_booked',
    '📅 Slot Booked Successfully',
    `Your slot ${formatTimeAMPM(slot.startTimestamp)} – ${formatTimeAMPM(slot.endTimestamp)} in ${slot.zoneName} has been confirmed.`,
    { slotId: slot.id, actionRoute: '/slots', actionLabel: 'View Slot', priority: 'normal' }
  );
}

export function createSlotReminderAlert(slot: RiderSlot): AlertNotification {
  return makeAlert(
    'slot_reminder',
    '⏰ Slot Starting in 10 Minutes',
    `Your slot ${formatTimeAMPM(slot.startTimestamp)} – ${formatTimeAMPM(slot.endTimestamp)} starts soon in ${slot.zoneName}.`,
    { slotId: slot.id, actionRoute: '/slots', actionLabel: 'View Slot', priority: 'high' }
  );
}

export function createSlotActiveAlert(slot: RiderSlot): AlertNotification {
  return makeAlert(
    'slot_active',
    '🟢 Slot Now Active',
    `Your slot ${formatTimeAMPM(slot.startTimestamp)} – ${formatTimeAMPM(slot.endTimestamp)} is now active in ${slot.zoneName}.`,
    { slotId: slot.id, priority: 'normal' }
  );
}

export function createSlotEndingAlert(slot: RiderSlot, nextAvailable: boolean): AlertNotification {
  const msg = nextAvailable
    ? `Your slot ends in 10 minutes. You can extend by 1 hour if you'd like to continue.`
    : `Your slot ends in 10 minutes. No extension available right now.`;
  return makeAlert(
    'slot_ending',
    '⚠️ Slot Ending in 10 Minutes',
    msg,
    { slotId: slot.id, actionRoute: '/slots', actionLabel: nextAvailable ? 'Extend Slot' : 'View Slots', priority: 'high' }
  );
}

export function createSlotEndedAlert(slot: RiderSlot): AlertNotification {
  return makeAlert(
    'slot_ended',
    '🔴 Slot Ended — Switched to Offline',
    `Your ${formatTimeAMPM(slot.startTimestamp)} – ${formatTimeAMPM(slot.endTimestamp)} slot has ended.`,
    { slotId: slot.id, priority: 'high' }
  );
}

export function createSlotExtendedAlert(newEndTime: number): AlertNotification {
  return makeAlert(
    'slot_extended',
    '✅ Slot Extended',
    `Your slot has been extended until ${formatTimeAMPM(newEndTime)}.`,
    { priority: 'normal' }
  );
}

export function createSlotCancelledAlert(slot: RiderSlot): AlertNotification {
  return makeAlert(
    'slot_cancelled',
    '❌ Slot Cancelled',
    `Your slot ${formatTimeAMPM(slot.startTimestamp)} – ${formatTimeAMPM(slot.endTimestamp)} has been cancelled.`,
    { slotId: slot.id }
  );
}

export function createZoneEnteredAlert(zoneName: string): AlertNotification {
  return makeAlert(
    'zone_entered',
    '📍 You Are Inside Your Zone',
    `You've entered ${zoneName}. Online mode is now available.`,
    { priority: 'normal' }
  );
}

export function createZoneExitedAlert(zoneName: string): AlertNotification {
  return makeAlert(
    'zone_exited',
    '⚠️ You Left Your Zone',
    `You've moved outside ${zoneName}. Return to your zone to receive delivery offers.`,
    { priority: 'high' }
  );
}

export function createZoneRequiredAlert(zoneName: string): AlertNotification {
  return makeAlert(
    'zone_required',
    '📍 Go to Your Zone to Go Online',
    `Please go to ${zoneName} to start receiving orders.`,
    { priority: 'normal' }
  );
}

export function createBreakStartedAlert(): AlertNotification {
  return makeAlert(
    'break_started',
    '☕ Break Started',
    'You are on a 15-minute break. No new orders will be assigned during this time.',
    { priority: 'low' }
  );
}

export function createBreakEndingAlert(minutesLeft: number = 2): AlertNotification {
  return makeAlert(
    'break_ending',
    `☕ Break Ending in ${minutesLeft} Minute${minutesLeft !== 1 ? 's' : ''}`,
    'Your break is ending soon. Be ready to resume orders.',
    { priority: 'high' }
  );
}

export function createBreakExceededAlert(): AlertNotification {
  return makeAlert(
    'break_exceeded',
    '⚠️ Break Time Exceeded',
    'You have exceeded the 15-minute break limit. Please resume duty.',
    { priority: 'high' }
  );
}

export function createBreakEmergencyAlert(reason?: string): AlertNotification {
  return makeAlert(
    'break_emergency',
    '🚨 Emergency Break Logged',
    reason ? `Emergency break recorded: ${reason}` : 'Your emergency break has been recorded.',
    { priority: 'normal' }
  );
}

export function createAcceptanceWarningAlert(nonAcceptanceCount: number, maxCount: number): AlertNotification {
  return makeAlert(
    'acceptance_warning',
    `⚠️ Order Non-Acceptance (${nonAcceptanceCount}/${maxCount})`,
    `You have passed ${nonAcceptanceCount} order(s). Further passes may impact assignment priority.`,
    { priority: 'high' }
  );
}

export function createWaitlistAvailableAlert(slot: RiderSlot): AlertNotification {
  return makeAlert(
    'waitlist_available',
    '🎉 Slot Available from Waitlist',
    `A slot in ${slot.zoneName} (${formatTimeAMPM(slot.startTimestamp)} – ${formatTimeAMPM(slot.endTimestamp)}) opened up.`,
    { slotId: slot.id, actionRoute: '/slots', actionLabel: 'Claim Slot', priority: 'high' }
  );
}

/** Sync notification to Supabase */
export async function persistNotificationInDb(
  riderPhone: string,
  alert: AlertNotification
): Promise<void> {
  const cleanPhone = riderPhone.replace(/[^0-9]/g, '');
  if (!cleanPhone) return;

  const payload: DbNotification = {
    id: alert.id,
    rider_id: cleanPhone,
    title: alert.title,
    message: alert.message,
    type: alert.type,
    read: alert.read,
    amount: alert.amount,
    action_route: alert.actionRoute,
    created_at: new Date().toISOString(),
  };

  try {
    await supabase.from('rider_notifications').upsert(payload, { onConflict: 'id' });
  } catch (e) {
    console.warn('Error saving notification in Supabase:', e);
  }
}
