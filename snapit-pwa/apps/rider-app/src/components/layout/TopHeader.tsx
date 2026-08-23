'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRider } from '@/context/RiderContext';
import { Bell } from 'lucide-react';
import { TestModeToggle } from '@/components/dev/TestModeToggle';

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
    alerts,
    canGoOnline,
    activeSlot,
    zoneStatus,
    riderBreak,
  } = useRider();

  const [showBlockedReason, setShowBlockedReason] = useState(false);

  const unreadCount = alerts?.filter((a) => !a.read).length || 0;
  const onlineGate = canGoOnline();
  const isBreakActive = riderBreak && !riderBreak.endedAt;

  // Determine toggle state visual
  const canToggleOn = onlineGate.canGo || isOnline; // if already online, can always go offline
  const toggleDisabled = !isOnline && !onlineGate.canGo;

  const handleToggle = () => {
    if (!isOnline && !onlineGate.canGo) {
      // Show reason tooltip briefly
      setShowBlockedReason(true);
      setTimeout(() => setShowBlockedReason(false), 3000);
      return;
    }
    toggleOnline();
  };

  // Online toggle label
  let onlineLabel = isOnline ? 'Online' : 'Offline';
  if (isBreakActive && isOnline === false) onlineLabel = 'Break';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-200">
      <div className="w-full max-w-md mx-auto h-16 px-3 flex items-center justify-between glass-nav border-b border-surface-variant/40 shadow-sm gap-1">

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

        {/* Center: Rider / Tester Mode Toggle */}
        <div className="flex items-center justify-center shrink-0">
          <TestModeToggle />
        </div>

        {/* Right: Online toggle + Bell */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Online toggle with gate */}
          <div className="relative shrink-0">
            <div
              onClick={handleToggle}
              className={`flex items-center gap-1 select-none ${
                toggleDisabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
              }`}
              title={
                isOnline
                  ? 'Go Offline'
                  : toggleDisabled
                  ? onlineGate.reason
                  : 'Go Online'
              }
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
                    : toggleDisabled
                    ? 'bg-slate-200 border border-slate-300'
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

            {/* Blocked reason tooltip */}
            {showBlockedReason && !isOnline && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900 text-white text-[10px] rounded-xl p-2 shadow-xl z-50 leading-relaxed animate-fade-in">
                <p className="font-bold text-amber-400 mb-0.5">
                  {!rider.isVerified
                    ? '🔒 Not Verified'
                    : !activeSlot
                    ? '📅 No Active Slot'
                    : zoneStatus === 'outside'
                    ? '📍 Outside Zone'
                    : '⚠️ Cannot Go Online'}
                </p>
                <p>{onlineGate.reason}</p>
                {!activeSlot && (
                  <Link href="/slots" className="block mt-1 text-primary-fixed font-bold underline text-[10px]">
                    → Book a Slot
                  </Link>
                )}
              </div>
            )}
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
    </header>
  );
};

