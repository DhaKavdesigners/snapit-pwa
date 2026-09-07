'use client';

import React, { useState } from 'react';
import { WeeklyBarData } from '@/types/earnings';

interface WeeklyEarningsChartProps {
  data: WeeklyBarData[];
}

export const WeeklyEarningsChart: React.FC<WeeklyEarningsChartProps> = ({ data }) => {
  // Find current day or default to Sunday (last day)
  const defaultSelectedDay = data.find((d) => d.isToday)?.day || data[data.length - 1]?.day || 'Sun';
  const [selectedDay, setSelectedDay] = useState<string>(defaultSelectedDay);

  const maxAmount = Math.max(...data.map((d) => d.amount), 1000);

  const activeItem = data.find((d) => d.day === selectedDay);

  return (
    <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 flex flex-col gap-3">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-sm text-slate-900 tracking-tight">Weekly Earnings</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Daily income from completed deliveries</p>
        </div>

        {/* Selected Day Quick Display or active pill */}
        {activeItem && (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200/90 px-2.5 py-1 rounded-xl text-right animate-fade-in">
            <span className="text-[10px] font-bold block leading-none">{activeItem.dayFull}</span>
            <span className="text-xs font-black font-mono text-emerald-700">₹{activeItem.amount}</span>
          </div>
        )}
      </div>

      {/* Chart Canvas Area */}
      <div className="h-44 flex items-end justify-between gap-1.5 relative pt-10 pb-1 mt-1">
        {/* Subtle Horizontal Reference Grid Lines */}
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
          const heightPercent = Math.max(Math.round((item.amount / maxAmount) * 100), 12);

          return (
            <div
              key={item.day}
              onClick={() => setSelectedDay(item.day)}
              className="flex-1 flex flex-col items-center z-10 cursor-pointer group relative h-full justify-end select-none"
              role="button"
              tabIndex={0}
              aria-label={`${item.dayFull}: ₹${item.amount} earned`}
            >
              {/* Tooltip on active bar or hover */}
              {isSelected && (
                <div className="absolute -top-7 bg-slate-900 text-white px-2.5 py-1 rounded-lg shadow-lg pointer-events-none text-center whitespace-nowrap z-30 animate-scale-up ring-1 ring-white/20">
                  <span className="text-[9px] font-medium text-slate-300 block leading-tight">
                    {item.dayFull}
                  </span>
                  <span className="text-[11px] font-black font-mono text-emerald-400 leading-tight">
                    ₹{item.amount} earned
                  </span>
                  {/* Tooltip arrow */}
                  <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mb-1 mt-0.5" />
                </div>
              )}

              {/* Bar Track & Fill */}
              <div className="w-full max-w-[36px] bg-slate-100/90 rounded-t-xl relative h-28 flex items-end overflow-hidden border border-slate-200/50">
                <div
                  className={`w-full rounded-t-xl transition-all duration-300 ease-out ${
                    isSelected
                      ? 'bg-emerald-600 shadow-lift ring-2 ring-emerald-400/40'
                      : isCurrentDay
                      ? 'bg-emerald-500 shadow-sm'
                      : 'bg-emerald-600/35 group-hover:bg-emerald-600/60'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>

              {/* Day Label */}
              <div className="mt-2 flex flex-col items-center">
                <span
                  className={`text-[11px] transition-colors ${
                    isSelected
                      ? 'font-black text-emerald-700'
                      : isCurrentDay
                      ? 'font-bold text-slate-900'
                      : 'font-semibold text-slate-500 group-hover:text-slate-900'
                  }`}
                >
                  {item.day}
                </span>

                {/* Highlight dot for current day */}
                {isCurrentDay && (
                  <span className="w-1 h-1 rounded-full bg-emerald-600 mt-0.5" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
