'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRider } from '@/context/RiderContext';
import { Power, MapPin, ChevronDown } from 'lucide-react';

interface TopHeaderProps {
  showBack?: boolean;
  title?: string;
  subtitle?: string;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export const TopHeader: React.FC<TopHeaderProps> = ({ showBack, title, subtitle }) => {
  const {
    rider,
    isOnline,
    toggleOnline,
    setOnlineStatus,
    riderBreak,
  } = useRider();

  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock scroll & listen for Escape key when modal is open
  useEffect(() => {
    if (showOfflineModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setShowOfflineModal(false);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showOfflineModal]);

  const isBreakActive = riderBreak && !riderBreak.endedAt;

  // Handle online toggle click
  const handleToggleClick = () => {
    if (isOnline) {
      setShowOfflineModal(true);
    } else {
      toggleOnline();
    }
  };

  // Online toggle label
  let onlineLabel = isOnline ? 'Online' : 'Offline';
  if (isBreakActive && isOnline === false) onlineLabel = 'Break';

  const firstName = rider?.name ? rider.name.split(' ')[0] : 'Rider';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-200 flex justify-center bg-white/95 backdrop-blur-md">
      <div className="w-full max-w-md h-16 px-4 flex items-center justify-between border-b border-slate-200/80 shadow-xs gap-2">

        {/* Left: Avatar + Greeting / Back button */}
        {showBack ? (
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => window.history.back()}
              className="w-8 h-8 rounded-full bg-white/80 border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs active:scale-95 shrink-0"
              aria-label="Go back"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-black text-slate-900 truncate">{title || 'Minnit Rider'}</h1>
              {subtitle && <p className="text-[11px] text-slate-500 truncate">{subtitle}</p>}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/profile" className="relative group cursor-pointer active:scale-95 transition-transform shrink-0" title="View Profile">
              <div className="w-10 h-10 rounded-full relative overflow-hidden ring-2 ring-emerald-500/30 p-[1px] bg-white shadow-2xs transition-transform group-hover:scale-105">
                <img
                  src={rider.selfieCapturedUrl || rider.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={rider.name}
                  className="w-full h-full object-cover rounded-full"
                />
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                    isBreakActive
                      ? 'bg-amber-400'
                      : isOnline
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-slate-400'
                  }`}
                />
              </div>
            </Link>

            <div className="min-w-0">
              <h2 className="text-sm font-black text-slate-900 leading-tight truncate">
                {getGreeting()}, {firstName} 👋
              </h2>
              <Link
                href="/slots"
                className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 transition-colors mt-0.5 cursor-pointer truncate"
              >
                <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="truncate">{rider.selectedZone || 'Robertsonpet'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </Link>
            </div>
          </div>
        )}

        {/* Right: Compact Professional Online/Offline Switch with Text Outside */}
        <div className="flex items-center justify-end shrink-0">
          <button
            type="button"
            role="switch"
            aria-checked={isOnline}
            aria-label={isOnline ? 'Go Offline' : 'Go Online'}
            onClick={handleToggleClick}
            className="flex items-center gap-2 select-none cursor-pointer py-1 px-1 rounded-full hover:opacity-95 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            title={isOnline ? 'Switch to Offline' : 'Switch to Online'}
          >
            {/* Outside Text Label + Status Indicator */}
            <div className="flex items-center gap-1.5">
              {isBreakActive ? (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
              ) : isOnline ? (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
              )}
              <span
                className={`text-xs font-black uppercase tracking-wider ${
                  isBreakActive
                    ? 'text-amber-600'
                    : isOnline
                    ? 'text-emerald-600'
                    : 'text-slate-500'
                }`}
              >
                {onlineLabel}
              </span>
            </div>

            {/* Small Compact iOS-Style Switch Slider */}
            <div
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 relative flex items-center shrink-0 ${
                isBreakActive
                  ? 'bg-amber-400'
                  : isOnline
                  ? 'bg-emerald-500 shadow-2xs'
                  : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-out ${
                  isOnline || isBreakActive ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* ── SIMPLE, SHORT & CENTERED GO OFFLINE CONFIRMATION MODAL ── */}
      {mounted && showOfflineModal && createPortal(
        <div
          className="fixed inset-0 z-[99999] w-screen h-screen min-h-[100dvh] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowOfflineModal(false)}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 animate-scale-up text-center space-y-3.5 relative mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Red Power Icon */}
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto shadow-xs">
              <Power className="w-6 h-6 stroke-[2.5]" />
            </div>

            {/* Short Title & Prompt */}
            <div>
              <h3 className="text-base font-black text-slate-900">
                Go Offline?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to go offline?
              </p>
            </div>

            {/* Simple Yes / No Buttons */}
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowOfflineModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
              >
                No
              </button>

              <button
                type="button"
                onClick={() => {
                  setOnlineStatus(false);
                  setShowOfflineModal(false);
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Yes
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};

