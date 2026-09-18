'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Check, RefreshCw, AlertCircle } from 'lucide-react';

export const RIDER_INSTRUCTIONS = [
  '/Instruction image/1.png',
  '/Instruction image/2.png',
  '/Instruction image/3.png',
  '/Instruction image/4.png',
  '/Instruction image/5.png',
  '/Instruction image/6.png',
  '/Instruction image/7.png',
];

interface RiderInstructionViewerProps {
  onDone: () => void;
  onClose?: () => void;
  title?: string;
  isModal?: boolean;
}

export const RiderInstructionViewer: React.FC<RiderInstructionViewerProps> = ({
  onDone,
  onClose,
  title = 'Rider Instructions',
  isModal = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const totalImages = RIDER_INSTRUCTIONS.length;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalImages - 1;

  // Touch swipe handling
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Preload all 7 instruction images immediately for instant slide transitions
  useEffect(() => {
    RIDER_INSTRUCTIONS.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (isLast) {
      onDone();
    } else {
      setCurrentIndex((prev) => Math.min(prev + 1, totalImages - 1));
    }
  }, [isLast, onDone, totalImages]);

  const handleBack = useCallback(() => {
    if (!isFirst) {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }
  }, [isFirst]);

  // Keyboard navigation for desktop testing / accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handleBack();
      } else if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handleBack, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handleBack();
      }
    }
  };

  const content = (
    <div className="flex-1 w-full h-full flex flex-col justify-between min-h-0 relative select-none bg-white">
      {/* ── 1. MAIN INSTRUCTION IMAGE AREA (HERO / "MOST PART") ── */}
      <div
        className="flex-1 min-h-0 w-full px-1.5 pt-1 pb-1 flex items-center justify-center relative touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleNext}
      >
        {imageLoading && !imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10 bg-white/80">
            <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
            <span className="text-slate-400 text-xs font-medium">Loading instruction...</span>
          </div>
        )}

        {imageError ? (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 max-w-xs z-10">
            <AlertCircle className="w-10 h-10 text-amber-500" />
            <p className="text-sm font-bold text-slate-800">Failed to load instruction</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setImageLoading(true);
                setImageError(false);
              }}
              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          <img
            key={RIDER_INSTRUCTIONS[currentIndex]}
            src={RIDER_INSTRUCTIONS[currentIndex]}
            alt={`Minnit Rider Instruction ${currentIndex + 1} of ${totalImages}`}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
            className={`max-h-full max-w-full w-auto h-auto object-contain select-none cursor-pointer rounded-2xl transition-opacity duration-150 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            draggable={false}
          />
        )}
      </div>

      {/* ── 2. PINNED BOTTOM CONTROLS: PROGRESS DOTS + NEXT/DONE BUTTON ── */}
      <div className="shrink-0 w-full px-4 pt-2.5 pb-3 flex flex-col gap-2.5 z-20 bg-white border-t border-slate-100 shadow-[0_-4px_16px_rgba(0,0,0,0.03)]">
        {/* Progress Dots + Number Indicator */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            {RIDER_INSTRUCTIONS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'w-6 bg-emerald-600'
                    : idx < currentIndex
                    ? 'w-2 bg-emerald-400'
                    : 'w-1.5 bg-slate-200'
                }`}
              />
            ))}
          </div>

          <div className="text-xs font-bold font-mono text-slate-500">
            <span className="text-emerald-700 font-extrabold">{currentIndex + 1}</span>
            <span className="text-slate-300 mx-1">/</span>
            <span>{totalImages}</span>
          </div>
        </div>

        {/* Action Buttons: Back & Next/Done */}
        <div className="w-full flex items-center gap-2.5">
          {!isFirst && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleBack();
              }}
              className="h-13 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl border border-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Back</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="flex-1 h-13 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/25 border border-emerald-500 ring-2 ring-emerald-400/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <span>{isLast ? 'Done' : 'Next'}</span>
            {isLast ? (
              <Check className="w-4 h-4 stroke-[3]" />
            ) : (
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[9999] h-[100dvh] w-full bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-hidden">
        <div className="w-full h-full max-w-md bg-white flex flex-col justify-between overflow-hidden sm:rounded-3xl shadow-2xl relative">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
