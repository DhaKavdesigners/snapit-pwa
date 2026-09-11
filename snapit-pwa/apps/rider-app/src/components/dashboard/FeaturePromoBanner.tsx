'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Coffee,
  Clock,
  Zap,
  PlusCircle,
  MapPin,
  TrendingUp,
  ChevronRight,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export interface FeaturePromoSlide {
  id: string;
  tag: string;
  tagBg: string;
  tagText: string;
  headline: string;
  description: string;
  pillHighlight: string;
  ctaText: string;
  ctaAction?: 'availability' | 'start_riding' | 'zone' | 'earnings';
  bgGradient: string;
  borderClass: string;
  accentMedallionBg: string;
  icon: React.ReactNode;
}

interface FeaturePromoBannerProps {
  onOpenStartRiding?: () => void;
  onOpenZoneModal?: () => void;
}

const PROMO_SLIDES: FeaturePromoSlide[] = [
  {
    id: 'break_mode',
    tag: 'NEW • ON-DEMAND BREAK',
    tagBg: 'bg-amber-100 text-amber-900 border-amber-300/80',
    tagText: 'text-amber-900',
    headline: 'Your Break. Your Choice.',
    description: 'Need a rest? Enjoy flexible breaks with a live countdown and read-only order preview.',
    pillHighlight: '15m – 30m Break',
    ctaText: 'Learn More',
    ctaAction: 'availability',
    bgGradient: 'from-amber-500/10 via-orange-500/5 to-amber-500/0 bg-gradient-to-br',
    borderClass: 'border-amber-200/90 hover:border-amber-300',
    accentMedallionBg: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-amber-500/25',
    icon: <Coffee className="w-5 h-5 stroke-[2.5]" />,
  },
  {
    id: 'availability',
    tag: 'PRIORITY DISPATCH',
    tagBg: 'bg-emerald-100 text-emerald-900 border-emerald-300/80',
    tagText: 'text-emerald-900',
    headline: 'Ride Your Preferred Hours.',
    description: 'Set Morning, Afternoon, Evening or Night windows for a 500m nearby priority boost.',
    pillHighlight: '500m Boost',
    ctaText: 'Set Preferences',
    ctaAction: 'availability',
    bgGradient: 'from-emerald-500/10 via-teal-500/5 to-emerald-500/0 bg-gradient-to-br',
    borderClass: 'border-emerald-200/90 hover:border-emerald-300',
    accentMedallionBg: 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-emerald-500/25',
    icon: <Clock className="w-5 h-5 stroke-[2.5]" />,
  },
  {
    id: 'flexible_sessions',
    tag: 'FREEDOM TO RIDE',
    tagBg: 'bg-blue-100 text-blue-900 border-blue-300/80',
    tagText: 'text-blue-900',
    headline: 'Choose Your Session.',
    description: 'Ride for 2, 3, or 4 hours on your own schedule with zero rigid shift lockouts.',
    pillHighlight: '2h • 3h • 4h',
    ctaText: 'Start Riding',
    ctaAction: 'start_riding',
    bgGradient: 'from-blue-500/10 via-indigo-500/5 to-blue-500/0 bg-gradient-to-br',
    borderClass: 'border-blue-200/90 hover:border-blue-300',
    accentMedallionBg: 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-blue-500/25',
    icon: <Zap className="w-5 h-5 stroke-[2.5]" />,
  },
  {
    id: 'extend_session',
    tag: 'FLEXIBILITY',
    tagBg: 'bg-purple-100 text-purple-900 border-purple-300/80',
    tagText: 'text-purple-900',
    headline: 'Need More Time?',
    description: 'Earning good momentum? Add +1 hour to your active session anytime with a single tap.',
    pillHighlight: '+1 Hr Extend',
    ctaText: 'Explore Slots',
    ctaAction: 'start_riding',
    bgGradient: 'from-purple-500/10 via-violet-500/5 to-purple-500/0 bg-gradient-to-br',
    borderClass: 'border-purple-200/90 hover:border-purple-300',
    accentMedallionBg: 'bg-gradient-to-br from-purple-600 to-violet-600 text-white shadow-purple-500/25',
    icon: <PlusCircle className="w-5 h-5 stroke-[2.5]" />,
  },
  {
    id: 'zone_selection',
    tag: 'LOCAL DELIVERIES',
    tagBg: 'bg-rose-100 text-rose-900 border-rose-300/80',
    tagText: 'text-rose-900',
    headline: 'Deliver in Your Zone.',
    description: 'Choose Robertsonpet, Andersonpet or local hubs to stay near your favorite stores.',
    pillHighlight: 'KGF Zones',
    ctaText: 'Change Zone',
    ctaAction: 'zone',
    bgGradient: 'from-rose-500/10 via-pink-500/5 to-rose-500/0 bg-gradient-to-br',
    borderClass: 'border-rose-200/90 hover:border-rose-300',
    accentMedallionBg: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/25',
    icon: <MapPin className="w-5 h-5 stroke-[2.5]" />,
  },
  {
    id: 'earnings_wallet',
    tag: 'INSTANT TRACKING',
    tagBg: 'bg-teal-100 text-teal-900 border-teal-300/80',
    tagText: 'text-teal-900',
    headline: 'Track Every Rupee.',
    description: 'Real-time order earnings, daily delivery totals, and transparent wallet transfers.',
    pillHighlight: '100% Direct',
    ctaText: 'View Earnings',
    ctaAction: 'earnings',
    bgGradient: 'from-teal-500/10 via-emerald-500/5 to-teal-500/0 bg-gradient-to-br',
    borderClass: 'border-teal-200/90 hover:border-teal-300',
    accentMedallionBg: 'bg-gradient-to-br from-teal-600 to-emerald-600 text-white shadow-teal-500/25',
    icon: <TrendingUp className="w-5 h-5 stroke-[2.5]" />,
  },
];

const AUTO_SLIDE_INTERVAL = 5500; // 5.5s per slide

export const FeaturePromoBanner: React.FC<FeaturePromoBannerProps> = ({
  onOpenStartRiding,
  onOpenZoneModal,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const touchStartXRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % PROMO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + PROMO_SLIDES.length) % PROMO_SLIDES.length);
  }, []);

  // Automatic slide rotation
  useEffect(() => {
    if (isPaused || prefersReducedMotion) return;

    timerRef.current = setInterval(() => {
      nextSlide();
    }, AUTO_SLIDE_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextSlide, prefersReducedMotion]);

  // Touch swipe handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null) {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartXRef.current - touchEndX;
      if (diff > 45) {
        nextSlide();
      } else if (diff < -45) {
        prevSlide();
      }
      touchStartXRef.current = null;
    }
    // Resume rotation after swipe
    setTimeout(() => setIsPaused(false), 2000);
  };

  const handleActionClick = (e: React.MouseEvent, action?: FeaturePromoSlide['ctaAction']) => {
    if (!action) return;
    if (action === 'start_riding' && onOpenStartRiding) {
      e.preventDefault();
      onOpenStartRiding();
    } else if (action === 'zone' && onOpenZoneModal) {
      e.preventDefault();
      onOpenZoneModal();
    }
  };

  const current = PROMO_SLIDES[activeIndex];

  return (
    <div
      className="relative w-full select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Minnit Rider Features Showcase"
    >
      {/* Outer Card Container */}
      <div
        className={`relative overflow-hidden rounded-[26px] bg-white border shadow-sm transition-all duration-300 p-4 ${current.borderClass} ${current.bgGradient}`}
      >
        {/* Subtle decorative background ambient glow */}
        <div
          className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-2xl opacity-20 pointer-events-none transition-colors duration-700"
          style={{
            background:
              activeIndex === 0
                ? '#f59e0b'
                : activeIndex === 1
                ? '#10b981'
                : activeIndex === 2
                ? '#3b82f6'
                : activeIndex === 3
                ? '#8b5cf6'
                : activeIndex === 4
                ? '#f43f5e'
                : '#14b8a6',
          }}
        />

        {/* Slide Content */}
        <div className="relative z-10 flex items-start justify-between gap-3">
          {/* Left Column: Tag, Headline, Description, and Action CTA */}
          <div className="min-w-0 flex-1 space-y-1.5">
            {/* Top Tag & Pill */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-2xs ${current.tagBg}`}
              >
                <Sparkles className="w-2.5 h-2.5 shrink-0" />
                <span>{current.tag}</span>
              </span>

              <span className="text-[10px] font-extrabold text-slate-500 bg-white/80 border border-slate-200/80 px-2 py-0.5 rounded-full shadow-2xs">
                {current.pillHighlight}
              </span>
            </div>

            {/* Headline */}
            <h4 className="text-base font-black text-slate-900 tracking-tight leading-tight pt-0.5">
              {current.headline}
            </h4>

            {/* Description */}
            <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-2 pr-1">
              {current.description}
            </p>

            {/* Action CTA Button */}
            <div className="pt-1 flex items-center gap-2">
              {current.ctaAction === 'availability' ? (
                <Link
                  href="/availability"
                  className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 hover:text-emerald-800 bg-white border border-emerald-200 hover:border-emerald-300 rounded-xl px-3 py-1.5 shadow-2xs transition-all active:scale-95"
                >
                  <span>{current.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : current.ctaAction === 'earnings' ? (
                <Link
                  href="/earnings"
                  className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 hover:text-emerald-800 bg-white border border-emerald-200 hover:border-emerald-300 rounded-xl px-3 py-1.5 shadow-2xs transition-all active:scale-95"
                >
                  <span>{current.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={(e) => handleActionClick(e, current.ctaAction)}
                  className="inline-flex items-center gap-1 text-xs font-black text-slate-800 hover:text-slate-900 bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl px-3 py-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <span>{current.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Visual Medallion / Illustration Card */}
          <div className="shrink-0 flex flex-col items-center justify-center pt-0.5">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105 active:scale-95 ${current.accentMedallionBg}`}
            >
              {current.icon}
            </div>
          </div>
        </div>

        {/* Bottom Pagination Dots & Progress Indicator */}
        <div className="relative z-10 flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60">
          <div className="flex items-center gap-1.5">
            {PROMO_SLIDES.map((slide, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'w-6 bg-slate-900 shadow-xs'
                      : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to slide ${idx + 1}: ${slide.headline}`}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-400">
            <span>{activeIndex + 1}</span>
            <span>/</span>
            <span>{PROMO_SLIDES.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
