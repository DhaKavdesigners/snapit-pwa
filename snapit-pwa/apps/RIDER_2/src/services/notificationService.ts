import { AlertNotification, AlertNotificationType, RiderSlot, RiderBreak } from '@/types';
import { formatTimeAMPM } from './slotService';

function makeAlert(
  type: AlertNotificationType,
  title: string,
  message: string,
  extras?: Partial<AlertNotification>
): AlertNotification {
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
    `Your slot ${formatTimeAMPM(slot.startTimestamp)} – ${formatTimeAMPM(slot.endTimestamp)} starts soon. Please go to ${slot.zoneName} to start receiving orders.`,
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
    '🔴 Slot Ended — You Are Now Offline',
    `Your ${formatTimeAMPM(slot.startTimestamp)} – ${formatTimeAMPM(slot.endTimestamp)} slot has ended. You have been switched to Offline.`,
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
    `You've moved outside ${zoneName}. You will not receive new orders until you return.`,
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

export function createBreakEndingAlert(minutesLeft: number): AlertNotification {
  return makeAlert(
    'break_ending',
    `⚠️ Break Ending in ${minutesLeft} Minute${minutesLeft !== 1 ? 's' : ''}`,
    `Your break allowance ends in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}. Please resume Online soon.`,
    { priority: 'high' }
  );
}

export function createBreakExceededAlert(): AlertNotification {
  return makeAlert(
    'break_exceeded',
    '🔴 Break Allowance Exceeded',
    'Your 15-minute break allowance has ended. Please resume Online now.',
    { priority: 'critical' }
  );
}

export function createBreakEmergencyAlert(reason: string): AlertNotification {
  return makeAlert(
    'break_emergency',
    '🚨 Emergency Break Recorded',
    `Emergency break started. Reason: ${reason || 'Not specified'}. This will be reviewed by Admin.`,
    { priority: 'high' }
  );
}

export function createAcceptanceWarningAlert(count: number, threshold: number): AlertNotification {
  if (count >= threshold) {
    return makeAlert(
      'acceptance_threshold',
      '🔴 Acceptance Threshold Reached',
      `You have ${count} non-accepted orders this slot. Policy action may apply. Please accept assigned orders promptly.`,
      { priority: 'critical' }
    );
  }
  return makeAlert(
    'acceptance_warning',
    '⚠️ Order Acceptance Warning',
    `You have ${count} non-accepted order${count !== 1 ? 's' : ''} this slot. Please accept assigned orders promptly.`,
    { priority: 'high' }
  );
}

export function createWaitlistAvailableAlert(slot: RiderSlot): AlertNotification {
  return makeAlert(
    'waitlist_available',
    '🎉 Slot Now Available',
    `A spot opened up in ${formatTimeAMPM(slot.startTimestamp)} – ${formatTimeAMPM(slot.endTimestamp)} for ${slot.zoneName}. You've been moved from the waitlist!`,
    { slotId: slot.id, actionRoute: '/slots', priority: 'high' }
  );
}
