import { RiderSlot, AdminSlotConfig, SlotStatus, DemandLevel } from '@/types';
import { getNow, getNowDate } from './mockService';

/** Returns today's date as YYYY-MM-DD */
export function getTodayDateString(): string {
  const d = getNowDate();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Returns tomorrow's date as YYYY-MM-DD */
export function getTomorrowDateString(): string {
  const d = getNowDate();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Converts HH:mm to epoch ms for a given YYYY-MM-DD date or today */
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

export function demandLabel(level: DemandLevel): string {
  switch (level) {
    case 'VERY_HIGH': return 'Very High Demand';
    case 'HIGH': return 'High Demand';
    case 'MEDIUM': return 'Moderate Demand';
    case 'LOW': return 'Low Demand';
    default: return 'Standard';
  }
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

/** Generate all slots for a specific date (YYYY-MM-DD) */
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
  const durationHours = Math.max(1, Math.round((config.slotDurationMinutes || 120) / 60));

  for (let h = config.operatingHourStart; h < config.operatingHourEnd; h += durationHours) {
    const startHourStr = h.toString().padStart(2, '0');
    const endH = (h + durationHours) % 24;
    const endHourStr = endH.toString().padStart(2, '0');
    const startTs = timeToTodayMs(`${startHourStr}:00`, date);
    const endTs = startTs + (config.slotDurationMinutes || 120) * 60 * 1000;
    const slotId = `slot-${date}-${h}`;

    const isBooked = bookedSlotIds.includes(slotId);
    const capacity = mockCapacityForHour(h);
    const bookedCount = isBooked
      ? mockBookedForHour(h, slotId, bookedSlotIds)
      : mockBookedForHour(h, slotId, bookedSlotIds);

    let status: SlotStatus = 'available';
    if (isBooked) {
      if (now >= startTs && now < endTs) status = 'active';
      else if (now >= endTs) status = 'active';
      else status = 'booked';
    } else {
      status = 'available';
    }

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
    });
  }

  return slots;
}

/** Generate both Today and Tomorrow 24h slots */
export function generateAllSlots(
  config: AdminSlotConfig,
  bookedSlotIds: string[],
  zoneId: string,
  zoneName: string
): RiderSlot[] {
  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString();
  const todaySlots = generateDailySlots(config, bookedSlotIds, zoneId, zoneName, todayStr);
  const tomorrowSlots = generateDailySlots(config, bookedSlotIds, zoneId, zoneName, tomorrowStr);
  return [...todaySlots, ...tomorrowSlots];
}

/** Check if booking is still open for a slot (Relaxed for testing) */
export function isBookingOpen(slot: RiderSlot, config: AdminSlotConfig): boolean {
  return true;
}

/** Check if rider can go online now for this slot (Relaxed for testing) */
export function isSlotOnlineReady(slot: RiderSlot | null, config: AdminSlotConfig): boolean {
  return true;
}

/** Get the currently active/upcoming slot from a list */
export function findActiveSlot(slots: RiderSlot[]): RiderSlot | null {
  const now = getNow();
  return (
    slots.find(
      (s) => (s.status === 'active' || s.status === 'booked') && now >= s.startTimestamp && now < s.endTimestamp
    ) || null
  );
}

/** Get upcoming slot that starts in the future */
export function findUpcomingSlot(slots: RiderSlot[]): RiderSlot | null {
  const now = getNow();
  return (
    slots
      .filter((s) => (s.status === 'booked' || s.status === 'available') && s.startTimestamp > now)
      .sort((a, b) => a.startTimestamp - b.startTimestamp)[0] || null
  );
}

/** Find the immediate next slot in the schedule after current */
export function findNextSlot(currentSlot: RiderSlot, allSlots: RiderSlot[]): RiderSlot | null {
  return (
    allSlots.find((s) => s.startTimestamp === currentSlot.endTimestamp && s.date === currentSlot.date) || null
  );
}

export function buildExtendedSlot(
  currentSlot: RiderSlot,
  nextSlot: RiderSlot,
  bookedSlotIds: string[]
): RiderSlot {
  return {
    ...currentSlot,
    endTimestamp: nextSlot.endTimestamp,
    endTime: nextSlot.endTime,
  };
}
