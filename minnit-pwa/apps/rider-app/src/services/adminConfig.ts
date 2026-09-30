import type { AdminConfig, OrderAcceptanceExceptionReason } from '@/types';

const ALL_EXCEPTION_REASONS: OrderAcceptanceExceptionReason[] = [
  'customer_cancelled',
  'shop_cancelled',
  'duplicate_assignment',
  'system_error',
  'network_error',
  'admin_reassignment',
  'outside_zone',
  'active_delivery_conflict',
  'safety_emergency',
  'admin_approved',
];

export const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  slot: {
    slotDurationMinutes: 60,
    operatingHourStart: 0,
    operatingHourEnd: 24,
    bookingCutoffMinutes: 60,
    earlyOnlineWindowMinutes: 5,
    maxConsecutiveSlots: 3,
    extensionEnabled: true,
    waitlistEnabled: true,
    instantBookingWindowMinutes: 25,
  },
  break: {
    allowedBreakMinutes: 15,
    gracePeriodMinutes: 3,
    maxBreaksPerSlot: 1,
    emergencyBreakEnabled: true,
    excessBreakPolicy: 'warn',
  },
  orderAcceptance: {
    acceptanceTimeoutSeconds: 25,
    warning1Threshold: 1,
    warning2Threshold: 2,
    maxNonAcceptances: 3,
    policyOnThreshold: 'warn',
    pauseDurationMinutes: 10,
    validExceptionReasons: ALL_EXCEPTION_REASONS,
  },
};

// In a real backend, this would be fetched from the API.
// This function can be replaced with an API call.
export function getAdminConfig(): AdminConfig {
  try {
    const stored = localStorage.getItem('snapit_admin_config_v1');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure slotDuration is 60 minutes even if older 120 min was previously cached
      const slotConfig = {
        ...DEFAULT_ADMIN_CONFIG.slot,
        ...(parsed.slot || {}),
        slotDurationMinutes: 60,
        instantBookingWindowMinutes: 25,
      };
      return { ...DEFAULT_ADMIN_CONFIG, ...parsed, slot: slotConfig };
    }
  } catch {
    // ignore
  }
  return DEFAULT_ADMIN_CONFIG;
}