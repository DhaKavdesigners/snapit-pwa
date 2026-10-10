'use client';

import React from 'react';
import { EarningsSummaryStats } from '@/types/earnings';
import { TrendingUp, Flame, Award } from 'lucide-react';

interface TodayEarningsSummaryProps {
  stats: EarningsSummaryStats;
}

export const TodayEarningsSummary: React.FC<TodayEarningsSummaryProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {/* 1. Today */}
      <div className="bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 rounded-2xl p-3 border border-emerald-300/80 shadow-2xs flex flex-col justify-between hover:border-emerald-400 hover:shadow-xs transition-all">
        <div className="flex items-center justify-between mb-1.5">
          <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200/80">
            <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
            Live
          </span>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
            Today
          </p>
          <p className="text-[17px] font-black text-slate-900 font-mono leading-tight mt-0.5">
            ₹{stats.today.toLocaleString()}
          </p>
          <p className="text-[10px] font-bold text-emerald-700 mt-0.5">
            {stats.todayDeliveries ?? 0} {stats.todayDeliveries === 1 ? 'order' : 'orders'}
          </p>
        </div>
      </div>

      {/* 2. This Week */}
      <div className="bg-gradient-to-br from-teal-50/90 via-white to-cyan-50/40 rounded-2xl p-3 border border-teal-300/80 shadow-2xs flex flex-col justify-between hover:border-teal-400 hover:shadow-xs transition-all">
        <div className="flex items-center justify-between mb-1.5">
          <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center border border-teal-200/80">
            <Flame className="w-3.5 h-3.5 fill-teal-600 text-teal-600" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider text-teal-700 bg-teal-100/70 px-1.5 py-0.5 rounded">
            Week
          </span>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
            This Week
          </p>
          <p className="text-[17px] font-black text-slate-900 font-mono leading-tight mt-0.5">
            ₹{stats.thisWeek.toLocaleString()}
          </p>
          <p className="text-[10px] font-bold text-teal-700 mt-0.5">
            {stats.weekDeliveries ?? 0} {stats.weekDeliveries === 1 ? 'order' : 'orders'} 🚀
          </p>
        </div>
      </div>

      {/* 3. This Month */}
      <div className="bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/40 rounded-2xl p-3 border border-indigo-300/80 shadow-2xs flex flex-col justify-between hover:border-indigo-400 hover:shadow-xs transition-all">
        <div className="flex items-center justify-between mb-1.5">
          <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center border border-indigo-200/80">
            <Award className="w-3.5 h-3.5 text-indigo-700" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded">
            Month
          </span>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
            This Month
          </p>
          <p className="text-[17px] font-black text-slate-900 font-mono leading-tight mt-0.5">
            ₹{stats.thisMonth.toLocaleString()}
          </p>
          <p className="text-[10px] font-bold text-indigo-700 mt-0.5">
            {stats.monthDeliveries ?? 0} {stats.monthDeliveries === 1 ? 'order' : 'orders'} 🏆
          </p>
        </div>
      </div>
    </div>
  );
};
