import React, { useState } from 'react';
import {
  Power,
  Volume2,
  VolumeX,
  Flame,
  Monitor,
} from 'lucide-react';
import { useMerchantStore } from '../../store/useMerchantStore';
import { MobileBottomNav, type MobileTab } from './MobileBottomNav';
import { MobileLiveOrdersView } from './MobileLiveOrdersView';
import { MobileMenuManagerView } from './MobileMenuManagerView';
import { MobileHistoryView } from './MobileHistoryView';
import { MobileStoreSettingsView } from './MobileStoreSettingsView';
import { OfflineBanner } from '../common/OfflineBanner';
import { AudioAlertBanner } from '../common/AudioAlertBanner';

interface MobileMerchantLayoutProps {
  onOpenSettlement: () => void;
  onSwitchToDesktop?: () => void;
}

export const MobileMerchantLayout: React.FC<MobileMerchantLayoutProps> = ({
  onOpenSettlement,
  onSwitchToDesktop,
}) => {
  const [activeTab, setActiveTab] = useState<MobileTab>('orders');
  const {
    activeStore,
    isOnline,
    toggleStoreStatus,
    rushMode,
    isMuted,
    toggleMute,
  } = useMerchantStore();

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center selection:bg-brand-100 selection:text-brand-700">
      {/* Mobile Shell Container (Max width matching mobile viewport standard like Customer/Rider PWA) */}
      <div className="w-full max-w-md min-h-screen bg-slate-50 flex flex-col pb-20 shadow-2xl relative">
        {/* 1. Mobile Sticky Top Bar */}
        <header className="sticky top-0 z-30 bg-slate-950 text-white px-4 py-3 shadow-md border-b border-slate-800">
          <div className="flex items-center justify-between gap-2">
            {/* Store Identity */}
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={activeStore.logoUrl}
                alt={activeStore.name}
                className="w-8 h-8 rounded-xl object-cover border border-slate-700 flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xs font-black text-white truncate tracking-tight">
                    {activeStore.name}
                  </h1>
                  {rushMode && (
                    <Flame className="w-3 h-3 text-amber-400 animate-pulse flex-shrink-0" />
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono block truncate">
                  Counter Terminal
                </span>
              </div>
            </div>

            {/* Quick Actions (Online/Offline & Mute & Desktop Switcher) */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Mute Toggle */}
              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title={isMuted ? 'Unmute sound' : 'Mute sound'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>

              {/* Desktop View Switcher if available */}
              {onSwitchToDesktop && (
                <button
                  type="button"
                  onClick={onSwitchToDesktop}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  title="Switch to Full Desktop Counter"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Store Status Toggle */}
              <button
                type="button"
                onClick={toggleStoreStatus}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all flex items-center gap-1 active:scale-95 shadow-sm ${
                  isOnline
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/25'
                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25'
                }`}
              >
                <Power className="w-3 h-3 stroke-[3]" />
                <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* 2. Critical Banners */}
        <OfflineBanner />
        <AudioAlertBanner />

        {/* 3. Tab Body View */}
        <main className="flex-1 p-3.5">
          {activeTab === 'orders' && <MobileLiveOrdersView />}
          {activeTab === 'menu' && <MobileMenuManagerView />}
          {activeTab === 'settlement' && <MobileHistoryView onOpenSettlement={onOpenSettlement} />}
          {activeTab === 'store' && <MobileStoreSettingsView />}
        </main>

        {/* 4. Bottom Mobile Navigation */}
        <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
};
