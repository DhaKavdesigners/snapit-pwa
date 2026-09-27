'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useRider } from '@/context/RiderContext';
import {
  MapPin,
  CheckCircle2,
  ArrowRight,
  Power,
  Store,
  Clock,
  Package,
  Navigation,
  KeyRound,
  X,
  Sparkles,
  Wallet,
  ShoppingBag,
} from 'lucide-react';

interface DemoStepConfig {
  targetId: string;
  stepNumber: number;
  totalSteps: number;
  category: string;
  title: string;
  description: string;
  heroImg: string;
  placement: 'top' | 'bottom';
  icon: React.ElementType;
  iconBg: string;
}

export const RiderDemoController: React.FC = () => {
  const {
    isDemoMode,
    demoStep,
    setDemoStep,
    advanceDemoStep,
    completeInteractiveDemo,
    rider,
    isOnline,
    toggleOnline,
    triggerMockOrder,
    simulateShopkeeperHandover,
    markOrderPickedUp,
    advanceActiveOrderStatus,
    acceptIncomingOrder,
    activeOrder,
    incomingOrder,
    demoCreditedAmount,
  } = useRider();

  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine current step configuration
  const getStepConfig = (): DemoStepConfig | null => {
    switch (demoStep) {
      case 'zone_check':
        return {
          targetId: 'tour-zas-area',
          stepNumber: 1,
          totalSteps: 8,
          category: 'Zone Verification',
          title: 'Verify Your Operating Zone 📍',
          description: `Always ensure you are inside your allotted zone (${rider.selectedZone || 'Robertsonpet, KGF'}) before going online so orders are dispatched to you.`,
          heroImg: '/images/momo/templates/momo_zas_store.png',
          placement: 'bottom',
          icon: MapPin,
          iconBg: 'bg-emerald-600 text-white',
        };
      case 'go_online':
        return {
          targetId: 'tour-online-toggle',
          stepNumber: 2,
          totalSteps: 8,
          category: 'Start Riding Shift',
          title: 'Switch Online to Receive Orders',
          description: 'Flip this switch in the header to go Online and start receiving incoming delivery offers in your zone.',
          heroImg: '/images/momo/tour/step_1_online.png',
          placement: 'bottom',
          icon: Power,
          iconBg: 'bg-emerald-600 text-white',
        };
      case 'accept_order':
        return {
          targetId: 'tour-incoming-order',
          stepNumber: 3,
          totalSteps: 8,
          category: 'Incoming Delivery Offer',
          title: 'Check Payout & Store Details',
          description: `Before accepting, review the Delivery Payout (₹${incomingOrder?.earnings || 49}), trip distance, and Store Name (${incomingOrder?.restaurantName || 'Biryani Paradise'}). Tap Accept to lock it in!`,
          heroImg: '/images/momo/tour/step_3_orders.png',
          placement: 'top',
          icon: ShoppingBag,
          iconBg: 'bg-emerald-600 text-white',
        };
      case 'navigate_store':
        return {
          targetId: 'navigate-to-store-btn',
          stepNumber: 4,
          totalSteps: 8,
          category: 'Store Navigation',
          title: 'Navigate to Store via Google Maps',
          description: `Tap 'Navigate to Store' to open Google Maps for turn-by-turn directions to ${activeOrder?.restaurantName || 'the restaurant'}. When you reach the store counter, tap below to confirm arrival!`,
          heroImg: '/images/momo/cards/step_4.png',
          placement: 'top',
          icon: Navigation,
          iconBg: 'bg-blue-600 text-white',
        };
      case 'wait_packaging':
        return {
          targetId: 'store-handover-section',
          stepNumber: 5,
          totalSteps: 8,
          category: 'Store Packaging & Handover',
          title: 'Wait for Merchant Handover Swipe',
          description: 'Wait by the counter while the store finishes packing. The merchant must swipe "Handover" on their Minnit Merchant app before pickup unlocks.',
          heroImg: '/images/momo/cards/step_5.png',
          placement: 'top',
          icon: Clock,
          iconBg: 'bg-amber-500 text-white',
        };
      case 'handover_ready':
        return {
          targetId: 'store-handover-section',
          stepNumber: 6,
          totalSteps: 8,
          category: 'Confirm Pickup',
          title: 'Slide to Confirm Pickup',
          description: 'Handover is verified! Slide the green bar below to collect the order package and begin transit to the customer doorstep.',
          heroImg: '/images/momo/cards/step_6.png',
          placement: 'top',
          icon: Package,
          iconBg: 'bg-emerald-600 text-white',
        };
      case 'navigate_customer':
        return {
          targetId: 'customer-slide-section',
          stepNumber: 7,
          totalSteps: 8,
          category: 'Customer Delivery',
          title: 'Customer Doorstep Delivery',
          description: `Head to customer address (${activeOrder?.deliveryAddress || 'Customer Doorstep'}). When you reach their location, slide 'Arrived at Location' to proceed to PIN verification.`,
          heroImg: '/images/momo/cards/step_7.png',
          placement: 'top',
          icon: Navigation,
          iconBg: 'bg-purple-600 text-white',
        };
      case 'confirm_delivery':
        return {
          targetId: 'delivery-pin-section',
          stepNumber: 8,
          totalSteps: 8,
          category: 'PIN Verification',
          title: 'Customer Delivery PIN (Demo: 1234)',
          description: 'Ask customer for 4-digit PIN. For this demo order, enter 1234 or show Minnit UPI QR code for digital payment!',
          heroImg: '/images/momo/cards/step_8.png',
          placement: 'top',
          icon: KeyRound,
          iconBg: 'bg-emerald-600 text-white',
        };
      case 'earnings_reflection':
        return {
          targetId: 'tour-today-earnings',
          stepNumber: 8,
          totalSteps: 8,
          category: 'Earnings Reflected & Auto-Vanish',
          title: '₹49 Earning Credited! 💰',
          description: `Your ₹${demoCreditedAmount || 49} payout is reflected in today's earnings & Minnit Wallet. When you tap Finish below, this demo earning vanishes automatically so your real account stays clean at ₹0!`,
          heroImg: '/images/momo/tour/step_5_earnings.png',
          placement: 'bottom',
          icon: Wallet,
          iconBg: 'bg-emerald-600 text-white',
        };
      default:
        return null;
    }
  };

  const stepConfig = getStepConfig();

  // Measure target element rect dynamically
  const updateRect = useCallback(() => {
    if (!isDemoMode || !stepConfig) return;
    const targetElement = document.getElementById(stepConfig.targetId);
    if (targetElement) {
      setTargetRect(targetElement.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [isDemoMode, stepConfig]);

  useEffect(() => {
    if (!isDemoMode || !stepConfig) return;

    const measure = () => {
      const targetElement = document.getElementById(stepConfig.targetId);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
        if (!isVisible && stepConfig.targetId !== 'tour-online-toggle') {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        setTargetRect(targetElement.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    measure();
    const timer = setTimeout(measure, 250);
    const timer2 = setTimeout(measure, 600);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [isDemoMode, demoStep, stepConfig?.targetId]);

  useEffect(() => {
    if (!isDemoMode) return;
    window.addEventListener('resize', updateRect, { passive: true });
    window.addEventListener('scroll', updateRect, { passive: true });
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [isDemoMode, updateRect]);

  if (!isDemoMode || !stepConfig || !mounted || demoStep === 'idle' || demoStep === 'completed') {
    return null;
  }

  const handleSkipOrExit = () => {
    completeInteractiveDemo();
    router.push('/');
  };

  // Geometry calculations with guaranteed mobile centering
  const pad = 6;
  const rect = targetRect;

  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    left: '16px',
    right: '16px',
    maxWidth: '360px',
    margin: '0 auto',
  };

  let arrowStyle: React.CSSProperties = {};
  let isPlacedTop = stepConfig.placement === 'top';

  if (rect) {
    const tooltipWidth = Math.min(360, window.innerWidth - 32);
    const cardLeft = (window.innerWidth - tooltipWidth) / 2;
    const targetCenterX = rect.left + rect.width / 2;

    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedCardHeight = 310;

    if (stepConfig.placement === 'top') {
      isPlacedTop = true;
    } else if (stepConfig.placement === 'bottom') {
      if (spaceBelow < estimatedCardHeight + 20 && spaceAbove > spaceBelow) {
        isPlacedTop = true;
      } else {
        isPlacedTop = false;
      }
    }

    if (isPlacedTop) {
      const rawBottom = window.innerHeight - rect.top + pad + 12;
      const bottomDistance = Math.min(
        window.innerHeight - estimatedCardHeight - 16,
        Math.max(16, rawBottom)
      );

      tooltipStyle = {
        position: 'fixed',
        left: '16px',
        right: '16px',
        maxWidth: '360px',
        margin: '0 auto',
        bottom: `${bottomDistance}px`,
      };

      const arrowLeft = Math.max(24, Math.min(tooltipWidth - 24, targetCenterX - cardLeft));
      arrowStyle = {
        left: `${arrowLeft}px`,
        bottom: '-8px',
        transform: 'translateX(-50%) rotate(45deg)',
      };
    } else {
      const rawTop = rect.bottom + pad + 12;
      const topDistance = Math.min(
        window.innerHeight - estimatedCardHeight - 16,
        Math.max(16, rawTop)
      );

      tooltipStyle = {
        position: 'fixed',
        left: '16px',
        right: '16px',
        maxWidth: '360px',
        margin: '0 auto',
        top: `${topDistance}px`,
      };

      const arrowLeft = Math.max(24, Math.min(tooltipWidth - 24, targetCenterX - cardLeft));
      arrowStyle = {
        left: `${arrowLeft}px`,
        top: '-8px',
        transform: 'translateX(-50%) rotate(45deg)',
      };
    }
  } else {
    tooltipStyle = {
      position: 'fixed',
      top: '50%',
      left: '16px',
      right: '16px',
      maxWidth: '360px',
      margin: '0 auto',
      transform: 'translateY(-50%)',
    };
  }

  const StepIcon = stepConfig.icon;

  return createPortal(
    <div className="fixed inset-0 z-[99990] overflow-hidden select-none animate-fade-in">
      {/* ── 1. SVG Cutout Mask for Dark Backdrop ── */}
      <svg className="fixed inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="demo-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={Math.max(0, rect.left - pad)}
                y={Math.max(0, rect.top - pad)}
                width={rect.width + pad * 2}
                height={rect.height + pad * 2}
                rx={18}
                ry={18}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.78)"
          mask="url(#demo-spotlight-mask)"
        />
      </svg>

      {/* ── 2. Glowing Animated Spotlight Target Ring ── */}
      {rect && (
        <div
          className="fixed pointer-events-none rounded-2xl transition-all duration-300 ease-out z-[99991]"
          style={{
            top: `${Math.max(0, rect.top - pad)}px`,
            left: `${Math.max(0, rect.left - pad)}px`,
            width: `${rect.width + pad * 2}px`,
            height: `${rect.height + pad * 2}px`,
            border: '2.5px solid #10b981',
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.65), inset 0 0 15px rgba(16, 185, 129, 0.25)',
          }}
        >
          <span className="absolute -inset-1 rounded-2xl border-2 border-emerald-400/60 animate-ping opacity-60 pointer-events-none" />
        </div>
      )}

      {/* ── 3. Interactive Floating Momo Tooltip Card ── */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
        className="z-[99995] bg-white rounded-3xl p-4 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] border border-slate-100 flex flex-col space-y-2.5 animate-scale-up"
      >
        {/* Dynamic Arrow pointer */}
        {rect && (
          <div
            style={arrowStyle}
            className="absolute w-4 h-4 bg-white border-l border-t border-slate-100 shadow-2xs pointer-events-none"
          />
        )}

        {/* Top Header */}
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">
              {stepConfig.stepNumber}
            </span>
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              Step {stepConfig.stepNumber} of {stepConfig.totalSteps} • {stepConfig.category}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSkipOrExit}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-700 px-2 py-0.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Skip Demo</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Visual Hero */}
        <div className="relative w-full h-[120px] flex items-center justify-center bg-gradient-to-b from-slate-50/80 to-slate-100/50 rounded-2xl overflow-hidden p-1 border border-slate-100/80">
          <img
            src={stepConfig.heroImg}
            alt={stepConfig.title}
            className="w-full h-full object-contain filter drop-shadow-sm select-none"
          />
        </div>

        {/* Sharp, Concise Title & Description */}
        <div className="px-0.5 space-y-1">
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${stepConfig.iconBg}`}
            >
              <StepIcon className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <h3 className="text-sm font-black text-slate-900 leading-tight">
              {stepConfig.title}
            </h3>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed font-medium pl-8">
            {stepConfig.description}
          </p>
        </div>

        {/* Dynamic Action Buttons per Step */}
        <div className="pt-1.5 border-t border-slate-100">
          {/* STEP 1: ZONE CHECK */}
          {demoStep === 'zone_check' && (
            <button
              type="button"
              onClick={() => setDemoStep('go_online')}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>I&apos;m Inside Zone 📍 → Next</span>
            </button>
          )}

          {/* STEP 2: GO ONLINE */}
          {demoStep === 'go_online' && (
            <button
              type="button"
              onClick={() => {
                if (!isOnline) toggleOnline();
                setDemoStep('accept_order');
                setTimeout(() => {
                  triggerMockOrder();
                }, 500);
              }}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <Power className="w-4 h-4 stroke-[2.5]" />
              <span>Turn Online &amp; Get Order 🚀</span>
            </button>
          )}

          {/* STEP 3: ACCEPT ORDER */}
          {demoStep === 'accept_order' && (
            <button
              type="button"
              onClick={() => {
                acceptIncomingOrder();
                setDemoStep('navigate_store');
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Accept Order (₹{incomingOrder?.earnings || 49}) ✅</span>
            </button>
          )}

          {/* STEP 4: NAVIGATE TO STORE */}
          {demoStep === 'navigate_store' && (
            <button
              type="button"
              onClick={() => setDemoStep('wait_packaging')}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <Store className="w-4 h-4" />
              <span>I&apos;ve Arrived at Store 🏬</span>
            </button>
          )}

          {/* STEP 5: WAIT FOR PACKAGING & STORE HANDOVER */}
          {demoStep === 'wait_packaging' && (
            <button
              type="button"
              onClick={() => {
                simulateShopkeeperHandover(true);
                setDemoStep('handover_ready');
              }}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Merchant Swiped Handover ✅</span>
            </button>
          )}

          {/* STEP 6: CONFIRM PICKUP SLIDER */}
          {demoStep === 'handover_ready' && (
            <button
              type="button"
              onClick={() => {
                markOrderPickedUp();
                setDemoStep('navigate_customer');
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <Package className="w-4 h-4" />
              <span>Confirm Pickup &amp; Start Transit 🚴</span>
            </button>
          )}

          {/* STEP 7: NAVIGATE TO CUSTOMER */}
          {demoStep === 'navigate_customer' && (
            <button
              type="button"
              onClick={() => {
                advanceActiveOrderStatus();
                router.push('/confirm-delivery');
              }}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <Navigation className="w-4 h-4" />
              <span>Arrived at Customer Doorstep 📍</span>
            </button>
          )}

          {/* STEP 8: CONFIRM DELIVERY (PIN ENTRY) */}
          {demoStep === 'confirm_delivery' && (
            <div className="space-y-1.5 text-center">
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 block">
                Enter PIN <strong>1234</strong> in the input boxes below!
              </span>
            </div>
          )}

          {/* STEP 9: EARNINGS REFLECTION & AUTO-VANISH */}
          {demoStep === 'earnings_reflection' && (
            <button
              type="button"
              onClick={handleSkipOrExit}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <Sparkles className="w-4 h-4" />
              <span>Finish Demo &amp; Vanish Demo Earnings ✨</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
