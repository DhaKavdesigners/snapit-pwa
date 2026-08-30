import React, { useState, useEffect } from 'react';
import {
  Zap,
  LogOut,
  Clock,
  Power,
  Flame,
} from 'lucide-react';
import { useMerchantStore } from '../../store/useMerchantStore';
import { ConfirmModal } from './ConfirmModal';

export const Header: React.FC = () => {
  const {
    activeStore,
    merchantUser,
    isOnline,
    toggleStoreStatus,
    rushMode,
    toggleRushMode,
    logout,
  } = useMerchantStore();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [isOfflineConfirmOpen, setIsOfflineConfirmOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).toLowerCase()
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-sm py-2 sm:py-2.5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Brand & Store Identity Synced with Database & Mobile UI */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {/* Store Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={activeStore.logoUrl}
                alt={activeStore.name}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                  if (fallback?.dataset.fallback) fallback.style.display = 'flex';
                }}
              />
              <div data-fallback="true" style={{ display: 'none' }} className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-600 text-white items-center justify-center text-xl font-black">
                {activeStore.name?.charAt(0) || '🏪'}
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  isOnline ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-rose-500 ring-2 ring-rose-500/20'
                }`}
              />
            </div>

            {/* Store Details Synced with Database & Mobile UI */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 truncate leading-tight">
                  {activeStore.name}
                </h1>
                {rushMode && (
                  <Flame className="w-4 h-4 text-amber-500 animate-pulse flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium leading-tight mt-0.5">
                Merchant: <strong className="text-slate-800 font-bold">{merchantUser?.name || 'Authorized Merchant'}</strong>
              </p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {/* 1. Category */}
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase font-mono">
                  {activeStore.category || 'GROCERY'}
                </span>
                <span className="text-slate-300 font-bold">&bull;</span>
                {/* 2. Address */}
                <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                  {activeStore.address || 'Robertsonpet, KGF'}
                </span>
                <span className="text-slate-300 font-bold">&bull;</span>
                {/* 3. Dark Store Badge */}
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  KGF Dark Store
                </span>
              </div>
            </div>
          </div>

          {/* Center: Brand Identity (minnit) */}
          <div className="hidden md:flex items-center justify-center">
            <div className="flex items-center px-4 py-1.5 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs hover:bg-slate-100/80 transition-all">
              <img
                src="/images/minnit.jpg"
                alt="minnit"
                className="h-6 sm:h-7 w-auto object-contain"
              />
            </div>
          </div>

          {/* Right: Live Status Controls & Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Live Counter Clock */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-mono text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{currentTime}</span>
            </div>

            {/* Rush Mode Toggle */}
            <button
              type="button"
              onClick={toggleRushMode}
              disabled={!isOnline}
              title={!isOnline ? 'Turn store ONLINE to activate Rush Mode' : 'Rush Mode adds prep time buffer for peak hours'}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                !isOnline
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : rushMode
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 ring-2 ring-amber-500/20 cursor-pointer'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-transparent cursor-pointer'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${rushMode && isOnline ? 'fill-amber-600 text-amber-600' : 'text-slate-400'}`} />
              <span>{rushMode && isOnline ? '⚡ Rush Active' : 'Rush Mode'}</span>
            </button>

            {/* STORE ONLINE / OFFLINE TOGGLE */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  if (isOnline) {
                    setIsOfflineConfirmOpen(true);
                  } else {
                    toggleStoreStatus();
                  }
                }}
                className={`group relative flex items-center gap-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all shadow-sm cursor-pointer border ${
                  isOnline
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-emerald-600/20'
                    : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500 shadow-rose-600/20'
                }`}
              >
                <Power className="w-3.5 h-3.5 stroke-[3]" />
                <span className="uppercase font-extrabold">
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
                <span className="hidden sm:inline-block text-[11px] opacity-80 font-normal ml-0.5">
                  ({isOnline ? 'Accepting' : 'Paused'})
                </span>
              </button>
            </div>

            {/* Logout Action */}
            <button
              type="button"
              onClick={() => setIsLogoutConfirmOpen(true)}
              title="Logout (Store will automatically go OFFLINE)"
              className="p-2 sm:p-2.5 rounded-xl text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 🔴 Turn Store Offline Confirmation Modal */}
      <ConfirmModal
        isOpen={isOfflineConfirmOpen}
        title="Turn Store Offline?"
        subtitle={activeStore.name}
        description={`Are you sure you want to turn ${activeStore.name} OFFLINE? Your store will be marked closed on the customer app and new incoming orders will be paused.`}
        confirmLabel="Turn Store Offline"
        cancelLabel="Cancel"
        variant="danger"
        icon="power"
        onConfirm={toggleStoreStatus}
        onClose={() => setIsOfflineConfirmOpen(false)}
      />

      {/* 🚪 Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        title="Log Out & Switch Store OFFLINE?"
        subtitle={activeStore.name}
        description={`Are you sure you want to log out from ${activeStore.name}? Your store counter will automatically be switched OFFLINE and stop receiving customer orders until you log back in.`}
        confirmLabel="Yes, Log Out"
        cancelLabel="Cancel"
        variant="danger"
        icon="logout"
        onConfirm={logout}
        onClose={() => setIsLogoutConfirmOpen(false)}
      />
    </header>
  );
};
