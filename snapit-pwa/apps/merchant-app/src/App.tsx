import React, { useState, useEffect } from 'react';
import {
  BellRing,
  UtensilsCrossed,
  Receipt,
  Store,
  Flame,
  Power,
  Clock,
} from 'lucide-react';
import { useMerchantStore } from './store/useMerchantStore';
import { LoginScreen } from './components/auth/LoginScreen';
import { OfflineBanner } from './components/common/OfflineBanner';
import { AudioAlertBanner } from './components/common/AudioAlertBanner';
import { LiveOrdersQueue } from './components/orders/LiveOrdersQueue';
import { LiveMenuManager } from './components/menu/LiveMenuManager';
import { MobileHistoryView } from './components/mobile-view/MobileHistoryView';
import { MobileStoreSettingsView } from './components/mobile-view/MobileStoreSettingsView';
import { PrepTimeModal } from './components/orders/PrepTimeModal';
import { RejectModal } from './components/orders/RejectModal';
import { AddEditProductModal } from './components/menu/AddEditProductModal';
import { DeleteConfirmModal } from './components/menu/DeleteConfirmModal';
import { SettlementModal } from './components/dashboard/SettlementModal';

type MobileTab = 'orders' | 'menu' | 'settlement' | 'store';

export const App: React.FC = () => {
  const {
    isAuthenticated,
    orders,
    products,
    activeStore,
    isOnline,
    toggleStoreStatus,
    rushMode,
  } = useMerchantStore();

  const [activeTab, setActiveTab] = useState<MobileTab>('orders');
  const [isSettlementOpen, setIsSettlementOpen] = useState(false);

  // Live Real-Time Digital Clock
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

  // ── Automatic Store Offline & Rush Reset on Tab Close / Exit ─────────────
  useEffect(() => {
    if (!isAuthenticated || !activeStore?.id) return;

    const handleTabExit = () => {
      const storeId = activeStore.id;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey || !storeId) return;

      try {
        // Guaranteed background network request during tab closing / navigation
        fetch(`${supabaseUrl}/rest/v1/stores?id=eq.${storeId}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            is_online: false,
            rush_mode: false,
            updated_at: new Date().toISOString(),
          }),
          keepalive: true,
        });
      } catch (err) {
        console.warn('Auto offline on tab close error:', err);
      }
    };

    window.addEventListener('beforeunload', handleTabExit);
    window.addEventListener('pagehide', handleTabExit);

    return () => {
      window.removeEventListener('beforeunload', handleTabExit);
      window.removeEventListener('pagehide', handleTabExit);
    };
  }, [isAuthenticated, activeStore?.id]);

  // If not logged in, render secure Login Screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const pendingOrdersCount = orders.filter((o) => o.status === 'PLACED').length;

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center selection:bg-brand-100 selection:text-brand-700">
      {/* Mobile-First PWA Smartphone Container (Matches SnapIt Customer & Rider Apps) */}
      <div className="w-full max-w-md min-h-screen bg-canvas flex flex-col pb-24 shadow-2xl relative border-x border-slate-300">
        {/* 1. Mobile Sticky Top Header with Real-time Clock */}
        <header className="sticky top-0 z-30 bg-slate-950 text-white px-4 py-3 shadow-md border-b border-slate-800">
          <div className="flex items-center justify-between gap-2">
            {/* Store Identity + Realtime Clock */}
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={activeStore.logoUrl}
                alt={activeStore.name}
                className="w-9 h-9 rounded-xl object-cover border border-slate-700 flex-shrink-0 shadow-2xs"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-xs sm:text-sm font-black text-white truncate tracking-tight">
                    {activeStore.name}
                  </h1>
                  {/* Live Realtime Clock next to Shop Name */}
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 px-1.5 py-0.5 rounded-md text-[10px] font-mono text-emerald-400 flex-shrink-0">
                    <Clock className="w-2.5 h-2.5 text-emerald-400" />
                    <span>{currentTime}</span>
                  </div>
                  {rushMode && (
                    <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse flex-shrink-0" />
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono block truncate">
                  KGF Dark Store Counter
                </span>
              </div>
            </div>

            {/* ONLINE / OFFLINE Status Button (Sound is Always ON by default) */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={toggleStoreStatus}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer ${
                  isOnline
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/25'
                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25'
                }`}
              >
                <Power className="w-3.5 h-3.5 stroke-[3]" />
                <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* 2. Context Banners */}
        <OfflineBanner />
        <AudioAlertBanner />

        {/* 3. Main Dynamic Mobile View Body */}
        <main className="flex-1 p-3.5 space-y-4">
          {/* Tab 1: Live Orders Queue */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <LiveOrdersQueue />
            </div>
          )}

          {/* Tab 2: Menu & Stock Manager */}
          {activeTab === 'menu' && (
            <div className="space-y-4">
              <LiveMenuManager />
            </div>
          )}

          {/* Tab 3: Daily Settlement & History (Pristine 2x2 Grid + 11 PM Payout Card + Date Accordions) */}
          {activeTab === 'settlement' && (
            <div className="space-y-4">
              <MobileHistoryView onOpenSettlement={() => setIsSettlementOpen(true)} />
            </div>
          )}

          {/* Tab 4: Store Profile & Operational Controls */}
          {activeTab === 'store' && (
            <div className="space-y-4">
              <MobileStoreSettingsView />
            </div>
          )}
        </main>

        {/* 4. Fixed Bottom Mobile Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-2">
          <div className="grid grid-cols-4 gap-1 text-center">
            {/* Orders Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'text-emerald-700 font-black'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="relative">
                <BellRing
                  className={`w-5 h-5 transition-transform ${
                    activeTab === 'orders' ? 'scale-110 stroke-[2.5]' : 'stroke-2'
                  }`}
                />
                {pendingOrdersCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-amber-500 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-xs font-mono">
                    {pendingOrdersCount}
                  </span>
                )}
                {pendingOrdersCount === 0 && orders.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center font-mono">
                    {orders.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1 truncate">
                Orders {orders.length > 0 ? `(${orders.length})` : ''}
              </span>
              {activeTab === 'orders' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5" />
              )}
            </button>

            {/* Menu & Stock Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('menu')}
              className={`py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                activeTab === 'menu'
                  ? 'text-emerald-700 font-black'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <UtensilsCrossed
                className={`w-5 h-5 transition-transform ${
                  activeTab === 'menu' ? 'scale-110 stroke-[2.5]' : 'stroke-2'
                }`}
              />
              <span className="text-[10px] tracking-tight mt-1 truncate">
                Menu ({products.length})
              </span>
              {activeTab === 'menu' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5" />
              )}
            </button>

            {/* Settlement Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('settlement')}
              className={`py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                activeTab === 'settlement'
                  ? 'text-emerald-700 font-black'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <Receipt
                className={`w-5 h-5 transition-transform ${
                  activeTab === 'settlement' ? 'scale-110 stroke-[2.5]' : 'stroke-2'
                }`}
              />
              <span className="text-[10px] tracking-tight mt-1 truncate">Settlement</span>
              {activeTab === 'settlement' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5" />
              )}
            </button>

            {/* Store Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('store')}
              className={`py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                activeTab === 'store'
                  ? 'text-emerald-700 font-black'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <Store
                className={`w-5 h-5 transition-transform ${
                  activeTab === 'store' ? 'scale-110 stroke-[2.5]' : 'stroke-2'
                }`}
              />
              <span className="text-[10px] tracking-tight mt-1 truncate">Store</span>
              {activeTab === 'store' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5" />
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Shared Modals (Centered over Mobile View) */}
      <PrepTimeModal />
      <RejectModal />
      <AddEditProductModal />
      <DeleteConfirmModal />
      <SettlementModal isOpen={isSettlementOpen} onClose={() => setIsSettlementOpen(false)} />
    </div>
  );
};

export default App;
