'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRider } from '@/context/RiderContext';
import { Bell, Power, X, AlertCircle } from 'lucide-react';
import { formatTimeAMPM } from '@/services/slotService';

interface TopHeaderProps {
  showBack?: boolean;
  title?: string;
  subtitle?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ showBack, title, subtitle }) => {
  const {
    rider,
    isOnline,
    toggleOnline,
    setOnlineStatus,
    activeSlot,
    activeOrder,
    alerts,
    riderBreak,
  } = useRider();

  const [showOfflineModal, setShowOfflineModal] = useState(false);

  const unreadCount = alerts?.filter((a) => !a.read).length || 0;
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-200 flex justify-center">
      <div className="w-full max-w-md h-16 px-4 flex items-center justify-between glass-nav border-b border-slate-200/80 shadow-xs gap-1">

        {/* Left: Avatar + Snapit RIDER Branding */}
        <div className="flex items-center gap-1.5 shrink-0">
          {showBack ? (
            <button
              onClick={() => window.history.back()}
              className="w-8 h-8 rounded-full bg-white/80 border border-outline-variant/30 flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors shadow-sm active:scale-95 shrink-0"
              aria-label="Go back"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
          ) : (
            <Link href="/profile" className="relative group cursor-pointer active:scale-95 transition-transform shrink-0" title="View Profile">
              <div className="w-8 h-8 rounded-full relative overflow-hidden ring-2 ring-primary/20 p-[1px] bg-white shadow-sm transition-transform group-hover:scale-105">
                <img
                  src={rider.selfieCapturedUrl || rider.avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                />
                <span
                  className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${
                    isBreakActive
                      ? 'bg-amber-400'
                      : isOnline
                      ? 'bg-primary animate-pulse'
                      : 'bg-secondary'
                  }`}
                />
              </div>
            </Link>
          )}

          <Link href="/" className="flex items-center gap-1 group shrink-0">
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">
              Snapit
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 bg-primary/10 text-primary rounded-full">
              RIDER
            </span>
          </Link>
        </div>

        {/* Right: Online toggle + Bell */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Online toggle */}
          <div
            onClick={handleToggleClick}
            className="flex items-center gap-1 select-none cursor-pointer"
            title={isOnline ? 'Go Offline' : 'Go Online'}
          >
            <span
              className={`text-[11px] font-bold ${
                isBreakActive
                  ? 'text-amber-500'
                  : isOnline
                  ? 'text-primary'
                  : 'text-secondary'
              }`}
            >
              {onlineLabel}
            </span>
            <div
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 relative shadow-inner ${
                isBreakActive
                  ? 'bg-amber-400 border border-amber-500'
                  : isOnline
                  ? 'bg-primary border border-primary-container shadow-glow'
                  : 'bg-slate-300 border border-slate-400/60'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${
                  isOnline ? 'translate-x-[16px]' : 'translate-x-0'
                }`}
              >
                <div
                  className={`w-1 h-1 rounded-full ${
                    isBreakActive
                      ? 'bg-amber-400'
                      : isOnline
                      ? 'bg-primary animate-pulse'
                      : 'bg-slate-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Bell icon with unread badge */}
          <Link href="/alerts" className="relative w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors shrink-0">
            <Bell className="w-4.5 h-4.5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* ── SIMPLE & SHORT GO OFFLINE CONFIRMATION MODAL ── */}
      {showOfflineModal && (
        <div
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowOfflineModal(false)}
        >
          <div
            className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 animate-scale-up text-center space-y-3.5 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Red Power Icon */}
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto shadow-sm">
              <Power className="w-6 h-6" />
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
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl active:scale-95 transition-all"
              >
                No
              </button>

              <button
                type="button"
                onClick={() => {
                  setOnlineStatus(false);
                  setShowOfflineModal(false);
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

