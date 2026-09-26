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
} from 'lucide-react';

export interface TourStep {
  targetId: string;
  stepNumber: number;
  category: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  placement: 'top' | 'bottom';
  heroImg: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-online-toggle',
    stepNumber: 1,
    category: 'Shift Controls',
    title: 'Switch Online & Go On-Duty',
    description:
      'Tap this switch at the top right to start receiving orders. Choose your session duration or go offline whenever you want.',
    icon: Power,
    iconColor: 'bg-emerald-500 text-white',
    placement: 'bottom',
    heroImg: '/images/momo/tour/step_1_online.png',
  },
  {
    targetId: 'tour-zas-area',
    stepNumber: 2,
    category: 'Order Dispatch Priority',
    title: 'Stay Inside Your ZAS Zone',
    description:
      'Store proximity is priority #1! Station yourself inside active store clusters to receive nearby delivery requests first.',
    icon: Store,
    iconColor: 'bg-blue-600 text-white',
    placement: 'bottom',
    heroImg: '/images/momo/tour/step_2_zas.png',
  },
  {
    targetId: 'tour-nav-orders',
    stepNumber: 3,
    category: 'Active Deliveries',
    title: 'Orders & Trip Navigation',
    description:
      'Track your ongoing deliveries with turn-by-turn navigation, store pickup addresses, and view your complete past trip log.',
    icon: ShoppingBag,
    iconColor: 'bg-amber-500 text-white',
    placement: 'top',
    heroImg: '/images/momo/tour/step_3_orders.png',
  },
  {
    targetId: 'tour-nav-availability',
    stepNumber: 4,
    category: 'Schedule Planning',
    title: 'Reserve Riding Windows',
    description:
      'Plan ahead! Reserve your preferred riding time slots for today and tomorrow to unlock dispatch priority boosts during peak rush.',
    icon: Calendar,
    iconColor: 'bg-purple-600 text-white',
    placement: 'top',
    heroImg: '/images/momo/tour/step_4_availability.png',
  },
  {
    targetId: 'tour-nav-earnings',
    stepNumber: 5,
    category: 'Earnings & Payouts',
    title: 'Live Pay & Instant UPI Cashout',
    description:
      'Monitor your daily earnings, trip payouts, tips, and surge incentives in real time. Request instant cashouts directly to your bank.',
    icon: Wallet,
    iconColor: 'bg-emerald-600 text-white',
    placement: 'top',
    heroImg: '/images/momo/tour/step_5_earnings.png',
  },
  {
    targetId: 'tour-nav-alerts',
    stepNumber: 6,
    category: 'Announcements & OPS',
    title: 'Surge Alerts & Hotspots',
    description:
      'Get real-time alerts for live demand surges, rain bonuses, active store hotspots, and important notices from Minnit OPS.',
    icon: Bell,
    iconColor: 'bg-rose-500 text-white',
    placement: 'top',
    heroImg: '/images/momo/tour/step_6_alerts.png',
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

  // Tooltip geometry calculations with viewport boundary safety
  const pad = 6;
  const rect = targetRect;

  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100vw - 32px)',
    maxWidth: '350px',
  };

  let arrowStyle: React.CSSProperties = {};
  let isPlacedTop = currentStep.placement === 'top';

  if (rect) {
    const tooltipWidth = Math.min(350, window.innerWidth - 32);
    // Center horizontally on target, clamped safely within viewport padding
    const targetCenterX = rect.left + rect.width / 2;
    const computedLeft = Math.max(
      16,
      Math.min(window.innerWidth - tooltipWidth - 16, targetCenterX - tooltipWidth / 2)
    );

    // Dynamic vertical placement: check available space above and below
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedCardHeight = 295;

    if (currentStep.placement === 'top') {
      isPlacedTop = true;
    } else if (currentStep.placement === 'bottom') {
      // If space below is too tight, flip safely above target
      if (spaceBelow < estimatedCardHeight + 20 && spaceAbove > spaceBelow) {
        isPlacedTop = true;
      } else {
        isPlacedTop = false;
      }
    }

    if (isPlacedTop) {
      // Place above target
      const rawBottom = window.innerHeight - rect.top + pad + 12;
      // Clamp to ensure tooltip doesn't go off top of screen
      const bottomDistance = Math.min(
        window.innerHeight - estimatedCardHeight - 16,
        Math.max(16, rawBottom)
      );

      tooltipStyle = {
        position: 'fixed',
        left: `${computedLeft}px`,
        bottom: `${bottomDistance}px`,
        width: `${tooltipWidth}px`,
        maxWidth: '350px',
      };

      const arrowLeft = Math.max(20, Math.min(tooltipWidth - 20, targetCenterX - computedLeft));
      arrowStyle = {
        left: `${arrowLeft}px`,
        bottom: '-8px',
        transform: 'translateX(-50%) rotate(45deg)',
      };
    } else {
      // Place below target
      const rawTop = rect.bottom + pad + 12;
      // Clamp to ensure tooltip doesn't go off bottom of screen
      const topDistance = Math.min(
        window.innerHeight - estimatedCardHeight - 16,
        Math.max(16, rawTop)
      );

      tooltipStyle = {
        position: 'fixed',
        left: `${computedLeft}px`,
        top: `${topDistance}px`,
        width: `${tooltipWidth}px`,
        maxWidth: '350px',
      };

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
      maxWidth: '350px',
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
            {/* Black hole = transparent spotlight cutout revealing target */}
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
        className="z-[99995] bg-white rounded-3xl p-3.5 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] border border-slate-100 flex flex-col space-y-2.5 animate-scale-up"
      >
        {/* Arrow pointer indicator */}
        {rect && (
          <div
            style={arrowStyle}
            className="absolute w-4 h-4 bg-white border-l border-t border-slate-100 shadow-2xs pointer-events-none"
          />
        )}

        {/* Top Header: Step Counter & Skip button */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">
              {currentStepIndex + 1}
            </span>
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              Step {currentStepIndex + 1} of {TOUR_STEPS.length} • {currentStep.category}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-700 px-2 py-0.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Skip</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hero Visual: Cropped Momo with Speech Bubble */}
        <div className="relative w-full h-[135px] flex items-center justify-center bg-gradient-to-b from-slate-50/80 to-slate-100/50 rounded-2xl overflow-hidden p-1 border border-slate-100/80">
          <img
            src={currentStep.heroImg}
            alt={currentStep.title}
            className="w-full h-full object-contain filter drop-shadow-sm select-none"
          />
        </div>

        {/* Single Clean Title & Instruction (No redundant nested boxes) */}
        <div className="px-1 space-y-1">
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${currentStep.iconColor}`}
            >
              <StepIcon className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <h3 className="text-sm font-black text-slate-900 leading-tight">
              {currentStep.title}
            </h3>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed font-medium pl-8">
            {currentStep.description}
          </p>
        </div>

        {/* Footer: Progress Dots + Back / Next Action Buttons */}
        <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-slate-100">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  currentStepIndex === idx
                    ? 'w-5 bg-emerald-600'
                    : 'w-1.5 bg-slate-200 hover:bg-slate-300'
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
                className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="py-1.5 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider active:scale-95"
            >
              {currentStepIndex === TOUR_STEPS.length - 1 ? (
                <span>Got it! 🚀</span>
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRight className="w-3 h-3" />
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
