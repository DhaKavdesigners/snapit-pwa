'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ZoneSelectionModal } from '@/components/slots/ZoneSelectionModal';
import { ActiveDeliveryCard } from '@/components/dashboard/ActiveDeliveryCard';
import { StartRidingSheet } from '@/components/dashboard/StartRidingSheet';
import { ActiveSessionCard } from '@/components/dashboard/ActiveSessionCard';
import { ExtendSessionModal } from '@/components/dashboard/ExtendSessionModal';
import { EndSessionEarlyModal } from '@/components/dashboard/EndSessionEarlyModal';
import { SessionCompleteCard } from '@/components/dashboard/SessionCompleteCard';
import { BreakOrderPreviewCard } from '@/components/delivery/BreakOrderPreviewCard';
import { FeaturePromoBanner } from '@/components/dashboard/FeaturePromoBanner';
import { RiderInstructionSlider } from '@/components/dashboard/RiderInstructionSlider';
import { RiderInstructionViewer } from '@/components/common/RiderInstructionViewer';
import { ApprovedRiderWelcomeModal } from '@/components/dashboard/ApprovedRiderWelcomeModal';
import { RiderGuidedTour } from '@/components/dashboard/RiderGuidedTour';
import { MomoVisualGuideModal } from '@/components/dashboard/MomoVisualGuideModal';
import { useRider } from '@/context/RiderContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { soundEngine } from '@/services/soundService';
import { formatOrderNumber } from '@/utils/orderUtils';
import {
  TrendingUp,
  BarChart2,
  Clock,
  ChevronRight,
  Store,
  Home,
  Power,
  Check,
  Lock,
} from 'lucide-react';

export default function DashboardPage() {
  const {
    isOnline,
    toggleOnline,
    activeOrder,
    incomingOrder,
    acceptIncomingOrder,
    declineIncomingOrder,
    advanceActiveOrderStatus,
    markOrderPickedUp,
    activeSession,
    isStartRidingOpen,
    openStartRiding,
    closeStartRiding,
    sessionCompletedData,
    rider,
    earnings,
    isHydrated,
    riderBreak,
    breakOrderPreview,
    dismissBreakOrderPreview,
    updateRiderProfile,
  } = useRider();
  const router = useRouter();

  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isEndEarlyModalOpen, setIsEndEarlyModalOpen] = useState(false);
  const [showFirstLoginInstructions, setShowFirstLoginInstructions] = useState(false);
  const [showManualGuideModal, setShowManualGuideModal] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isMomoVisualGuideOpen, setIsMomoVisualGuideOpen] = useState(false);

  // Track previous verified state to detect live admin approval transitions instantly
  const prevIsVerifiedRef = useRef<boolean | null>(null);

  // Check for first login after approval or live transition to show celebration & tour
  useEffect(() => {
    if (!isHydrated || !rider.isAuthenticated) return;

    const isPending = rider.isVerified === false || rider.verificationStatus === 'PENDING';

    if (isPending) {
      prevIsVerifiedRef.current = false;
      return;
    }

    const riderKey = rider.phone || rider.Rider_ID || rider.riderId || 'default_rider';

    // 1. Live transition from unverified to verified while user has the app open!
    if (prevIsVerifiedRef.current === false && rider.isVerified === true) {
      setShowFirstLoginInstructions(true);
    } 
    // 2. Fresh app visit as verified rider: check if welcome celebration was already seen
    else if (prevIsVerifiedRef.current === null && rider.isVerified === true) {
      const isCompleted =
        Boolean(rider.rider_instructions_completed) ||
        (typeof window !== 'undefined' && localStorage.getItem(`minnit_approval_welcome_seen_${riderKey}`) === 'true');

      if (!isCompleted) {
        setShowFirstLoginInstructions(true);
      }
    }

    prevIsVerifiedRef.current = true;
  }, [isHydrated, rider.isAuthenticated, rider.isVerified, rider.verificationStatus, rider.phone, rider.Rider_ID, rider.riderId, rider.rider_instructions_completed]);

  const handleCompleteFirstLoginInstructions = () => {
    setShowFirstLoginInstructions(false);
    setShowManualGuideModal(false);
    const riderKey = rider.phone || rider.Rider_ID || rider.riderId || 'default_rider';
    try {
      localStorage.setItem(`minnit_first_login_instructions_${riderKey}`, 'true');
      localStorage.setItem(`minnit_rider_instructions_completed_${riderKey}`, 'true');
      localStorage.setItem(`minnit_approval_welcome_seen_${riderKey}`, 'true');
    } catch {}

    updateRiderProfile({ rider_instructions_completed: true });

    try {
      const saved = localStorage.getItem('snapit_rider_profile_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.rider_instructions_completed = true;
        localStorage.setItem('snapit_rider_profile_v2', JSON.stringify(parsed));
      }
    } catch {}
  };

  const isBreakActive = Boolean(riderBreak && !riderBreak.endedAt);
  const isPendingVerification = rider.isVerified === false || rider.verificationStatus === 'PENDING';

  // Redirect to onboarding if not registered or not authenticated, or show status screen if verification pending
  useEffect(() => {
    if (!isHydrated) return;
    if (!rider.phone || !rider.isAuthenticated) {
      router.push('/onboarding');
      return;
    }

    // When verification pending rider opens the app on their device, show Registration Submitted status first
    const isExploring = typeof window !== 'undefined' && sessionStorage.getItem('minnit_exploring_ui') === 'true';
    if (isPendingVerification && !isExploring) {
      router.push('/onboarding?step=status');
    }
  }, [isHydrated, rider.phone, rider.isAuthenticated, isPendingVerification, router]);

  // Guarantee buzzer is stopped if leaving or unmounting dashboard
  useEffect(() => {
    return () => {
      soundEngine.stopIncomingOrderBuzzer();
    };
  }, []);

  // Online timer calculation
  const [onlineSeconds, setOnlineSeconds] = useState(0);
  useEffect(() => {
    if (!isOnline) {
      setOnlineSeconds(0);
      return;
    }
    const t = setInterval(() => setOnlineSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isOnline]);

  const onlineHours = Math.floor(onlineSeconds / 3600);
  const onlineMins = Math.floor((onlineSeconds % 3600) / 60);
  const onlineTimeStr =
    onlineSeconds > 0
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

  if (!isHydrated) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
        <img
          src="/images/minnit_cart_nd_name.png"
          alt="Minnit Rider"
          className="h-10 w-auto object-contain mb-3 animate-pulse"
        />
        <div className="w-6 h-6 border-2 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-3.5 pt-2 pb-6 max-w-md mx-auto w-full">

        {/* ── 1. TODAY'S OVERVIEW (3 METRIC TILES) ── */}
        <div className="grid grid-cols-3 gap-2">
          {/* Earnings */}
          <Link
            href="/earnings"
            className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs flex flex-col justify-between active:scale-98 transition-transform"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Earnings</p>
              <p className="text-[18px] font-black text-slate-900 font-mono leading-tight mt-0.5">
                ₹{isPendingVerification ? '0' : earnings.today.toLocaleString()}
              </p>
            </div>
          </Link>

          {/* Orders Delivered */}
          <Link
            href="/orders"
            className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs flex flex-col justify-between active:scale-98 transition-transform"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Delivered</p>
              <p className="text-[18px] font-black text-slate-900 font-mono leading-tight mt-0.5">
                {isPendingVerification ? 0 : earnings.todayDeliveries}
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
                {isPendingVerification ? '0h 00m' : onlineTimeStr}
              </p>
            </div>
          </div>
        </div>


        {/* ── 3. MAIN INTERACTIVE ORDER / SESSION COCKPIT ── */}

        {/* ─── SCENARIO 0: VERIFICATION PENDING (ONLINE STRICTLY LOCKED) ─── */}
        {isPendingVerification ? (
          <>
            <div
              onClick={() => {
                sessionStorage.removeItem('minnit_exploring_ui');
                router.push('/onboarding?step=status');
              }}
              className="bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50 rounded-2xl p-4 border border-amber-300/90 shadow-2xs cursor-pointer hover:border-amber-400 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Lock className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                        Verification Pending
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-white/90 px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                        ONLINE LOCKED
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300/70 flex items-center gap-0.5 group-hover:bg-amber-200 transition-colors shrink-0">
                      Status <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900">Online Access Locked</h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                    Your rider profile is currently under review by Minnit Admin. Tap to view status tracker &amp; progress.
                  </p>
                </div>
              </div>
            </div>

            {/* ── 2. Interactive Rider Instructions Slider (In Main Cockpit Space) ── */}
            <RiderInstructionSlider
              onOpenFullGuide={() => setIsMomoVisualGuideOpen(true)}
            />
          </>
        ) : (
          <>
            {/* ─── SCENARIO A: INCOMING ORDER ALERT ─── */}
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

                {/* Restaurant Hero Title & Trip Specs */}
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

                {/* Connected Route Timeline */}
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

                {/* Action Buttons */}
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

            {/* ─── SCENARIO B: ACTIVE DELIVERY IN PROGRESS (Top Priority on Home) ─── */}
            {activeOrder && (
              <ActiveDeliveryCard
                activeOrder={activeOrder}
                onMarkPickedUp={markOrderPickedUp}
                onAdvanceStatus={advanceActiveOrderStatus}
              />
            )}

            {/* ─── SCENARIO C: SESSION COMPLETED SUMMARY (After session finishes naturally) ─── */}
            {!incomingOrder && !activeOrder && !isOnline && sessionCompletedData && (
              <SessionCompleteCard onStartAnother={openStartRiding} />
            )}

            {/* ─── SCENARIO D: ONLINE & ACTIVE RIDING SESSION ─── */}
            {!incomingOrder && !activeOrder && isOnline && (
              <>
                {/* Break-Mode Live Order Preview (Read-only ~3s preview) */}
                {breakOrderPreview && isBreakActive && (
                  <BreakOrderPreviewCard
                    order={breakOrderPreview}
                    onDismiss={dismissBreakOrderPreview}
                  />
                )}

                <ActiveSessionCard
                  onOpenExtend={() => setIsExtendModalOpen(true)}
                />
              </>
            )}

            {/* ─── SCENARIO E: OFFLINE STATE (START RIDING CTA & FEATURE SHOWCASE) ─── */}
            {!incomingOrder && !activeOrder && !isOnline && !sessionCompletedData && (
              <div id="tour-zas-area" className="space-y-4">
                {/* Premium Moving Feature Advertisement Banner */}
                <FeaturePromoBanner
                  onOpenStartRiding={openStartRiding}
                  onOpenZoneModal={() => setIsZoneModalOpen(true)}
                  onStartTour={() => setIsTourOpen(true)}
                />

                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col items-center text-center space-y-3.5">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 text-slate-400 my-1 shadow-2xs">
                    <Power className="w-7 h-7" />
                  </div>

                  <div>
                    <h3 className="font-black text-lg text-slate-900">
                      You&apos;re Currently Offline
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-[280px] leading-relaxed">
                      Ready to earn in <strong className="text-slate-800">{rider.selectedZone || 'Robertsonpet'}</strong>? Start a flexible riding session to receive delivery orders.
                    </p>
                  </div>

                  <div className="w-full max-w-xs pt-1 flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={openStartRiding}
                      className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/25 border border-emerald-500 ring-2 ring-emerald-400/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                    >
                      <Power className="w-5 h-5 stroke-[2.5]" />
                      <span>START RIDING</span>
                    </button>

                    <Link
                      href="/availability"
                      className="block w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all text-center"
                    >
                      ⭐ Availability Preferences
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── 4. Modals ── */}
        {/* Start Riding Bottom Sheet */}
        <StartRidingSheet
          isOpen={isStartRidingOpen}
          onClose={closeStartRiding}
        />

        {/* Extend Session Modal (+1h) */}
        <ExtendSessionModal
          isOpen={isExtendModalOpen}
          onClose={() => setIsExtendModalOpen(false)}
        />

        {/* End Session Early Modal */}
        <EndSessionEarlyModal
          isOpen={isEndEarlyModalOpen}
          onClose={() => setIsEndEarlyModalOpen(false)}
        />

        {/* Zone Selection Modal */}
        <ZoneSelectionModal
          isOpen={isZoneModalOpen}
          onClose={() => setIsZoneModalOpen(false)}
        />

        {/* Welcoming Pop-up for Approved Riders */}
        <ApprovedRiderWelcomeModal
          rider={rider}
          isOpen={showFirstLoginInstructions || showManualGuideModal}
          onClose={handleCompleteFirstLoginInstructions}
          onStartTour={() => {
            setShowFirstLoginInstructions(false);
            setShowManualGuideModal(false);
            setIsTourOpen(true);
          }}
        />

        {/* Interactive Guided Spotlight Tour */}
        <RiderGuidedTour
          isOpen={isTourOpen}
          onClose={() => {
            setIsTourOpen(false);
            handleCompleteFirstLoginInstructions();
          }}
          onComplete={() => {
            setIsTourOpen(false);
            handleCompleteFirstLoginInstructions();
            openStartRiding();
          }}
        />

        {/* Momo's 10-Step Visual Guide Modal */}
        <MomoVisualGuideModal
          isOpen={isMomoVisualGuideOpen}
          onClose={() => setIsMomoVisualGuideOpen(false)}
          onStartInteractiveTour={() => {
            setIsMomoVisualGuideOpen(false);
            setIsTourOpen(true);
          }}
        />

      </div>
    </AppShell>
  );
}
