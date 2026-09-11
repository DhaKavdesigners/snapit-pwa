'use client';

import React, { useState, useEffect } from 'react';
import { useRider } from '@/context/RiderContext';
import {
  getSessionRemainingMs,
  formatRemainingSessionTime,
  getSessionBreakAllowanceMinutes,
  formatRemainingBreakTime,
} from '@/services/sessionService';
import {
  Clock,
  Plus,
  Coffee,
  Play,
  MapPin,
} from 'lucide-react';

interface ActiveSessionCardProps {
  onOpenExtend: () => void;
  onOpenGoOffline?: () => void;
}

export const ActiveSessionCard: React.FC<ActiveSessionCardProps> = ({
  onOpenExtend,
}) => {
  const {
    rider,
    activeSession,
    riderBreak,
    startBreak,
    endBreak,
    activeOrder,
    remainingBreakAllowanceMs,
  } = useRider();

  // Local 1-second countdown ticker so only this card re-renders every second,
  // preventing unnecessary global re-renders
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isBreakActive = Boolean(riderBreak && !riderBreak.endedAt);

  // Remaining session time calculated strictly from timestamps
  const remainingMs = getSessionRemainingMs(activeSession, now);
  const remainingTimeStr = formatRemainingSessionTime(remainingMs);

  // Session progress percentage
  const totalDurationMs = (activeSession?.planned_duration_mins || 180) * 60000;
  const elapsedMs = totalDurationMs - remainingMs;
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100)));

  // Break allowance based on planned session hours:
  // 2h -> 15m single break, 3h -> 25m, 4h -> 30m
  const sessionBreakAllowanceMins = getSessionBreakAllowanceMinutes(activeSession?.planned_duration_mins);
  const breakAllowedMs = riderBreak?.allowedDurationMs || (sessionBreakAllowanceMins * 60000);

  // Reducing countdown calculation
  const breakElapsedMs = riderBreak ? Math.max(0, now - riderBreak.startedAt) : 0;
  const breakRemainingMs = Math.max(0, breakAllowedMs - breakElapsedMs);
  const breakRemainingStr = formatRemainingBreakTime(breakRemainingMs);
  const breakProgressPercent = Math.min(100, Math.max(0, Math.round((breakRemainingMs / breakAllowedMs) * 100)));

  const zoneName = activeSession?.zone_name || rider.selectedZone || 'Robertsonpet';

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-4 relative overflow-hidden animate-fade-in">
      {/* ── TOP HEADER: STATUS BADGE + WORKING ZONE ── */}
      <div className="flex items-center justify-between gap-2">
        {/* Status Pill */}
        <div className="flex items-center gap-2">
          {isBreakActive ? (
            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 text-xs font-black uppercase px-3 py-1 rounded-full border border-amber-200 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              On Break ⏸️
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-black uppercase px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              Online & Ready 🟢
            </span>
          )}
        </div>

        {/* Current Working Zone */}
        <div className="inline-flex items-center gap-1 text-xs font-black text-slate-700 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl shadow-2xs max-w-[170px] truncate">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">{zoneName}</span>
        </div>
      </div>

      {/* ── MAIN COCKPIT DISPLAY: COUNTDOWN + PROGRESS BAR ── */}
      {isBreakActive ? (
        /* Break Active Cockpit View: 15m/25m/30m Reducing Countdown */
        <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200/80 text-center space-y-2.5 animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-2xs">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Break Time Remaining
            </span>
            <p className="text-3xl font-black text-slate-900 font-mono mt-0.5 tracking-tight">
              {breakRemainingStr}
            </p>

            {/* Smooth Reducing Progress Bar */}
            <div className="w-full max-w-xs mx-auto h-2 rounded-full bg-amber-200/70 overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${breakProgressPercent}%` }}
              />
            </div>

            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {breakRemainingMs > 0
                ? 'Orders paused. Tap resume when ready to receive deliveries.'
                : `Break allowance completed (${sessionBreakAllowanceMins}m). Tap resume to start receiving orders.`}
            </p>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={endBreak}
              className={`w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider ${
                breakRemainingMs === 0 ? 'animate-pulse' : ''
              }`}
            >
              <Play className="w-4 h-4 fill-white stroke-none" />
              <span>Resume Riding</span>
            </button>
          </div>
        </div>
      ) : (
        /* Normal Session Cockpit View */
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Riding Session Remaining
                </span>
                <p className="text-xl font-black text-slate-900 font-mono leading-tight mt-0.5">
                  {remainingTimeStr}
                </p>
              </div>
            </div>

            {/* Extend +1h Quick Pill */}
            <button
              type="button"
              onClick={onOpenExtend}
              className="px-3 py-1.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-black text-emerald-700 shadow-2xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+1 Hr</span>
            </button>
          </div>

          {/* Clean Progress Line */}
          <div className="space-y-1">
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${100 - progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>{Math.round((activeSession?.planned_duration_mins || 180) / 60)}h Planned Session</span>
              <span>Listening for orders</span>
            </div>
          </div>
        </div>
      )}

      {/* ── COCKPIT CONTROLS: TAKE BREAK ── */}
      {!isBreakActive && (
        <div className="pt-1">
          {/* Take Break Button (Idle only, disabled if delivering or break fully used) */}
          <button
            type="button"
            onClick={startBreak}
            disabled={Boolean(activeOrder) || (remainingBreakAllowanceMs !== undefined && remainingBreakAllowanceMs <= 0)}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-extrabold text-xs rounded-2xl border border-slate-200/90 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            title={
              activeOrder
                ? 'Finish active delivery first'
                : remainingBreakAllowanceMs !== undefined && remainingBreakAllowanceMs <= 0
                ? 'Break allowance already used for this session'
                : 'Take your riding break'
            }
          >
            <Coffee className="w-4 h-4 text-slate-600" />
            <span>
              {remainingBreakAllowanceMs !== undefined && remainingBreakAllowanceMs <= 0
                ? `Break Used (${sessionBreakAllowanceMins}m limit)`
                : `Take Break (${sessionBreakAllowanceMins}m)`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
