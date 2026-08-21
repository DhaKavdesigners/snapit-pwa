import { RiderBreak, AdminBreakConfig, BreakStatus } from '@/types';
import { formatCountdown } from './slotService';

export interface BreakState {
  isActive: boolean;
  isGrace: boolean;
  isEmergency: boolean;
  remainingMs: number;
  elapsedMs: number;
  excessMs: number;
  allowedMs: number;
  graceRemainingMs: number;
  displayCountdown: string;
  usedMinutes: number;
  remainingMinutes: number;
  percentUsed: number;
  status: BreakStatus;
}

/** Compute all break state values from a RiderBreak record */
export function computeBreakState(
  riderBreak: RiderBreak | null,
  config: AdminBreakConfig,
  now: number = Date.now()
): BreakState {
  if (!riderBreak || riderBreak.status === 'completed') {
    return {
      isActive: false,
      isGrace: false,
      isEmergency: false,
      remainingMs: config.allowedBreakMinutes * 60000,
      elapsedMs: 0,
      excessMs: 0,
      allowedMs: config.allowedBreakMinutes * 60000,
      graceRemainingMs: 0,
      displayCountdown: config.allowedBreakMinutes.toString().padStart(2, '0') + ':00',
      usedMinutes: 0,
      remainingMinutes: config.allowedBreakMinutes,
      percentUsed: 0,
      status: 'idle',
    };
  }

  const endAt = riderBreak.endedAt ?? now;
  const elapsedMs = endAt - riderBreak.startedAt;
  const allowedMs = riderBreak.allowedDurationMs;
  const remainingMs = Math.max(0, allowedMs - elapsedMs);
  const excessMs = Math.max(0, elapsedMs - allowedMs);
  const graceTotalMs = config.gracePeriodMinutes * 60000;
  const graceEndAt = riderBreak.gracePeriodEndAt ?? (riderBreak.startedAt + allowedMs + graceTotalMs);
  const graceRemainingMs = Math.max(0, graceEndAt - now);
  const isGrace = elapsedMs > allowedMs && now < graceEndAt;
  const isExceeded = elapsedMs > allowedMs + graceTotalMs;

  const status: BreakStatus = riderBreak.isEmergency
    ? 'emergency'
    : isExceeded
    ? 'grace' // past grace = still show grace state but with 0 time
    : isGrace
    ? 'grace'
    : 'active';

  const displayMs = isGrace ? graceRemainingMs : remainingMs;

  return {
    isActive: !riderBreak.endedAt,
    isGrace,
    isEmergency: riderBreak.isEmergency,
    remainingMs,
    elapsedMs,
    excessMs,
    allowedMs,
    graceRemainingMs,
    displayCountdown: formatCountdown(displayMs),
    usedMinutes: Math.floor(elapsedMs / 60000),
    remainingMinutes: Math.ceil(remainingMs / 60000),
    percentUsed: Math.min(100, Math.floor((elapsedMs / allowedMs) * 100)),
    status,
  };
}

export function shouldWarnBreak(
  state: BreakState,
  lastWarnedAt: number | null,
  config: AdminBreakConfig,
  now: number = Date.now()
): 'five_minute_warning' | 'one_minute_warning' | 'allowance_ended' | 'grace_exceeded' | null {
  if (!state.isActive) return null;

  const used = state.elapsedMs / 60000;
  const allowed = config.allowedBreakMinutes;
  const grace = config.gracePeriodMinutes;

  // Only warn once (check lastWarnedAt per warning type)
  if (used >= allowed + grace && !state.isGrace) return 'grace_exceeded';
  if (used >= allowed) return 'allowance_ended';
  if (used >= allowed - 1) return 'one_minute_warning';
  if (used >= allowed - 5) return 'five_minute_warning';
  return null;
}
