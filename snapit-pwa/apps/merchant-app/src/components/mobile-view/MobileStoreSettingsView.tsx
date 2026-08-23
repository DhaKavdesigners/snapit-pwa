import React from 'react';
import {
  Power,
  Flame,
  LogOut,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useMerchantStore } from '../../store/useMerchantStore';

export const MobileStoreSettingsView: React.FC = () => {
  const {
    activeStore,
    merchantUser,
    isOnline,
    toggleStoreStatus,
    rushMode,
    toggleRushMode,
    logout,
  } = useMerchantStore();

  return (
    <div className="space-y-4 pb-8">
      {/* Store Profile Card */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center gap-3.5">
          <img
            src={activeStore.logoUrl}
            alt={activeStore.name}
            className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-2xs flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-black text-slate-950 truncate">
              {activeStore.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Merchant: <strong className="text-slate-800">{merchantUser?.name || 'Authorized Merchant'}</strong>
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase font-mono">
                {activeStore.category}
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                KGF Dark Store
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Toggles */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {/* 1. Online / Offline Toggle */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              <Power className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block">Store Status</span>
              <span className="text-[11px] text-slate-500">
                {isOnline ? '🟢 ONLINE (Accepting orders)' : '🔴 OFFLINE (Orders blocked)'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleStoreStatus}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all active:scale-95 shadow-sm cursor-pointer ${
              isOnline
                ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                : 'bg-rose-600 text-white shadow-rose-600/20'
            }`}
          >
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </button>
        </div>

        {/* 2. Rush Mode Toggle */}
        <div className={`p-4 flex items-center justify-between transition-opacity ${
          !isOnline ? 'opacity-50' : 'opacity-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              rushMode && isOnline ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-100 text-slate-400'
            }`}>
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block">Rush Mode</span>
              <span className="text-[11px] text-slate-500">
                {isOnline ? 'Adds +10 min prep buffer' : 'Store must be ONLINE to activate'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleRushMode}
            disabled={!isOnline}
            title={!isOnline ? 'Turn store ONLINE to activate Rush Mode' : 'Toggle Rush Mode'}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all active:scale-95 ${
              !isOnline
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : rushMode
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm cursor-pointer'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer'
            }`}
          >
            {rushMode && isOnline ? 'ACTIVE' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Security info */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center flex items-center justify-center gap-1.5 text-xs text-slate-600">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Authenticated Counter Session &bull; {activeStore.name}</span>
      </div>

      {/* Logout Action */}
      <button
        type="button"
        onClick={logout}
        className="w-full p-4 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 active:scale-95 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>Logout & Switch Store OFFLINE</span>
      </button>
    </div>
  );
};

export default MobileStoreSettingsView;
