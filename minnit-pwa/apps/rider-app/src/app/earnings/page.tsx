'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
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
import { formatOrderNumber } from '@/utils/orderUtils';
import { Sparkles, Store, ArrowRight, Landmark } from 'lucide-react';

export default function EarningsPage() {
  const { rider, earnings, isDemoMode, demoCreditedAmount, ordersHistory } = useRider();

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
    todayDeliveries: isPending ? 0 : (earnings.todayDeliveries || 0),
    weekDeliveries: isPending ? 0 : (earnings.weekDeliveries || Math.max(1, Math.round(realWeekEarnings / 30))),
    monthDeliveries: isPending ? 0 : (earnings.monthDeliveries || Math.max(rider.totalDeliveries || 0, Math.round(realMonthEarnings / 30))),
  }), [realTodayEarnings, realWeekEarnings, realMonthEarnings, earnings.todayDeliveries, earnings.weekDeliveries, earnings.monthDeliveries, rider.totalDeliveries, isPending]);

  // Synchronized Weekly Bar Chart (fed with actual completed orders)
  const weeklyData = useMemo(() => {
    return getRealWeeklyEarnings(realTodayEarnings, ordersHistory);
  }, [realTodayEarnings, ordersHistory]);

  // Top 3 recent orders for itemized trip breakdown
  const recentOrders = useMemo(() => {
    return (ordersHistory || []).slice(0, 3);
  }, [ordersHistory]);

  return (
    <AppShell>
      <div className="flex flex-col gap-3.5 pt-2 pb-16 max-w-md mx-auto w-full animate-fade-in px-1">
        {/* ── PAGE HEADER (Celebratory Title) ── */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Earnings</span>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                ₹{realBalance} Total
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Track your delivery income & payouts</p>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Active Partner</span>
          </div>
        </div>

        {/* ── 1. MINNIT WALLET CARD (Glowing Celebratory Emerald Mesh) ── */}
        <div id="tour-today-earnings" className="flex flex-col gap-3.5">
          <SnapitWalletSection
            wallet={walletData}
            onOpenPayoutHistory={handleScrollToHistory}
          />

          {/* ── 2. SUMMARY BENTO: TODAY, THIS WEEK, THIS MONTH ── */}
          <TodayEarningsSummary stats={earningsSummaryStats} />
        </div>

        {/* ── 3. WEEKLY MOMENTUM BAR GRAPH ── */}
        <WeeklyEarningsChart data={weeklyData} />

        {/* ── 4. RECENT DELIVERY TRIP EARNINGS ── */}
        <div className="bg-white rounded-3xl p-4 shadow-soft border border-slate-200/90 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-sm text-slate-900 tracking-tight">Recent Trip Earnings</h3>
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  Verified Payouts
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Individual payout credited per delivery</p>
            </div>
            <Link
              href="/orders"
              className="text-xs font-black text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 transition-all active:scale-95 cursor-pointer"
            >
              <span>History</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/70 flex items-center justify-between gap-3 hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                      <Store className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          #{formatOrderNumber(order.orderNumber || order.id)}
                        </span>
                        <span className="text-[9px] font-black text-emerald-700 bg-emerald-100/90 px-1.5 py-0.2 rounded">
                          COMPLETED
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                        {order.restaurantName || 'Store Partner'} • {order.distanceKm ? `${order.distanceKm} km` : '2.4 km'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-400 block leading-tight">Credited</span>
                    <span className="font-mono font-black text-sm text-emerald-600">
                      +₹{order.earnings || 30}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-50 rounded-2xl p-4 text-center border border-dashed border-slate-200">
                <p className="text-xs font-bold text-slate-600">No trips completed today</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Completed delivery payouts will appear here in real time!</p>
              </div>
            )}
          </div>
        </div>

        {/* ── 5. DIRECT BANK PAYOUT STATUS ── */}
        <div className="bg-gradient-to-r from-emerald-50 via-white to-teal-50 rounded-2xl p-3.5 border border-emerald-200/90 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Landmark className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-black text-slate-900 truncate">State Bank of India</h4>
                <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-200 shrink-0">
                  Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate">Account ending •••• 4209 • Auto-deposit Sunday</p>
            </div>
          </div>
          <span className="text-xs font-black text-emerald-700 font-mono bg-white px-2 py-1 rounded-lg border border-emerald-200 shrink-0">
            Active
          </span>
        </div>

        {/* ── 6. PAYOUT HISTORY (WITH MONTH SELECTOR) ── */}
        <PayoutHistorySection
          monthOptions={MONTH_OPTIONS}
          monthlyPayouts={MONTHLY_PAYOUTS}
        />
      </div>
    </AppShell>
  );
}
