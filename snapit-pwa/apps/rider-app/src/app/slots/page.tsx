'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRider } from '@/context/RiderContext';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Flame,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Coffee,
  Zap,
  Users,
  History,
  RefreshCw,
  TrendingUp,
  PackageCheck,
  ListX,
} from 'lucide-react';
import {
  formatTimeAMPM,
  formatRemainingTime,
  formatCountdown,
  demandLabel,
  isBookingOpen,
  findNextSlot,
} from '@/services/slotService';
import { RiderSlot, DemandLevel, SlotStatus } from '@/types';

// ─── Demand Badge ─────────────────────────────────────────────────────────────

const DemandBadge: React.FC<{ level: DemandLevel }> = ({ level }) => {
  const config = {
    LOW: { cls: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Low Demand' },
    MEDIUM: { cls: 'bg-blue-50 text-blue-600 border-blue-200', label: 'Medium Demand' },
    HIGH: { cls: 'bg-orange-50 text-orange-600 border-orange-200', label: '🔥 High Demand' },
    VERY_HIGH: { cls: 'bg-red-50 text-red-600 border-red-200', label: '🔥 Very High Demand' },
  }[level];

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.cls}`}>
      {config.label}
    </span>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const SlotStatusBadge: React.FC<{ status: SlotStatus }> = ({ status }) => {
  const config: Record<SlotStatus, { cls: string; label: string }> = {
    available: { cls: 'bg-green-100 text-green-700 border-green-300', label: 'AVAILABLE' },
    booked: { cls: 'bg-blue-100 text-blue-700 border-blue-300', label: 'BOOKED' },
    active: { cls: 'bg-primary/10 text-primary border-primary/30 animate-pulse', label: 'ACTIVE' },
    completed: { cls: 'bg-slate-100 text-slate-500 border-slate-200', label: 'COMPLETED' },
    cancelled: { cls: 'bg-red-100 text-red-600 border-red-200', label: 'CANCELLED' },
    missed: { cls: 'bg-amber-100 text-amber-600 border-amber-300', label: 'MISSED' },
    full: { cls: 'bg-red-100 text-red-600 border-red-200', label: 'FULL' },
    waitlisted: { cls: 'bg-purple-100 text-purple-600 border-purple-200', label: 'WAITLISTED' },
    booking_closed: { cls: 'bg-slate-100 text-slate-400 border-slate-200', label: 'CLOSED' },
  };
  const { cls, label } = config[status] || config.available;
  return (
    <span className={`text-[10px] font-extrabold tracking-wider px-2.5 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  );
};

// ─── Current Slot Card ────────────────────────────────────────────────────────

const CurrentSlotCard: React.FC<{ slot: RiderSlot }> = ({ slot }) => {
  const { isOnline, riderBreak, startBreak, endBreak, extendSlot, slots, adminConfig } = useRider();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remainingMs = Math.max(0, slot.endTimestamp - now);
  const totalMs = slot.endTimestamp - slot.startTimestamp;
  const elapsed = now - slot.startTimestamp;
  const progressPct = Math.min(100, Math.floor((elapsed / totalMs) * 100));
  const isBreakActive = riderBreak && !riderBreak.endedAt;
  const nextSlot = findNextSlot(slot, slots);
  const endingSoon = remainingMs > 0 && remainingMs <= 10 * 60000;

  const breakElapsedMs = riderBreak ? now - riderBreak.startedAt : 0;
  const breakAllowedMs = adminConfig.break.allowedBreakMinutes * 60000;
  const breakRemainingMs = Math.max(0, breakAllowedMs - breakElapsedMs);

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${endingSoon ? 'border-amber-300' : 'border-slate-200'}`}>
      {/* Header bar */}
      <div className={`px-4 py-3 flex items-center justify-between ${endingSoon ? 'bg-amber-50' : 'bg-primary/5'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${slot.status === 'active' ? 'bg-primary animate-pulse' : 'bg-blue-500'}`} />
          <span className="text-[11px] font-extrabold tracking-wider text-slate-600 uppercase">
            {slot.status === 'active' ? 'Current Slot' : 'Upcoming Slot'}
          </span>
        </div>
        {endingSoon && (
          <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
            ⚠️ Ending Soon
          </span>
        )}
      </div>

      {/* Slot time */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[22px] font-black text-slate-900 font-mono leading-none">
              {formatTimeAMPM(slot.startTimestamp)}
            </p>
            <p className="text-[13px] font-bold text-slate-500 mt-0.5">
              – {formatTimeAMPM(slot.endTimestamp)}
            </p>
          </div>
          <SlotStatusBadge status={slot.status} />
        </div>

        {/* Progress bar */}
        {slot.status === 'active' && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Remaining: {formatRemainingTime(remainingMs)}</span>
              <span>{progressPct}% elapsed</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Zone */}
        <div className="flex items-center gap-1.5 mt-3 text-[12px] text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span className="font-semibold">{slot.zoneName}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 pb-3 grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
          <p className="text-[10px] text-slate-400 font-semibold">Online</p>
          <p className="text-[13px] font-black text-slate-800 font-mono">
            {isOnline ? '🟢 Yes' : '⚫ No'}
          </p>
        </div>
        <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
          <p className="text-[10px] text-slate-400 font-semibold">Break</p>
          <p className="text-[13px] font-black text-slate-800 font-mono">
            {riderBreak?.endedAt
              ? `${Math.ceil((riderBreak.actualDurationMs || 0) / 60000)}m used`
              : isBreakActive
              ? formatCountdown(breakRemainingMs)
              : `0/${adminConfig.break.allowedBreakMinutes}m`}
          </p>
        </div>
        <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
          <p className="text-[10px] text-slate-400 font-semibold">Demand</p>
          <p className="text-[11px] font-black text-orange-500">
            {slot.demandLevel === 'VERY_HIGH' ? '🔥🔥' : slot.demandLevel === 'HIGH' ? '🔥' : slot.demandLevel}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-4 flex gap-2">
        {slot.status === 'active' && !isBreakActive && !riderBreak?.endedAt === false && (
          <button
            onClick={startBreak}
            className="flex-1 py-2.5 border border-amber-300 bg-amber-50 text-amber-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <Coffee className="w-3.5 h-3.5" />
            Take Break
          </button>
        )}
        {slot.status === 'active' && isBreakActive && (
          <button
            onClick={endBreak}
            className="flex-1 py-2.5 bg-primary text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lift"
          >
            Resume Online
          </button>
        )}
        {endingSoon && nextSlot && nextSlot.status === 'available' && adminConfig.slot.extensionEnabled && (
          <button
            onClick={() => extendSlot(slot.id, nextSlot.id)}
            className="flex-1 py-2.5 bg-primary text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lift"
          >
            <Zap className="w-3.5 h-3.5" />
            Extend 1 Hour
          </button>
        )}
        {endingSoon && nextSlot && nextSlot.status === 'full' && (
          <div className="flex-1 py-2.5 bg-slate-100 text-slate-500 font-bold text-xs rounded-xl flex items-center justify-center">
            Next slot is full
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Available Slot Row ───────────────────────────────────────────────────────

const AvailableSlotRow: React.FC<{
  slot: RiderSlot;
  onBook: () => void;
  onWaitlist: () => void;
  isBooked: boolean;
}> = ({ slot, onBook, onWaitlist, isBooked }) => {
  const { adminConfig } = useRider();
  const now = Date.now();
  const isPast = now >= slot.endTimestamp;
  const bookingOpen = isBookingOpen(slot, adminConfig.slot);
  const capacityPct = Math.floor((slot.bookedCount / slot.capacity) * 100);

  if (isPast) return null;

  return (
    <div
      className={`bg-white rounded-xl border px-4 py-3 flex items-center gap-3 transition-all ${
        isBooked ? 'border-primary/30 bg-primary/5' : 'border-slate-200'
      }`}
    >
      {/* Time */}
      <div className="shrink-0 text-center w-20">
        <p className="text-[13px] font-black text-slate-900 font-mono">
          {formatTimeAMPM(slot.startTimestamp)}
        </p>
        <p className="text-[10px] text-slate-400">–{formatTimeAMPM(slot.endTimestamp)}</p>
      </div>

      {/* Middle */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <DemandBadge level={slot.demandLevel} />
          <SlotStatusBadge status={isBooked ? (slot.status === 'active' ? 'active' : 'booked') : slot.status} />
        </div>

        {/* Capacity bar */}
        <div className="mt-1.5 flex items-center gap-2">
          <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                capacityPct >= 90 ? 'bg-red-400' : capacityPct >= 60 ? 'bg-amber-400' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(100, capacityPct)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-0.5">
            <Users className="w-2.5 h-2.5" />
            {slot.bookedCount}/{slot.capacity}
          </span>
        </div>
      </div>

      {/* Action */}
      <div className="shrink-0">
        {isBooked ? (
          <div className="flex items-center gap-1 text-primary text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">Booked</span>
          </div>
        ) : slot.status === 'full' && adminConfig.slot.waitlistEnabled ? (
          <button
            onClick={onWaitlist}
            className="text-[11px] font-bold text-purple-600 border border-purple-200 bg-purple-50 px-2.5 py-1.5 rounded-lg active:scale-95 whitespace-nowrap"
          >
            Waitlist
          </button>
        ) : slot.status === 'full' ? (
          <span className="text-[10px] font-bold text-slate-400">Full</span>
        ) : !bookingOpen ? (
          <span className="text-[10px] font-bold text-slate-400 text-center leading-tight">
            Booking<br />closed
          </span>
        ) : (
          <button
            onClick={onBook}
            className="text-[11px] font-bold text-white bg-primary px-3 py-1.5 rounded-lg active:scale-95 shadow-sm"
          >
            Book
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Booking Modal ────────────────────────────────────────────────────────────

const BookingConfirmModal: React.FC<{
  slot: RiderSlot;
  onConfirm: () => void;
  onClose: () => void;
}> = ({ slot, onConfirm, onClose }) => {
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setConfirmed(true);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-6 animate-slide-up shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {confirmed ? (
          <div className="flex flex-col items-center py-4 gap-3">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Slot Booked!</h2>
            <p className="text-sm text-slate-500 text-center">
              {formatTimeAMPM(slot.startTimestamp)} – {formatTimeAMPM(slot.endTimestamp)} in {slot.zoneName}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-slate-900">Confirm Slot</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center active:scale-95">
                <XCircle className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Slot details */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-[18px] font-black text-slate-900 font-mono">
                    {formatTimeAMPM(slot.startTimestamp)} – {formatTimeAMPM(slot.endTimestamp)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold text-slate-600">{slot.zoneName}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-primary/10 flex items-center justify-between text-[11px]">
                <DemandBadge level={slot.demandLevel} />
                <span className="text-slate-500 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {slot.bookedCount}/{slot.capacity} riders booked
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="bg-slate-50 rounded-xl p-3 mb-5 text-[11px] text-slate-500 flex items-start gap-2 border border-slate-200">
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                You'll be able to go Online 5 minutes before your slot starts. Go to{' '}
                <strong className="text-slate-700">{slot.zoneName}</strong> to start receiving orders.
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-[2] py-3 bg-gradient-to-r from-primary to-primary-container text-white font-bold text-xs rounded-xl shadow-lift active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-4 h-4" />
                Book Slot
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Slot History Item ────────────────────────────────────────────────────────

const SlotHistoryItem: React.FC<{ slot: RiderSlot }> = ({ slot }) => {
  const statusConfig = {
    completed: { icon: <CheckCircle2 className="w-4 h-4 text-primary" />, color: 'text-primary' },
    missed: { icon: <AlertCircle className="w-4 h-4 text-amber-500" />, color: 'text-amber-500' },
    cancelled: { icon: <XCircle className="w-4 h-4 text-red-500" />, color: 'text-red-500' },
  };
  const cfg = statusConfig[slot.status as 'completed' | 'missed' | 'cancelled'] || statusConfig.completed;

  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-slate-900 font-mono">
          {formatTimeAMPM(slot.startTimestamp)} – {formatTimeAMPM(slot.endTimestamp)}
        </p>
        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3 text-primary" />
          {slot.zoneName}
        </p>
      </div>
      <div className="text-right shrink-0">
        <SlotStatusBadge status={slot.status} />
        <p className="text-[10px] text-slate-400 mt-1">{slot.date}</p>
      </div>
    </div>
  );
};

// ─── Main Slots Page ──────────────────────────────────────────────────────────

export default function SlotsPage() {
  const {
    slots,
    activeSlot,
    upcomingSlot,
    adminConfig,
    bookSlot,
    addSlotToWaitlist,
    rider,
    zoneStatus,
    riderBreak,
    nonAcceptanceCount,
    refreshZoneStatus,
    isOnline,
  } = useRider();

  const [selectedTab, setSelectedTab] = useState<'slots' | 'history'>('slots');
  const [bookingSlot, setBookingSlot] = useState<RiderSlot | null>(null);
  const [now, setNow] = useState(Date.now());

  // Re-render every second for live countdowns
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Determine selected zone
  const selectedZoneId = rider.selectedZoneId || 'zone-1';

  // Split slots into categories
  const futureSlots = slots.filter((s) => now < s.endTimestamp);
  const historySlots = slots.filter((s) => now >= s.endTimestamp);
  const bookedIds = slots.filter((s) => s.status === 'booked' || s.status === 'active').map((s) => s.id);

  const isBreakActive = riderBreak && !riderBreak.endedAt;

  return (
    <AppShell>
      <div className="flex flex-col gap-4 pt-2 pb-6 animate-fade-in">

        {/* ── Zone Status Banner ───────────────────────── */}
        {zoneStatus !== 'inside' && zoneStatus !== 'unknown' && (
          <div
            className={`rounded-2xl px-4 py-3 flex items-start gap-2.5 border ${
              zoneStatus === 'outside'
                ? 'bg-amber-50 border-amber-200'
                : zoneStatus === 'permission_denied' || zoneStatus === 'gps_disabled'
                ? 'bg-red-50 border-red-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <MapPin
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                zoneStatus === 'outside' ? 'text-amber-600' : 'text-red-500'
              }`}
            />
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-800">
                {zoneStatus === 'outside'
                  ? `You're outside ${rider.selectedZone}`
                  : zoneStatus === 'permission_denied'
                  ? 'Location permission denied'
                  : zoneStatus === 'gps_disabled'
                  ? 'GPS is disabled'
                  : zoneStatus === 'low_accuracy'
                  ? 'GPS signal is weak'
                  : 'Location unavailable'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {zoneStatus === 'outside'
                  ? `Go to ${rider.selectedZone} to receive orders`
                  : 'Enable location to verify your zone'}
              </p>
            </div>
            <button
              onClick={refreshZoneStatus}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-white border border-slate-200 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        )}

        {/* ── Break Banner ─────────────────────────────── */}
        {isBreakActive && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3 flex items-center gap-3">
            <Coffee className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-bold text-amber-800">You're on a break</p>
              <p className="text-[11px] text-amber-600">No new orders during break</p>
            </div>
          </div>
        )}

        {/* ── Acceptance Warning ───────────────────────── */}
        {nonAcceptanceCount >= adminConfig.orderAcceptance.warning1Threshold && (
          <div
            className={`rounded-2xl px-4 py-3 flex items-start gap-2.5 border ${
              nonAcceptanceCount >= adminConfig.orderAcceptance.maxNonAcceptances
                ? 'bg-red-50 border-red-300'
                : 'bg-amber-50 border-amber-300'
            }`}
          >
            <AlertCircle
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                nonAcceptanceCount >= adminConfig.orderAcceptance.maxNonAcceptances
                  ? 'text-red-500'
                  : 'text-amber-600'
              }`}
            />
            <div>
              <p className="text-xs font-bold text-slate-800">
                {nonAcceptanceCount >= adminConfig.orderAcceptance.maxNonAcceptances
                  ? '🔴 Acceptance Threshold Reached'
                  : '⚠️ Order Acceptance Warning'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {nonAcceptanceCount} non-accepted order{nonAcceptanceCount !== 1 ? 's' : ''} this slot.
              </p>
            </div>
          </div>
        )}

        {/* ── Tab Switcher ─────────────────────────────── */}
        <div className="flex bg-slate-200/80 p-1 rounded-2xl w-full border border-slate-300/60 shadow-inner">
          {(['slots', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`flex-1 py-2 text-center rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                selectedTab === tab
                  ? 'bg-white text-primary shadow-soft scale-[1.02]'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              {tab === 'slots' ? (
                <>
                  <Calendar className="w-3.5 h-3.5" />
                  Today&apos;s Slots
                </>
              ) : (
                <>
                  <History className="w-3.5 h-3.5" />
                  History
                </>
              )}
            </button>
          ))}
        </div>

        {selectedTab === 'slots' && (
          <>
            {/* ── Active / Current Slot ──────────────────── */}
            {activeSlot && <CurrentSlotCard slot={activeSlot} />}

            {/* ── Upcoming Booked Slot ───────────────────── */}
            {upcomingSlot && !activeSlot && (
              <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-blue-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-[11px] font-extrabold tracking-wider text-slate-600 uppercase">Upcoming</span>
                  </div>
                  <SlotStatusBadge status="booked" />
                </div>
                <div className="px-4 py-3">
                  <p className="text-[20px] font-black text-slate-900 font-mono">
                    {formatTimeAMPM(upcomingSlot.startTimestamp)}
                  </p>
                  <p className="text-[13px] font-bold text-slate-500">
                    – {formatTimeAMPM(upcomingSlot.endTimestamp)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-[12px] text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span className="font-semibold">{upcomingSlot.zoneName}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] text-slate-500">
                      Starts in {formatRemainingTime(upcomingSlot.startTimestamp - now)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── No Slot Booked ─────────────────────────── */}
            {!activeSlot && !upcomingSlot && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-7 h-7 text-slate-400" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">No Slot Booked</h3>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[220px] mx-auto">
                  Book a slot below to start receiving orders. Must book at least 1 hour in advance.
                </p>
              </div>
            )}

            {/* ── Available Slots ────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[14px] font-bold text-slate-900">Available Slots</h2>
                <span className="text-[11px] font-semibold text-slate-500">
                  {futureSlots.filter((s) => s.status === 'available').length} available
                </span>
              </div>

              {futureSlots.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <ListX className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No slots available for today.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {futureSlots.map((slot) => (
                    <AvailableSlotRow
                      key={slot.id}
                      slot={slot}
                      isBooked={bookedIds.includes(slot.id)}
                      onBook={() => setBookingSlot(slot)}
                      onWaitlist={() => addSlotToWaitlist(slot.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Info Card ──────────────────────────────── */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-[11px] text-slate-500 space-y-2">
              <div className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                <span>Slots must be booked at least <strong className="text-slate-700">{adminConfig.slot.bookingCutoffMinutes} minutes</strong> before they start.</span>
              </div>
              <div className="flex items-start gap-2">
                <Coffee className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                <span><strong className="text-slate-700">{adminConfig.break.allowedBreakMinutes} minutes</strong> break allowed per slot. Breaks are optional.</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                <span>You must be inside <strong className="text-slate-700">{rider.selectedZone}</strong> to go Online.</span>
              </div>
            </div>
          </>
        )}

        {selectedTab === 'history' && (
          <>
            {historySlots.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
                <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-sm text-slate-700">No Slot History</h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Completed, missed, and cancelled slots will appear here.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {historySlots.map((slot) => (
                  <SlotHistoryItem key={slot.id} slot={slot} />
                ))}
              </div>
            )}

            {/* Performance summary */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Slot Performance
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Acceptance Rate', value: `${rider.acceptanceRate}%`, color: 'text-primary' },
                  { label: 'Completion Rate', value: `${rider.completionRate || 97}%`, color: 'text-blue-600' },
                  { label: 'Slot Reliability', value: `${rider.slotReliability || 96}%`, color: 'text-orange-500' },
                  { label: 'On-Time Rate', value: `${rider.onTimeRate || 94}%`, color: 'text-amber-500' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">{label}</p>
                    <p className={`text-[20px] font-black font-mono mt-0.5 ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Booking Confirmation Modal */}
      {bookingSlot && (
        <BookingConfirmModal
          slot={bookingSlot}
          onConfirm={() => {
            bookSlot(bookingSlot.id, selectedZoneId, rider.selectedZone);
          }}
          onClose={() => setBookingSlot(null)}
        />
      )}
    </AppShell>
  );
}
