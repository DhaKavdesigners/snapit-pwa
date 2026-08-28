import { RiderSlot, AdminSlotConfig, SlotStatus, DemandLevel } from '@/types';
import { getNow, getNowDate } from './mockService';

/** Returns today's date as YYYY-MM-DD */
export function getTodayDateString(): string {
  return getNowDate().toISOString().split('T')[0];
}

/** Converts HH:mm to epoch ms for a specific date (YYYY-MM-DD or today) */
export function timeToTodayMs(timeStr: string, date?: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  if (date) {
    const [year, month, day] = date.split('-').map(Number);
    const d = new Date(year, month - 1, day, h, m, 0, 0);
    return d.getTime();
  }
  const d = getNowDate();
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

/** Format epoch ms as HH:mm AM/PM */
export function formatTimeAMPM(ts: number): string {
  const d = new Date(ts);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

/** Format remaining ms as "Xh Ym" or "Ym Zs" */
export function formatRemainingTime(ms: number): string {
  if (ms <= 0) return '0m';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** Format mm:ss countdown for break */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function mockDemandForHour(hour: number): DemandLevel {
  if (hour >= 11 && hour <= 14) return 'HIGH';
  if (hour >= 18 && hour <= 21) return 'VERY_HIGH';
  if (hour >= 7 && hour <= 10) return 'MEDIUM';
  if (hour >= 21 && hour <= 23) return 'HIGH';
  return 'LOW';
}

function mockCapacityForHour(hour: number): number {
  if (hour >= 18 && hour <= 21) return 20;
  if (hour >= 11 && hour <= 14) return 18;
  return 15;
}

function mockBookedForHour(hour: number, slotId: string, bookedSlotIds: string[]): number {
  const base = mockCapacityForHour(hour);
  if (hour >= 18 && hour <= 21) return Math.min(base, base - 4);
  if (hour >= 11 && hour <= 14) return Math.min(base, base - 6);
  return Math.min(base, Math.floor(base * 0.4));
}

/** Generate full 24-hour slots with color-coded status, demand intelligence, and order metrics */
export function generateDailySlots(
  config: AdminSlotConfig,
  bookedSlotIds: string[],
  zoneId: string,
  zoneName: string,
  dateStr?: string
): RiderSlot[] {
  const date = dateStr || getTodayDateString();
  const slots: RiderSlot[] = [];
  const now = getNow();

  // Full 24 Hours: 00:00 to 24:00 (24 1-hour slots)
  for (let h = 0; h < 24; h++) {
    const startHourStr = h.toString().padStart(2, '0');
    const endHourStr = ((h + 1) % 24).toString().padStart(2, '0');
    const startTs = timeToTodayMs(`${startHourStr}:00`, date);
    const endTs = startTs + 60 * 60 * 1000;
    const slotId = `slot-${date}-${h}`;

    const isBooked = bookedSlotIds.includes(slotId);
    const capacity = mockCapacityForHour(h);
    const bookedCount = mockBookedForHour(h, slotId, bookedSlotIds);

    let status: SlotStatus = 'available';
    let closesInMinutes: number | undefined = undefined;

    // Determine status & urgency based on current real-time clock
    if (isBooked) {
      if (now >= startTs && now < endTs) {
        status = 'active';
      } else if (now >= endTs) {
        status = 'past';
      } else {
        status = 'booked';
      }
    } else {
      if (now >= endTs) {
        // Past / Unbookable (Red)
        status = 'past';
      } else if (now >= startTs && now < endTs) {
        // Current hour slot in progress (unbookable for new booking)
        status = 'past';
      } else {
        // Upcoming future slot
        const timeUntilStartMs = startTs - now;
        if (timeUntilStartMs <= 60 * 60 * 1000 && timeUntilStartMs > 0) {
          // Yellow: Expiring soon (booking closes in <1h)
          status = 'expiring_soon';
          closesInMinutes = Math.max(1, Math.floor(timeUntilStartMs / 60000));
        } else {
          // Green: Open available slot
          status = 'available';
        }
      }
    }

    // Historical demand analytics for past slots
    const ordersFulfilled = Math.max(3, Math.floor(((h * 3 + 7) % 12) + (h >= 18 && h <= 21 ? 11 : h >= 12 && h <= 15 ? 7 : 2)));
    const ordersMissed = Math.max(1, Math.floor(((h * 2 + 1) % 3) + (h >= 18 ? 2 : 0)));

    slots.push({
      id: slotId,
      date,
      startTime: `${startHourStr}:00`,
      endTime: `${endHourStr}:00`,
      startTimestamp: startTs,
      endTimestamp: endTs,
      zoneId,
      zoneName,
      status,
      bookedAt: isBooked ? now - 3600000 : null,
      startedAt: isBooked ? startTs : null,
      endedAt: null,
      extendedFromSlotId: null,
      demandLevel: mockDemandForHour(h),
      capacity,
      bookedCount: isBooked ? bookedCount + 1 : bookedCount,
      ordersFulfilled,
      ordersMissed,
      closesInMinutes,
    });
  }

  return slots;
}

/** Check if rider is allowed to switch zone (Relaxed for testing: unrestricted zone changes) */
export function checkZoneSwitchAllowed(
  switchHistory?: number[] | number
): {
  allowed: boolean;
  remaining: number;
  lockRemainingMs?: number;
  reason?: string;
} {
  // Relaxed for testing - unrestricted zone switching allowed
  return {
    allowed: true,
    remaining: 2,
    lockRemainingMs: 0,
  };
}

/** Check if booking is still open for a slot */
export function isBookingOpen(slot: RiderSlot, config: AdminSlotConfig): boolean {
  return slot.status === 'available' || slot.status === 'expiring_soon';
}

/** Check if rider can go online now for this slot */
export function isSlotOnlineReady(slot: RiderSlot | null, config: AdminSlotConfig): boolean {
  return true;
}

/** Get the currently active/upcoming slot from a list */
export function findActiveSlot(slots: RiderSlot[]): RiderSlot | null {
  const now = getNow();
  return slots.find((s) => s.status === 'active' || (s.status === 'booked' && now < s.endTimestamp)) || null;
}

/** Get next bookable slot after the given one */
export function findNextSlot(currentSlot: RiderSlot, allSlots: RiderSlot[]): RiderSlot | null {
  return allSlots.find(
    (s) => s.startTimestamp === currentSlot.endTimestamp && (s.status === 'available' || s.status === 'full')
  ) || null;
}

/** Check if two slots overlap */
export function slotsOverlap(a: RiderSlot, b: RiderSlot): boolean {
  return a.startTimestamp < b.endTimestamp && b.startTimestamp < a.endTimestamp;
}

/** Extend a slot to include the next slot period */
export function buildExtendedSlot(current: RiderSlot, next: RiderSlot): RiderSlot {
  return {
    ...current,
    endTime: next.endTime,
    endTimestamp: next.endTimestamp,
    extendedFromSlotId: current.id,
    id: `${current.id}-ext`,
  };
}

/** Human-readable demand label */
export function demandLabel(level: DemandLevel): string {
  const map: Record<DemandLevel, string> = {
    LOW: 'Low Demand',
    MEDIUM: 'Medium Demand',
    HIGH: '🔥 High Demand',
    VERY_HIGH: '🔥 Very High Demand',
  };
  return map[level];
}
