'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, ChevronRight, Sparkles, MapPin } from 'lucide-react';
import { useRider } from '@/context/RiderContext';
import {
  AVAILABILITY_WINDOWS,
  getActivePreferenceWindow,
} from '@/services/preferenceService';
import { PreferenceWindowId } from '@/types';

export const HomeAvailabilityCard: React.FC = () => {
  const { rider, ridingPreferences } = useRider();
  const [activeWindowId, setActiveWindowId] = useState<PreferenceWindowId | null>(null);

  useEffect(() => {
    setActiveWindowId(getActivePreferenceWindow());
    const interval = setInterval(() => {
      setActiveWindowId(getActivePreferenceWindow());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const activeWindow = AVAILABILITY_WINDOWS.find((w) => w.id === activeWindowId);
  const isPriorityActive = activeWindowId ? (ridingPreferences || []).includes(activeWindowId) : false;
  const selectedCount = (ridingPreferences || []).length;

  return (
    <div
      className={`rounded-2xl p-4 border transition-all shadow-2xs ${
        isPriorityActive
          ? 'bg-gradient-to-r from-emerald-50/90 to-teal-50/90 border-emerald-300 ring-2 ring-emerald-500/15'
          : activeWindow
          ? 'bg-amber-50/80 border-amber-200'
          : 'bg-white border-slate-200/90'
      }`}
    >
      {/* Header Badge & Action Link */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isPriorityActive ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              ⭐ Priority Active Now
            </span>
          ) : activeWindow ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-200">
              <Clock className="w-3 h-3" />
              Window Live ({activeWindow.label})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200">
              <Clock className="w-3 h-3 text-slate-400" />
              Off-Peak Hours
            </span>
          )}
        </div>

        <Link
          href="/availability"
          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 shrink-0 transition-colors"
        >
          <span>Availability</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Info */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-black text-sm text-slate-900 leading-tight">
            {activeWindow ? (
              <span className="flex items-center gap-1.5">
                <span>{activeWindow.emoji}</span>
                <span>{activeWindow.label} ({activeWindow.timeRange})</span>
              </span>
            ) : (
              'Flexible Riding Active'
            )}
          </h3>

          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">
            {isPriorityActive
              ? 'Your nearby-order priority boost is active in this zone.'
              : activeWindow
              ? 'Set this window in Availability to boost order priority.'
              : 'Ride anytime without rigid hourly slots.'}
          </p>
        </div>

        {/* Selected count pill */}
        <div className="shrink-0">
          <Link
            href="/availability"
            className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-1 text-[11px] font-black text-slate-700 hover:border-slate-300 transition-all active:scale-95"
          >
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>{selectedCount}/4 Selected</span>
          </Link>
        </div>
      </div>

      {/* 4 Mini Pills for Windows */}
      <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-slate-200/60">
        {AVAILABILITY_WINDOWS.map((win) => {
          const isSelected = (ridingPreferences || []).includes(win.id);
          const isCurrent = activeWindowId === win.id;

          return (
            <Link
              key={win.id}
              href="/availability"
              className={`py-1 px-1 rounded-lg text-center transition-all flex flex-col items-center justify-center ${
                isSelected && isCurrent
                  ? 'bg-emerald-600 text-white font-black shadow-2xs ring-1 ring-emerald-400'
                  : isSelected
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                  : isCurrent
                  ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                  : 'bg-slate-50 text-slate-400 border border-slate-200/80'
              }`}
            >
              <span className="text-[10px] leading-tight">{win.emoji}</span>
              <span className="text-[9px] font-extrabold truncate max-w-full">
                {win.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
