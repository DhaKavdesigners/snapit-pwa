'use client';

import React from 'react';
import { useRider } from '@/context/RiderContext';
import {
  Trophy,
  BarChart2,
  TrendingUp,
  Clock,
  RotateCcw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface SessionCompleteCardProps {
  onStartAnother: () => void;
}

export const SessionCompleteCard: React.FC<SessionCompleteCardProps> = ({ onStartAnother }) => {
  const { sessionCompletedData, earnings, dismissSessionCompleted } = useRider();

  const ordersCount = sessionCompletedData?.ordersCompleted || 0;
  const todayEarnings = earnings.today || 0;
  const durationMins = sessionCompletedData?.durationMinutes || 180;
  const durationHours = Math.round(durationMins / 60);

  const handleStartAnotherSession = () => {
    dismissSessionCompleted();
    onStartAnother();
  };

  return (
    <div className="bg-white rounded-3xl border border-emerald-200 shadow-md p-6 space-y-4 text-center relative overflow-hidden animate-slide-up ring-2 ring-emerald-500/10">
      {/* Top Banner & Trophy */}
      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
        <Trophy className="w-8 h-8" />
      </div>

      <div>
        <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Duty Complete
        </span>
        <h3 className="text-xl font-black text-slate-900 mt-1">
          Session Completed!
        </h3>
        <p className="text-xs text-slate-500 mt-0.5 max-w-[280px] mx-auto leading-relaxed">
          Great work! Your planned riding session has ended. All your deliveries and payouts are credited.
        </p>
      </div>

      {/* 3 Summary Badges */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orders</p>
          <p className="text-lg font-black text-slate-900 font-mono mt-0.5">{ordersCount}</p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today Earned</p>
          <p className="text-lg font-black text-emerald-600 font-mono mt-0.5">₹{todayEarnings}</p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</p>
          <p className="text-lg font-black text-slate-900 font-mono mt-0.5">{durationHours}h</p>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleStartAnotherSession}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/25 border border-emerald-500 ring-2 ring-emerald-400/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
        >
          <RotateCcw className="w-4 h-4 stroke-[2.5]" />
          <span>START ANOTHER SESSION</span>
        </button>
      </div>
    </div>
  );
};
