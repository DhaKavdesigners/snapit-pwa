'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { UnsettledEarningsCard } from '@/components/earnings/UnsettledEarningsCard';
import { PeriodSummaryCard }     from '@/components/earnings/PeriodSummaryCard';
import { PayoutHistoryCard }     from '@/components/earnings/PayoutHistoryCard';
import {
  initialUnsettledEarnings,
  initialPeriodSummary,
  MONTH_OPTIONS,
  MONTHLY_PAYOUTS,
} from '@/services/earningsData';

export default function EarningsPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-4 pt-2 pb-8 max-w-md mx-auto w-full">
        {/* ── PAGE HEADER ── */}
        <div className="px-1">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Earnings</h1>
          <p className="text-xs text-slate-500 mt-0.5">Your delivery income &amp; payouts</p>
        </div>

        {/* ── 1. UNSETTLED EARNINGS ── */}
        <UnsettledEarningsCard data={initialUnsettledEarnings} />

        {/* ── 2. PERIOD SUMMARY ── */}
        <PeriodSummaryCard data={initialPeriodSummary} />

        {/* ── 3. BANK PAYOUT HISTORY ── */}
        <PayoutHistoryCard
          monthOptions={MONTH_OPTIONS}
          monthlyPayouts={MONTHLY_PAYOUTS}
        />
      </div>
    </AppShell>
  );
}
