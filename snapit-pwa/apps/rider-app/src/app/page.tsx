'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ZoneSelectionModal } from '@/components/slots/ZoneSelectionModal';
import { HomeAvailabilityCard } from '@/components/dashboard/HomeAvailabilityCard';
import { ActiveDeliveryCard } from '@/components/dashboard/ActiveDeliveryCard';
import { useRider } from '@/context/RiderContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { soundEngine } from '@/services/soundService';
import { SlideButton } from '@/components/common/SlideButton';
import { formatOrderNumber } from '@/utils/orderUtils';
import {
  TrendingUp,
  BarChart2,
  Clock,
  ChevronRight,
  Navigation,
  Store,
  Home,
  Power,
  Check,
} from 'lucide-react';

export default function DashboardPage() {
  const {
    isOnline,
    toggleOnline,
    setOnlineStatus,
    activeOrder,
    incomingOrder,
    acceptIncomingOrder,
    declineIncomingOrder,
    advanceActiveOrderStatus,
    markOrderPickedUp,
    activeSlot,
    upcomingSlot,
    rider,
    earnings,
    isHydrated,
  } = useRider();
  const router = useRouter();

  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);

  // Greeting by time of day
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Redirect to onboarding if not registered
  useEffect(() => {
    if (!isHydrated) return;
    if (!rider.phone) {
      router.push('/onboarding');
    }
  }, [isHydrated, rider.phone, router]);

  // Guarantee buzzer is stopped if leaving or unmounting dashboard
  useEffect(() => {
    return () => {
      soundEngine.stopIncomingOrderBuzzer();
    };
  }, []);

  // Online timer calculation
  const [onlineSeconds, setOnlineSeconds] = useState(0);
  useEffect(() => {
    if (!isOnline) { setOnlineSeconds(0); return; }
    const t = setInterval(() => setOnlineSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isOnline]);
  const onlineHours = Math.floor(onlineSeconds / 3600);
  const onlineMins = Math.floor((onlineSeconds % 3600) / 60);
  const onlineTimeStr = onlineSeconds > 0
    ? `${onlineHours}h ${onlineMins.toString().padStart(2, '0')}m`
    : '0h 00m';

  // 25s Countdown for incoming order
  const [countdown, setCountdown] = useState(25);
  useEffect(() => {
    if (!incomingOrder) {
      setCountdown(25);
      soundEngine.stopIncomingOrderBuzzer();
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          soundEngine.stopIncomingOrderBuzzer();
          declineIncomingOrder();
          return 25;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [incomingOrder, declineIncomingOrder]);

  return (
    <AppShell>
      <div className="flex flex-col gap-3.5 pt-2 pb-6 max-w-md mx-auto w-full">

        {/* ── 1. TODAY'S OVERVIEW (3 METRIC TILES) ── */}
        <div className="grid grid-cols-3 gap-2">
          {/* Earnings */}
          <Link href="/earnings" className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs flex flex-col justify-between active:scale-98 transition-transform">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Earnings</p>
              <p className="text-[18px] font-black text-slate-900 font-mono leading-tight mt-0.5">
                ₹{earnings.today.toLocaleString()}
              </p>
            </div>
          </Link>

          {/* Orders Delivered */}
          <Link href="/orders" className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs flex flex-col justify-between active:scale-98 transition-transform">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Delivered</p>
              <p className="text-[18px] font-black text-slate-900 font-mono leading-tight mt-0.5">
                {earnings.todayDeliveries}
              </p>
            </div>
          </Link>

          {/* Online Time */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Duty Time</p>
              <p className="text-[18px] font-black text-slate-900 font-mono leading-tight mt-0.5">
                {onlineTimeStr}
              </p>
            </div>
          </div>
        </div>

        {/* ── 2. LIVE AVAILABILITY & PRIORITY CARD ── */}
        <HomeAvailabilityCard />

        {/* ── 4. MAIN INTERACTIVE ORDER COCKPIT ── */}

        {/* ─── SCENARIO A: INCOMING ORDER ALERT (Clean, Premium & Super Cool) ─── */}
        {incomingOrder && !activeOrder && (
          <div className="bg-white text-slate-900 rounded-[28px] p-5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] border border-slate-200/90 relative overflow-hidden animate-slide-up space-y-4 ring-2 ring-emerald-500/20">
            {/* Top Timer Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-1000 ease-linear shadow-xs"
                style={{ width: `${(countdown / 25) * 100}%` }}
              />
            </div>

            {/* Header: Offer Badge + Payout */}
            <div className="flex items-center justify-between pt-1">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[11px] font-black uppercase px-3 py-1 rounded-full border border-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                </span>
                New Delivery Offer • #{formatOrderNumber(incomingOrder.orderNumber)} • {countdown}s
              </span>

              <div className="flex items-baseline gap-1.5 bg-emerald-50 border border-emerald-200/90 px-3 py-1 rounded-xl shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  Payout
                </span>
                <span className="text-xl font-black text-emerald-600 font-mono">
                  ₹{incomingOrder.earnings || 45}
                </span>
              </div>
            </div>

            {/* Restaurant Hero Title & Trip Specs Subline */}
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {incomingOrder.restaurantName}
              </h3>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mt-1.5">
                <span className="text-slate-800">📍 {incomingOrder.distanceKm} km trip</span>
                <span className="text-slate-300">•</span>
                <span>⏱️ ~{incomingOrder.estimatedMinutes} mins</span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-700 font-extrabold">Food Delivery</span>
              </div>
            </div>

            {/* Clean Connected Route Timeline (No Redundant Restaurant Name) */}
            <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 space-y-2">
              {/* Pickup Point */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Store className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                    Pick Up From Store
                  </span>
                  <p className="text-xs font-bold text-slate-800 truncate mt-0.5">
                    {incomingOrder.restaurantAddress}
                  </p>
                </div>
              </div>

              {/* Connecting Line */}
              <div className="ml-3.5 border-l-2 border-dashed border-slate-300 h-3" />

              {/* Drop-off Point */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Home className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
                    Deliver To Customer
                  </span>
                  <p className="text-xs font-bold text-slate-800 truncate mt-0.5">
                    {incomingOrder.deliveryAddress}
                  </p>
                </div>
              </div>
            </div>

            {/* High-Impact Action Buttons */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <button
                type="button"
                onClick={declineIncomingOrder}
                className="col-span-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-2xl border border-slate-300/80 transition-all active:scale-95 cursor-pointer shadow-2xs flex items-center justify-center"
              >
                <span>Pass</span>
              </button>

              <button
                type="button"
                onClick={acceptIncomingOrder}
                className="col-span-2 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/25 border border-emerald-500 ring-2 ring-emerald-400/30 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer tracking-wider"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>ACCEPT ORDER</span>
              </button>
            </div>
          </div>
        )}

        {/* ─── SCENARIO B: ACTIVE ORDER IN PROGRESS (Home = What I need to do NOW) ─── */}
        {activeOrder && (
          <ActiveDeliveryCard
            activeOrder={activeOrder}
            onMarkPickedUp={markOrderPickedUp}
            onAdvanceStatus={advanceActiveOrderStatus}
          />
        )}

        {/* ─── SCENARIO C: ONLINE & WAITING FOR ORDERS ─── */}
        {!incomingOrder && !activeOrder && isOnline && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col items-center text-center space-y-3">
            <div className="relative w-20 h-20 flex items-center justify-center my-2">
              <div className="absolute inset-0 bg-emerald-500/15 rounded-full animate-ping" />
              <div className="relative z-10 w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border-2 border-emerald-400 text-emerald-600 shadow-md">
                <Navigation className="w-7 h-7 text-emerald-600 fill-emerald-100" />
              </div>
            </div>

            <div>
              <h3 className="font-black text-lg text-slate-900">
                You are Online & Ready
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-[260px] leading-relaxed">
                Listening for store orders in <strong className="text-slate-800">{rider.selectedZone || 'Robertsonpet'}</strong>. Orders will appear here automatically.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/availability"
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 transition-colors"
              >
                <span>Manage Availability Preferences</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* ─── SCENARIO D: OFFLINE STATE ─── */}
        {!incomingOrder && !activeOrder && !isOnline && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border border-slate-300 text-slate-400 my-1">
              <Power className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-black text-lg text-slate-900">
                You are Currently Offline
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-[260px] leading-relaxed">
                Toggle the switch in the top bar to go online and receive delivery orders.
              </p>
            </div>

            <div className="w-full max-w-[260px] pt-1 flex flex-col gap-2">
              <button
                type="button"
                onClick={toggleOnline}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Power className="w-4 h-4" />
                <span>Go Online Now</span>
              </button>

              <Link
                href="/availability"
                className="block w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all text-center"
              >
                ⭐ Manage Availability Preferences
              </Link>
            </div>
          </div>
        )}

        {/* ── 5. Zone Selection Modal ── */}
        <ZoneSelectionModal
          isOpen={isZoneModalOpen}
          onClose={() => setIsZoneModalOpen(false)}
        />

      </div>
    </AppShell>
  );
}
