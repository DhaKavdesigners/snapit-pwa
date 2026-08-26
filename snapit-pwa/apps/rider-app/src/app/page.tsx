'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { IncomingOrderModal } from '@/components/dashboard/IncomingOrderModal';
import { SlotStatusCard } from '@/components/slots/SlotStatusCard';
import { ZoneStatusBanner } from '@/components/slots/ZoneStatusBanner';
import { ZoneSelectionModal } from '@/components/slots/ZoneSelectionModal';
import { useRider } from '@/context/RiderContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Check,
  Hourglass,
  ChevronDown,
  MapPin,
  TrendingUp,
  BarChart2,
  Clock,
  ChevronRight,
  AlertCircle,
  Package,
  Navigation,
  Phone,
  X,
  Sparkles,
} from 'lucide-react';
import { SlideToConfirm } from '@/components/orders/SlideToConfirm';

// ─── Tiny sparkline SVG components ─────────────────────────────────
const EarningsTrend = () => (
  <svg width="56" height="24" viewBox="0 0 56 24" fill="none">
    <polyline points="0,20 10,16 20,10 30,14 40,6 50,2 56,4" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);
const DeliveriesChart = () => (
  <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
    {[8, 14, 10, 20, 16, 22].map((h, i) => (
      <rect key={i} x={i * 7} y={24 - h} width="5" height={h} rx="2" fill="#2563eb" opacity={i === 5 ? 1 : 0.4} />
    ))}
  </svg>
);
const OnlineTimeLine = () => (
  <svg width="56" height="24" viewBox="0 0 56 24" fill="none">
    <polyline points="0,14 8,10 16,16 24,8 32,14 40,6 48,12 56,8" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);
// ─── Main Home Page ─────────────────────────────────────────────────
export default function DashboardPage() {
  const {
    isOnline,
    activeOrder,
    incomingOrder,
    acceptIncomingOrder,
    declineIncomingOrder,
    advanceActiveOrderStatus,
    markOrderPickedUp,
    triggerMockOrder,
    simulateMerchantReadyForPickup,
    simulateShopkeeperHandover,
    resetActiveOrder,
    rider,
    simulateApproval,
    earnings,
    nonAcceptanceCount,
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

  // Online timer
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
    : '5h 24m'; // fallback display

  // Incoming order timer
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

  // Active Order slider config
  const getStatusBadgeLabel = () => {
    if (!activeOrder) return '';
    const isReadyForPickup =
      activeOrder.dbStatus === 'READY_FOR_PICKUP' ||
      activeOrder.dbStatus === 'OUT_OF_SHOP' ||
      activeOrder.dbStatus === 'OUT_FOR_DELIVERY' ||
      Boolean(activeOrder.shopkeeperHandoverConfirmed);

    if (activeOrder.status === 'accepted' || activeOrder.status === 'picking_up' || activeOrder.status === 'arrived_at_pickup') {
      if (!isReadyForPickup) return 'AWAITING ORDER PREPARATION';
      if (activeOrder.riderPickupConfirmed && !activeOrder.shopkeeperHandoverConfirmed && activeOrder.dbStatus !== 'OUT_OF_SHOP') {
        return 'AWAITING SHOPKEEPER HANDOVER';
      }
      return 'READY FOR PICKUP';
    }
    if (activeOrder.status === 'in_transit') return 'OUT FOR DELIVERY';
    if (activeOrder.status === 'arrived_at_dropoff') return 'ARRIVED AT CUSTOMER';
    if (activeOrder.status === 'delivered') return 'DELIVERED';
    return 'ACTIVE ORDER';
  };

  const handleNextStepAction = () => {
    if (!activeOrder) return;
    if (activeOrder.status === 'accepted' || activeOrder.status === 'picking_up' || activeOrder.status === 'arrived_at_pickup') {
      markOrderPickedUp();
    } else if (activeOrder.status === 'in_transit') {
      advanceActiveOrderStatus();
    } else if (activeOrder.status === 'arrived_at_dropoff') {
      router.push('/confirm-delivery');
    }
  };

  const getSliderConfig = () => {
    if (!activeOrder) return { type: 'slider', label: '', success: '', hint: '', disabled: false };
    
    // Check if store has prepared and marked order ready in Supabase
    const isReadyForPickup =
      activeOrder.dbStatus === 'READY_FOR_PICKUP' ||
      activeOrder.dbStatus === 'OUT_OF_SHOP' ||
      activeOrder.dbStatus === 'OUT_FOR_DELIVERY' ||
      Boolean(activeOrder.shopkeeperHandoverConfirmed);

    if (activeOrder.status === 'accepted' || activeOrder.status === 'picking_up' || activeOrder.status === 'arrived_at_pickup') {
      const isRiderConfirmed = Boolean(activeOrder.riderPickupConfirmed);
      const isShopConfirmed = Boolean(activeOrder.shopkeeperHandoverConfirmed || activeOrder.dbStatus === 'OUT_OF_SHOP');

      // Stage 1: Order is still being prepared by store
      if (!isReadyForPickup) {
        return {
          type: 'slider',
          label: 'AWAITING ORDER PREPARATION',
          success: 'Waiting for Store...',
          hint: 'Merchant is preparing the order. Slide to confirm pickup once marked ready.',
          disabled: true,
        };
      }

      // Stage 2b: Rider confirmed pickup, waiting for shopkeeper handover confirmation
      if (isRiderConfirmed && !isShopConfirmed) {
        return {
          type: 'slider',
          label: 'AWAITING SHOPKEEPER HANDOVER',
          success: 'Waiting for Handover...',
          hint: 'You confirmed pickup. Waiting for shopkeeper to confirm handover.',
          disabled: true,
        };
      }

      // Stage 2: Store marked ready -> Rider can slide ORDER PICKED UP
      return {
        type: 'slider',
        label: 'ORDER PICKED UP',
        success: 'Order Collected!',
        hint: 'Order is ready at store. Slide to confirm physical pickup from merchant.',
        disabled: false,
      };
    }
    if (activeOrder.status === 'in_transit') {
      return {
        type: 'slider',
        label: 'ARRIVED AT CUSTOMER',
        success: 'Arrived at Customer!',
        hint: 'Deliver package to customer doorstep',
        disabled: false,
      };
    }
    if (activeOrder.status === 'arrived_at_dropoff') {
      return {
        type: 'button',
        label: 'Verify Delivery OTP →',
        success: '',
        hint: 'Ask customer for delivery OTP',
        disabled: false,
      };
    }
    return { type: 'slider', label: 'Update Status', success: 'Done', hint: '', disabled: false };
  };

  const sliderConfig = getSliderConfig();

  // ── Verification gate ──────────────────────────────────────────
  if (!rider.isVerified) {
    return (
      <AppShell showHeader={false} showNav={false} noPadding={true}>
        <div className="min-h-screen bg-background flex flex-col justify-between p-6 max-w-sm mx-auto animate-fade-in">
          <div className="flex flex-col items-center text-center mt-8">
            <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 rounded-full radar-ring" />
              <div className="relative z-10 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-soft border border-slate-200">
                <Hourglass className="w-8 h-8 text-primary animate-pulse" />
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-4 py-1 rounded-full text-xs font-bold border border-amber-200 mb-3">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>Status: Verification In Progress</span>
            </div>
            <h1 className="text-2xl font-black text-on-surface tracking-tight">Awaiting Admin Approval</h1>
            <p className="text-xs text-secondary mt-2 leading-relaxed max-w-[280px]">
              Hi <strong>{rider.name}</strong>, your KYC documents are under manual review.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 my-4">
            <h3 className="font-bold text-xs text-on-surface mb-3.5 flex justify-between">
              <span>Verification Checklist</span>
              <span className="text-primary font-mono text-[11px] font-bold">Step 3 of 4</span>
            </h3>
            <div className="space-y-3 text-xs">
              {['Live Selfie Captured & Matched', 'Aadhaar & PAN Scans Validated'].map((label) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center"><Check className="w-3 h-3" /></div>
                  <span className="font-semibold text-on-surface">{label}</span>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary-container text-white flex items-center justify-center animate-pulse"><Check className="w-3 h-3" /></div>
                <span className="font-bold text-primary">Driving License Authenticity</span>
              </div>
              <div className="flex items-center gap-3 opacity-50">
                <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">4</div>
                <span className="text-secondary">Admin Onboarding Approval</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pb-4">
            <button
              onClick={() => simulateApproval()}
              className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-white font-bold text-xs rounded-2xl shadow-lift flex items-center justify-center gap-2 active:scale-98"
            >
              <ShieldCheck className="w-4 h-4" />
              Simulate Admin Approval & Unlock Dashboard
            </button>
            <Link href="/onboarding" className="block text-center text-xs font-bold text-secondary hover:text-primary transition-colors py-1">
              Re-edit Application Form →
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Approved Rider Dashboard ───────────────────────────────────
  return (
    <AppShell>
      <div className="flex flex-col gap-4 pt-2 pb-6">

        {/* ── Greeting + Zone selector ─────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[18px] font-black text-slate-900 leading-tight">
              {getGreeting()}, {rider.name.split(' ')[0]} 👋
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isOnline ? "You're online and ready to receive orders." : "You're offline. Go online to start receiving orders."}
            </p>
          </div>

          {/* Zone pill */}
          <button
            onClick={() => setIsZoneModalOpen(true)}
            className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm text-xs font-semibold text-slate-700 shrink-0 active:scale-95 hover:border-slate-300 transition-all text-left"
          >
            <MapPin className="w-3.5 h-3.5 text-green-600" />
            <div className="text-left">
              <p className="text-[9px] text-slate-400 leading-none">Your Zone</p>
              <p className="text-[11px] font-bold text-slate-800">{rider.selectedZone || 'Robertsonpet'}</p>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        {/* ── Live Slot Status & Booking Card (PROMINENT FIRST ELEMENT) ── */}
        <SlotStatusCard />

        {/* ═════════════════════════════════════════════════════════════════
            EXPANDED DEDICATED ORDER COCKPIT SLOT (HOME PRIMARY HUB)
        ═════════════════════════════════════════════════════════════════ */}

        {/* STATE 1: INCOMING ORDER REQUEST (Full expanded interactive card) */}
        {incomingOrder && !activeOrder && (
          <div className="bg-white rounded-3xl p-5 shadow-[0px_10px_35px_rgba(15,23,42,0.12)] border-2 border-emerald-500 relative overflow-hidden ring-4 ring-emerald-500/10 animate-slide-up">
            {/* Top Animated Progress Countdown Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / 25) * 100}%` }}
              />
            </div>

            {/* Header: Request Badge + Countdown + Payout */}
            <div className="flex justify-between items-start mb-3 pt-1">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                    New Incoming Request
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    Expires in {countdown}s
                  </span>
                </div>
                <h3 className="font-black text-lg text-slate-900 tracking-tight">
                  {incomingOrder.customerName}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                  <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                  {incomingOrder.distanceKm} km away ({incomingOrder.estimatedMinutes} mins)
                </p>
              </div>

              {/* Big Earnings Badge */}
              <div className="bg-emerald-50 rounded-2xl p-2.5 text-center border border-emerald-200 min-w-[84px] shadow-sm">
                <p className="text-[9px] uppercase font-extrabold tracking-wider text-emerald-800">
                  Est. Payout
                </p>
                <p className="text-2xl font-black text-emerald-600 font-mono leading-none mt-0.5">
                  ₹{incomingOrder.earnings}
                </p>
              </div>
            </div>

            {/* Restaurant & Drop location breakdown */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-2 text-xs mb-3">
              <div className="flex items-start gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900">{incomingOrder.restaurantName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{incomingOrder.restaurantAddress}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900">{incomingOrder.customerName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{incomingOrder.deliveryAddress}</p>
                </div>
              </div>
            </div>

            {/* Items tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {incomingOrder.items.map((item, idx) => (
                <span key={idx} className="bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-lg shadow-2xs">
                  {item.quantity}x {item.name}
                </span>
              ))}
            </div>

            {/* Action buttons: Decline / Accept */}
            <div className="flex gap-2.5">
              <button
                onClick={declineIncomingOrder}
                className="flex-1 border border-slate-300 hover:bg-slate-100 text-slate-600 font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
                Decline
              </button>

              <button
                onClick={acceptIncomingOrder}
                className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-2xl shadow-lift flex items-center justify-center gap-1.5 ring-2 ring-emerald-500/20 active:scale-95 transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                Accept Order
              </button>
            </div>
          </div>
        )}

        {/* STATE 2: ACTIVE LIVE ORDER IN PROGRESS (Expanded full live card) */}
        {activeOrder && (
          <div className="bg-white rounded-3xl p-5 shadow-[0px_10px_35px_rgba(15,23,42,0.1)] border-2 border-emerald-500/40 relative overflow-hidden animate-fade-in">
            {/* Top Accent Gradient */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 to-green-500" />

            {/* Header: Status + Order Number + Earnings */}
            <div className="flex justify-between items-start mb-3 pt-1">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    {getStatusBadgeLabel()}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    #{activeOrder.orderNumber}
                  </span>
                </div>
                <h3 className="font-black text-base text-slate-900">
                  {activeOrder.status === 'accepted' || activeOrder.status === 'picking_up' || activeOrder.status === 'arrived_at_pickup'
                    ? activeOrder.restaurantName
                    : activeOrder.customerName}
                </h3>
              </div>

              <div className="bg-emerald-50 rounded-2xl px-3 py-2 text-right border border-emerald-200">
                <p className="text-xl font-black text-emerald-600 font-mono leading-none">
                  ₹{activeOrder.earnings}
                </p>
                <p className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">Earnings</p>
              </div>
            </div>

            {/* Route summary box */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2 text-xs mb-3">
              <div className="flex items-start gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Pickup Store</p>
                  <p className="font-bold text-slate-900 truncate">{activeOrder.restaurantName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{activeOrder.restaurantAddress}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 pt-1 border-t border-slate-200/60">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Customer Dropoff</p>
                  <p className="font-bold text-slate-900 truncate">{activeOrder.customerName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{activeOrder.deliveryAddress}</p>
                </div>
              </div>
            </div>

            {/* Distance, ETA, and Call Toolbar */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-100/70 px-3 py-2 rounded-xl flex-1">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold">{activeOrder.estimatedMinutes} mins</span>
                </div>
                <div className="w-px h-4 bg-slate-300" />
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold">{activeOrder.distanceKm} km</span>
                </div>
                <div className="w-px h-4 bg-slate-300" />
                <span className="text-[11px] text-slate-500 truncate">{activeOrder.items.length} items</span>
              </div>

              <a
                href={`tel:${activeOrder.customerPhone}`}
                className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-emerald-700 shadow-sm hover:bg-slate-50 active:scale-95 shrink-0"
                title="Call Customer"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>

            {/* Navigation CTA button */}
            <Link
              href="/orders"
              className="w-full mb-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Navigation className="w-3.5 h-3.5 fill-current" />
              <span>Open Full Live Navigation Map</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>

            {/* Slide Action / Next Step Slider right on the home page */}
            <div>
              {sliderConfig.type === 'slider' ? (
                <SlideToConfirm
                  key={`${activeOrder.status}-${activeOrder.riderPickupConfirmed}-${activeOrder.shopkeeperHandoverConfirmed}`}
                  label={sliderConfig.label}
                  successLabel={sliderConfig.success}
                  disabled={sliderConfig.disabled}
                  onConfirm={handleNextStepAction}
                />
              ) : (
                <button
                  onClick={handleNextStepAction}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:opacity-95 text-white font-extrabold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{sliderConfig.label}</span>
                </button>
              )}
            </div>

            {/* ── TEMPORARY DEV HANDOVER SIMULATOR ── */}
            <div className="mt-4 p-3 rounded-2xl bg-slate-900 text-white shadow-md border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="flex items-center gap-1.5 text-purple-300">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                  🧪 Temporary Dev Handover Simulator
                </span>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  DB: {activeOrder.dbStatus || 'PREPARING'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {/* Step 1: Merchant Marks Ready for Pickup */}
                <button
                  onClick={() => simulateMerchantReadyForPickup(activeOrder.dbStatus !== 'READY_FOR_PICKUP')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 ${
                    activeOrder.dbStatus === 'READY_FOR_PICKUP' || activeOrder.dbStatus === 'OUT_OF_SHOP' || activeOrder.dbStatus === 'OUT_FOR_DELIVERY'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  <span>
                    {activeOrder.dbStatus === 'READY_FOR_PICKUP' || activeOrder.dbStatus === 'OUT_OF_SHOP' || activeOrder.dbStatus === 'OUT_FOR_DELIVERY'
                      ? '✓ 1. Ready for Pickup'
                      : '🏪 1. Mark Ready'}
                  </span>
                </button>

                {/* Step 2: Merchant Slide Out of Shop */}
                <button
                  onClick={() => simulateShopkeeperHandover(!activeOrder.shopkeeperHandoverConfirmed)}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 ${
                    activeOrder.shopkeeperHandoverConfirmed
                      ? 'bg-amber-950 text-amber-300 border border-amber-500'
                      : 'bg-teal-600 hover:bg-teal-500 text-white'
                  }`}
                >
                  <span>{activeOrder.shopkeeperHandoverConfirmed ? '✓ 2. Out of Shop' : '🏪 2. Out of Shop'}</span>
                </button>
              </div>

              <div className="pt-0.5">
                <button
                  onClick={resetActiveOrder}
                  className="w-full py-1.5 px-2 rounded-xl text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center justify-center gap-1 active:scale-95"
                >
                  <span>✕ Clear Test Order</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STATE 3: NO CURRENT ORDER (Professional empty state with online readiness) */}
        {!incomingOrder && !activeOrder && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col items-center text-center relative overflow-hidden animate-fade-in">
            <div className="relative w-16 h-16 mb-3 flex items-center justify-center">
              {isOnline ? (
                <>
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping" />
                  <div className="relative z-10 w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-200 text-emerald-600">
                    <Package className="w-7 h-7" />
                  </div>
                </>
              ) : (
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 text-slate-400">
                  <Package className="w-7 h-7" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 mb-1">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <h3 className="font-bold text-base text-slate-900">
                {isOnline ? 'Stationed & Ready for Orders' : 'No Current Order'}
              </h3>
            </div>

            <p className="text-xs text-slate-500 max-w-[280px] leading-relaxed mb-4">
              {isOnline
                ? `You're online in ${rider.selectedZone || 'Robertsonpet'}. New delivery assignments and orders will appear here automatically.`
                : 'You are currently offline. Book your slot or go online to start receiving delivery orders.'}
            </p>

            <div className="flex flex-col gap-2 w-full max-w-[280px]">
              <button
                onClick={triggerMockOrder}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-lift"
              >
                <Sparkles className="w-4 h-4" />
                <span>Simulate Incoming Order (PREPARING)</span>
              </button>

              {!isOnline && (
                <Link
                  href="/slots"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Book or Check Slots
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── Zone Status Banner (Geofence & Location Warning) ── */}
        <ZoneStatusBanner />

        {/* ── Non-acceptance warning card ── */}
        {nonAcceptanceCount >= 1 && (
          <div className={`rounded-2xl px-4 py-3 flex items-center gap-2.5 border ${
            nonAcceptanceCount >= 3
              ? 'bg-red-50 border-red-300'
              : 'bg-amber-50 border-amber-300'
          }`}>
            <AlertCircle className={`w-4 h-4 shrink-0 ${nonAcceptanceCount >= 3 ? 'text-red-500' : 'text-amber-600'}`} />
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-800">
                {nonAcceptanceCount >= 3 ? '🔴 Acceptance Threshold Reached' : '⚠️ Order Acceptance Warning'}
              </p>
              <p className="text-[11px] text-slate-500">
                {nonAcceptanceCount} non-accepted order{nonAcceptanceCount !== 1 ? 's' : ''} this slot.
              </p>
            </div>
            <Link href="/alerts" className="text-[11px] font-bold text-primary shrink-0">View →</Link>
          </div>
        )}

        {/* ── Today's Overview 3-card grid (AT THE BOTTOM) ────────────────────── */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[14px] font-bold text-slate-900">Today&apos;s Overview</h2>
            <Link href="/earnings" className="text-[11px] font-bold text-green-700 flex items-center gap-0.5">
              View Details <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Earnings */}
            <Link href="/earnings" className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex flex-col justify-between gap-2 active:scale-98 transition-transform">
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 text-green-700" />
                </div>
                <EarningsTrend />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-medium truncate">Today&apos;s Earnings</p>
                <p className="text-[17px] font-black text-slate-900 font-mono leading-tight">₹{earnings.today.toLocaleString()}</p>
              </div>
            </Link>

            {/* Deliveries */}
            <Link href="/orders" className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex flex-col justify-between gap-2 active:scale-98 transition-transform">
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <DeliveriesChart />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-medium truncate">Deliveries</p>
                <p className="text-[17px] font-black text-slate-900 font-mono leading-tight">{earnings.todayDeliveries}</p>
              </div>
            </Link>

            {/* Online Time */}
            <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <OnlineTimeLine />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-medium truncate">Online Time</p>
                <p className="text-[17px] font-black text-slate-900 font-mono leading-tight">{onlineTimeStr}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Zone Selection & Locked Modal ──────────────────── */}
        <ZoneSelectionModal
          isOpen={isZoneModalOpen}
          onClose={() => setIsZoneModalOpen(false)}
        />

      </div>
    </AppShell>
  );
}
