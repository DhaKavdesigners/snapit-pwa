'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { SnapitWalletSection } from '@/components/earnings/SnapitWalletSection';
import { TodayEarningsSummary } from '@/components/earnings/TodayEarningsSummary';
import { WeeklyEarningsChart } from '@/components/earnings/WeeklyEarningsChart';
import { PayoutHistorySection } from '@/components/earnings/PayoutHistorySection';
import {
  initialEarningsSummary,
  initialWeeklyEarnings,
  initialWalletData,
  MONTH_OPTIONS,
  MONTHLY_PAYOUTS,
} from '@/services/earningsData';

export default function EarningsPage() {
  const handleScrollToHistory = () => {
    const el = document.getElementById('payout-history');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-3.5 pt-2 pb-6 max-w-md mx-auto w-full animate-fade-in">
        {/* ── PAGE HEADER ── */}
        <div className="px-1">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Earnings</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track your delivery income & payouts</p>
        </div>

        {/* ── 1. MINNIT WALLET CARD ── */}
        <SnapitWalletSection
          wallet={initialWalletData}
          onOpenPayoutHistory={handleScrollToHistory}
        />

        {/* ── 2. SUMMARY IN A SINGLE ROW: TODAY, THIS WEEK, THIS MONTH ── */}
        <TodayEarningsSummary stats={initialEarningsSummary} />

        {/* ── 3. WEEKLY EARNINGS BAR GRAPH ── */}
        <WeeklyEarningsChart data={initialWeeklyEarnings} />

        {/* ── 4. PAYOUT HISTORY (WITH MONTH SELECTOR) ── */}
        <PayoutHistorySection
          monthOptions={MONTH_OPTIONS}
          monthlyPayouts={MONTHLY_PAYOUTS}
        />
      </div>
    </AppShell>
  );
}
