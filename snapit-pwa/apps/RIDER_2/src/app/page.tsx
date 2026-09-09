'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRider } from '@/context/RiderContext';
import { useRouter } from 'next/navigation';
import { soundEngine } from '@/services/soundService';
import { SlideButton } from '@/components/common/SlideButton';
import { openGoogleMapsNavigation, hasValidCoordinates } from '@/utils/navigationLauncher';
import { formatOrderNumber } from '@/utils/orderUtils';
import { formatSessionRemaining, formatTime12h } from '@/services/sessionService';
import { StartRidingSheet } from '@/components/home/StartRidingSheet';
import { SessionEndedCard } from '@/components/home/SessionEndedCard';
import {
  Phone,
  Navigation,
  Store,
  Home,
  Clock,
  Package,
  Check,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Timer,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(name: string) {
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${greet}${name ? `, ${name.split(' ')[0]}` : ''}`;
}

// ═════════════════════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const {
    isOnline,
    activeOrder,
    incomingOrder,
    acceptIncomingOrder,
    declineIncomingOrder,
    advanceActiveOrderStatus,
    markOrderPickedUp,
    rider,
    earnings,
    zones,
    isHydrated,
    activeSession,
    sessionEnded,
    startSession,
    endSession,
    currentWindow,
    isCurrentWindowPreferred,
  } = useRider();


  const router = useRouter();

  // Redirect if not registered
  useEffect(() => {
    if (!isHydrated) return;
    if (!rider.phone) router.push('/onboarding');
  }, [isHydrated, rider.phone, router]);

  // Cleanup buzzer on unmount
  useEffect(() => {
    return () => soundEngine.stopIncomingOrderBuzzer();
  }, []);

  // Session countdown (ticks every 30s to update display)
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // Session auto-expiry
  useEffect(() => {
    if (!activeSession || !isOnline) return;
    const msRemaining = activeSession.committedUntil - Date.now();
    if (msRemaining <= 0) {
      // Already expired — end immediately unless active order
      if (!activeOrder) endSession(false);
      return;
    }
    const timer = setTimeout(() => {
      if (!activeOrder) endSession(false);
    }, msRemaining);
    return () => clearTimeout(timer);
  }, [activeSession, isOnline, activeOrder]);

  // Incoming order countdown (25s)
  const [countdown, setCountdown] = useState(25);
  useEffect(() => {
    if (!incomingOrder) {
      setCountdown(25);
      soundEngine.stopIncomingOrderBuzzer();
      return;
    }
    soundEngine.startIncomingOrderBuzzer?.();
    const t = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          soundEngine.stopIncomingOrderBuzzer();
          declineIncomingOrder();
          return 25;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [incomingOrder, declineIncomingOrder]);

  // Start riding sheet visibility
  const [showSheet, setShowSheet] = useState(false);

  // Go-offline confirmation sheet
  const [showGoOfflineSheet, setShowGoOfflineSheet] = useState(false);

  // Active order status helpers
  const rawDbStatus = (activeOrder?.dbStatus || '').toUpperCase();
  const isArrivedAtCustomer =
    rawDbStatus === 'RIDER_AT_LOC' ||
    rawDbStatus === 'ARRIVED_AT_CUSTOMER' ||
    activeOrder?.status === 'arrived_at_dropoff';
  const isOutOfShop = rawDbStatus === 'OUT_OF_SHOP';
  const isReadyForPickup = !isOutOfShop && rawDbStatus === 'READY_FOR_PICKUP';
  const isPreparing =
    !isOutOfShop &&
    !isReadyForPickup &&
    (rawDbStatus === 'PREPARING' || rawDbStatus === 'PACKING' || rawDbStatus === 'PLACED' ||
      rawDbStatus === 'PENDING' || rawDbStatus === 'ACCEPTED' || rawDbStatus === 'RIDER_ARRIVING_TO_STORE' ||
      (!rawDbStatus && Boolean(activeOrder)));
  const isOutForDelivery =
    !isArrivedAtCustomer &&
    (rawDbStatus === 'OUT_FOR_DELIVERY' || rawDbStatus === 'IN_TRANSIT' || rawDbStatus === 'PICKED_UP') &&
    !isPreparing && !isReadyForPickup && !isOutOfShop;
  const isPickupStage = isPreparing || isReadyForPickup || isOutOfShop;

  const canNavShop = activeOrder
    ? hasValidCoordinates(activeOrder.shopLocation?.lat, activeOrder.shopLocation?.lng) ||
      Boolean(activeOrder.restaurantAddress?.trim() && activeOrder.restaurantAddress !== 'Store Location')
    : false;
  const canNavCust = activeOrder
    ? hasValidCoordinates(activeOrder.customerLocation?.lat, activeOrder.customerLocation?.lng) ||
      Boolean(activeOrder.deliveryAddress?.trim() && activeOrder.deliveryAddress !== 'Customer Address')
    : false;

  const storePhone = activeOrder?.shopPhone || '8217649688';

  // Countdown ring
  const RING_RADIUS = 20;
  const RING_CIRC = 2 * Math.PI * RING_RADIUS;
  const ringOffset = RING_CIRC - (countdown / 25) * RING_CIRC;

  // ═══════════════════════════════════════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════════════════════════════════════
  if (!isHydrated) return null;

  // ═══════════════════════════════════════════════════════════════════════════
  // SESSION ENDED (no active order)
  // ═══════════════════════════════════════════════════════════════════════════
  if (sessionEnded && !activeOrder && !incomingOrder) {
    return (
      <AppShell>
        <div className="flex flex-col min-h-full pt-4 pb-6 animate-fade-in">
          <SessionEndedCard
            zoneName={rider.selectedZone || 'Robertsonpet'}
            ordersCompleted={earnings.todayDeliveries}
            earningsToday={earnings.today}
            onStartAnother={() => setShowSheet(true)}
          />
        </div>
        <StartRidingSheet
          isOpen={showSheet}
          onClose={() => setShowSheet(false)}
          onStartSession={startSession}
          zones={zones}
          defaultZoneId={rider.selectedZoneId || 'zone-1'}
          defaultZoneName={rider.selectedZone || 'Robertsonpet'}
        />
      </AppShell>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OFFLINE
  // ═══════════════════════════════════════════════════════════════════════════
  if (!isOnline && !activeOrder && !incomingOrder) {
    return (
      <AppShell>
        <div className="flex flex-col min-h-full pt-4 pb-6 gap-3 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 cockpit-shadow border border-slate-200/80 flex flex-col items-center text-center gap-4">
            {/* Power Icon */}
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center border-2 border-slate-200 mt-2">
              <svg viewBox="0 0 24 24" className="w-9 h-9 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0" strokeLinecap="round"/>
                <line x1="12" y1="2" x2="12" y2="12"/>
              </svg>
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">You're Offline</h2>
              <p className="text-sm font-semibold text-slate-500 mt-1.5">{getGreeting(rider.name)}</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[220px] leading-relaxed">
                Go online to start receiving orders in <strong className="text-slate-600">{rider.selectedZone || 'Robertsonpet'}</strong>
              </p>
            </div>

            {/* Today stats (if any) */}
            {(earnings.today > 0 || earnings.todayDeliveries > 0) && (
              <div className="flex items-center gap-4 py-3 px-4 bg-slate-50 rounded-2xl border border-slate-200/80 w-full">
                <div className="text-center flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Earned Today</p>
                  <p className="text-lg font-black text-emerald-600 font-mono">₹{earnings.today}</p>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="text-center flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deliveries</p>
                  <p className="text-lg font-black text-slate-900 font-mono">{earnings.todayDeliveries}</p>
                </div>
              </div>
            )}

            {/* START RIDING CTA */}
            <button
              type="button"
              onClick={() => setShowSheet(true)}
              className="w-full min-h-touch bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/25 active:scale-98 transition-all flex items-center justify-center gap-2 tracking-wide"
            >
              <span className="text-lg">🚀</span>
              START RIDING
            </button>
          </div>
        </div>

        <StartRidingSheet
          isOpen={showSheet}
          onClose={() => setShowSheet(false)}
          onStartSession={startSession}
          zones={zones}
          defaultZoneId={rider.selectedZoneId || 'zone-1'}
          defaultZoneName={rider.selectedZone || 'Robertsonpet'}
        />
      </AppShell>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ONLINE + WAITING (no incoming order, no active order)
  // ═══════════════════════════════════════════════════════════════════════════
  if (isOnline && !activeOrder && !incomingOrder) {
    const remainingStr = activeSession ? formatSessionRemaining(activeSession.committedUntil) : '';
    const endsAtStr = activeSession ? formatTime12h(activeSession.committedUntil) : '';

    return (
      <AppShell>
        <div className="flex flex-col min-h-full items-center justify-center py-6 gap-4 animate-fade-in">

          {/* Radar animation */}
          <div className="relative flex items-center justify-center my-2">
            <div className="absolute w-24 h-24 rounded-full bg-emerald-400/15 radar-ring-3" />
            <div className="absolute w-24 h-24 rounded-full bg-emerald-400/20 radar-ring-2" />
            <div className="absolute w-24 h-24 rounded-full bg-emerald-400/25 radar-ring-1" />
            <div className="relative z-10 w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-600/30">
              <Navigation className="w-8 h-8 text-white fill-white" />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Scanning for Orders</h2>
            <p className="text-xs text-slate-500 mt-1.5">
              Active in <strong className="text-slate-800">{rider.selectedZone || 'Robertsonpet'}</strong>
            </p>
          </div>

          {/* Realtime Priority Pill */}
          {isCurrentWindowPreferred && currentWindow && (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black shadow-xs animate-fade-in">
              <span>⭐ Priority Active · {currentWindow.title} ({currentWindow.timeRange})</span>
            </div>
          )}

          {/* Session timer */}
          {activeSession && (

            <div className="w-full max-w-xs bg-white rounded-2xl px-4 py-3 cockpit-shadow border border-emerald-200/60 flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                <Timer className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Session Active</p>
                <p className="text-sm font-black text-slate-900">
                  {remainingStr} remaining · ends {endsAtStr}
                </p>
              </div>
            </div>
          )}

          {/* Mini stats */}
          <div className="flex gap-3 w-full max-w-xs">
            <div className="flex-1 bg-white rounded-2xl p-3 cockpit-shadow border border-slate-200/70 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Earned</p>
              <p className="text-base font-black text-emerald-600 font-mono mt-0.5">₹{earnings.today}</p>
            </div>
            <div className="flex-1 bg-white rounded-2xl p-3 cockpit-shadow border border-slate-200/70 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orders</p>
              <p className="text-base font-black text-slate-900 font-mono mt-0.5">{earnings.todayDeliveries}</p>
            </div>
          </div>

          {/* Go offline */}
          <button
            type="button"
            onClick={() => setShowGoOfflineSheet(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors mt-1"
          >
            End Session
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Go Offline confirmation */}
        {showGoOfflineSheet && (
          <div
            className="fixed inset-0 z-[200] bg-black/50 flex items-end justify-center"
            onClick={() => setShowGoOfflineSheet(false)}
          >
            <div
              className="w-full max-w-md bg-white rounded-t-3xl p-6 animate-slide-up space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto" />
              <div>
                <h3 className="text-base font-black text-slate-900">End your session?</h3>
                {activeSession && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    Your session is scheduled until <strong className="text-slate-800">{formatTime12h(activeSession.committedUntil)}</strong>. 
                    Ending early is recorded for analytics — no penalties in Phase 1.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => setShowGoOfflineSheet(false)}
                  className="py-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm rounded-2xl active:scale-98 transition-all"
                >
                  Stay Online
                </button>
                <button
                  onClick={async () => { setShowGoOfflineSheet(false); await endSession(true); }}
                  className="py-3.5 bg-slate-800 text-white font-bold text-sm rounded-2xl active:scale-98 transition-all"
                >
                  End Session
                </button>
              </div>
            </div>
          </div>
        )}
      </AppShell>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INCOMING ORDER
  // ═══════════════════════════════════════════════════════════════════════════
  if (incomingOrder && !activeOrder) {
    return (
      <AppShell>
        <div className="flex flex-col min-h-full pt-3 pb-6 animate-slide-up">
          <div className="bg-white rounded-3xl cockpit-shadow-active border border-emerald-200/60 overflow-hidden">
            {/* Progress bar */}
            <div className="h-1 bg-slate-100">
              <div className="h-full bg-emerald-500 transition-all duration-1000 ease-linear" style={{ width: `${(countdown / 25) * 100}%` }} />
            </div>
            <div className="p-5 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                  </span>
                  <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider">
                    New Order · #{formatOrderNumber(incomingOrder.orderNumber)}
                  </span>
                </div>
                {/* Countdown ring */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r={RING_RADIUS} fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
                    <circle cx="24" cy="24" r={RING_RADIUS} fill="none" stroke="#059669" strokeWidth="3.5"
                      strokeDasharray={RING_CIRC} strokeDashoffset={ringOffset} strokeLinecap="round"
                      className="transition-all duration-1000 ease-linear" />
                  </svg>
                  <span className="absolute text-sm font-black text-slate-900 font-mono">{countdown}</span>
                </div>
              </div>

              {/* Store + trip details */}
              <div>
                <h2 className="text-[22px] font-black text-slate-900 tracking-tight leading-tight">
                  {incomingOrder.restaurantName}
                </h2>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-1.5">
                  <span>📍 {incomingOrder.distanceKm} km</span>
                  <span className="text-slate-300">·</span>
                  <span>⏱ ~{incomingOrder.estimatedMinutes} min</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-emerald-700 font-bold">₹{incomingOrder.earnings || 45}</span>
                </div>
              </div>

              {/* Route */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Store className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">Pickup</span>
                    <p className="text-xs font-semibold text-slate-800 truncate">{incomingOrder.restaurantAddress}</p>
                  </div>
                </div>
                <div className="ml-3 h-3 border-l-2 border-dashed border-slate-300" />
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Home className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block">Drop-off</span>
                    <p className="text-xs font-semibold text-slate-800 truncate">{incomingOrder.deliveryAddress}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={declineIncomingOrder}
                  className="flex-none w-20 min-h-touch bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-2xl border border-slate-200 active:scale-98 transition-all">
                  Pass
                </button>
                <button type="button" onClick={acceptIncomingOrder}
                  className="flex-1 min-h-touch bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/25 active:scale-98 transition-all flex items-center justify-center gap-2 tracking-wide">
                  <Check className="w-5 h-5 stroke-[3]" />
                  ACCEPT ORDER
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIVE ORDER (Pickup or Delivery stage)
  // ═══════════════════════════════════════════════════════════════════════════
  if (activeOrder) {
    return (
      <AppShell>
        <div className="flex flex-col min-h-full pt-3 pb-6 gap-3 animate-fade-in">
          <div className={`rounded-3xl p-4 border ${
            isPickupStage ? 'bg-white cockpit-shadow-active border-emerald-200/50' : 'bg-white cockpit-shadow-blue border-blue-200/50'
          }`}>

            {/* 2-step progress */}
            <div className="flex items-center gap-0 mb-4">
              <div className="flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-md shadow-emerald-600/30">
                  {!isPickupStage ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700">
                  {isPickupStage ? 'Pickup' : 'Done ✓'}
                </span>
              </div>
              <div className={`flex-1 h-0.5 mx-2 ${!isPickupStage ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              <div className="flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-md ${
                  !isPickupStage ? 'bg-blue-600 text-white shadow-blue-600/30' : 'bg-slate-200 text-slate-500'
                }`}>2</div>
                <span className={`text-[9px] font-black uppercase tracking-wider ${!isPickupStage ? 'text-blue-600' : 'text-slate-400'}`}>
                  Deliver
                </span>
              </div>
            </div>

            {/* PICKUP STAGE */}
            {isPickupStage && (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                      <Store className="w-3 h-3" /> Pickup Store
                    </span>
                    {isPreparing && <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3 animate-spin" />Packing</span>}
                    {isReadyForPickup && <span className="flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full"><Package className="w-3 h-3" />Ready</span>}
                    {isOutOfShop && <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><Check className="w-3 h-3 stroke-[3]" />Handed Over</span>}
                  </div>
                  <h3 className="text-[22px] font-black text-slate-900 tracking-tight">{activeOrder.restaurantName}</h3>
                  <p className="text-xs text-slate-600 font-medium flex items-start gap-1.5">
                    <span className="shrink-0 mt-0.5">📍</span><span>{activeOrder.restaurantAddress}</span>
                  </p>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {activeOrder.distanceKm || 2.2} km · <span className="text-emerald-700 font-bold">₹{activeOrder.earnings || 45}</span>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <a href={`tel:${storePhone}`} className="col-span-1 min-h-touch bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-1 active:scale-98 transition-all">
                    <Phone className="w-4 h-4 text-slate-700" /><span className="text-[11px] font-bold text-slate-700">Call Store</span>
                  </a>
                  {canNavShop ? (
                    <button type="button" onClick={() => openGoogleMapsNavigation(activeOrder.shopLocation?.lat, activeOrder.shopLocation?.lng, activeOrder.restaurantAddress)}
                      className="col-span-2 min-h-touch bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-md shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 tracking-wide">
                      <Navigation className="w-4 h-4 fill-white" />Navigate to Store<ExternalLink className="w-3 h-3 opacity-70" />
                    </button>
                  ) : (
                    <button disabled className="col-span-2 min-h-touch bg-slate-100 text-slate-400 text-xs rounded-2xl border border-slate-200 flex items-center justify-center cursor-not-allowed">Location Unavailable</button>
                  )}
                </div>
                {isPreparing && (
                  <div className="py-3.5 px-4 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-center gap-3">
                    <Clock className="w-5 h-5 text-amber-600 animate-spin shrink-0" />
                    <div><p className="text-xs font-black text-amber-900">Merchant is packing your order</p><p className="text-[10.5px] text-amber-700 font-medium">Will be handed over shortly</p></div>
                  </div>
                )}
                {isReadyForPickup && (
                  <div className="py-3.5 px-4 bg-blue-50 border border-blue-200/90 rounded-2xl flex items-center gap-3">
                    <Package className="w-5 h-5 text-blue-600 shrink-0" />
                    <div><p className="text-xs font-black text-blue-900">Order Ready at Counter</p><p className="text-[10.5px] text-blue-700 font-medium">Ask store to hand over the parcel</p></div>
                  </div>
                )}
                {isOutOfShop && <SlideButton label="SLIDE TO CONFIRM PICKUP" variant="emerald" onConfirm={markOrderPickedUp} />}
              </div>
            )}

            {/* DELIVERY STAGE */}
            {!isPickupStage && (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 flex items-center gap-1">
                      <Home className="w-3 h-3" /> Deliver To
                    </span>
                    {isOutForDelivery && <span className="flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full"><span className="animate-scooter inline-block">🛵</span>In Transit</span>}
                    {isArrivedAtCustomer && <span className="flex items-center gap-1 text-[10px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full animate-pulse">📍 At Doorstep</span>}
                  </div>
                  <h3 className="text-[22px] font-black text-slate-900 tracking-tight">{activeOrder.customerName || 'Customer'}</h3>
                  <p className="text-xs text-slate-700 font-medium flex items-start gap-1.5">
                    <span className="shrink-0 mt-0.5">📍</span><span className="break-words">{activeOrder.deliveryAddress}</span>
                  </p>
                  <span className="text-[11px] font-semibold text-slate-500">
                    From {activeOrder.restaurantName} · <span className="text-blue-700 font-bold">₹{activeOrder.earnings || 45}</span>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {activeOrder.customerPhone ? (
                    <a href={`tel:${activeOrder.customerPhone}`} className="col-span-1 min-h-touch bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-1 active:scale-98 transition-all">
                      <Phone className="w-4 h-4 text-slate-700" /><span className="text-[11px] font-bold text-slate-700">Call</span>
                    </a>
                  ) : (
                    <button disabled className="col-span-1 min-h-touch bg-slate-100 text-slate-400 text-xs rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-1 cursor-not-allowed">
                      <Phone className="w-4 h-4" /><span>Call</span>
                    </button>
                  )}
                  {canNavCust ? (
                    <button type="button" onClick={() => openGoogleMapsNavigation(activeOrder.customerLocation?.lat, activeOrder.customerLocation?.lng, activeOrder.deliveryAddress)}
                      className="col-span-2 min-h-touch bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-2xl shadow-md shadow-blue-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 tracking-wide">
                      <Navigation className="w-4 h-4 fill-white" />Navigate to Drop-off<ExternalLink className="w-3 h-3 opacity-70" />
                    </button>
                  ) : (
                    <button disabled className="col-span-2 min-h-touch bg-slate-100 text-slate-400 text-xs rounded-2xl border border-slate-200 flex items-center justify-center cursor-not-allowed">Location Unavailable</button>
                  )}
                </div>
                {isOutForDelivery
                  ? <SlideButton label="SLIDE: ARRIVED AT CUSTOMER" variant="blue" onConfirm={advanceActiveOrderStatus} />
                  : <SlideButton label="SLIDE TO ENTER DELIVERY PIN" variant="purple" icon={<ShieldCheck className="w-5 h-5 text-white stroke-[2.5]" />} onConfirm={() => router.push('/confirm-delivery')} />
                }
              </div>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  return null;
}
