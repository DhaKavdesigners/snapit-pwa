'use client';

import React, { useState } from 'react';
import { useRider } from '@/context/RiderContext';

export const WeeklyTrendChart: React.FC = () => {
  const { earnings } = useRider();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const maxAmount = Math.max(...earnings.dailyTrend.map((d) => d.amount), 3000);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-soft border border-surface-container-low flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm text-on-surface">Weekly Trend</h3>
          <p className="text-[11px] text-secondary">Mon - Sun Performance</p>
        </div>

        <button className="flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/20 hover:bg-primary/10 transition-colors">
          <span>This Week</span>
          <span className="material-symbols-outlined text-[14px]">expand_more</span>
        </button>
      </div>

      {/* Bar Chart Area */}
      <div className="h-44 flex items-end justify-between gap-2 relative pt-8 pb-2">
        {/* Background Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6 z-0">
          <div className="w-full h-px bg-slate-100" />
          <div className="w-full h-px bg-slate-100" />
          <div className="w-full h-px bg-slate-100" />
        </div>

        {/* 7 Daily Bars */}
        {earnings.dailyTrend.map((item, idx) => {
          const heightPercent = item.amount > 0 ? Math.round((item.amount / maxAmount) * 100) : 6;
          const isSelected = selectedDay === item.day || (!selectedDay && item.isToday);

          return (
            <div
              key={idx}
              onClick={() => setSelectedDay(item.day)}
              className="flex-1 flex flex-col items-center gap-2 z-10 cursor-pointer group relative h-full justify-end"
            >
              {/* Tooltip on active / hover */}
              {item.amount > 0 && (
                <div
                  className={`absolute -top-7 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md pointer-events-none transition-all whitespace-nowrap z-20 ${
                    isSelected ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  ₹{item.amount}
                </div>
              )}

              {/* Bar track and fill */}
              <div className="w-full bg-slate-100 rounded-t-lg relative h-32 flex items-end overflow-hidden">
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 ${
                    item.isToday
                      ? 'bg-gradient-to-t from-primary to-primary-container shadow-lift'
                      : isSelected
                      ? 'bg-primary/80'
                      : item.amount > 0
                      ? 'bg-primary/40 group-hover:bg-primary/60'
                      : 'bg-slate-200'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>

              {/* Day Label */}
              <span
                className={`text-[11px] transition-colors ${
                  item.isToday
                    ? 'font-bold text-primary'
                    : isSelected
                    ? 'font-semibold text-on-surface'
                    : 'text-secondary group-hover:text-primary'
                }`}
              >
                {item.dayShort}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
