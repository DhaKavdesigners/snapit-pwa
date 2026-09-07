'use client';

import React from 'react';
import { WalletSummary } from '@/types/earnings';
import { Wallet, Calendar, History } from 'lucide-react';

interface SnapitWalletSectionProps {
  wallet: WalletSummary;
  onOpenPayoutHistory: () => void;
}

export const SnapitWalletSection: React.FC<SnapitWalletSectionProps> = ({
  wallet,
  onOpenPayoutHistory,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-soft border border-slate-200/80 flex flex-col gap-2.5">
      {/* 1. Header: Minnit Wallet Label + Payout History Trigger Icon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <Wallet className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
            Minnit Wallet
          </span>
        </div>

        {/* Small icon button to open payout history window */}
        <button
          type="button"
          onClick={onOpenPayoutHistory}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 text-[10px] font-extrabold transition-all active:scale-95 cursor-pointer shadow-2xs"
          title="View Payout History"
        >
          <History className="w-3 h-3 text-slate-500" />
          <span>History</span>
        </button>
      </div>

      {/* 2. Main Wallet Balance (Compact & Clean) */}
      <div>
        <h2 className="text-[26px] font-black text-slate-900 font-mono tracking-tight leading-none">
          ₹{wallet.balance.toLocaleString()}
        </h2>
        <p className="text-[11px] font-bold text-slate-400 mt-1">In Wallet</p>
      </div>

      {/* 3. Next Payout Information (Compact & Proportional) */}
      <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-200/70 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-700 leading-tight">
            Next payout: <span className="font-mono font-black text-slate-900">₹{wallet.nextPayoutAmount.toLocaleString()}</span>
          </p>
          <p className="text-[10px] font-semibold text-slate-400 mt-0.5 leading-tight">
            Payout on <span className="font-bold text-emerald-700">{wallet.nextPayoutDate}</span>
          </p>
        </div>

        <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100/80 shrink-0">
          <Calendar className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
