'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useRider } from '@/context/RiderContext';
import {
  MapPin,
  CheckCircle2,
  Power,
  Store,
  Clock,
  Package,
  Navigation,
  KeyRound,
  X,
  Sparkles,
  ShoppingBag,
  Wallet,
} from 'lucide-react';

interface DemoStepConfig {
  targetId: string;
  stepNumber: number;
  totalSteps: number;
  category: string;
  title: string;
  description: string;
  avatarImg: string;
  icon: React.ElementType;
  buttonText: string;
  buttonIcon: React.ElementType;
}

export const RiderDemoController: React.FC = () => {
  const {
    isDemoMode,
    demoStep,
    setDemoStep,
    completeInteractiveDemo,
    rider,
    setOnlineStatus,
    triggerMockOrder,
    simulateShopkeeperHandover,
    markOrderPickedUp,
    advanceActiveOrderStatus,
    acceptIncomingOrder,
    completeDeliveryWithOtp,
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

  // Determine current step configuration aligned to the real rider order flow
  const getStepConfig = (): DemoStepConfig | null => {
    const earningsAmount = incomingOrder?.earnings || activeOrder?.earnings || demoCreditedAmount || 49;

    switch (demoStep) {
      case 'zone_check':
        return {
          targetId: 'tour-zone-pill',
          stepNumber: 1,
          totalSteps: 8,
          category: 'Zone Verification',
          title: 'Operating Zone 📍',
          description: `Stay inside your allotted zone (${rider.selectedZone || 'Robertsonpet'}) to receive dispatches.`,
          avatarImg: '/images/momo/characters/momo_zone.png',
          icon: MapPin,
          buttonText: "I'm Inside Zone 📍 → Next",
          buttonIcon: CheckCircle2,
        };

      case 'go_online':
        return {
          targetId: 'tour-online-toggle',
          stepNumber: 2,
          totalSteps: 8,
          category: 'Go Online',
          title: 'Switch Online ⚡',
          description: 'Flip this switch in the header to go online and receive customer orders.',
          avatarImg: '/images/momo/characters/momo_online.png',
          icon: Power,
          buttonText: 'Turn Online & Get Order 🚀',
          buttonIcon: Power,
        };

      case 'accept_order':
        return {
          targetId: 'accept-order-btn',
          stepNumber: 3,
          totalSteps: 8,
          category: 'Incoming Offer',
          title: 'New Delivery Offer 🛍️',
          description: `Check payout (₹${earningsAmount}), store, and distance. Tap Accept to lock it in!`,
          avatarImg: '/images/momo/characters/momo_orders.png',
          icon: ShoppingBag,
          buttonText: `Accept Order (₹${earningsAmount}) ✅`,
          buttonIcon: CheckCircle2,
        };

      case 'navigate_store':
        return {
          targetId: 'navigate-to-store-btn',
          stepNumber: 4,
          totalSteps: 8,
          category: 'Store Navigation',
          title: 'Navigate to Store 🗺️',
          description: `Tap 'Navigate to Store' for GPS directions to ${activeOrder?.restaurantName || 'the store'}.`,
          avatarImg: '/images/momo/characters/momo_nav.png',
          icon: Navigation,
          buttonText: "I've Arrived at Store 🏬",
          buttonIcon: Store,
        };

      case 'wait_packaging':
        return {
          targetId: 'store-handover-section',
          stepNumber: 5,
          totalSteps: 8,
          category: 'Store Handover',
          title: 'Merchant Packaging 📦',
          description: 'Wait at counter while merchant packs and swipes Handover on their app.',
          avatarImg: '/images/momo/characters/momo_ready.png',
          icon: Clock,
          buttonText: 'Merchant Swiped Handover ✅',
          buttonIcon: CheckCircle2,
        };

      case 'handover_ready':
        return {
          targetId: 'store-handover-section',
          stepNumber: 6,
          totalSteps: 8,
          category: 'Confirm Pickup',
          title: 'Slide to Confirm Pickup 🚴',
          description: 'Handover verified! Slide the green bar to collect package and start delivery.',
          avatarImg: '/images/momo/characters/momo_ready.png',
          icon: Package,
          buttonText: 'Confirm Pickup & Start Transit 🚴',
          buttonIcon: Package,
        };

      case 'navigate_customer':
        return {
          targetId: 'customer-slide-section',
          stepNumber: 7,
          totalSteps: 8,
          category: 'Customer Delivery',
          title: 'Deliver to Customer 📍',
          description: 'Ride to customer doorstep. Slide below when arrived to enter delivery PIN.',
          avatarImg: '/images/momo/characters/momo_nav.png',
          icon: Navigation,
          buttonText: 'Arrived at Customer Doorstep 📍',
          buttonIcon: Navigation,
        };

      case 'confirm_delivery':
        return {
          targetId: 'delivery-pin-section',
          stepNumber: 8,
          totalSteps: 8,
          category: 'PIN Verification',
          title: 'Enter Delivery PIN 🔑',
          description: 'Ask customer for 4-digit PIN. For demo, enter 1234 to complete delivery!',
          avatarImg: '/images/momo/characters/momo_ready.png',
          icon: KeyRound,
          buttonText: 'Auto-fill PIN 1234 & Complete ✅',
          buttonIcon: CheckCircle2,
        };

      case 'earnings_reflection':
        return {
          targetId: 'tour-today-earnings',
          stepNumber: 8,
          totalSteps: 8,
          category: 'Earnings Credited',
          title: `₹${earningsAmount} Payout Credited! 💰`,
          description: 'Payout reflected in wallet! Finishing demo auto-clears test balance for real riding.',
          avatarImg: '/images/momo/characters/momo_earnings.png',
          icon: Wallet,
          buttonText: 'Finish Demo & Start Real Riding ✨',
          buttonIcon: Sparkles,
        };

      default:
        return null;
    }
  };

  const stepConfig = getStepConfig();

  // Measure target element rect dynamically
  const updateRect = useCallback(() => {
    if (!isDemoMode || !stepConfig) return;

    let targetElement = document.getElementById(stepConfig.targetId);

    // Fallbacks if specific ID isn't found yet
    if (!targetElement && stepConfig.targetId === 'accept-order-btn') {
      targetElement = document.getElementById('tour-incoming-order');
    }
    if (!targetElement && stepConfig.targetId === 'tour-zone-pill') {
      targetElement = document.getElementById('tour-zas-area');
    }

    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [isDemoMode, stepConfig]);

  useEffect(() => {
    if (!isDemoMode || !stepConfig) return;

    const measure = () => {
      let targetElement = document.getElementById(stepConfig.targetId);
      if (!targetElement && stepConfig.targetId === 'accept-order-btn') {
        targetElement = document.getElementById('tour-incoming-order');
      }
      if (!targetElement && stepConfig.targetId === 'tour-zone-pill') {
        targetElement = document.getElementById('tour-zas-area');
      }

      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
        if (!isVisible && stepConfig.targetId !== 'tour-online-toggle' && stepConfig.targetId !== 'tour-zone-pill') {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        setTargetRect(targetElement.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    measure();
    const timer = setTimeout(measure, 150);
    const timer2 = setTimeout(measure, 400);

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

  // Perform step advancement and update real order flow state synchronously
  const handleStepAction = () => {
    switch (demoStep) {
      case 'zone_check':
        setDemoStep('go_online');
        break;

      case 'go_online':
        setOnlineStatus(true);
        setDemoStep('accept_order');
        triggerMockOrder();
        break;

      case 'accept_order':
        acceptIncomingOrder();
        setDemoStep('navigate_store');
        break;

      case 'navigate_store':
        setDemoStep('wait_packaging');
        break;

      case 'wait_packaging':
        simulateShopkeeperHandover(true);
        setDemoStep('handover_ready');
        break;

      case 'handover_ready':
        markOrderPickedUp();
        setDemoStep('navigate_customer');
        break;

      case 'navigate_customer':
        advanceActiveOrderStatus();
        router.push('/confirm-delivery');
        setDemoStep('confirm_delivery');
        break;

      case 'confirm_delivery': {
        const pinInputs = document.querySelectorAll<HTMLInputElement>('#delivery-pin-section input');
        if (pinInputs && pinInputs.length === 4) {
          const digits = ['1', '2', '3', '4'];
          pinInputs.forEach((inp, idx) => {
            inp.value = digits[idx];
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true }));
          });
          setTimeout(() => {
            const verifyBtn = document.getElementById('confirm-delivery-verify-btn') as HTMLButtonElement | null;
            if (verifyBtn) {
              verifyBtn.click();
            } else {
              completeDeliveryWithOtp('1234');
            }
          }, 250);
        } else {
          completeDeliveryWithOtp('1234');
        }
        break;
      }

      case 'earnings_reflection':
        handleSkipOrExit();
        break;

      default:
        break;
    }
  };

  // Geometry calculations: smart anchor to top or bottom to guarantee zero overflow on mobile
  const pad = 6;
  const rect = targetRect;

  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    left: '16px',
    right: '16px',
    maxWidth: '350px',
    margin: '0 auto',
  };

  if (rect) {
    const targetCenterY = rect.top + rect.height / 2;
    const isTargetInTopHalf = targetCenterY < window.innerHeight * 0.48;

    if (isTargetInTopHalf) {
      // Element is in upper half: anchor card cleanly at bottom
      tooltipStyle = {
        position: 'fixed',
        left: '16px',
        right: '16px',
        maxWidth: '350px',
        margin: '0 auto',
        bottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
      };
    } else {
      // Element is in lower half: anchor card cleanly at top
      tooltipStyle = {
        position: 'fixed',
        left: '16px',
        right: '16px',
        maxWidth: '350px',
        margin: '0 auto',
        top: 'max(16px, env(safe-area-inset-top, 16px))',
      };
    }
  } else {
    tooltipStyle = {
      position: 'fixed',
      top: '50%',
      left: '16px',
      right: '16px',
      maxWidth: '350px',
      margin: '0 auto',
      transform: 'translateY(-50%)',
    };
  }

  const ButtonIcon = stepConfig.buttonIcon;

  return createPortal(
    <div className="fixed inset-0 z-[99990] overflow-hidden select-none animate-fade-in">
      {/* ── 1. SVG Cutout Mask for Dark Scrim ── */}
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
                rx={16}
                ry={16}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.72)"
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
            border: '2px solid #10b981',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.65), inset 0 0 10px rgba(16, 185, 129, 0.2)',
          }}
        >
          <span className="absolute -inset-1 rounded-2xl border-2 border-emerald-400/60 animate-ping opacity-50 pointer-events-none" />
        </div>
      )}

      {/* ── 3. Compact Floating Momo Tooltip Card ── */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
        className="z-[99995] bg-white rounded-2xl p-3.5 sm:p-4 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.4)] border border-emerald-500/25 ring-1 ring-emerald-500/10 flex flex-col gap-2.5 animate-scale-up"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Step {stepConfig.stepNumber} of {stepConfig.totalSteps} • {stepConfig.category}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSkipOrExit}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-600 px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Skip</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Momo Mascot Avatar & Concise Content Row */}
        <div className="flex items-center gap-3 py-0.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-100 via-teal-50 to-emerald-50 border border-emerald-200/90 flex items-center justify-center shrink-0 shadow-2xs p-1">
            <img
              src={stepConfig.avatarImg}
              alt="Momo Assistant"
              className="w-full h-full object-contain filter drop-shadow-2xs select-none"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight truncate">
              {stepConfig.title}
            </h3>
            <p className="text-[11px] text-slate-600 leading-tight font-medium mt-0.5 line-clamp-2">
              {stepConfig.description}
            </p>
          </div>
        </div>

        {/* Dynamic Action Button */}
        <button
          type="button"
          onClick={handleStepAction}
          className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
        >
          <ButtonIcon className="w-4 h-4 stroke-[2.5]" />
          <span>{stepConfig.buttonText}</span>
        </button>
      </div>
    </div>,
    document.body
  );
};
