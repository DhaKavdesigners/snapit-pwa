import React, { useState, useEffect } from 'react';
import {
  Power,
  Flame,
  Monitor,
  Clock,
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
  } = useMerchantStore();

  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
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

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center selection:bg-brand-100 selection:text-brand-700">
      {/* Mobile Shell Container */}
      <div className="w-full max-w-md min-h-screen bg-slate-50 flex flex-col pb-20 shadow-2xl relative">
        {/* 1. Mobile Sticky Top Bar with Realtime Clock */}
        <header className="sticky top-0 z-30 bg-slate-950 text-white px-4 py-3 shadow-md border-b border-slate-800">
          <div className="flex items-center justify-between gap-2">
            {/* Store Identity + Realtime Clock */}
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={activeStore.logoUrl}
                alt={activeStore.name}
                className="w-8 h-8 rounded-xl object-cover border border-slate-700 flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-xs font-black text-white truncate tracking-tight">
                    {activeStore.name}
                  </h1>
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 px-1.5 py-0.5 rounded-md text-[10px] font-mono text-emerald-400 flex-shrink-0">
                    <Clock className="w-2.5 h-2.5 text-emerald-400" />
                    <span>{currentTime}</span>
                  </div>
                  {rushMode && (
                    <Flame className="w-3 h-3 text-amber-400 animate-pulse flex-shrink-0" />
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono block truncate">
                  Counter Terminal
                </span>
              </div>
            </div>

            {/* Quick Actions (Online/Offline & Desktop Switcher) */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Desktop View Switcher if available */}
              {onSwitchToDesktop && (
                <button
                  type="button"
                  onClick={onSwitchToDesktop}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Switch to Full Desktop Counter"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Store Status Toggle */}
              <button
                type="button"
                onClick={toggleStoreStatus}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all flex items-center gap-1 active:scale-95 shadow-sm cursor-pointer ${
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

export default MobileMerchantLayout;
