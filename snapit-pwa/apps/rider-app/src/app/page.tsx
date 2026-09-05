'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ZoneSelectionModal } from '@/components/slots/ZoneSelectionModal';
import { HomeSlotCard } from '@/components/dashboard/HomeSlotCard';
import { ActiveDeliveryCard } from '@/components/dashboard/ActiveDeliveryCard';
import { useRider } from '@/context/RiderContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { soundEngine } from '@/services/soundService';
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
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
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

        {/* ── 3. UPCOMING / ACTIVE BOOKED SLOT CARD ── */}
        <HomeSlotCard />

        {/* ── 4. MAIN INTERACTIVE ORDER COCKPIT ── */}

        {/* ─── SCENARIO A: INCOMING ORDER ALERT ─── */}
        {incomingOrder && !activeOrder && (
          <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white rounded-3xl p-5 shadow-2xl border-2 border-emerald-400 relative overflow-hidden animate-slide-up space-y-4">
            {/* Top Timer Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800">
              <div
                className="h-full bg-emerald-400 transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / 25) * 100}%` }}
              />
            </div>

            {/* Header: Title + Payout */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10.5px] font-black uppercase px-2.5 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  New Delivery • {countdown}s
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  {incomingOrder.restaurantName}
                </h3>
              </div>

              <div className="bg-emerald-500/20 border border-emerald-400/50 rounded-2xl px-3.5 py-2 text-right">
                <span className="text-[10px] font-bold uppercase text-emerald-300 block">Payout</span>
                <span className="text-2xl font-black text-white font-mono leading-none">
                  ₹{incomingOrder.earnings || 45}
                </span>
              </div>
            </div>

            {/* Simple Route Summary */}
            <div className="bg-white/10 rounded-2xl p-3.5 space-y-2 text-xs border border-white/10">
              <div className="flex items-start gap-2.5">
                <Store className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Pick Up From</p>
                  <p className="font-bold text-white truncate">{incomingOrder.restaurantName}</p>
                  <p className="text-[11px] text-gray-300 truncate">{incomingOrder.restaurantAddress}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-2 border-t border-white/10">
                <Home className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Deliver To</p>
                  <p className="font-bold text-white truncate">Delivery Location</p>
                  <p className="text-[11px] text-gray-300 truncate">{incomingOrder.deliveryAddress}</p>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center justify-between text-xs text-gray-300 px-1">
              <span className="font-bold">📍 {incomingOrder.distanceKm} km trip</span>
              <span className="font-bold">⏱️ ~{incomingOrder.estimatedMinutes} mins</span>
              <span className="font-bold text-emerald-300">📦 Package Delivery</span>
            </div>

            {/* 2 Huge Action Buttons */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <button
                onClick={declineIncomingOrder}
                className="col-span-1 py-3.5 bg-white/10 hover:bg-white/20 text-gray-300 font-bold text-xs rounded-2xl transition-all active:scale-95 cursor-pointer"
              >
                Pass
              </button>

              <button
                onClick={acceptIncomingOrder}
                className="col-span-2 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
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
                href="/slots"
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 transition-colors"
              >
                <span>Pick / Change 1-Hour Duty Slot</span>
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
                href="/slots"
                className="block w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all text-center"
              >
                📅 View & Book 1-Hour Slots
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
