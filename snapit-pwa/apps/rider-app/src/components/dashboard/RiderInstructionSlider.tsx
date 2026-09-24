'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen,
  Bike,
  PackageCheck,
  Clock,
  Coffee,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

interface RiderInstructionSlide {
  id: string;
  stepNum: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  iconBg: string;
  points: string[];
}

const INSTRUCTION_SLIDES: RiderInstructionSlide[] = [
  {
    id: 'sessions',
    stepNum: 'Step 1',
    title: 'Flexible Riding Sessions',
    subtitle: 'Choose your working hours on your own terms.',
    badge: 'FREEDOM TO RIDE',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-200',
    icon: <Bike className="w-6 h-6 stroke-[2.5]" />,
    iconBg: 'bg-blue-600 text-white shadow-blue-500/25',
    points: [
      'Select 1, 2, 3, or 4 hours of duty whenever you want.',
      'Extend by +1 hour anytime with a single tap.',
      'Zero rigid lockouts — ride whenever you are free.',
    ],
  },
  {
    id: 'orders',
    stepNum: 'Step 2',
    title: 'Order Acceptance & Delivery',
    subtitle: 'Fast dispatch with sound alerts & OTP delivery.',
    badge: 'LIVE DELIVERY',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    icon: <PackageCheck className="w-6 h-6 stroke-[2.5]" />,
    iconBg: 'bg-emerald-600 text-white shadow-emerald-500/25',
    points: [
      'Buzzer sounds when a restaurant finishes cooking.',
      'Check payout & distance, then tap Accept.',
      'Pick up order and confirm delivery with customer PIN.',
    ],
  },
  {
    id: 'priority',
    stepNum: 'Step 3',
    title: 'Priority Dispatch Windows',
    subtitle: 'Get first preference on nearby orders.',
    badge: '500M BOOST',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
    icon: <Clock className="w-6 h-6 stroke-[2.5]" />,
    iconBg: 'bg-amber-500 text-white shadow-amber-500/25',
    points: [
      'Set Morning, Afternoon, Evening, or Night windows.',
      'Gives you priority boost over other riders within 500m.',
      'Nearest rider to store always gets priority #1.',
    ],
  },
  {
    id: 'breaks',
    stepNum: 'Step 4',
    title: 'On-Demand Rest Breaks',
    subtitle: 'Rest, refuel, or take emergency downtime.',
    badge: 'RECHARGE ANYTIME',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-200',
    icon: <Coffee className="w-6 h-6 stroke-[2.5]" />,
    iconBg: 'bg-rose-500 text-white shadow-rose-500/25',
    points: [
      'Take 15m or 30m break during any active session.',
      'See read-only order previews while on break.',
      'No penalties, no lost slots when pausing duty.',
    ],
  },
  {
    id: 'earnings',
    stepNum: 'Step 5',
    title: 'Guaranteed Sunday Payouts',
    subtitle: 'Every rupee earned credited directly.',
    badge: 'WEEKLY PAYOUTS',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    icon: <Wallet className="w-6 h-6 stroke-[2.5]" />,
    iconBg: 'bg-teal-600 text-white shadow-teal-500/25',
    points: [
      'Transparent earnings per delivery + distance pay.',
      'Automatic transfer to your UPI or Bank every Sunday.',
      'Track today, weekly, and monthly totals in Earnings.',
    ],
  },
];

interface RiderInstructionSliderProps {
  onOpenFullGuide?: () => void;
}

export const RiderInstructionSlider: React.FC<RiderInstructionSliderProps> = ({
  onOpenFullGuide,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const total = INSTRUCTION_SLIDES.length;

  const nextSlide = useCallback(() => {
    setCurrentIdx((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    setCurrentIdx((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Auto-slide every 5 seconds unless hovered/touched
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    setIsPaused(false);

    if (diff > 40) {
      prevSlide();
    } else if (diff < -40) {
      nextSlide();
    }
  };

  const current = INSTRUCTION_SLIDES[currentIdx];

  return (
    <div
      className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-4 select-none relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header Row: 📖 Title + Step counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Rider Instructions</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            </h3>
            <p className="text-[11px] text-slate-500">Learn how Minnit rider features work</p>
          </div>
        </div>

        {/* Step / Total Pill */}
        <span className="text-[10px] font-mono font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
          {currentIdx + 1} / {total}
        </span>
      </div>

      {/* Main Slide Card */}
      <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 transition-all duration-300 min-h-[160px] flex flex-col justify-between">
        {/* Slide Header: Icon + Badge + Title */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md ${current.iconBg}`}>
              {current.icon}
            </div>

            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${current.badgeColor}`}>
              {current.badge}
            </span>
          </div>

          <h4 className="text-base font-black text-slate-900 leading-tight">
            {current.title}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">{current.subtitle}</p>
        </div>

        {/* 3 Bullet Points with check icons */}
        <div className="space-y-1.5 mt-3 pt-2.5 border-t border-slate-200/60">
          {current.points.map((pt, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
              <span className="leading-snug">{pt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Slide Navigation: Dots + Arrows + Full Guide Button */}
      <div className="flex items-center justify-between pt-1">
        {/* Carousel Progress Dots */}
        <div className="flex items-center gap-1.5">
          {INSTRUCTION_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentIdx(i)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                i === currentIdx ? 'w-6 bg-emerald-600' : 'w-2 bg-slate-200 hover:bg-slate-300'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={prevSlide}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center border border-slate-200 cursor-pointer active:scale-95 transition-all"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center border border-slate-200 cursor-pointer active:scale-95 transition-all"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* CTA Button to open full visual guide if provided */}
      {onOpenFullGuide && (
        <button
          type="button"
          onClick={onOpenFullGuide}
          className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-2xl border border-emerald-200 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shadow-2xs"
        >
          <BookOpen className="w-4 h-4 text-emerald-700" />
          <span>Read Full Illustrated Rider Guide (7 Slides)</span>
          <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
        </button>
      )}
    </div>
  );
};
