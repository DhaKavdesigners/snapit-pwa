'use client';

import React, { useMemo, useState, useEffect } from 'react';
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
import { triggerHaptic } from '@/services/preferenceService';
import confetti from 'canvas-confetti';
import { Sparkles, Store, ArrowRight, Landmark, PartyPopper, X } from 'lucide-react';

export default function EarningsPage() {
  const { rider, earnings, isDemoMode, demoCreditedAmount, ordersHistory } = useRider();
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

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

  // Automatic celebration popup on page open whenever rider has earned amount
  useEffect(() => {
    if (realBalance > 0) {
      const timer = setTimeout(() => {
        setShowCelebrationModal(true);
        triggerHaptic([30, 60, 30]);
        try {
          confetti({
            particleCount: 90,
            spread: 80,
            origin: { y: 0.45 },
            colors: ['#10b981', '#059669', '#34d399', '#f59e0b', '#6366f1'],
          });
        } catch {}
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [realBalance]);

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

        {/* ── 1. MINNIT WALLET CARD (Fresh Mint/Emerald Reward Theme) ── */}
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

      {/* ── AUTOMATIC CELEBRATION MODAL ON EARNINGS PAGE ── */}
      {showCelebrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-br from-emerald-50/95 via-white to-teal-50/90 p-6 border-2 border-emerald-300 shadow-2xl text-center flex flex-col items-center gap-3.5 animate-scale-up">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowCelebrationModal(false)}
              className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Celebratory Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 text-3xl">
              <PartyPopper className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                🎉 Earnings Celebration
              </span>
              <div className="flex items-baseline justify-center gap-1 mt-2">
                <span className="text-2xl font-black text-emerald-600 font-mono">₹</span>
                <span className="text-4xl font-black text-slate-900 font-mono tracking-tight leading-none">
                  {realBalance}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-700 mt-1">
                Credited & Ready in Your Wallet!
              </p>
              <p className="text-[11px] font-medium text-slate-500 max-w-[250px] mx-auto">
                Every delivery pays off! Keep up the great work and claim your milestone rewards.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowCelebrationModal(false);
                triggerHaptic(10);
              }}
              className="w-full mt-1 py-3 px-5 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md shadow-emerald-600/30 hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Keep Riding & Earning 🚀</span>
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
