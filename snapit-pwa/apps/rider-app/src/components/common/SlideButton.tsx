'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronsRight, Check } from 'lucide-react';

interface SlideButtonProps {
  label: string;
  onConfirm: () => void;
  variant?: 'emerald' | 'blue' | 'purple';
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export const SlideButton: React.FC<SlideButtonProps> = ({
  label,
  onConfirm,
  variant = 'emerald',
  disabled = false,
  className = '',
  icon,
}) => {
  const [dragProgress, setDragProgress] = useState(0); // 0 to 1
  const [isDragging, setIsDragging] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const currentDragRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const isCompletedRef = useRef<boolean>(false);

  // Styling maps based on variant
  const variantStyles = {
    emerald: {
      trackBg: 'bg-emerald-50 border-emerald-500/40',
      trackFill: 'from-emerald-600 to-teal-500',
      handleBg: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/40',
      handleBorder: 'border-emerald-300/40',
      textColor: 'text-emerald-900',
      glow: 'shadow-[0_4px_20px_rgba(16,185,129,0.2)]',
    },
    blue: {
      trackBg: 'bg-blue-50 border-blue-500/40',
      trackFill: 'from-blue-600 to-cyan-500',
      handleBg: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/40',
      handleBorder: 'border-blue-300/40',
      textColor: 'text-blue-900',
      glow: 'shadow-[0_4px_20px_rgba(59,130,246,0.2)]',
    },
    purple: {
      trackBg: 'bg-purple-50 border-purple-500/40',
      trackFill: 'from-purple-600 to-indigo-500',
      handleBg: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/40',
      handleBorder: 'border-purple-300/40',
      textColor: 'text-purple-900',
      glow: 'shadow-[0_4px_20px_rgba(168,85,247,0.2)]',
    },
  }[variant];

  const triggerCompletion = useCallback(() => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;
    setIsCompleted(true);
    setDragProgress(1);

    // Haptic vibration feedback for mobile riders
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate([30, 40, 60]);
      } catch {
        // Ignore vibration errors
      }
    }

    // Call confirmation after a brief visual confirmation animation
    setTimeout(() => {
      onConfirm();
      // Reset state if component stays mounted
      setTimeout(() => {
        isCompletedRef.current = false;
        setIsCompleted(false);
        setDragProgress(0);
      }, 500);
    }, 200);
  }, [onConfirm]);

  const handleDrag = useCallback((clientX: number) => {
    if (!isDraggingRef.current || !trackRef.current || isCompletedRef.current) return;

    const trackRect = trackRef.current.getBoundingClientRect();
    const handleWidth = 52;
    const maxDistance = trackRect.width - handleWidth - 8; // 8px total padding

    if (maxDistance <= 0) return;

    const deltaX = clientX - startXRef.current;
    const clampedDelta = Math.max(0, Math.min(deltaX, maxDistance));
    const progress = clampedDelta / maxDistance;

    currentDragRef.current = progress;
    setDragProgress(progress);

    // If dragged past 85%, automatically confirm
    if (progress >= 0.85) {
      isDraggingRef.current = false;
      setIsDragging(false);
      triggerCompletion();
    }
  }, [triggerCompletion]);

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current || isCompletedRef.current) return;

    isDraggingRef.current = false;
    setIsDragging(false);

    // Threshold check
    if (currentDragRef.current >= 0.72) {
      triggerCompletion();
    } else {
      // Spring back to 0
      setDragProgress(0);
      currentDragRef.current = 0;
    }
  }, [triggerCompletion]);

  // Touch Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    if (disabled || isCompleted) return;
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    isDraggingRef.current = true;
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    handleDrag(e.touches[0].clientX);
  };

  const onTouchEnd = () => {
    handleDragEnd();
  };

  // Mouse Handlers
  const onMouseDown = (e: React.MouseEvent) => {
    if (disabled || isCompleted) return;
    startXRef.current = e.clientX;
    isDraggingRef.current = true;
    setIsDragging(true);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        handleDrag(e.clientX);
      }
    };

    const onMouseUp = () => {
      if (isDraggingRef.current) {
        handleDragEnd();
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleDrag, handleDragEnd]);

  const handleWidth = 52;
  const trackWidth = trackRef.current ? trackRef.current.clientWidth : 280;
  const maxTravel = Math.max(0, trackWidth - handleWidth - 8);
  const currentTranslateX = dragProgress * maxTravel;

  if (disabled) {
    return (
      <div
        className={`w-full h-14 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center font-bold text-xs cursor-not-allowed select-none ${className}`}
      >
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div
      ref={trackRef}
      className={`relative w-full h-14 rounded-2xl p-1 select-none overflow-hidden transition-shadow duration-200 border-2 ${variantStyles.trackBg} ${variantStyles.glow} ${className}`}
    >
      {/* Dynamic Background Fill */}
      <div
        className={`absolute top-0 left-0 bottom-0 bg-gradient-to-r ${variantStyles.trackFill} transition-all duration-75`}
        style={{
          width: isCompleted
            ? '100%'
            : `calc(${currentTranslateX}px + ${handleWidth}px + 8px)`,
          transition: isDragging ? 'none' : 'width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      />

      {/* Shimmer Track Center Label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-14">
        <span
          className={`text-xs font-black tracking-wider uppercase transition-opacity duration-200 text-center flex items-center gap-1 ${
            dragProgress > 0.3 ? 'text-white' : variantStyles.textColor
          }`}
          style={{ opacity: Math.max(0.2, 1 - dragProgress * 1.5) }}
        >
          <span>{label}</span>
          <span className="inline-flex tracking-tighter opacity-70 animate-pulse">❯❯</span>
        </span>
      </div>

      {/* Draggable Slider Thumb */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        style={{
          transform: `translateX(${currentTranslateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        className={`absolute top-1 bottom-1 left-1 w-[52px] rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg border ${variantStyles.handleBg} ${variantStyles.handleBorder} z-10`}
      >
        {isCompleted ? (
          <Check className="w-5 h-5 text-white stroke-[3] animate-scale-in" />
        ) : icon ? (
          <span className="text-white">{icon}</span>
        ) : (
          <ChevronsRight className="w-6 h-6 text-white stroke-[2.5] animate-pulse" />
        )}
      </div>
    </div>
  );
};
