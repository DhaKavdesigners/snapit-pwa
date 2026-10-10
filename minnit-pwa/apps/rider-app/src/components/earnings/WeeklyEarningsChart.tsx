'use client';

import React, { useState } from 'react';
import { WeeklyBarData } from '@/types/earnings';
import { Flame, Sparkles } from 'lucide-react';
import { triggerHaptic } from '@/services/preferenceService';

interface WeeklyEarningsChartProps {
  data: WeeklyBarData[];
}

export const WeeklyEarningsChart: React.FC<WeeklyEarningsChartProps> = ({ data }) => {
  // Find current day or default to today or day with highest amount
  const defaultSelectedDay = data.find((d) => d.isToday)?.day || data[data.length - 1]?.day || 'Sun';
  const [selectedDay, setSelectedDay] = useState<string>(defaultSelectedDay);

  const highestDay = data.reduce((max, d) => (d.amount > max.amount ? d : max), data[0] || { amount: 0 });
  const maxAmount = Math.max(...data.map((d) => d.amount), 300);

  const activeItem = data.find((d) => d.day === selectedDay);

  const handleBarTap = (day: string) => {
    triggerHaptic(8);
    setSelectedDay(day);
  };

  return (
    <div className="bg-gradient-to-b from-white via-white to-slate-50/70 rounded-3xl p-5 shadow-soft border border-slate-200/90 flex flex-col gap-3.5">
      {/* Header */}
      <div className="flex justify-between items-start gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-black text-sm text-slate-900 tracking-tight">Weekly Momentum</h3>
            {highestDay && highestDay.amount > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                <Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
                Peak: {highestDay.day} (₹{highestDay.amount})
              </span>
            )}
          </div>
          <p className="text-[11px] font-medium text-slate-500 mt-0.5">Daily delivery income this week</p>
        </div>

        {/* Selected Day Display */}
        {activeItem && (
          <div className="bg-emerald-50 text-emerald-900 border border-emerald-300/80 px-3 py-1.5 rounded-2xl text-right animate-fade-in shadow-2xs">
            <span className="text-[10px] font-extrabold block leading-none text-slate-500">{activeItem.dayFull}</span>
            <span className="text-sm font-black font-mono text-emerald-700">₹{activeItem.amount}</span>
          </div>
        )}
      </div>

      {/* Chart Canvas Area */}
      <div className="h-44 flex items-end justify-between gap-1.5 relative pt-10 pb-1 mt-1">
        {/* Horizontal Reference Grid Lines */}
        <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between pointer-events-none pb-7 z-0">
          <div className="w-full flex items-center justify-between">
            <div className="w-full h-px bg-slate-100 border-t border-dashed border-slate-200" />
            <span className="text-[9px] font-mono text-slate-400 pl-1">₹{maxAmount}</span>
          </div>
          <div className="w-full flex items-center justify-between">
            <div className="w-full h-px bg-slate-100 border-t border-dashed border-slate-200" />
            <span className="text-[9px] font-mono text-slate-400 pl-1">₹{Math.round(maxAmount / 2)}</span>
          </div>
          <div className="w-full flex items-center justify-between">
            <div className="w-full h-px bg-slate-100" />
            <span className="text-[9px] font-mono text-slate-400 pl-1">₹0</span>
          </div>
        </div>

        {/* 7 Daily Vertical Bars */}
        {data.map((item) => {
          const isSelected = selectedDay === item.day;
          const isCurrentDay = !!item.isToday;
          const hasEarned = item.amount > 0;
          const heightPercent = maxAmount > 0 && item.amount > 0
            ? Math.max(Math.round((item.amount / maxAmount) * 100), 16)
            : 8;

          return (
            <div
              key={item.day}
              onClick={() => handleBarTap(item.day)}
              className="flex-1 flex flex-col items-center z-10 cursor-pointer group relative h-full justify-end select-none"
              role="button"
              tabIndex={0}
              aria-label={`${item.dayFull}: ₹${item.amount} earned`}
            >
              {/* Tooltip on active bar */}
              {isSelected && (
                <div className="absolute -top-8 bg-slate-900 text-white px-2.5 py-1 rounded-xl shadow-xl pointer-events-none text-center whitespace-nowrap z-30 animate-scale-up ring-1 ring-white/20">
                  <span className="text-[9px] font-semibold text-slate-300 block leading-tight">
                    {item.dayFull}
                  </span>
                  <span className="text-xs font-black font-mono text-emerald-400 leading-tight">
                    ₹{item.amount} {hasEarned ? '🎉' : ''}
                  </span>
                  {item.deliveries ? (
                    <span className="text-[9px] text-teal-200 block font-bold leading-tight">
                      {item.deliveries} {item.deliveries === 1 ? 'order' : 'orders'}
                    </span>
                  ) : null}
                  {/* Tooltip arrow */}
                  <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mb-1 mt-0.5" />
                </div>
              )}

              {/* Bar Track & Fill */}
              <div className="w-full max-w-[38px] bg-slate-100/90 rounded-t-xl relative h-28 flex items-end overflow-hidden border border-slate-200/60 shadow-inner">
                <div
                  className={`w-full rounded-t-xl transition-all duration-300 ease-out relative ${
                    hasEarned
                      ? isSelected
                        ? 'bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/50'
                        : 'bg-gradient-to-t from-emerald-600 to-teal-500 shadow-xs'
                      : isCurrentDay
                      ? 'bg-slate-300/80'
                      : 'bg-slate-200/50 group-hover:bg-slate-300/70'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                >
                  {hasEarned && (
                    <div className="absolute top-1 left-1 right-1 h-1 bg-white/40 rounded-full blur-[1px]" />
                  )}
                </div>
              </div>

              {/* Day Label */}
              <div className="mt-2 flex flex-col items-center">
                <span
                  className={`text-[11px] transition-colors ${
                    isSelected
                      ? 'font-black text-emerald-700'
                      : isCurrentDay
                      ? 'font-black text-slate-900'
                      : hasEarned
                      ? 'font-bold text-slate-700'
                      : 'font-medium text-slate-400 group-hover:text-slate-700'
                  }`}
                >
                  {item.day}
                </span>

                {/* Highlight dot for current day */}
                {isCurrentDay && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtle Bottom Metric Pill */}
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-2 border-t border-slate-100">
        <span className="flex items-center gap-1 text-slate-600">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Average: <strong className="text-slate-900 font-mono">₹30 / delivery</strong>
        </span>
        <span className="text-emerald-700 font-extrabold">100% Verified Trips</span>
      </div>
    </div>
  );
};
