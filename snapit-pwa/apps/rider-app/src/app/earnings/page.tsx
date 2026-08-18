'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRider } from '@/context/RiderContext';
import { WeeklyTrendChart } from '@/components/earnings/WeeklyTrendChart';
import { CashoutModal } from '@/components/earnings/CashoutModal';
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  Bike,
  Zap,
  Heart,
  Calendar,
  Building2,
  ShieldCheck,
} from 'lucide-react';

export default function EarningsPage() {
  const { earnings, rider } = useRider();
  const [showCashoutModal, setShowCashoutModal] = useState(false);

  return (
    <AppShell title="Earnings & Wallet" subtitle="Wallet balance & bank payouts">
      <div className="flex flex-col gap-4 pt-2 pb-6 animate-fade-in">
        
        {/* 1. MAIN RIDER WALLET CARD (ALL TRIP EARNINGS DEPOSIT HERE FIRST) */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 overflow-hidden relative">
          {/* Neon Glow Burst */}
          <div className="absolute -right-10 -top-10 w-44 h-44 bg-primary/30 rounded-full blur-3xl pointer-events-none" />

          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary-fixed border border-primary/30 flex items-center justify-center shadow-glow">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Snapit Rider Wallet
                </span>
                <span className="text-[10px] text-primary-fixed font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Auto-Credited from Trips
                </span>
              </div>
            </div>

            <span className="bg-primary/20 text-primary-fixed text-[10px] font-bold px-2.5 py-1 rounded-full border border-primary/30">
              Active Wallet
            </span>
          </div>

          <div className="my-2">
            <span className="text-xs text-slate-400">Available Wallet Balance</span>
            <h2 className="text-4xl font-black text-white font-mono tracking-tight mt-0.5">
              ₹{rider.walletBalance.toLocaleString()}
            </h2>
          </div>

          {/* Transfer Button */}
          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Primary Main Account
              </span>
              <p className="text-xs font-mono font-bold text-slate-200 truncate">
                {rider.upiId} ({rider.bankName || 'HDFC Bank'})
              </p>
            </div>

            <button
              onClick={() => setShowCashoutModal(true)}
              className="bg-gradient-to-r from-primary to-primary-container text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-lift hover:opacity-95 flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
            >
              <span>Transfer to Bank</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Today's Overview Sub-Card */}
        <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-secondary uppercase">Today's Total Generated</p>
              <p className="text-xl font-bold font-mono text-on-surface">
                ₹{earnings.today.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
              {earnings.todayDeliveries} Deliveries
            </span>
            <p className="text-[10px] text-secondary mt-1">+15% vs yesterday</p>
          </div>
        </div>

        {/* 3. Timeframe Summary Bento (This Week & This Month) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col justify-between h-[104px]">
            <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
              This Week
            </span>
            <div>
              <div className="text-xl font-black text-on-surface font-mono">
                ₹{earnings.thisWeek.toLocaleString()}
              </div>
              <div className="text-[11px] text-primary font-semibold mt-0.5">
                {earnings.weekDeliveries} Deliveries
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col justify-between h-[104px]">
            <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
              This Month
            </span>
            <div>
              <div className="text-xl font-black text-on-surface font-mono">
                ₹{earnings.thisMonth.toLocaleString()}
              </div>
              <div className="text-[11px] text-secondary font-semibold mt-0.5">
                {earnings.monthDeliveries} Deliveries
              </div>
            </div>
          </div>
        </div>

        {/* 4. Weekly Trend Bar Graph */}
        <WeeklyTrendChart />

        {/* 5. Today's Breakdown List */}
        <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 flex flex-col gap-3">
          <h3 className="font-bold text-sm text-on-surface">Today's Earnings Breakdown</h3>

          <div className="flex flex-col divide-y divide-slate-100 text-xs">
            {/* Delivery Fare */}
            <div className="flex justify-between items-center py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Bike className="w-4 h-4" />
                </div>
                <span className="font-semibold text-on-surface">Trip Base Earnings ({earnings.todayDeliveries} orders)</span>
              </div>
              <span className="font-mono font-bold text-on-surface">
                ₹{earnings.baseFare.toLocaleString()}
              </span>
            </div>

            {/* Incentives */}
            <div className="flex justify-between items-center py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="font-semibold text-on-surface">Incentives & Surge Multipliers</span>
              </div>
              <span className="font-mono font-bold text-amber-600">
                +₹{earnings.incentives.toLocaleString()}
              </span>
            </div>

            {/* Tips */}
            <div className="flex justify-between items-center py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                  <Heart className="w-4 h-4" />
                </div>
                <span className="font-semibold text-on-surface">Customer Direct Tips</span>
              </div>
              <span className="font-mono font-bold text-pink-600">
                +₹{earnings.tips.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Cashout / Bank Transfer Modal */}
      {showCashoutModal && (
        <CashoutModal onClose={() => setShowCashoutModal(false)} />
      )}
    </AppShell>
  );
}
