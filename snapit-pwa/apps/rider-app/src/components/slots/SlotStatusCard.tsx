'use client';

import React, { useState, useEffect } from 'react';
import { useRider } from '@/context/RiderContext';
import { formatTimeAMPM, formatRemainingTime, isBookingOpen } from '@/services/slotService';
import { computeBreakState } from '@/services/breakService';
import { getNow } from '@/services/mockService';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Coffee,
  Zap,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  MapPin,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { RiderSlot } from '@/types';

export const SlotStatusCard: React.FC = () => {
  const {
    activeSlot,
    upcomingSlot,
    riderBreak,
    adminConfig,
    extendSlot,
    slots,
    startBreak,
    endBreak,
    isOnline,
    canGoOnline,
    rider,
  } = useRider();

  const [now, setNow] = useState(getNow());

  useEffect(() => {
    const t = setInterval(() => setNow(getNow()), 1000);
    return () => clearInterval(t);
  }, []);

  const breakState = computeBreakState(riderBreak || null, adminConfig.break, now);
  const isBreakActive = riderBreak && !riderBreak.endedAt;
  const onlineGate = canGoOnline();

  // ── 1. NO ACTIVE OR UPCOMING SLOT (Hero Slot Booking Widget) ──
  if (!activeSlot && !upcomingSlot) {
    return (
      <Link
        href="/slots"
        className="block bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-4 shadow-md border border-slate-700/60 relative overflow-hidden transition-all hover:scale-[1.01] active:scale-98 group"
      >
        {/* Background glow decorative elements */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header Label */}
        <div className="flex items-center justify-between mb-2.5 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Slot Booking Required</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Zone: <strong className="text-white">{rider.selectedZone || 'Robertsonpet'}</strong></span>
        </div>

        {/* Main Title & Subtitle */}
        <div className="relative z-10 mb-3">
          <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400 shrink-0" />
            Book Your Slot
          </h2>
          <p className="text-[11px] text-slate-300 mt-1 leading-normal">
            You are currently offline. Tap to choose your preferred time slot and start receiving delivery orders.
          </p>
        </div>

        {/* Action Button (Clicking Area) */}
        <div className="relative z-10">
          <div className="w-full py-2.5 bg-emerald-500 group-hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lift flex items-center justify-center gap-2 transition-all">
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            Book Here
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    );
  }

  // ── 2. ON BREAK ──
  if (isBreakActive) {
    return (
      <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 flex flex-col gap-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-800 flex items-center justify-center">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-md">
                Duty Break Active
              </span>
              <h3 className="text-lg font-black text-amber-900 mt-0.5">ON BREAK</h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-base font-black text-amber-800 font-mono">{breakState.displayCountdown}</p>
            <p className="text-[10px] text-amber-600 font-semibold">Remaining</p>
          </div>
        </div>

        <button
          onClick={endBreak}
          className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          Resume Duty (Go Online)
        </button>
      </div>
    );
  }

  // ── 3. ACTIVE SLOT ──
  if (activeSlot) {
    const remaining = activeSlot.endTimestamp - now;
    const nextSlot = slots.find(
      (s) => s.startTimestamp === activeSlot.endTimestamp && s.status === 'available'
    );
    const endingSoon = remaining > 0 && remaining <= 10 * 60000;

    if (now >= activeSlot.endTimestamp) {
      return (
        <div className="bg-slate-900 text-white rounded-3xl p-5 flex items-center justify-between shadow-lg border border-slate-700">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-red-500/20 text-red-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              Slot Ended
            </div>
            <h3 className="text-base font-black text-white mt-1">YOUR SLOT HAS ENDED</h3>
            <p className="text-xs text-slate-400">You are now Offline</p>
          </div>
          <Link
            href="/slots"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black px-4 py-3 rounded-2xl active:scale-95 transition-all shadow-md"
          >
            Book Next Slot
          </Link>
        </div>
      );
    }

    if (endingSoon) {
      return (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-3xl p-5 shadow-lg border border-amber-300">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-black/20 px-2.5 py-0.5 rounded-full">
                ⚠️ Ending Soon
              </span>
              <h3 className="text-lg font-black mt-1">SLOT ENDS IN {Math.ceil(remaining / 60000)} MIN</h3>
              <p className="text-xs opacity-90 font-medium">
                {formatTimeAMPM(activeSlot.startTimestamp)} – {formatTimeAMPM(activeSlot.endTimestamp)}
              </p>
            </div>
            {nextSlot && (
              <button
                onClick={() => extendSlot(activeSlot.id, nextSlot.id)}
                className="bg-white text-orange-600 font-black text-xs px-4 py-3 rounded-2xl shadow-lg active:scale-95 transition-all shrink-0 ml-2 flex items-center gap-1.5"
              >
                <Zap className="w-4 h-4 fill-orange-500" />
                Extend 1 Hr
              </button>
            )}
          </div>
        </div>
      );
    }

    const totalMs = activeSlot.endTimestamp - activeSlot.startTimestamp;
    const elapsed = now - activeSlot.startTimestamp;
    const progressPct = Math.min(100, Math.max(0, Math.floor((elapsed / totalMs) * 100)));

    return (
      <div
        className={`rounded-3xl border-2 shadow-lg p-5 transition-all ${
          !isOnline && !onlineGate.canGo ? 'bg-amber-50 border-amber-300' : 'bg-white border-emerald-500/30'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <span className="text-xs font-black text-emerald-700 uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              ACTIVE SLOT DUTY
            </span>
          </div>

          <div className="text-right">
            <span className="text-sm font-black text-emerald-600 font-mono">{formatRemainingTime(remaining)}</span>
            <span className="text-[10px] text-slate-400 block font-medium">remaining</span>
          </div>
        </div>

        {/* Slot details */}
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <h2 className="text-2xl font-black text-slate-900 font-mono leading-none">
              {formatTimeAMPM(activeSlot.startTimestamp)} – {formatTimeAMPM(activeSlot.endTimestamp)}
            </h2>
            <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {activeSlot.zoneName}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="my-3">
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {!onlineGate.canGo && !isOnline && (
          <div className="mt-2 p-2.5 bg-amber-100/80 rounded-xl flex items-center gap-2 text-xs font-semibold text-amber-800 border border-amber-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span className="truncate">{onlineGate.reason}</span>
          </div>
        )}

        {/* Action button */}
        {isOnline && (
          <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
            <button
              onClick={startBreak}
              className="text-xs font-bold text-amber-800 border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
            >
              <Coffee className="w-4 h-4 text-amber-600" />
              Take Break
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── 4. UPCOMING SLOT ──
  if (upcomingSlot) {
    const startsIn = upcomingSlot.startTimestamp - now;
    const isSoon = startsIn <= 10 * 60000;
    return (
      <div
        className={`rounded-3xl border-2 shadow-md p-5 flex items-center justify-between ${
          isSoon ? 'bg-amber-50 border-amber-300' : 'bg-white border-blue-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
              isSoon ? 'bg-amber-200 text-amber-800' : 'bg-blue-100 text-blue-600'
            }`}
          >
            <Clock className={`w-6 h-6 ${isSoon ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isSoon ? 'text-amber-800' : 'text-blue-600'}`}>
              {isSoon ? '⏰ SLOT STARTS SOON' : 'UPCOMING BOOKED SLOT'}
            </span>
            <p className="text-lg font-black text-slate-900 font-mono leading-tight">
              {formatTimeAMPM(upcomingSlot.startTimestamp)} – {formatTimeAMPM(upcomingSlot.endTimestamp)}
            </p>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Starts in {formatRemainingTime(startsIn)} · {upcomingSlot.zoneName}
            </p>
          </div>
        </div>
        <Link
          href="/slots"
          className="text-xs font-bold text-primary border border-primary/30 bg-primary/10 px-3 py-2 rounded-xl shrink-0 active:scale-95 transition-all"
        >
          View Slots
        </Link>
      </div>
    );
  }

  return null;
};

