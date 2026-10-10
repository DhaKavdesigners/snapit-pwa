'use client';

import React, { useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { SnapitWalletSection } from '@/components/earnings/SnapitWalletSection';
import { TodayEarningsSummary } from '@/components/earnings/TodayEarningsSummary';
import { WeeklyEarningsChart } from '@/components/earnings/WeeklyEarningsChart';
import { PayoutHistorySection } from '@/components/earnings/PayoutHistorySection';
import { useRider } from '@/context/RiderContext';
import {
  getNextSundayDate,
  getRealWeeklyEarnings,
  MONTH_OPTIONS,
  MONTHLY_PAYOUTS,
} from '@/services/earningsData';

export default function EarningsPage() {
  const { rider, earnings, isDemoMode, demoCreditedAmount } = useRider();

  const handleScrollToHistory = () => {
    const el = document.getElementById('payout-history');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Real synchronized values from logged-in rider profile
  const isPending = (rider.isVerified === false || rider.verificationStatus === 'PENDING') && !isDemoMode && demoCreditedAmount === 0;
  const deliveryEarnings = Math.max(earnings.thisWeek || 0, earnings.thisMonth || 0, earnings.today || 0);
  const realBalance = isPending ? 0 : Math.max(rider.walletBalance || 0, deliveryEarnings);
  const realTodayEarnings = isPending ? 0 : (earnings.today || 0);
  const realWeekEarnings = isPending ? 0 : (earnings.thisWeek || 0);
  const realMonthEarnings = isPending ? 0 : (earnings.thisMonth || 0);

  // Synchronized Wallet Data
  const walletData = useMemo(() => ({
    balance: realBalance,
    nextPayoutAmount: realBalance,
    nextPayoutDate: getNextSundayDate(),
  }), [realBalance]);

  // Synchronized Earnings Summary Stats (Today / This Week / This Month)
  const earningsSummaryStats = useMemo(() => ({
    today: realTodayEarnings,
    thisWeek: realWeekEarnings,
    thisMonth: realMonthEarnings,
  }), [realTodayEarnings, realWeekEarnings, realMonthEarnings]);

  // Synchronized Weekly Bar Chart
  const weeklyData = useMemo(() => {
    return getRealWeeklyEarnings(realTodayEarnings);
  }, [realTodayEarnings]);

  return (
    <AppShell>
      <div className="flex flex-col gap-3.5 pt-2 pb-6 max-w-md mx-auto w-full animate-fade-in">
        {/* ── PAGE HEADER ── */}
        <div className="px-1">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Earnings</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track your delivery income & payouts</p>
        </div>

        {/* ── 1. MINNIT WALLET CARD & TODAY'S EARNINGS (Spotlight Target for Demo) ── */}
        <div id="tour-today-earnings" className="flex flex-col gap-3.5">
          <SnapitWalletSection
            wallet={walletData}
            onOpenPayoutHistory={handleScrollToHistory}
          />

          {/* ── 2. SUMMARY IN A SINGLE ROW: TODAY, THIS WEEK, THIS MONTH ── */}
          <TodayEarningsSummary stats={earningsSummaryStats} />
        </div>

        {/* ── 3. WEEKLY EARNINGS BAR GRAPH ── */}
        <WeeklyEarningsChart data={weeklyData} />

        {/* ── 4. PAYOUT HISTORY (WITH MONTH SELECTOR) ── */}
        <PayoutHistorySection
          monthOptions={MONTH_OPTIONS}
          monthlyPayouts={MONTHLY_PAYOUTS}
        />
      </div>
    </AppShell>
  );
}
