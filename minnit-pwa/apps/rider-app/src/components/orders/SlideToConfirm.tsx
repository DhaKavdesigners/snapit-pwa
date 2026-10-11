'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface SlideToConfirmProps {
  label?: string;
  successLabel?: string;
  onConfirm: () => void | Promise<void | boolean>;
  disabled?: boolean;
}

export const SlideToConfirm: React.FC<SlideToConfirmProps> = ({
  label = 'Slide to Arrive',
  successLabel = 'Arrived!',
  onConfirm,
  disabled = false,
}) => {
  const [dragProgress, setDragProgress] = useState(0); // 0 to 1
  const [isDragging, setIsDragging] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const knobRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const currentDragRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const isConfirmedRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const activePointerIdRef = useRef<number | null>(null);
  const hasReachedThresholdRef = useRef<boolean>(false);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  const thumbWidth = 56;

  // Auto-reset state whenever label or disabled changes
  useEffect(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    isConfirmedRef.current = false;
    setIsConfirmed(false);
    isProcessingRef.current = false;
    setIsProcessing(false);
    isDraggingRef.current = false;
    setIsDragging(false);
    currentDragRef.current = 0;
    hasReachedThresholdRef.current = false;
    setDragProgress(0);
  }, [label, disabled]);

  // Clean up any pending reset timer on unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    };
  }, []);

  const triggerCompletion = useCallback(async () => {
    if (isConfirmedRef.current || isProcessingRef.current) return;
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
      isConfirmedRef.current = true;
      setIsConfirmed(true);
      setIsProcessing(false);
      isProcessingRef.current = false;

      // Auto-reset after completion so component never stays stuck if mounted
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => {
        isConfirmedRef.current = false;
        setIsConfirmed(false);
        currentDragRef.current = 0;
        hasReachedThresholdRef.current = false;
        setDragProgress(0);
        resetTimerRef.current = null;
      }, 500);
    } catch (err) {
      console.warn('SlideToConfirm execution failed:', err);
      // On failure: do NOT falsely mark as completed; allow retry
      isConfirmedRef.current = false;
      setIsConfirmed(false);
      setIsProcessing(false);
      isProcessingRef.current = false;
      hasReachedThresholdRef.current = false;
      currentDragRef.current = 0;
      setDragProgress(0);
    }
  }, [onConfirm]);

  const handleDrag = useCallback((clientX: number) => {
    if (!isDraggingRef.current || !trackRef.current || isConfirmedRef.current || isProcessingRef.current) return;

    const trackWidth = trackRef.current.offsetWidth - thumbWidth;
    if (trackWidth <= 0) return;

    const deltaX = clientX - startXRef.current;
    const clampedDelta = Math.max(0, Math.min(deltaX, trackWidth));
    const progress = clampedDelta / trackWidth;

    currentDragRef.current = progress;
    setDragProgress(progress);

    if (progress >= 0.80) {
      hasReachedThresholdRef.current = true;
    }

    // Auto-confirm smoothly when dragged all the way to 88%
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
  }, [thumbWidth, triggerCompletion]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || isConfirmed || isProcessing) return;
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

  const thumbPosition = trackRef.current
    ? dragProgress * Math.max(0, trackRef.current.offsetWidth - thumbWidth)
    : 0;

  return (
    <div
      ref={trackRef}
      style={{ touchAction: 'none', userSelect: 'none' }}
      className={`slide-track w-full relative select-none transition-all duration-300 ${
        disabled
          ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 opacity-60 cursor-not-allowed'
          : isConfirmed
          ? 'bg-primary/20 border-primary cursor-default'
          : 'bg-slate-200/70 border-slate-300 dark:bg-slate-800 dark:border-slate-700 cursor-pointer'
      }`}
    >
      {/* Background Fill as user drags */}
      {!disabled && (
        <div
          className="absolute top-0 left-0 bottom-0 bg-primary/20 rounded-full transition-all duration-75 pointer-events-none"
          style={{ width: `${Math.max(12, dragProgress * 100)}%` }}
        />
      )}

      {/* Track Center Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-12 text-center">
        <span
          className={`text-xs uppercase font-extrabold tracking-wider transition-all duration-200 ${
            disabled
              ? 'text-slate-400 dark:text-slate-500'
              : isConfirmed
              ? 'text-primary scale-105'
              : 'text-secondary opacity-90'
          }`}
          style={{ opacity: disabled ? 1 : Math.max(0.2, 1 - dragProgress * 1.5) }}
        >
          {isProcessing ? 'Processing...' : isConfirmed ? successLabel : label}
        </span>
      </div>

      {/* Draggable Thumb Knob */}
      <div
        ref={knobRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        className={`absolute top-1 left-1 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform ${
          disabled
            ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed shadow-none'
            : isConfirmed
            ? 'bg-primary-dark cursor-default'
            : 'bg-gradient-to-r from-primary to-primary-container cursor-grab active:cursor-grabbing hover:shadow-glow active:scale-95'
        }`}
        style={{
          touchAction: 'none',
          userSelect: 'none',
          transform: `translateX(${thumbPosition}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <span className="material-symbols-outlined text-[24px]">
          {disabled ? 'lock' : isConfirmed ? 'check' : 'chevron_right'}
        </span>
      </div>
    </div>
  );
};
