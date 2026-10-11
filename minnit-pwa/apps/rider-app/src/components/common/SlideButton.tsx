'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronsRight, Check, Loader2 } from 'lucide-react';

interface SlideButtonProps {
  label: string;
  onConfirm: () => void | Promise<void | boolean>;
  variant?: 'emerald' | 'blue' | 'purple';
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const SlideButton: React.FC<SlideButtonProps> = ({
  label,
  onConfirm,
  variant = 'emerald',
  disabled = false,
  className = '',
  icon,
  rightIcon,
}) => {
  const [dragProgress, setDragProgress] = useState(0); // 0 to 1
  const [isDragging, setIsDragging] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const knobRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const currentDragRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const isCompletedRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const activePointerIdRef = useRef<number | null>(null);
  const hasReachedThresholdRef = useRef<boolean>(false);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state whenever label, variant, or disabled props change (ensures next status slider is clean & ready to slide)
  useEffect(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    isCompletedRef.current = false;
    setIsCompleted(false);
    isProcessingRef.current = false;
    setIsProcessing(false);
    isDraggingRef.current = false;
    setIsDragging(false);
    currentDragRef.current = 0;
    hasReachedThresholdRef.current = false;
    setDragProgress(0);
  }, [label, variant, disabled]);

  // Clean up any pending reset timer on unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    };
  }, []);

  const theme = {
    emerald: {
      trackBorder: 'border-emerald-100/90',
      trackShadow: 'shadow-[0_4px_16px_rgba(16,185,129,0.12)]',
      trackGradient: 'bg-gradient-to-r from-[#dcfce7]/70 via-[#ecfdf5]/85 to-[#f0fdf4]',
      trailGradient: 'bg-gradient-to-r from-emerald-300/50 via-emerald-200/40 to-emerald-100/20',
      textColor: 'text-[#064e3b]',
      haloBg: 'bg-emerald-400/25',
      haloBorder: 'border-emerald-300/80',
      haloShadow: 'shadow-[0_0_16px_2px_rgba(52,211,153,0.55),0_0_28px_rgba(52,211,153,0.3)]',
      buttonGradient: 'bg-gradient-to-b from-[#059669] via-[#047857] to-[#065f46]',
    },
    blue: {
      trackBorder: 'border-blue-100/90',
      trackShadow: 'shadow-[0_4px_16px_rgba(59,130,246,0.12)]',
      trackGradient: 'bg-gradient-to-r from-[#dbeafe]/70 via-[#eff6ff]/85 to-[#f8faff]',
      trailGradient: 'bg-gradient-to-r from-blue-300/50 via-blue-200/40 to-blue-100/20',
      textColor: 'text-[#1e3a8a]',
      haloBg: 'bg-blue-400/25',
      haloBorder: 'border-blue-300/80',
      haloShadow: 'shadow-[0_0_16px_2px_rgba(59,130,246,0.55),0_0_28px_rgba(59,130,246,0.3)]',
      buttonGradient: 'bg-gradient-to-b from-[#2563eb] via-[#1d4ed8] to-[#1e40af]',
    },
    purple: {
      trackBorder: 'border-purple-100/90',
      trackShadow: 'shadow-[0_4px_16px_rgba(168,85,247,0.12)]',
      trackGradient: 'bg-gradient-to-r from-[#f3e8ff]/70 via-[#faf5ff]/85 to-[#fdfbfe]',
      trailGradient: 'bg-gradient-to-r from-purple-300/50 via-purple-200/40 to-purple-100/20',
      textColor: 'text-[#581c87]',
      haloBg: 'bg-purple-400/25',
      haloBorder: 'border-purple-300/80',
      haloShadow: 'shadow-[0_0_16px_2px_rgba(168,85,247,0.55),0_0_28px_rgba(168,85,247,0.3)]',
      buttonGradient: 'bg-gradient-to-b from-[#9333ea] via-[#7e22ce] to-[#6b21a8]',
    },
  }[variant];

  const handleWidth = 54;

  const triggerCompletion = useCallback(async () => {
    if (isCompletedRef.current || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);
    setDragProgress(1);

    // Haptic vibration feedback for mobile riders
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate([30, 40, 60]);
      } catch {
        // Ignore vibration errors
      }
    }

    try {
      const result = await onConfirm();
      if (result === false) {
        throw new Error('Action failed');
      }
      isCompletedRef.current = true;
      setIsCompleted(true);
      setIsProcessing(false);
      isProcessingRef.current = false;

      // Keep visual completion feedback briefly (500ms), then auto-reset so component never stays stuck
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => {
        isCompletedRef.current = false;
        setIsCompleted(false);
        currentDragRef.current = 0;
        hasReachedThresholdRef.current = false;
        setDragProgress(0);
        resetTimerRef.current = null;
      }, 500);
    } catch (err) {
      console.warn('Slide action execution failed:', err);
      // On failure: do NOT falsely mark as completed; allow rider to retry immediately
      isCompletedRef.current = false;
      setIsCompleted(false);
      setIsProcessing(false);
      isProcessingRef.current = false;
      hasReachedThresholdRef.current = false;
      currentDragRef.current = 0;
      setDragProgress(0);
    }
  }, [onConfirm]);

  const handleDrag = useCallback((clientX: number) => {
    if (!isDraggingRef.current || !trackRef.current || isCompletedRef.current || isProcessingRef.current) return;

    const trackRect = trackRef.current.getBoundingClientRect();
    const maxDistance = trackRect.width - handleWidth - 8; // 8px total padding

    if (maxDistance <= 0) return;

    const deltaX = clientX - startXRef.current;
    const clampedDelta = Math.max(0, Math.min(deltaX, maxDistance));
    const progress = clampedDelta / maxDistance;

    currentDragRef.current = progress;
    setDragProgress(progress);

    if (progress >= 0.80) {
      hasReachedThresholdRef.current = true;
    }

    // Auto-confirm smoothly when dragged all the way past 88%
    if (progress >= 0.88) {
      isDraggingRef.current = false;
      setIsDragging(false);
      if (activePointerIdRef.current !== null && knobRef.current) {
        try {
          knobRef.current.releasePointerCapture(activePointerIdRef.current);
        } catch {}
        activePointerIdRef.current = null;
      }
      triggerCompletion();
    }
  }, [handleWidth, triggerCompletion]);

  // Unified Pointer Handlers (Works seamlessly across Android/iOS touch and Desktop mouse)
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || isCompleted || isProcessing) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    activePointerIdRef.current = e.pointerId;
    startXRef.current = e.clientX;
    isDraggingRef.current = true;
    setIsDragging(true);
    currentDragRef.current = 0;
    hasReachedThresholdRef.current = false;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || activePointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    handleDrag(e.clientX);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || activePointerIdRef.current !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    activePointerIdRef.current = null;
    isDraggingRef.current = false;
    setIsDragging(false);

    // Intentional completion check:
    // When the slider reaches the valid completion threshold (>= 0.75) and user releases, trigger exactly once
    if (currentDragRef.current >= 0.75 || hasReachedThresholdRef.current) {
      triggerCompletion();
    } else {
      // Partial or accidental swipe: spring back smoothly without triggering action
      setDragProgress(0);
      currentDragRef.current = 0;
      hasReachedThresholdRef.current = false;
    }
  };

  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current === e.pointerId) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      activePointerIdRef.current = null;
      isDraggingRef.current = false;
      setIsDragging(false);

      if (currentDragRef.current >= 0.75 || hasReachedThresholdRef.current) {
        triggerCompletion();
      } else {
        setDragProgress(0);
        currentDragRef.current = 0;
        hasReachedThresholdRef.current = false;
      }
    }
  };

  const trackWidth = trackRef.current ? trackRef.current.clientWidth : 280;
  const maxTravel = Math.max(0, trackWidth - handleWidth - 8);
  const currentTranslateX = dragProgress * maxTravel;

  if (disabled) {
    return (
      <div
        className={`w-full h-[62px] rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center font-bold text-xs cursor-not-allowed select-none ${className}`}
      >
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div
      ref={trackRef}
      style={{ touchAction: 'none', userSelect: 'none' }}
      className={`relative w-full h-[62px] rounded-full p-1 select-none border-[3px] ${theme.trackBorder} ${theme.trackShadow} ${theme.trackGradient} flex items-center ${className}`}
    >
      {/* Overflow-clipped Track Fill & Dynamic Chevron Trail */}
      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        {/* Leading Chevron Wedge Trail Behind Handle */}
        <div
          className={`absolute left-0 top-0 bottom-0 ${theme.trailGradient}`}
          style={{
            width: isCompleted
              ? '100%'
              : `calc(${currentTranslateX}px + ${handleWidth}px + 28px)`,
            clipPath: isCompleted
              ? 'none'
              : 'polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%)',
            transition: isDragging
              ? 'none'
              : 'width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        />
      </div>

      {/* Center Label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-14">
        <span
          className={`text-[12.5px] font-black uppercase tracking-wider ${theme.textColor} transition-opacity duration-150 text-center select-none`}
          style={{ opacity: Math.max(0, 1 - dragProgress * 2.2) }}
        >
          {isProcessing ? 'Processing...' : label}
        </span>
      </div>

      {/* Right Icon if provided */}
      {rightIcon && (
        <div className={`absolute right-4.5 flex items-center pointer-events-none ${theme.textColor} select-none`}>
          {rightIcon}
        </div>
      )}

      {/* Draggable Circular Knob with Outer Glowing Halo and Pointer Capture */}
      <div
        ref={knobRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        style={{
          touchAction: 'none',
          userSelect: 'none',
          transform: `translateX(${currentTranslateX}px)`,
          transition: isDragging
            ? 'none'
            : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        className={`relative z-10 w-[54px] h-[54px] rounded-full p-[3px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none ${theme.haloBg} border-[1.5px] ${theme.haloBorder} ${theme.haloShadow}`}
      >
        {/* Inner Solid Circle Button */}
        <div className={`w-full h-full rounded-full ${theme.buttonGradient} flex items-center justify-center shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4),0_3px_6px_rgba(0,0,0,0.25)]`}>
          {isProcessing ? (
            <Loader2 className="w-5 h-5 text-white animate-spin stroke-[3]" />
          ) : isCompleted ? (
            <Check className="w-5 h-5 text-white stroke-[3.5] animate-scale-in" />
          ) : icon ? (
            <span className="text-white flex items-center justify-center">{icon}</span>
          ) : (
            <ChevronsRight className="w-5 h-5 text-white stroke-[3.2] drop-shadow-xs" />
          )}
        </div>
      </div>
    </div>
  );
};
