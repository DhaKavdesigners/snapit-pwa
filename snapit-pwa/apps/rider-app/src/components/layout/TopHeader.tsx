'use client';

import React from 'react';
import Link from 'next/link';
import { useRider } from '@/context/RiderContext';
import { Smartphone, Monitor } from 'lucide-react';

interface TopHeaderProps {
  showBack?: boolean;
  title?: string;
  subtitle?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ showBack, title, subtitle }) => {
  const { rider, isOnline, toggleOnline, desktopFrame, toggleDesktopFrame } = useRider();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-200">
      {/* Centered container with blur background matching Stitch glassmorphic specs */}
      <div className="w-full max-w-md mx-auto h-16 px-4 flex items-center justify-between glass-nav border-b border-surface-variant/40 shadow-sm">
        
        {/* Left: Avatar or Back Button */}
        {showBack ? (
          <button
            onClick={() => window.history.back()}
            className="w-9 h-9 rounded-full bg-white/80 border border-outline-variant/30 flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors shadow-sm active:scale-95"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
        ) : (
          <Link href="/profile" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-full relative overflow-hidden ring-2 ring-primary/20 p-[1px] bg-white shadow-sm transition-transform group-hover:scale-105">
              <img
                src={rider.selfieCapturedUrl || rider.avatarUrl}
                alt={rider.name}
                className="w-full h-full object-cover rounded-full"
              />
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                  isOnline ? 'bg-primary animate-pulse' : 'bg-secondary'
                }`}
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-semibold text-xs text-on-surface leading-tight">{rider.name}</span>
              <span className="text-[10px] text-secondary">⭐ {rider.rating} (450+ trips)</span>
            </div>
          </Link>
        )}

        {/* Center: Brand or Custom Title */}
        <div className="flex flex-col items-center">
          {title ? (
            <div className="text-center">
              <h1 className="font-bold text-base text-on-surface leading-tight">{title}</h1>
              {subtitle && <p className="text-[11px] text-secondary">{subtitle}</p>}
            </div>
          ) : (
            <Link href="/" className="flex items-center gap-1 group">
              <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">
                Snapit
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
                Rider
              </span>
            </Link>
          )}
        </div>

        {/* Right: Online / Offline Toggle Switch & Frame Switcher */}
        <div className="flex items-center gap-2.5">
          {/* Mobile/Desktop Presentation toggle */}
          <button
            onClick={toggleDesktopFrame}
            title={desktopFrame ? "Switch to Fullscreen" : "Switch to Mobile Device Frame"}
            className="w-8 h-8 rounded-full flex items-center justify-center text-secondary/70 hover:text-primary hover:bg-primary/10 transition-colors hidden md:flex"
          >
            {desktopFrame ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          </button>

          {/* Real Animated Sliding Toggle Switch */}
          <div
            onClick={toggleOnline}
            className="flex items-center gap-2 cursor-pointer select-none group"
            title={`Click to switch ${isOnline ? 'Offline' : 'Online'}`}
          >
            <span
              className={`text-xs font-bold transition-colors ${
                isOnline ? 'text-primary' : 'text-secondary'
              }`}
            >
              {isOnline ? 'Online' : 'Offline'}
            </span>

            {/* Toggle Track */}
            <div
              className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-300 relative shadow-inner ${
                isOnline
                  ? 'bg-primary border border-primary-container shadow-glow'
                  : 'bg-slate-300 border border-slate-400/60'
              }`}
            >
              {/* Sliding Circular Thumb Knob */}
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${
                  isOnline ? 'translate-x-[22px]' : 'translate-x-0'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    isOnline ? 'bg-primary animate-pulse' : 'bg-slate-400'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};
