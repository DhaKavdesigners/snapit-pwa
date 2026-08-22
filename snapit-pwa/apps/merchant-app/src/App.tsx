import React, { useState, useEffect } from 'react';
import {
  BellRing,
  UtensilsCrossed,
  Receipt,
  Store,
  Flame,
  Volume2,
  VolumeX,
  Power,
  LogOut,
  Monitor,
  Smartphone,
} from 'lucide-react';
import { useMerchantStore } from './store/useMerchantStore';
import { LoginScreen } from './components/auth/LoginScreen';
import { Header } from './components/common/Header';
import { OfflineBanner } from './components/common/OfflineBanner';
import { AudioAlertBanner } from './components/common/AudioAlertBanner';
import { DailyMetricsBar } from './components/dashboard/DailyMetricsBar';
import { LiveOrdersQueue } from './components/orders/LiveOrdersQueue';
import { LiveMenuManager } from './components/menu/LiveMenuManager';
import { OrderHistory } from './components/history/OrderHistory';
import { PrepTimeModal } from './components/orders/PrepTimeModal';
import { RejectModal } from './components/orders/RejectModal';
import { AddEditProductModal } from './components/menu/AddEditProductModal';
import { DeleteConfirmModal } from './components/menu/DeleteConfirmModal';
import { SettlementModal } from './components/dashboard/SettlementModal';
import { mockStores } from './lib/mockData';

type MobileTab = 'orders' | 'menu' | 'settlement' | 'store';
type ViewMode = 'mobile' | 'pc';

export const App: React.FC = () => {
  const {
    isAuthenticated,
    orders,
    products,
    activeStore,
    switchStoreOutlet,
    isOnline,
    toggleStoreStatus,
    rushMode,
    toggleRushMode,
    isMuted,
    toggleMute,
    merchantUser,
    logout,
  } = useMerchantStore();

  const [activeTab, setActiveTab] = useState<MobileTab>('orders');
  const [isSettlementOpen, setIsSettlementOpen] = useState(false);

  // View Mode: 'mobile' (Phone PWA) vs 'pc' (Desktop POS Dashboard)
  const [viewMode, setViewMode] = useState<ViewMode>('mobile');

  // If not logged in, show clean merchant login screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const pendingOrdersCount = orders.filter((o) => o.status === 'PLACED').length;

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center selection:bg-brand-100 selection:text-brand-700">
      {/* Top Floating View Mode Switcher (Allows instant switching between Mobile and PC interfaces on laptop) */}
      <div className="w-full bg-slate-950 text-white border-b border-slate-800 px-4 py-1.5 flex items-center justify-between z-50 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400">INTERFACE MODE:</span>
          <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('mobile')}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'mobile'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile PWA View</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('pc')}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'pc'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>PC / Laptop Dashboard</span>
            </button>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
          <span>Active: <strong className="text-white">{activeStore.name}</strong></span>
          <span>&bull;</span>
          <span className="font-mono">{isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}</span>
        </div>
      </div>

      {/* ── MODE 1: MOBILE SMARTPHONE PWA INTERFACE ── */}
      {viewMode === 'mobile' && (
        <div className="w-full max-w-md min-h-[calc(100vh-38px)] bg-canvas flex flex-col pb-24 shadow-2xl relative border-x border-slate-300">
          {/* 1. Mobile Sticky Top Header */}
          <header className="sticky top-0 z-30 bg-slate-950 text-white px-4 py-3 shadow-md border-b border-slate-800">
            <div className="flex items-center justify-between gap-2">
              {/* Store Identity */}
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={activeStore.logoUrl}
                  alt={activeStore.name}
                  className="w-9 h-9 rounded-xl object-cover border border-slate-700 flex-shrink-0 shadow-2xs"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-xs sm:text-sm font-black text-white truncate tracking-tight">
                      {activeStore.name}
                    </h1>
                    {rushMode && (
                      <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block truncate">
                    KGF Dark Store Counter
                  </span>
                </div>
              </div>

              {/* Quick Actions (Audio Mute & ONLINE/OFFLINE Status) */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Mute Volume Toggle */}
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute audio sounds' : 'Mute audio sounds'}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  )}
                </button>

                {/* CRITICAL STORE ONLINE / OFFLINE TOGGLE */}
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

            {/* Tab 3: Settlement & History */}
            {activeTab === 'settlement' && (
              <div className="space-y-4">
                <DailyMetricsBar onOpenSettlement={() => setIsSettlementOpen(true)} />
                <OrderHistory />
              </div>
            )}

            {/* Tab 4: Store Outlet & Controls */}
            {activeTab === 'store' && (
              <div className="space-y-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                {/* Store Profile Card */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <img
                    src={activeStore.logoUrl}
                    alt={activeStore.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-black text-slate-950 truncate">
                      {activeStore.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Merchant: <strong className="text-slate-800">{merchantUser?.name}</strong>
                    </p>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase font-mono mt-1 inline-block">
                      {activeStore.category}
                    </span>
                  </div>
                </div>

                {/* Outlet Switcher Dropdown */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                    Switch Store Outlet
                  </label>
                  <select
                    value={activeStore.id}
                    onChange={(e) => switchStoreOutlet(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-900 outline-none cursor-pointer"
                  >
                    {mockStores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Operational Toggles */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Store Status</span>
                      <span className="text-[11px] text-slate-500">
                        {isOnline ? '🟢 ONLINE & Accepting orders' : '🔴 OFFLINE (Orders paused)'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={toggleStoreStatus}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold shadow-sm transition-all active:scale-95 cursor-pointer ${
                        isOnline ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      }`}
                    >
                      {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Rush Mode</span>
                      <span className="text-[11px] text-slate-500">+10 min prep buffer for peak hours</span>
                    </div>
                    <button
                      type="button"
                      onClick={toggleRushMode}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 cursor-pointer ${
                        rushMode ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {rushMode ? 'ACTIVE' : 'OFF'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Counter Audio</span>
                      <span className="text-[11px] text-slate-500">
                        {isMuted ? 'Muted' : 'Ringers & alarms active'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                    >
                      {isMuted ? 'Unmute' : 'Mute'}
                    </button>
                  </div>
                </div>

                {/* Logout Action */}
                <button
                  type="button"
                  onClick={logout}
                  className="w-full p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-extrabold flex items-center justify-center gap-2 mt-2 transition-all active:scale-95 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout (Switch Store OFFLINE)</span>
                </button>
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
      )}

      {/* ── MODE 2: PC / LAPTOP MULTI-COLUMN DASHBOARD ── */}
      {viewMode === 'pc' && (
        <div className="w-full min-h-[calc(100vh-38px)] bg-canvas flex flex-col">
          <Header />
          <OfflineBanner />
          <AudioAlertBanner />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            <DailyMetricsBar onOpenSettlement={() => setIsSettlementOpen(true)} />

            <div className="grid grid-cols-12 gap-6 items-start">
              <div className="col-span-7 space-y-6">
                <LiveOrdersQueue />
              </div>
              <div className="col-span-5 space-y-6">
                <LiveMenuManager />
              </div>
            </div>

            <OrderHistory />
          </main>
        </div>
      )}

      {/* Shared Modals (Responsive on both Mobile and PC views) */}
      <PrepTimeModal />
      <RejectModal />
      <AddEditProductModal />
      <DeleteConfirmModal />
      <SettlementModal isOpen={isSettlementOpen} onClose={() => setIsSettlementOpen(false)} />
    </div>
  );
};

export default App;
