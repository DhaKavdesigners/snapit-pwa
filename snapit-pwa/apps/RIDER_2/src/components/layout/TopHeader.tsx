'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRider } from '@/context/RiderContext';
import { MapPin, ChevronDown, Power } from 'lucide-react';

interface TopHeaderProps {
  showBack?: boolean;
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'dark';
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  showBack,
  title,
  subtitle,
  variant = 'default',
}) => {
  const {
    rider,
    isOnline,
    riderBreak,
    earnings,
    activeSession,
    endSession,
  } = useRider();

  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Lock scroll when modal open
  useEffect(() => {
    if (!showOfflineModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowOfflineModal(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [showOfflineModal]);

  const isBreakActive = riderBreak && !riderBreak.endedAt;
  const firstName = rider?.name ? rider.name.split(' ')[0] : 'Rider';

  const handleToggleClick = () => {
    if (isOnline) setShowOfflineModal(true);
    // Offline → online is handled by START RIDING button on home page
  };

  // Status dot
  const statusDot = isBreakActive
    ? 'bg-amber-400 animate-pulse'
    : isOnline
    ? 'bg-emerald-400 animate-pulse'
    : 'bg-slate-400';

  const statusLabel = isBreakActive ? 'On Break' : isOnline ? 'Online' : 'Offline';

  // Session remaining for header
  const sessionRemaining = activeSession && isOnline
    ? (() => {
        const rem = activeSession.committedUntil - Date.now();
        if (rem <= 0) return null;
        const m = Math.floor(rem / 60000);
        const h = Math.floor(m / 60);
        return h > 0 ? `${h}h ${(m % 60).toString().padStart(2, '0')}m` : `${m}m`;
      })()
    : null;


  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center">
        <div
          className={`w-full max-w-md h-[60px] px-4 flex items-center justify-between border-b ${
            isOnline
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-slate-200/80 shadow-xs'
          } transition-colors duration-300`}
        >
          {/* ── Left: Back OR Avatar+Info ── */}
          {showBack ? (
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => window.history.back()}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors active:scale-95 ${
                  isOnline
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                aria-label="Go back"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              </button>
              <div className="min-w-0">
                <h1 className={`text-sm font-black truncate ${isOnline ? 'text-white' : 'text-slate-900'}`}>
                  {title || 'Minnit Rider'}
                </h1>
                {subtitle && (
                  <p className={`text-[10px] truncate ${isOnline ? 'text-slate-400' : 'text-slate-500'}`}>
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <Link href="/profile" className="flex items-center gap-2.5 min-w-0 active:opacity-80" title="View Profile">
              {/* Avatar with status dot */}
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/20">
                  <img
                    src={rider.selfieCapturedUrl || rider.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                    alt={rider.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${isOnline ? 'border-slate-900' : 'border-white'} ${statusDot}`} />
              </div>

              <div className="min-w-0">
                <p className={`text-[13px] font-bold leading-tight truncate ${isOnline ? 'text-white' : 'text-slate-900'}`}>
                  {firstName}
                </p>
                <div className={`flex items-center gap-0.5 text-[11px] font-semibold ${isOnline ? 'text-slate-400' : 'text-slate-500'}`}>
                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{rider.selectedZone || 'Robertsonpet'}</span>
                </div>
              </div>
            </Link>
          )}

          {/* ── Right: Stats strip + Online Toggle ── */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Right content: session remaining OR earnings */}
            {!showBack && (
              <div className="flex flex-col items-end">
                {sessionRemaining ? (
                  <>
                    <span className={`text-[10px] font-bold ${isOnline ? 'text-slate-400' : 'text-slate-500'}`}>
                      Session
                    </span>
                    <span className={`text-sm font-black font-mono ${isOnline ? 'text-emerald-400' : 'text-slate-700'}`}>
                      {sessionRemaining}
                    </span>
                  </>
                ) : (
                  <>
                    <span className={`text-[10px] font-bold ${isOnline ? 'text-slate-400' : 'text-slate-500'}`}>
                      {earnings.todayDeliveries} {earnings.todayDeliveries === 1 ? 'order' : 'orders'}
                    </span>
                    <span className={`text-sm font-black font-mono ${isOnline ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      ₹{earnings.today}
                    </span>
                  </>
                )}
              </div>
            )}


            {/* Online/Offline Toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={isOnline}
              onClick={handleToggleClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all active:scale-95 border ${
                isOnline
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${statusDot}`} />
              <span>{statusLabel}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── End Session Confirmation Sheet ── */}
      {mounted && showOfflineModal && createPortal(
        <div
          className="fixed inset-0 z-[200] bg-black/50 flex items-end justify-center"
          onClick={() => setShowOfflineModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl p-6 animate-slide-up shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Power className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">End your session?</h3>
                <p className="text-xs text-slate-500">You won't receive new orders</p>
              </div>
            </div>

            {activeSession && sessionRemaining && (
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl px-3.5 py-2.5 mb-4">
                <p className="text-xs font-semibold text-amber-900">
                  Your session still has <strong>{sessionRemaining}</strong> remaining.
                  Ending early is recorded for analytics — no penalty in Phase 1.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                onClick={() => setShowOfflineModal(false)}
                className="py-3.5 text-emerald-800 font-bold text-sm rounded-2xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 active:scale-98 transition-all"
              >
                Stay Online
              </button>
              <button
                onClick={async () => { setShowOfflineModal(false); await endSession(true); }}
                className="py-3.5 text-white font-bold text-sm rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-98 transition-all"
              >
                End Session
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
