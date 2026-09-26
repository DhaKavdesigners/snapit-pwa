'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Power,
  Store,
  ShoppingBag,
  Calendar,
  Wallet,
  Bell,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';

export interface TourStep {
  targetId: string;
  title: string;
  badge: string;
  userAnnotation: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  placement: 'top' | 'bottom';
  highlightActionText?: string;
  momoImg: string;
  momoQuote: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-online-toggle',
    badge: 'Step 1 of 6 • Shift Controls',
    userAnnotation: 'Tap here to switch online',
    title: 'Switch Online & Go On-Duty',
    description:
      'Tap this switch at the top right to go online and choose your session duration (from 1 to 8 hours). You can start riding or go off-duty whenever you choose.',
    icon: Power,
    iconColor: 'bg-emerald-500 text-white',
    placement: 'bottom',
    highlightActionText: 'Top Right Switch',
    momoImg: '/images/momo/characters/momo_online.png',
    momoQuote: 'Tap here to go ONLINE and start receiving orders!',
  },
  {
    targetId: 'tour-zas-area',
    badge: 'Step 2 of 6 • Order Priority',
    userAnnotation: 'Enter inside ZAS to receive orders',
    title: 'Enter Inside ZAS (Zone Around Store)',
    description:
      'Store proximity is priority #1 for dispatches. Station yourself close to active store clusters in your operating zone to receive delivery requests first!',
    icon: Store,
    iconColor: 'bg-blue-600 text-white',
    placement: 'bottom',
    highlightActionText: 'ZAS Dispatch Priority',
    momoImg: '/images/momo/characters/momo_zone.png',
    momoQuote: 'Make sure you are within your selected zone to receive orders first!',
  },
  {
    targetId: 'tour-nav-orders',
    badge: 'Step 3 of 6 • Delivery History',
    userAnnotation: 'Order history & active trips',
    title: 'Order History & Active Deliveries',
    description:
      'Track your ongoing deliveries with turn-by-turn navigation, store pickup addresses, and view your complete past delivery trip records.',
    icon: ShoppingBag,
    iconColor: 'bg-amber-500 text-white',
    placement: 'top',
    highlightActionText: 'Bottom Bar • Orders',
    momoImg: '/images/momo/characters/momo_orders.png',
    momoQuote: 'All your completed and active orders will be shown right here!',
  },
  {
    targetId: 'tour-nav-availability',
    badge: 'Step 4 of 6 • Priority Scheduling',
    userAnnotation: 'Preferred riding windows',
    title: 'Preferred Riding Windows',
    description:
      'Plan ahead! Reserve your preferred riding time slots for today and tomorrow to unlock dispatch priority boosts during peak demand hours.',
    icon: Calendar,
    iconColor: 'bg-purple-600 text-white',
    placement: 'top',
    highlightActionText: 'Bottom Bar • Availability',
    momoImg: '/images/momo/characters/momo_availability.png',
    momoQuote: 'Set your preferred riding windows to get priority dispatch for nearby orders!',
  },
  {
    targetId: 'tour-nav-earnings',
    badge: 'Step 5 of 6 • Instant Payouts',
    userAnnotation: 'Live earnings & UPI cashout',
    title: 'Live Earnings & UPI Cashouts',
    description:
      'Monitor your daily earnings, trip payouts, tips, and surge incentives in real time. Request instant cashouts directly to your registered UPI ID or bank account anytime.',
    icon: Wallet,
    iconColor: 'bg-emerald-600 text-white',
    placement: 'top',
    highlightActionText: 'Bottom Bar • Earnings',
    momoImg: '/images/momo/characters/momo_earnings.png',
    momoQuote: 'Check your daily and weekly earnings here. Payouts go directly to your bank!',
  },
  {
    targetId: 'tour-nav-alerts',
    badge: 'Step 6 of 6 • Demand Updates',
    userAnnotation: 'Surge & operational notices',
    title: 'Demand Alerts & Hotspots',
    description:
      'Get real-time alerts for live demand surges, rain bonuses, active store hotspots, and important operational updates from Minnit OPS.',
    icon: Bell,
    iconColor: 'bg-rose-500 text-white',
    placement: 'top',
    highlightActionText: 'Bottom Bar • Alerts',
    momoImg: '/images/momo/characters/momo_alerts.png',
    momoQuote: 'Important updates like new slots, bonuses and notices will appear here!',
  },
];

interface RiderGuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const RiderGuidedTour: React.FC<RiderGuidedTourProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Measure target element rect
  const updateRect = useCallback(() => {
    if (!isOpen) return;
    const targetElement = document.getElementById(currentStep.targetId);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStep.targetId]);

  // When step changes, scroll target into view and measure
  useEffect(() => {
    if (!isOpen) return;

    const targetElement = document.getElementById(currentStep.targetId);
    if (targetElement) {
      // Smooth scroll if not fully visible
      const rect = targetElement.getBoundingClientRect();
      const isVisible =
        rect.top >= 0 &&
        rect.bottom <= window.innerHeight;

      if (!isVisible && currentStep.targetId !== 'tour-online-toggle') {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      // Initial measure
      setTargetRect(targetElement.getBoundingClientRect());

      // Delayed measure to account for smooth scroll finishing
      const timer = setTimeout(() => {
        setTargetRect(targetElement.getBoundingClientRect());
      }, 200);

      return () => clearTimeout(timer);
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStepIndex, currentStep.targetId]);

  // Listen to window scroll & resize to dynamically keep spotlight aligned
  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener('resize', updateRect, { passive: true });
    window.addEventListener('scroll', updateRect, { passive: true });

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [isOpen, updateRect]);

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    onComplete();
  };

  if (!isOpen || !mounted) return null;

  // Tooltip geometry calculations
  const pad = 6;
  const rect = targetRect;

  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100vw - 32px)',
    maxWidth: '360px',
  };

  let arrowStyle: React.CSSProperties = {};
  let isPlacedTop = currentStep.placement === 'top';

  if (rect) {
    const tooltipWidth = Math.min(360, window.innerWidth - 32);
    // Center tooltip on target horizontally, but keep within viewport [16px, innerWidth - tooltipWidth - 16px]
    const targetCenterX = rect.left + rect.width / 2;
    const computedLeft = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, targetCenterX - tooltipWidth / 2));

    // Determine vertical placement
    if (currentStep.placement === 'top' || (rect.top > window.innerHeight / 2 && rect.bottom > window.innerHeight - 100)) {
      // Place above target
      isPlacedTop = true;
      const bottomDistance = window.innerHeight - rect.top + pad + 14;
      tooltipStyle = {
        position: 'fixed',
        left: `${computedLeft}px`,
        bottom: `${bottomDistance}px`,
        width: `${tooltipWidth}px`,
        maxWidth: '360px',
      };
      // Arrow pointing down towards target
      const arrowLeft = Math.max(20, Math.min(tooltipWidth - 20, targetCenterX - computedLeft));
      arrowStyle = {
        left: `${arrowLeft}px`,
        bottom: '-8px',
        transform: 'translateX(-50%) rotate(45deg)',
      };
    } else {
      // Place below target
      isPlacedTop = false;
      const topDistance = rect.bottom + pad + 14;
      tooltipStyle = {
        position: 'fixed',
        left: `${computedLeft}px`,
        top: `${topDistance}px`,
        width: `${tooltipWidth}px`,
        maxWidth: '360px',
      };
      // Arrow pointing up towards target
      const arrowLeft = Math.max(20, Math.min(tooltipWidth - 20, targetCenterX - computedLeft));
      arrowStyle = {
        left: `${arrowLeft}px`,
        top: '-8px',
        transform: 'translateX(-50%) rotate(45deg)',
      };
    }
  } else {
    // Centered fallback if element not yet measured
    tooltipStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 'calc(100vw - 32px)',
      maxWidth: '360px',
    };
  }

  const StepIcon = currentStep.icon;

  return createPortal(
    <div className="fixed inset-0 z-[99990] overflow-hidden select-none animate-fade-in">
      {/* ── 1. SVG Cutout Mask for Dark Backdrop ── */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-auto cursor-pointer"
        onClick={handleNext}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White base = fully dark backdrop */}
            <rect width="100%" height="100%" fill="white" />
            {/* Black hole = transparent spotlight hole revealing target */}
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
        {/* Semi-transparent backdrop with cutout */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.78)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* ── 2. Glowing Animated Spotlight Target Ring ── */}
      {rect && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="fixed pointer-events-auto cursor-pointer rounded-2xl transition-all duration-300 ease-out z-[99991]"
          style={{
            top: `${Math.max(0, rect.top - pad)}px`,
            left: `${Math.max(0, rect.left - pad)}px`,
            width: `${rect.width + pad * 2}px`,
            height: `${rect.height + pad * 2}px`,
            border: '2.5px solid #10b981',
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.65), inset 0 0 15px rgba(16, 185, 129, 0.25)',
          }}
          title="Click to proceed to next tour step"
        >
          {/* Subtle pulse ring */}
          <span className="absolute -inset-1 rounded-2xl border-2 border-emerald-400/60 animate-ping opacity-60 pointer-events-none" />
        </div>
      )}

      {/* ── 3. Interactive Floating Tour Tooltip Card ── */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
        className="z-[99995] bg-white rounded-3xl p-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-slate-100 flex flex-col space-y-3.5 animate-scale-up"
      >
        {/* Arrow pointer indicator */}
        {rect && (
          <div
            style={arrowStyle}
            className="absolute w-4 h-4 bg-white border-l border-t border-slate-100 shadow-2xs pointer-events-none"
          />
        )}

        {/* Top Header: Step Counter & Close/Skip button */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">
              {currentStepIndex + 1}
            </span>
            <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
              {currentStep.badge}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Skip Tour</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User Hand-Drawn Annotation Badge */}
        <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-black px-3 py-1 rounded-full w-fit">
          <Zap className="w-3.5 h-3.5 text-amber-600" />
          <span>{currentStep.userAnnotation}</span>
        </div>

        {/* Step Title & Icon */}
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${currentStep.iconColor}`}
          >
            <StepIcon className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-900 leading-tight">
              {currentStep.title}
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              {currentStep.highlightActionText}
            </p>
          </div>
        </div>

        {/* Momo Rider Assistant Speech Callout */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50/50 p-2.5 rounded-2xl border border-emerald-200/90 shadow-2xs">
          {/* Momo Character Avatar */}
          <div className="relative w-12 h-14 shrink-0 rounded-xl overflow-hidden bg-white border border-emerald-300/80 shadow-2xs flex items-center justify-center p-0.5">
            <img
              src={currentStep.momoImg}
              alt="Momo Rider Assistant"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Momo Speech */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                Momo&apos;s Tip
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs font-black text-slate-800 leading-snug mt-0.5">
              &ldquo;{currentStep.momoQuote}&rdquo;
            </p>
          </div>
        </div>

        {/* Step Description */}
        <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
          {currentStep.description}
        </p>

        {/* Footer: Step Dots + Prev / Next Actions */}
        <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  currentStepIndex === idx
                    ? 'w-6 bg-emerald-600'
                    : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
                title={`Jump to Step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider active:scale-95"
            >
              {currentStepIndex === TOUR_STEPS.length - 1 ? (
                <>
                  <span>Got it! Go Online 🚀</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
