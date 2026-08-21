'use client';

import React, { useState, useEffect } from 'react';
import { useRider } from '@/context/RiderContext';
import { formatTimeAMPM, formatRemainingTime } from '@/services/slotService';
import { computeBreakState } from '@/services/breakService';
import Link from 'next/link';
import { Calendar, Clock, Coffee, Zap, AlertCircle, ChevronRight } from 'lucide-react';

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
  } = useRider();

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const breakState = computeBreakState(riderBreak || null, adminConfig.break, now);
  const isBreakActive = riderBreak && !riderBreak.endedAt;
  const onlineGate = canGoOnline();

  // No active or upcoming slot
  if (!activeSlot && !upcomingSlot) {
    return (
      <Link
        href="/slots"
        className="bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm px-4 py-3 flex items-center justify-between active:scale-98 transition-transform"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-700">No Slot Booked</p>
            <p className="text-[11px] text-slate-500">Tap to book a slot and receive orders</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </Link>
    );
  }

  // On break
  if (isBreakActive) {
    return (
      <div className="bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
            <Coffee className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-amber-800">ON BREAK</p>
            <p className="text-[11px] text-amber-600">{breakState.displayCountdown} remaining</p>
          </div>
        </div>
        <button
          onClick={endBreak}
          className="bg-primary text-white text-[11px] font-bold px-3 py-2 rounded-xl shadow-sm active:scale-95"
        >
          Resume Online
        </button>
      </div>
    );
  }

  // Active slot
  if (activeSlot) {
    const remaining = activeSlot.endTimestamp - now;
    const nextSlot = slots.find(
      (s) => s.startTimestamp === activeSlot.endTimestamp && s.status === 'available'
    );
    const endingSoon = remaining > 0 && remaining <= 10 * 60000;

    if (now >= activeSlot.endTimestamp) {
      return (
        <div className="bg-slate-800 text-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[13px] font-bold">YOUR SLOT HAS ENDED</p>
            <p className="text-[11px] text-slate-400">You are now Offline</p>
          </div>
          <Link
            href="/slots"
            className="bg-primary text-white text-[11px] font-bold px-3 py-2 rounded-xl active:scale-95"
          >
            Book Next
          </Link>
        </div>
      );
    }

    if (endingSoon) {
      return (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold text-amber-800">
                SLOT ENDS IN {Math.ceil(remaining / 60000)} MIN
              </p>
              <p className="text-[11px] text-amber-600">
                {formatTimeAMPM(activeSlot.startTimestamp)} – {formatTimeAMPM(activeSlot.endTimestamp)}
              </p>
            </div>
            {nextSlot && (
              <button
                onClick={() => extendSlot(activeSlot.id, nextSlot.id)}
                className="bg-primary text-white text-[11px] font-bold px-3 py-2 rounded-xl shadow-sm active:scale-95 shrink-0 ml-2"
              >
                <Zap className="w-3 h-3 inline mr-1" />
                Extend 1 Hour
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        className={`rounded-2xl border shadow-sm overflow-hidden ${
          !isOnline && !onlineGate.canGo ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
        }`}
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[13px] font-bold text-slate-900">ACTIVE SLOT</p>
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-500">
                {formatTimeAMPM(activeSlot.startTimestamp)} – {formatTimeAMPM(activeSlot.endTimestamp)} ·{' '}
                {activeSlot.zoneName}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[12px] font-bold text-primary">{formatRemainingTime(remaining)}</p>
            <p className="text-[10px] text-slate-400">remaining</p>
          </div>
        </div>

        {!onlineGate.canGo && !isOnline && (
          <div className="px-4 pb-3 flex items-center gap-2 text-[11px] text-amber-700">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{onlineGate.reason}</span>
          </div>
        )}

        {isOnline && (
          <div className="px-4 pb-3 flex justify-end">
            <button
              onClick={startBreak}
              className="text-[11px] font-bold text-amber-700 border border-amber-200 bg-amber-50 px-3 py-1.5 rounded-lg flex items-center gap-1 active:scale-95"
            >
              <Coffee className="w-3 h-3" />
              Take Break
            </button>
          </div>
        )}
      </div>
    );
  }

  // Upcoming slot
  if (upcomingSlot) {
    const startsIn = upcomingSlot.startTimestamp - now;
    const isSoon = startsIn <= 10 * 60000;
    return (
      <div
        className={`rounded-2xl border shadow-sm px-4 py-3 flex items-center justify-between ${
          isSoon ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isSoon ? 'bg-amber-100' : 'bg-blue-50'
            }`}
          >
            <Clock className={`w-5 h-5 ${isSoon ? 'text-amber-600 animate-pulse' : 'text-blue-500'}`} />
          </div>
          <div>
            <p className={`text-[13px] font-bold ${isSoon ? 'text-amber-800' : 'text-slate-900'}`}>
              {isSoon ? '⏰ SLOT STARTS SOON' : 'UPCOMING SLOT'}
            </p>
            <p className="text-[11px] text-slate-500">
              {formatTimeAMPM(upcomingSlot.startTimestamp)} – {formatTimeAMPM(upcomingSlot.endTimestamp)} ·{' '}
              Starts in {formatRemainingTime(startsIn)}
            </p>
          </div>
        </div>
        <Link
          href="/slots"
          className="text-[11px] font-bold text-primary border border-primary/20 bg-primary/5 px-2.5 py-1.5 rounded-xl shrink-0 active:scale-95"
        >
          View
        </Link>
      </div>
    );
  }

  return null;
};
