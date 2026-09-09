'use client';

import React from 'react';
import { CheckCircle2, Zap } from 'lucide-react';

interface SessionEndedCardProps {
  zoneName: string;
  ordersCompleted: number;
  earningsToday: number;
  onStartAnother: () => void;
}

export const SessionEndedCard: React.FC<SessionEndedCardProps> = ({
  zoneName,
  ordersCompleted,
  earningsToday,
  onStartAnother,
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 cockpit-shadow border border-slate-200/80 flex flex-col items-center text-center gap-4 animate-slide-up">
      {/* Icon */}
      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border-2 border-emerald-100 mt-2">
        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
      </div>

      <div>
        <h2 className="text-lg font-black text-slate-900 tracking-tight">Riding Session Ended</h2>
        <p className="text-xs text-slate-500 mt-1">
          Thanks for riding with Minnit in <strong className="text-slate-700">{zoneName}</strong>!
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 py-3 px-4 bg-slate-50 rounded-2xl border border-slate-200/80 w-full">
        <div className="text-center flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Earned Today</p>
          <p className="text-xl font-black text-emerald-600 font-mono">₹{earningsToday}</p>
        </div>
        <div className="w-px h-8 bg-slate-200" />
        <div className="text-center flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orders Done</p>
          <p className="text-xl font-black text-slate-900 font-mono">{ordersCompleted}</p>
        </div>
      </div>

      {/* Start another */}
      <button
        type="button"
        onClick={onStartAnother}
        className="w-full min-h-touch bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/25 active:scale-98 transition-all flex items-center justify-center gap-2 tracking-wide"
      >
        <Zap className="w-5 h-5 fill-white" />
        Start Another Session
      </button>

      <p className="text-[10px] text-slate-400">No waiting period — start immediately</p>
    </div>
  );
};
