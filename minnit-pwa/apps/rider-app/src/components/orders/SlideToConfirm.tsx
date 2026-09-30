'use client';

import React, { useState, useRef, useEffect } from 'react';

interface SlideToConfirmProps {
  label?: string;
  successLabel?: string;
  onConfirm: () => void;
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
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (disabled || isConfirmed) return;
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startXRef.current = clientX;
  };

  useEffect(() => {
    const handleMove = (e: TouchEvent | MouseEvent) => {
      if (!isDragging || !trackRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const trackWidth = trackRef.current.offsetWidth - 56; // width minus thumb width
      const delta = clientX - startXRef.current;
      const progress = Math.max(0, Math.min(1, delta / trackWidth));
      setDragProgress(progress);

      if (progress >= 0.95) {
        setIsDragging(false);
        setIsConfirmed(true);
        setDragProgress(1);
        onConfirm();
      }
    };

    const handleEnd = () => {
      if (!isDragging) return;
      setIsDragging(false);
      if (dragProgress < 0.95) {
        setDragProgress(0);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragProgress, onConfirm]);

  const thumbPosition = trackRef.current
    ? dragProgress * (trackRef.current.offsetWidth - 56)
    : 0;

  return (
    <div
      ref={trackRef}
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
          {isConfirmed ? successLabel : label}
        </span>
      </div>

      {/* Draggable Thumb Knob */}
      <div
        onMouseDown={handleTouchStart}
        onTouchStart={handleTouchStart}
        className={`absolute top-1 left-1 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform ${
          disabled
            ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed shadow-none'
            : isConfirmed
            ? 'bg-primary-dark cursor-default'
            : 'bg-gradient-to-r from-primary to-primary-container cursor-grab active:cursor-grabbing hover:shadow-glow active:scale-95'
        }`}
        style={{
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
