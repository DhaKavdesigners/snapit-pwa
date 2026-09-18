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

  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const currentDragRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const isCompletedRef = useRef<boolean>(false);

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
  }, [handleWidth, triggerCompletion]);

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
          {label}
        </span>
      </div>

      {/* Right Icon if provided */}
      {rightIcon && (
        <div className={`absolute right-4.5 flex items-center pointer-events-none ${theme.textColor} select-none`}>
          {rightIcon}
        </div>
      )}

      {/* Draggable Circular Knob with Outer Glowing Halo */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        style={{
          transform: `translateX(${currentTranslateX}px)`,
          transition: isDragging
            ? 'none'
            : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        className={`relative z-10 w-[54px] h-[54px] rounded-full p-[3px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none ${theme.haloBg} border-[1.5px] ${theme.haloBorder} ${theme.haloShadow}`}
      >
        {/* Inner Solid Circle Button */}
        <div className={`w-full h-full rounded-full ${theme.buttonGradient} flex items-center justify-center shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4),0_3px_6px_rgba(0,0,0,0.25)]`}>
          {isCompleted ? (
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
