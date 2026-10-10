'use client';

import React from 'react';
import { WalletSummary } from '@/types/earnings';
import { Wallet, Calendar, History, ShieldCheck, Zap } from 'lucide-react';

interface SnapitWalletSectionProps {
  wallet: WalletSummary;
  onOpenPayoutHistory: () => void;
}

export const SnapitWalletSection: React.FC<SnapitWalletSectionProps> = ({
  wallet,
  onOpenPayoutHistory,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 p-5 border-2 border-emerald-200/90 shadow-xs flex flex-col gap-3.5">
      {/* Subtle background ambient accents (exact match with rewards page milestone quest card) */}
      <div className="pointer-events-none absolute -top-8 -right-8 w-28 h-28 rounded-full bg-emerald-200/30 blur-xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-teal-200/30 blur-xl" />

      {/* 1. Header: Pill Tag & History Trigger */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/90 border border-emerald-300/80 px-2.5 py-1 rounded-full shadow-2xs">
          <Wallet className="w-3.5 h-3.5 text-emerald-700" />
          Minnit Wallet
        </span>

        <button
          type="button"
          onClick={onOpenPayoutHistory}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 text-[11px] font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
          title="View Payout History"
        >
          <History className="w-3.5 h-3.5 text-slate-500" />
          <span>History</span>
        </button>
      </div>

      {/* 2. Main Wallet Balance (Exact Typography & Badge match with Reward Page) */}
      <div className="relative z-10">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Available Payout Balance
        </span>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-black text-emerald-600 font-mono">₹</span>
          <h2 className="text-4xl font-black text-slate-900 font-mono tracking-tight leading-none">
            {wallet.balance.toLocaleString()}
          </h2>
          <span className="ml-auto text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
            ✦ 100% Verified
          </span>
        </div>
      </div>

      {/* 3. Next Automated Payout Pod */}
      <div className="relative z-10 bg-white/95 rounded-2xl p-3 border border-emerald-200/80 shadow-2xs flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
            <p className="text-xs font-black text-slate-900 truncate">
              Next Payout: <span className="text-emerald-700 font-mono font-black">₹{wallet.nextPayoutAmount.toLocaleString()}</span>
            </p>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5 truncate">
            Automated deposit on <strong className="text-slate-800">{wallet.nextPayoutDate}</strong> • 0% Bank Fee
          </p>
        </div>

        <div className="w-8 h-8 rounded-xl bg-emerald-100/90 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
          <Calendar className="w-4 h-4 text-emerald-700" />
        </div>
      </div>
    </div>
  );
};
