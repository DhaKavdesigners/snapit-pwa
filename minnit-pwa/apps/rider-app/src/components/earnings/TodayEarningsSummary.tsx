'use client';

import React from 'react';
import { EarningsSummaryStats } from '@/types/earnings';
import { TrendingUp, Calendar, CalendarDays } from 'lucide-react';

interface TodayEarningsSummaryProps {
  stats: EarningsSummaryStats;
}

export const TodayEarningsSummary: React.FC<TodayEarningsSummaryProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {/* 1. Today */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-soft flex flex-col justify-between hover:border-emerald-200 transition-colors">
        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1.5">
          <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Today
          </p>
          <p className="text-[15px] font-black text-slate-900 font-mono leading-tight mt-0.5">
            ₹{stats.today.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 2. This Week */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-soft flex flex-col justify-between hover:border-slate-300 transition-colors">
        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
          <Calendar className="w-3.5 h-3.5" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            This Week
          </p>
          <p className="text-[15px] font-black text-slate-900 font-mono leading-tight mt-0.5">
            ₹{stats.thisWeek.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 3. This Month */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-soft flex flex-col justify-between hover:border-slate-300 transition-colors">
        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1.5">
          <CalendarDays className="w-3.5 h-3.5" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            This Month
          </p>
          <p className="text-[15px] font-black text-slate-900 font-mono leading-tight mt-0.5">
            ₹{stats.thisMonth.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};
