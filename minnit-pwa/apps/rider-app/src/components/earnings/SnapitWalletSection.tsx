'use client';

import React from 'react';
import { WalletSummary } from '@/types/earnings';
import { Wallet, Calendar, History, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { triggerHaptic } from '@/services/preferenceService';

interface SnapitWalletSectionProps {
  wallet: WalletSummary;
  onOpenPayoutHistory: () => void;
}

export const SnapitWalletSection: React.FC<SnapitWalletSectionProps> = ({
  wallet,
  onOpenPayoutHistory,
}) => {
  const handleCelebrate = () => {
    triggerHaptic([30, 50, 30]);
    try {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.4 },
        colors: ['#10b981', '#34d399', '#f59e0b', '#60a5fa'],
      });
    } catch {}
  };

  return (
    <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/35 shadow-xl shadow-emerald-950/25 flex flex-col gap-3.5">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/25 rounded-full blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 w-36 h-36 bg-teal-400/15 rounded-full blur-2xl" />

      {/* 1. Header: Wallet Label + History & Celebrate Triggers */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shadow-inner">
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300/90 block leading-tight">
              Minnit Wallet
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              Official Rider Vault
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCelebrate}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/30 text-[10px] font-black transition-all active:scale-95 cursor-pointer shadow-2xs backdrop-blur-sm"
            title="Celebrate Your Earnings!"
          >
            <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>Celebrate 🎉</span>
          </button>

          <button
            type="button"
            onClick={onOpenPayoutHistory}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border border-white/10 text-[10px] font-extrabold transition-all active:scale-95 cursor-pointer shadow-2xs backdrop-blur-sm"
            title="View Payout History"
          >
            <History className="w-3 h-3 text-slate-400" />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* 2. Main Wallet Balance (Celebratory Typography) */}
      <div className="relative z-10 my-0.5" onClick={handleCelebrate} role="button" tabIndex={0}>
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Available Payout Balance
        </span>
        <div className="flex items-baseline gap-1.5 mt-1.5">
          <span className="text-2xl font-black text-emerald-400 font-mono">₹</span>
          <h2 className="text-[40px] font-black text-white font-mono tracking-tight leading-none drop-shadow-sm">
            {wallet.balance.toLocaleString()}
          </h2>
          <span className="ml-2 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            ✦ 100% Verified
          </span>
        </div>
      </div>

      {/* 3. Next Automated Payout Pod */}
      <div className="relative z-10 bg-white/[0.08] backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center justify-between gap-3 shadow-inner">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
            <p className="text-xs font-black text-white truncate">
              Next Payout: <span className="text-emerald-400 font-mono">₹{wallet.nextPayoutAmount.toLocaleString()}</span>
            </p>
          </div>
          <p className="text-[10px] font-medium text-slate-300/80 mt-0.5 truncate">
            Automated deposit on <strong className="text-emerald-300 font-bold">{wallet.nextPayoutDate}</strong> • 0% Bank Fee
          </p>
        </div>

        <div className="w-8 h-8 rounded-xl bg-emerald-400/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0">
          <Calendar className="w-4 h-4 text-emerald-300" />
        </div>
      </div>
    </div>
  );
};
