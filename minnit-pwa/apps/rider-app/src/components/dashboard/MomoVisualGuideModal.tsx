'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Compass,
  CheckCircle2,
} from 'lucide-react';

interface MomoVisualGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartInteractiveTour?: () => void;
  initialStep?: number;
}

const GUIDE_CARDS = [
  {
    step: 1,
    title: 'Welcome to Minnit!',
    subtitle: 'Meet Momo, your Rider Assistant',
    img: '/images/momo/cards/step_1.png',
  },
  {
    step: 2,
    title: 'Turn Online to Receive Orders',
    subtitle: 'Shift session controls & flexible duty',
    img: '/images/momo/cards/step_2.png',
  },
  {
    step: 3,
    title: 'Be in Your Allotted Zone',
    subtitle: 'Stay near active store hubs for priority',
    img: '/images/momo/cards/step_3.png',
  },
  {
    step: 4,
    title: 'Home Screen Overview',
    subtitle: 'Duty timer, daily earnings & quick stats',
    img: '/images/momo/cards/step_4.png',
  },
  {
    step: 5,
    title: 'Availability & Shift Windows',
    subtitle: 'Pre-book windows for priority boosts',
    img: '/images/momo/cards/step_5.png',
  },
  {
    step: 6,
    title: 'Orders & Trip History',
    subtitle: 'Active dispatches & completed delivery logs',
    img: '/images/momo/cards/step_6.png',
  },
  {
    step: 7,
    title: 'Earnings & Payouts',
    subtitle: 'Track tips, surge & instant bank cashouts',
    img: '/images/momo/cards/step_7.png',
  },
  {
    step: 8,
    title: 'Alerts & Hotspots',
    subtitle: 'Live demand surges & store announcements',
    img: '/images/momo/cards/step_8.png',
  },
  {
    step: 9,
    title: 'Bottom Navigation',
    subtitle: 'Quick access to all 5 essential tabs',
    img: '/images/momo/cards/step_9.png',
  },
  {
    step: 10,
    title: "You're Ready to Ride!",
    subtitle: 'Go online, ride safe, and earn more',
    img: '/images/momo/cards/step_10.png',
  },
];

export const MomoVisualGuideModal: React.FC<MomoVisualGuideModalProps> = ({
  isOpen,
  onClose,
  onStartInteractiveTour,
  initialStep = 0,
}) => {
  const [currentIdx, setCurrentIdx] = useState(initialStep);
  const touchStartXRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIdx(initialStep);
    }
  }, [isOpen, initialStep]);

  if (!isOpen) return null;

  const current = GUIDE_CARDS[currentIdx];

  const handleNext = () => {
    if (currentIdx < GUIDE_CARDS.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      if (onStartInteractiveTour) {
        onClose();
        onStartInteractiveTour();
      } else {
        onClose();
      }
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null) {
      const diff = touchStartXRef.current - e.changedTouches[0].clientX;
      if (diff > 45) {
        handleNext();
      } else if (diff < -45) {
        handlePrev();
      }
      touchStartXRef.current = null;
    }
  };

  return (
    <div className="fixed inset-0 z-[99990] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in select-none">
      <div
        className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-slate-200/90 flex flex-col max-h-[95vh] relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top Header Row */}
        <div className="px-4 pt-3.5 pb-2.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shadow-xs">
              {current.step}
            </span>
            <div>
              <p className="text-xs font-black text-slate-900 leading-tight">
                {current.title}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                Step {currentIdx + 1} of 10 • Momo Assistant
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Artwork Image Container */}
        <div className="relative flex-1 min-h-[380px] max-h-[500px] bg-slate-100/60 overflow-hidden flex items-center justify-center p-2">
          <img
            key={current.img}
            src={current.img}
            alt={current.title}
            className="w-full h-full max-h-[480px] object-contain rounded-2xl shadow-sm animate-fade-in"
          />

          {/* Left Arrow Floating Button */}
          {currentIdx > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md border border-slate-200/80 text-slate-800 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              aria-label="Previous step"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Right Arrow Floating Button */}
          {currentIdx < GUIDE_CARDS.length - 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md border border-slate-200/80 text-slate-800 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              aria-label="Next step"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Bottom Navigation & CTAs */}
        <div className="p-3.5 bg-white border-t border-slate-100 space-y-2.5 shrink-0">
          {/* Step Progress Dots */}
          <div className="flex items-center justify-center gap-1">
            {GUIDE_CARDS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIdx(i)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  currentIdx === i
                    ? 'w-5 bg-emerald-600'
                    : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                }`}
                aria-label={`Jump to slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Buttons Row */}
          <div className="flex items-center gap-2">
            {onStartInteractiveTour && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartInteractiveTour();
                }}
                className="py-3 px-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-extrabold text-xs rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95"
                title="Start live interactive spotlight tour on your screen"
              >
                <Compass className="w-4 h-4 text-emerald-600 animate-spin-slow" />
                <span>Live Tour</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-2xl shadow-lift transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider active:scale-98"
            >
              {currentIdx === GUIDE_CARDS.length - 1 ? (
                <>
                  <span>Ready — Start Riding! 🚀</span>
                </>
              ) : (
                <>
                  <span>Next Card</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
