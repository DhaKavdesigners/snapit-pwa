'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { SnapitWalletSection } from '@/components/earnings/SnapitWalletSection';
import { PayoutHistoryModal } from '@/components/earnings/PayoutHistoryModal';
import { TodayEarningsSummary } from '@/components/earnings/TodayEarningsSummary';
import { WeeklyEarningsChart } from '@/components/earnings/WeeklyEarningsChart';
import { RecentEarningsList } from '@/components/earnings/RecentEarningsList';
import { PaymentAccountCard } from '@/components/earnings/PaymentAccountCard';
import {
  initialEarningsSummary,
  initialWeeklyEarnings,
  initialWalletData,
  initialRecentEarnings,
  initialPayoutHistory,
} from '@/services/earningsData';

export default function EarningsPage() {
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

  return (
    <AppShell>
      <div className="flex flex-col gap-3.5 pt-2 pb-6 max-w-md mx-auto w-full animate-fade-in">
        {/* ── PAGE HEADER ── */}
        <div className="px-1">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Earnings</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track your delivery income & payouts</p>
        </div>

        {/* ── 1. MINNIT WALLET (COMPACT & CLEAN, WITH HISTORY MODAL TRIGGER) ── */}
        <SnapitWalletSection
          wallet={initialWalletData}
          onOpenPayoutHistory={() => setIsPayoutModalOpen(true)}
        />

        {/* ── 2. SUMMARY IN A SINGLE ROW: TODAY, THIS WEEK, THIS MONTH ── */}
        <TodayEarningsSummary stats={initialEarningsSummary} />

        {/* ── 3. WEEKLY EARNINGS BAR GRAPH ── */}
        <WeeklyEarningsChart data={initialWeeklyEarnings} />

        {/* ── 4. RECENT EARNINGS (COMPLETED DELIVERIES) ── */}
        <RecentEarningsList earnings={initialRecentEarnings} />

        {/* ── 5. PAYMENT ACCOUNT (UPI) ── */}
        <PaymentAccountCard />

        {/* ── 6. PAYOUT HISTORY MODAL WINDOW ── */}
        <PayoutHistoryModal
          isOpen={isPayoutModalOpen}
          onClose={() => setIsPayoutModalOpen(false)}
          payouts={initialPayoutHistory}
        />
      </div>
    </AppShell>
  );
}
