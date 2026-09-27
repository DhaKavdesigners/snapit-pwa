'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { useRider } from '@/context/RiderContext';
import {
  Home,
  ShoppingBag,
  Calendar,
  Wallet,
  Bell,
  ArrowRight,
  ArrowLeft,
  X,
  Lock,
  Sparkles,
} from 'lucide-react';

// ─── Step 0 is the Momo intro splash (no spotlight needed) ───────────────────
const MOMO_INTRO_STEP_ID = 'momo-intro-splash';

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
  route: string;
  isIntroSlide?: boolean; // If true, renders centered splash card (no spotlight / no overlay)
}

// Tour steps for unapproved / exploring riders only.
// Approved riders go directly to startInteractiveDemo() and never see this tour.
const TOUR_STEPS: TourStep[] = [
  {
    targetId: MOMO_INTRO_STEP_ID,
    stepNumber: 0,
    category: 'Welcome',
    title: "Hi! I'm Momo 👋",
    description:
      "I'm your Minnit riding assistant! Let me quickly walk you through the app so you know your way around before your first delivery!",
    icon: Sparkles,
    iconColor: 'bg-emerald-500 text-white',
    placement: 'bottom',
    heroImg: '/images/momo/characters/momo_welcome.png',
    route: '/',
    isIntroSlide: true,
  },
  {
    targetId: 'tour-nav-home',
    stepNumber: 1,
    category: 'Home Cockpit',
    title: 'Home Dashboard',
    description: 'Your central hub for live status, operating zone, and shift controls.',
    icon: Home,
    iconColor: 'bg-emerald-600 text-white',
    placement: 'top',
    heroImg: '/images/momo/tour/step_2_zas.png',
    route: '/',
  },
  {
    targetId: 'tour-nav-orders',
    stepNumber: 2,
    category: 'Trip Navigation',
    title: 'Orders & Routes',
    description: 'Live navigation for active trips and complete delivery history.',
    icon: ShoppingBag,
    iconColor: 'bg-amber-500 text-white',
    placement: 'top',
    heroImg: '/images/momo/tour/step_3_orders.png',
    route: '/orders',
  },
  {
    targetId: 'tour-nav-availability',
    stepNumber: 3,
    category: 'Schedule Planning',
    title: 'Slot Booking',
    description: 'Reserve riding shifts in advance for peak-rush priority dispatch.',
    icon: Calendar,
    iconColor: 'bg-purple-600 text-white',
    placement: 'top',
    heroImg: '/images/momo/tour/step_4_availability.png',
    route: '/availability',
  },
  {
    targetId: 'tour-nav-earnings',
    stepNumber: 4,
    category: 'Payouts',
    title: 'Daily Earnings',
    description: 'Track real-time trip payouts, bonuses, and instant UPI bank withdrawals.',
    icon: Wallet,
    iconColor: 'bg-emerald-600 text-white',
    placement: 'top',
    heroImg: '/images/momo/tour/step_5_earnings.png',
    route: '/earnings',
  },
  {
    targetId: 'tour-nav-alerts',
    stepNumber: 5,
    category: 'Updates',
    title: 'Surge & OPS Alerts',
    description: 'Surge bonuses, rain pay alerts, and dispatch updates in real-time.',
    icon: Bell,
    iconColor: 'bg-rose-500 text-white',
    placement: 'top',
    heroImg: '/images/momo/tour/step_6_alerts.png',
    route: '/alerts',
  },
  {
    targetId: 'tour-online-toggle',
    stepNumber: 6,
    category: 'Shift Access',
    title: 'Online Switch Locked 🔒',
    description:
      "Your switch is locked while Minnit Admin reviews your KYC. It'll activate automatically once you're approved — I'll notify you!",
    icon: Lock,
    iconColor: 'bg-amber-500 text-white',
    placement: 'bottom',
    heroImg: '/images/momo/tour/step_1_online.png',
    route: '/',
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
  const router = useRouter();
  const pathname = usePathname();
  const { rider } = useRider();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // When tour opens, always reset to intro slide (step 0) on home page
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      if (pathname !== '/') {
        router.push('/');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const currentStep = TOUR_STEPS[currentStepIndex] ?? TOUR_STEPS[0];
  const isIntroSlide = currentStep.isIntroSlide === true;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  // Navigate tour to a specific step index and push route if needed
  const navigateToStep = useCallback(
    (index: number) => {
      if (index < 0 || index >= TOUR_STEPS.length) return;
      const targetStep = TOUR_STEPS[index];
      setCurrentStepIndex(index);
      if (targetStep?.route && pathname !== targetStep.route) {
        router.push(targetStep.route);
      }
    },
    [pathname, router],
  );

  // Sync tour step when user manually taps a bottom-nav tab while tour is open
  // (only sync for non-intro, non-online-toggle steps)
  useEffect(() => {
    if (!isOpen) return;
    // The last step (online toggle) is on '/', don't jump back to step 0 or step 1
    if (currentStepIndex === TOUR_STEPS.length - 1 && pathname === '/') return;
    // Intro slide is also on '/', don't re-trigger it
    if (currentStepIndex === 0 && pathname === '/') return;

    const matchingIdx = TOUR_STEPS.findIndex(
      (s, idx) => idx > 0 && idx < TOUR_STEPS.length - 1 && s.route === pathname,
    );
    if (matchingIdx !== -1 && matchingIdx !== currentStepIndex) {
      setCurrentStepIndex(matchingIdx);
    }
  }, [isOpen, pathname, currentStepIndex]);

  // Measure target element rect with automatic retries after navigation
  const updateRect = useCallback(() => {
    if (!isOpen || !currentStep || isIntroSlide) {
      setTargetRect(null);
      return;
    }
    const el = document.getElementById(currentStep.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect(rect);
        return;
      }
    }
    setTargetRect(null);
  }, [isOpen, currentStep, isIntroSlide]);

  useEffect(() => {
    if (!isOpen || !currentStep) return;
    if (isIntroSlide) {
      setTargetRect(null);
      return;
    }
    updateRect();
    const t1 = setTimeout(updateRect, 60);
    const t2 = setTimeout(updateRect, 200);
    const t3 = setTimeout(updateRect, 450);
    const t4 = setTimeout(updateRect, 750);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isOpen, currentStepIndex, currentStep?.targetId, pathname, updateRect, isIntroSlide]);

  useEffect(() => {
    if (!isOpen || isIntroSlide) return;
    window.addEventListener('resize', updateRect, { passive: true });
    window.addEventListener('scroll', updateRect, { passive: true });
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [isOpen, updateRect, isIntroSlide]);

  const handleNext = () => {
    if (!isLastStep) {
      navigateToStep(currentStepIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      navigateToStep(currentStepIndex - 1);
    }
  };

  const handleFinish = () => {
    if (pathname !== '/') router.push('/');
    onComplete();
  };

  const handleClose = () => {
    if (pathname !== '/') router.push('/');
    onClose();
  };

  if (!isOpen || !mounted || !currentStep) return null;

  const StepIcon = currentStep.icon;

  // ── INTRO SLIDE — Full-Screen Centered Momo Welcome Card ─────────────────────
  if (isIntroSlide) {
    return createPortal(
      <div className="fixed inset-0 z-[99990] flex items-end justify-center pb-10 select-none animate-fade-in">
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

        {/* Glowing aura */}
        <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-emerald-500/30 via-teal-400/20 to-amber-400/15 blur-3xl pointer-events-none animate-pulse" />

        {/* Momo full-body image above card */}
        <img
          src="/images/momo/characters/momo_welcome.png"
          alt="Momo"
          className="absolute bottom-[340px] left-1/2 -translate-x-1/2 w-52 object-contain drop-shadow-2xl select-none pointer-events-none z-[99993]"
        />

        {/* Welcome card */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative z-[99995] bg-white w-full max-w-sm mx-4 rounded-[32px] overflow-hidden shadow-[0_25px_60px_-12px_rgba(0,0,0,0.55)] border border-emerald-200/60 ring-4 ring-emerald-500/10 animate-scale-up"
        >
          {/* Top accent ribbon */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 py-2.5 px-4 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:10px_10px]" />
            <span className="text-white font-black text-xs uppercase tracking-[0.15em] relative z-10">
              🏍️ Minnit Rider Tour
            </span>
          </div>

          <div className="px-5 pt-4 pb-5 space-y-3">
            {/* Speech bubble */}
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl px-4 py-3 text-center">
              <p className="text-sm font-black text-emerald-900 leading-snug">
                Hi! I'm Momo — your Minnit riding assistant! 👋
              </p>
              <p className="text-[11px] text-emerald-700 mt-1 font-medium leading-relaxed">
                {currentStep.description}
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 py-1">
              {TOUR_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    currentStepIndex === idx ? 'w-5 bg-emerald-600' : 'w-1.5 bg-slate-200'
                  }`}
                />
              ))}
            </div>

            {/* CTA buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleNext}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 border border-emerald-400/40 ring-2 ring-emerald-500/15 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Show me around!</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2 text-slate-400 hover:text-slate-600 font-bold text-xs transition-colors cursor-pointer"
              >
                Skip tour
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  // ── REGULAR SPOTLIGHT STEPS ──────────────────────────────────────────────────
  const pad = 6;
  const rect = targetRect;

  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    left: '16px',
    right: '16px',
    maxWidth: '350px',
    margin: '0 auto',
  };
  let arrowStyle: React.CSSProperties = {};
  let isPlacedTop = currentStep.placement === 'top';

  if (rect) {
    const tooltipWidth = Math.min(350, window.innerWidth - 32);
    const cardLeft = (window.innerWidth - tooltipWidth) / 2;
    const targetCenterX = rect.left + rect.width / 2;
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedCardHeight = 285;

    if (currentStep.placement === 'top') {
      isPlacedTop = true;
    } else if (currentStep.placement === 'bottom') {
      isPlacedTop = spaceBelow < estimatedCardHeight + 20 && spaceAbove > spaceBelow;
    }

    if (isPlacedTop) {
      const rawBottom = window.innerHeight - rect.top + pad + 12;
      const bottomDistance = Math.min(
        window.innerHeight - estimatedCardHeight - 16,
        Math.max(16, rawBottom),
      );
      tooltipStyle = {
        position: 'fixed',
        left: '16px',
        right: '16px',
        maxWidth: '350px',
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
        Math.max(16, rawTop),
      );
      tooltipStyle = {
        position: 'fixed',
        left: '16px',
        right: '16px',
        maxWidth: '350px',
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
      maxWidth: '350px',
      margin: '0 auto',
      transform: 'translateY(-50%)',
    };
  }

  // Visible step label counts only the spotlight steps (excludes intro slide)
  const spotlightSteps = TOUR_STEPS.filter((s) => !s.isIntroSlide);
  const spotlightIdx = currentStepIndex - 1; // intro slide is step 0 so spotlight step index = currentStepIndex - 1

  return createPortal(
    <div className="fixed inset-0 z-[99990] overflow-hidden select-none animate-fade-in">
      {/* ── 1. SVG Cutout Mask ── */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-auto cursor-pointer"
        onClick={handleNext}
      >
        <defs>
          <mask id="tour-spotlight-mask">
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
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* ── 2. Glowing Spotlight Ring ── */}
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
          title="Click to proceed to next step"
        >
          <span className="absolute -inset-1 rounded-2xl border-2 border-emerald-400/60 animate-ping opacity-60 pointer-events-none" />
        </div>
      )}

      {/* ── 3. Floating Momo Tooltip Card ── */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
        className="z-[99995] bg-white rounded-3xl p-3.5 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] border border-slate-100 flex flex-col space-y-2 animate-scale-up"
      >
        {/* Arrow pointer */}
        {rect && (
          <div
            style={arrowStyle}
            className="absolute w-4 h-4 bg-white border-l border-t border-slate-100 shadow-2xs pointer-events-none"
          />
        )}

        {/* Top Header — show spotlight step count (excludes intro) */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">
              {spotlightIdx + 1}
            </span>
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              Step {spotlightIdx + 1} of {spotlightSteps.length} • {currentStep.category}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-700 px-2 py-0.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Skip</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hero image */}
        <div className="relative w-full h-[125px] flex items-center justify-center bg-gradient-to-b from-slate-50/80 to-slate-100/50 rounded-2xl overflow-hidden p-1 border border-slate-100/80">
          <img
            src={currentStep.heroImg}
            alt={currentStep.title}
            className="w-full h-full object-contain filter drop-shadow-sm select-none"
          />
        </div>

        {/* Title & description */}
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

        {/* Footer */}
        <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-slate-100">
          {/* Progress dots (all steps including intro) */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => navigateToStep(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  currentStepIndex === idx ? 'w-5 bg-emerald-600' : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                }`}
                title={`Jump to step ${idx}`}
              />
            ))}
          </div>

          {/* Back / Next */}
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
              {isLastStep ? (
                <span>Got It 👍</span>
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
    document.body,
  );
};
