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
  ChevronDown,
} from 'lucide-react';
import { ZoneSelectionModal } from '@/components/slots/ZoneSelectionModal';
import {
  formatTimeAMPM,
  formatRemainingTime,
  formatCountdown,
  demandLabel,
  isBookingOpen,
  findNextSlot,
} from '@/services/slotService';
import { getNow } from '@/services/mockService';
import { RiderSlot, DemandLevel, SlotStatus } from '@/types';

// ─── Status Badge (AVAILABLE / BOOKED ONLY) ───────────────────────────────────

const SlotStatusBadge: React.FC<{ isBooked: boolean }> = ({ isBooked }) => {
  return (
    <span
      className={`text-[10px] font-black tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${
        isBooked
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : 'bg-green-50 text-green-700 border-green-200'
      }`}
    >
      {isBooked ? 'BOOKED' : 'AVAILABLE'}
    </span>
  );
};

// ─── Current Slot Card (Clean, Professional, Online/Offline Only) ──────────────

const CurrentSlotCard: React.FC<{ slot: RiderSlot }> = ({ slot }) => {
  const { isOnline, extendSlot, slots, adminConfig } = useRider();
  const [now, setNow] = useState(getNow());

  useEffect(() => {
    const t = setInterval(() => setNow(getNow()), 1000);
    return () => clearInterval(t);
  }, []);

  const remainingMs = Math.max(0, slot.endTimestamp - now);
  const totalMs = slot.endTimestamp - slot.startTimestamp;
  const elapsed = now - slot.startTimestamp;
  const progressPct = Math.min(100, Math.floor((elapsed / totalMs) * 100));
  const nextSlot = findNextSlot(slot, slots);
  const endingSoon = remainingMs > 0 && remainingMs <= 10 * 60000;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${endingSoon ? 'border-amber-300' : 'border-slate-200'}`}>
      {/* Header bar */}
      <div className={`px-4 py-2.5 flex items-center justify-between ${endingSoon ? 'bg-amber-50' : 'bg-slate-50 border-b border-slate-100'}`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[11px] font-extrabold tracking-wider text-slate-600 uppercase">
            Current Slot
          </span>
        </div>
        {endingSoon ? (
          <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
            ⚠️ Ending Soon
          </span>
        ) : (
          <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            <span>BOOKED</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-4 space-y-3">
        {/* Time, Zone & Online Status Row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[20px] font-black text-slate-900 font-mono leading-none">
              {formatTimeAMPM(slot.startTimestamp)} – {formatTimeAMPM(slot.endTimestamp)}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold">{slot.zoneName}</span>
            </div>
          </div>

          {/* Online / Offline Status Badge */}
          <div className="shrink-0 text-right">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Online Status</span>
            <span className={`inline-flex items-center gap-1.5 font-bold text-xs px-3 py-1 rounded-xl border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>{isOnline ? 'Yes' : 'No'}</span>
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        {slot.status === 'active' && (
          <div className="pt-1">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Remaining: {formatRemainingTime(remainingMs)}</span>
              <span>{progressPct}% elapsed</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Extend 1 Hour if ending soon */}
        {endingSoon && nextSlot && nextSlot.status === 'available' && adminConfig.slot.extensionEnabled && (
          <button
            onClick={() => extendSlot(slot.id, nextSlot.id)}
            className="w-full py-2.5 bg-primary text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lift"
          >
            <Zap className="w-3.5 h-3.5" />
            Extend 1 Hour
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Available Slot Row (Professional: Time on Left, Status + Action on Right) ─

const AvailableSlotRow: React.FC<{
  slot: RiderSlot;
  onBook: () => void;
  isBooked: boolean;
}> = ({ slot, onBook, isBooked }) => {
  const now = getNow();
  const isPast = now >= slot.endTimestamp;

  if (isPast) return null;

  return (
    <div
      className={`bg-white rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition-all ${
        isBooked ? 'border-blue-200/80 bg-blue-50/15' : 'border-slate-200'
      }`}
    >
      {/* Left: Time Range */}
      <div className="shrink-0 text-left">
        <p className="text-[14px] font-black text-slate-900 font-mono leading-none">
          {formatTimeAMPM(slot.startTimestamp)} – {formatTimeAMPM(slot.endTimestamp)}
        </p>
      </div>

      {/* Right: Status Badge & Action Button aligned together */}
      <div className="flex items-center gap-2 shrink-0">
        {isBooked ? (
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 stroke-[2.5]" />
            <span>BOOKED</span>
          </div>
        ) : (
          <>
            <SlotStatusBadge isBooked={false} />
            <button
              onClick={onBook}
              className="text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-95 px-3.5 py-1.5 rounded-xl shadow-xs transition-all"
            >
              Book
            </button>
          </>
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
        <SlotStatusBadge isBooked={true} />
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
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [now, setNow] = useState(getNow());

  // Re-render every second for live countdowns
  useEffect(() => {
    const t = setInterval(() => setNow(getNow()), 1000);
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

        {/* ── Top Header with Zone Selector ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-tight">Operating Slots</h1>
            <p className="text-xs text-slate-500 mt-0.5">Book your shift duties</p>
          </div>

          <button
            onClick={() => setIsZoneModalOpen(true)}
            className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm text-xs font-semibold text-slate-700 active:scale-95 hover:border-slate-300 transition-all text-left"
          >
            <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0" />
            <div className="text-left">
              <p className="text-[9px] text-slate-400 leading-none">Your Zone</p>
              <p className="text-[11px] font-bold text-slate-800">{rider.selectedZone || 'Robertsonpet'}</p>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>
        </div>

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
                  <SlotStatusBadge isBooked={true} />
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

      {/* Zone Selection & Locked Modal */}
      <ZoneSelectionModal
        isOpen={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
      />
    </AppShell>
  );
}
