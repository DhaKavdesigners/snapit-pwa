import { RiderSlot, AdminSlotConfig, SlotStatus, DemandLevel } from '@/types';
import { supabase, DbRiderSlot } from '@/lib/supabase';
import { getNow, getNowDate } from './mockService';

/** Returns today's date as YYYY-MM-DD */
export function getTodayDateString(): string {
  return getNowDate().toISOString().split('T')[0];
}

/** Converts HH:mm to epoch ms for today's date */
export function timeToTodayMs(timeStr: string, date?: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  const d = date ? new Date(date) : getNowDate();
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
    case 'VERY_HIGH':
      return '🔥 Very High Demand';
    case 'HIGH':
      return '🔥 High Demand';
    case 'MEDIUM':
      return 'Medium Demand';
    case 'LOW':
    default:
      return 'Low Demand';
  }
}

function demandForHour(hour: number): DemandLevel {
  if (hour >= 11 && hour <= 14) return 'HIGH';
  if (hour >= 18 && hour <= 21) return 'VERY_HIGH';
  if (hour >= 7 && hour <= 10) return 'MEDIUM';
  if (hour >= 21 && hour <= 23) return 'HIGH';
  return 'LOW';
}

function capacityForHour(hour: number): number {
  if (hour >= 18 && hour <= 21) return 20;
  if (hour >= 11 && hour <= 14) return 18;
  return 15;
}

/** Generate all slots for today based on admin config */
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
    const capacity = capacityForHour(h);
    const bookedCount = isBooked ? Math.min(capacity, 10) : 4;

    let status: SlotStatus = 'available';
    if (isBooked) {
      if (now >= startTs && now < endTs) status = 'active';
      else if (now >= endTs) status = 'completed';
      else status = 'booked';
    } else {
      if (now >= endTs) status = 'past';
      else if (bookedCount >= capacity) status = 'full';
      else status = 'available';
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
      bookedAt: isBooked ? startTs - 3600000 : null,
      startedAt: status === 'active' ? startTs : null,
      endedAt: status === 'completed' ? endTs : null,
      extendedFromSlotId: null,
      demandLevel: demandForHour(h),
      capacity,
      bookedCount,
      onWaitlist: false,
      ordersFulfilled: 0,
      ordersMissed: 0,
    });
  }

  return slots;
}

/** Check if rider is currently eligible to be online based on slot time */
export function isSlotOnlineReady(
  slot: RiderSlot | null,
  config: AdminSlotConfig
): { ready: boolean; reason: string } {
  if (!slot) {
    return { ready: false, reason: 'You must book an active delivery slot to go online.' };
  }

  const now = getNow();
  const earlyWindowMs = (config.earlyOnlineWindowMinutes || 15) * 60 * 1000;
  const earliestAllowed = slot.startTimestamp - earlyWindowMs;

  if (now < earliestAllowed) {
    const diffMins = Math.ceil((slot.startTimestamp - now) / 60000);
    return {
      ready: false,
      reason: `Your slot starts at ${formatTimeAMPM(slot.startTimestamp)} (in ${diffMins} min). You can go online 15m early.`,
    };
  }

  if (now >= slot.endTimestamp) {
    return {
      ready: false,
      reason: `Your slot ended at ${formatTimeAMPM(slot.endTimestamp)}. Please book the next available slot.`,
    };
  }

  return { ready: true, reason: 'Slot active and ready' };
}

/** Fetch booked slots for rider from Supabase */
export async function fetchRiderSlotsFromDb(riderPhone: string, dateStr?: string): Promise<string[]> {
  const cleanPhone = riderPhone.replace(/[^0-9]/g, '');
  if (!cleanPhone) return [];

  const targetDate = dateStr || getTodayDateString();

  try {
    const { data, error } = await supabase
      .from('rider_slots')
      .select('id, status')
      .eq('rider_id', cleanPhone)
      .eq('slot_date', targetDate)
      .in('status', ['BOOKED', 'ACTIVE', 'EXTENDED']);

    if (error) {
      console.warn('Error fetching rider slots:', error);
      return [];
    }

    return (data || []).map((r) => r.id);
  } catch {
    return [];
  }
}

/** Book a slot in Supabase */
export async function bookSlotInDb(
  riderPhone: string,
  slot: RiderSlot
): Promise<boolean> {
  const cleanPhone = riderPhone.replace(/[^0-9]/g, '');
  if (!cleanPhone) return false;

  const payload: DbRiderSlot = {
    id: slot.id,
    rider_id: cleanPhone,
    slot_date: slot.date,
    start_time: slot.startTime,
    end_time: slot.endTime,
    start_timestamp: slot.startTimestamp,
    end_timestamp: slot.endTimestamp,
    zone_id: slot.zoneId,
    zone_name: slot.zoneName,
    status: 'BOOKED',
    booked_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabase
      .from('rider_slots')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Error booking slot in Supabase:', error);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Cancel a slot in Supabase */
export async function cancelSlotInDb(riderPhone: string, slotId: string): Promise<boolean> {
  const cleanPhone = riderPhone.replace(/[^0-9]/g, '');
  if (!cleanPhone) return false;

  try {
    const { error } = await supabase
      .from('rider_slots')
      .update({ status: 'CANCELLED' })
      .eq('id', slotId)
      .eq('rider_id', cleanPhone);

    return !error;
  } catch {
    return false;
  }
}

/** Check if booking is open for a slot */
export function isBookingOpen(
  slot: RiderSlot,
  config: AdminSlotConfig
): { open: boolean; reason: string; closesInMinutes?: number } {
  const now = getNow();
  const cutoffMs = (config.bookingCutoffMinutes || 15) * 60 * 1000;
  const cutoffTime = slot.startTimestamp - cutoffMs;

  if (now >= slot.endTimestamp) {
    return { open: false, reason: 'Slot has already ended' };
  }

  if (now >= slot.startTimestamp) {
    return { open: false, reason: 'Slot is in progress' };
  }

  if (now >= cutoffTime) {
    return { open: false, reason: 'Booking closed for this slot' };
  }

  const closesInMinutes = Math.floor((cutoffTime - now) / 60000);
  return { open: true, reason: 'Booking open', closesInMinutes };
}

export function findNextSlot(currentSlot: RiderSlot, allSlots: RiderSlot[]): RiderSlot | null {
  const currentIdx = allSlots.findIndex((s) => s.id === currentSlot.id);
  if (currentIdx === -1 || currentIdx >= allSlots.length - 1) return null;
  return allSlots[currentIdx + 1];
}

export function buildExtendedSlot(
  currentSlot: RiderSlot,
  extendMinutes: number,
  config: AdminSlotConfig
): RiderSlot {
  const extendMs = extendMinutes * 60 * 1000;
  const newEndTs = currentSlot.endTimestamp + extendMs;
  const newEndH = new Date(newEndTs).getHours().toString().padStart(2, '0');
  const newEndM = new Date(newEndTs).getMinutes().toString().padStart(2, '0');

  return {
    ...currentSlot,
    id: `${currentSlot.id}-ext`,
    endTime: `${newEndH}:${newEndM}`,
    endTimestamp: newEndTs,
    extendedFromSlotId: currentSlot.id,
    status: 'active',
  };
}
