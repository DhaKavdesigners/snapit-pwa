import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Zap,
  LogOut,
  Clock,
  Store,
  ChevronDown,
  BellRing,
  Smartphone,
} from 'lucide-react';
import { useMerchantStore } from '../../store/useMerchantStore';
import { counterAudio } from '../../lib/audio';
import { mockStores } from '../../lib/mockData';
import { ConfirmModal } from './ConfirmModal';

interface HeaderProps {
  isSimulatorMode?: boolean;
  onToggleSimulatorMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isSimulatorMode, onToggleSimulatorMode }) => {
  const {
    activeStore,
    isOnline,
    toggleStoreStatus,
    rushMode,
    toggleRushMode,
    isMuted,
    toggleMute,
    merchantUser,
    logout,
    switchStoreOutlet,
  } = useMerchantStore();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [isStoreMenuOpen, setIsStoreMenuOpen] = useState(false);
  const [isOfflineConfirmOpen, setIsOfflineConfirmOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTestSound = () => {
    counterAudio.playReadyDispatchChime();
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          {/* Left: Brand & Store Selector */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {/* Store Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={activeStore.logoUrl}
                alt={activeStore.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border-2 border-slate-100 shadow-sm"
              />
              <div
                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                  isOnline ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-rose-500 ring-2 ring-rose-500/20'
                }`}
              />
            </div>

            {/* Store Info & Switcher */}
            <div className="relative min-w-0">
              <button
                type="button"
                onClick={() => setIsStoreMenuOpen(!isStoreMenuOpen)}
                className="group flex items-center gap-1.5 text-left focus:outline-none"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate leading-tight group-hover:text-emerald-700 transition-colors">
                      {activeStore.name}
                    </h1>
                    <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase tracking-wider">
                      {activeStore.category}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-600 group-hover:text-slate-700 transition-colors flex-shrink-0" />
                  </div>
                  <p className="text-xs text-slate-600 truncate font-medium">
                    {merchantUser?.name || 'Counter Staff'} &bull; KGF Outlet
                  </p>
                </div>
              </button>

              {/* Outlet Dropdown */}
              {isStoreMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsStoreMenuOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white shadow-2xl border border-slate-200 py-2 z-30 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Switch Outlet Counter
                    </div>
                    {mockStores.map((store) => (
                      <button
                        key={store.id}
                        type="button"
                        onClick={() => {
                          switchStoreOutlet(store.id);
                          setIsStoreMenuOpen(false);
                        }}
                        className={`w-full px-3.5 py-2.5 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors ${
                          store.id === activeStore.id ? 'bg-emerald-50 text-emerald-950 font-bold' : 'text-slate-700'
                        }`}
                      >
                        <img
                          src={store.logoUrl}
                          alt={store.name}
                          className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                        />
                        <div className="truncate">
                          <div className="text-xs truncate">{store.name}</div>
                          <div className="text-[10px] text-slate-600 font-mono uppercase">{store.category}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Center / Right: Live Status Controls & Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Live Counter Clock */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-mono text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-slate-600" />
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



            {/* Laptop vs Mobile Phone Simulator Toggle */}
            {onToggleSimulatorMode && (
              <button
                type="button"
                onClick={onToggleSimulatorMode}
                title={isSimulatorMode ? 'Switch to Full Laptop Counter' : 'Simulate Mobile Phone Screen'}
                className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isSimulatorMode
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-600/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{isSimulatorMode ? 'Phone Simulator (Active)' : 'Phone Simulator'}</span>
              </button>
            )}

            {/* CRITICAL STORE ONLINE / OFFLINE TOGGLE */}
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
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isOnline ? 'bg-emerald-200 animate-pulse' : 'bg-rose-200'
                  }`}
                />
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
