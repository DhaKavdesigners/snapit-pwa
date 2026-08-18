'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRider } from '@/context/RiderContext';
import { WeeklyTrendChart } from '@/components/earnings/WeeklyTrendChart';
import { CashoutModal } from '@/components/earnings/CashoutModal';
import { TrendingUp, ArrowUpRight, Bike, Zap, Heart, Calendar } from 'lucide-react';

export default function EarningsPage() {
  const { earnings, rider } = useRider();
  const [showCashoutModal, setShowCashoutModal] = useState(false);

  return (
    <AppShell title="My Earnings" subtitle="Track your progress and payouts">
      <div className="flex flex-col gap-4 pt-2 pb-6 animate-fade-in">
        
        {/* Hero Earnings Card with Glassmorphic Highlight */}
        <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-200/80 overflow-hidden relative text-center">
          {/* Top Green Accent Gradient Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-primary-container" />

          <div className="flex items-center justify-center gap-1.5 text-secondary text-xs font-bold uppercase tracking-wider mb-2">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>Today's Earnings</span>
          </div>

          <h2 className="text-4xl font-black text-on-surface font-mono tracking-tight my-1">
            ₹{earnings.today.toLocaleString()}
          </h2>

          <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3.5 py-1 rounded-full text-xs font-bold mt-2 border border-primary/20">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+15% vs yesterday</span>
          </div>

          {/* Cashout Button inside Hero Card */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-secondary">Linked Account</span>
              <p className="text-xs font-mono font-bold text-on-surface truncate">{rider.upiId}</p>
            </div>
            <button
              onClick={() => setShowCashoutModal(true)}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lift flex items-center gap-1 transition-all active:scale-95"
            >
              <span>Cashout</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Timeframe Summary Sub-cards (Bento Grid Style) */}
        <div className="grid grid-cols-2 gap-3">
          {/* This Week */}
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

          {/* This Month */}
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

        {/* Interactive Weekly Trend Graph Section */}
        <WeeklyTrendChart />

        {/* Detailed Breakdown List matching Stitch Screen 4 */}
        <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 flex flex-col gap-3">
          <h3 className="font-bold text-sm text-on-surface">Today's Breakdown</h3>

          <div className="flex flex-col divide-y divide-slate-100 text-xs">
            {/* Row 1: Delivery Base Fare */}
            <div className="flex justify-between items-center py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Bike className="w-4 h-4" />
                </div>
                <span className="font-semibold text-on-surface">Delivery Earnings (14 trips)</span>
              </div>
              <span className="font-mono font-bold text-on-surface">
                ₹{earnings.baseFare.toLocaleString()}
              </span>
            </div>

            {/* Row 2: Surge & Incentives */}
            <div className="flex justify-between items-center py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="font-semibold text-on-surface">Incentives & Peak Surge</span>
              </div>
              <span className="font-mono font-bold text-amber-600">
                +₹{earnings.incentives.toLocaleString()}
              </span>
            </div>

            {/* Row 3: Tips */}
            <div className="flex justify-between items-center py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                  <Heart className="w-4 h-4" />
                </div>
                <span className="font-semibold text-on-surface">Customer Tips</span>
              </div>
              <span className="font-mono font-bold text-pink-600">
                +₹{earnings.tips.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Cashout Payout Modal */}
      {showCashoutModal && (
        <CashoutModal onClose={() => setShowCashoutModal(false)} />
      )}
    </AppShell>
  );
}
