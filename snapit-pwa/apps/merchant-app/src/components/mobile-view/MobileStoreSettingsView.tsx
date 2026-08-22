import React, { useState } from 'react';
import {
  Store,
  Power,
  Flame,
  Volume2,
  VolumeX,
  Percent,
  Truck,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useMerchantStore } from '../../store/useMerchantStore';
import { mockStores } from '../../lib/mockData';
import { formatCurrency } from '../../utils/formatters';

export const MobileStoreSettingsView: React.FC = () => {
  const {
    activeStore,
    switchStoreOutlet,
    merchantUser,
    isOnline,
    toggleStoreStatus,
    rushMode,
    toggleRushMode,
    isMuted,
    toggleMute,
    gstPercent,
    setGstPercent,
    deliveryFeePaise,
    setDeliveryFeePaise,
    logout,
  } = useMerchantStore();

  const [isEditingRates, setIsEditingRates] = useState(false);
  const [tempGst, setTempGst] = useState(gstPercent.toString());
  const [tempDeliveryFee, setTempDeliveryFee] = useState((deliveryFeePaise / 100).toString());

  const handleSaveRates = () => {
    setGstPercent(parseFloat(tempGst) || 0);
    setDeliveryFeePaise(Math.round((parseFloat(tempDeliveryFee) || 0) * 100));
    setIsEditingRates(false);
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Store Header Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase font-mono">
                {activeStore.category}
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-[10px] text-slate-500 font-semibold">KGF Dark Store</span>
            </div>
          </div>
        </div>

        {/* Outlet Switcher Dropdown */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
            Switch Outlet Counter
          </label>
          <select
            value={activeStore.id}
            onChange={(e) => switchStoreOutlet(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-900 outline-none"
          >
            {mockStores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.category.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Operational Toggles */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {/* 1. Online / Offline Toggle */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${
              isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              <Power className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block">Store Status</span>
              <span className="text-[11px] text-slate-500">
                {isOnline ? '🟢 ONLINE & Accepting orders' : '🔴 OFFLINE (Orders blocked)'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleStoreStatus}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 shadow-sm ${
              isOnline
                ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                : 'bg-rose-600 text-white shadow-rose-600/20'
            }`}
          >
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </button>
        </div>

        {/* 2. Rush Mode */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${
              rushMode ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-100 text-slate-500'
            }`}>
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block">Rush Mode</span>
              <span className="text-[11px] text-slate-500">Adds +10 min auto prep buffer</span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleRushMode}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 ${
              rushMode
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {rushMode ? 'ACTIVE' : 'OFF'}
          </button>
        </div>

        {/* 3. Audio Alarm Volume */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-600" /> : <Volume2 className="w-5 h-5 text-emerald-600" />}
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block">Counter Sound</span>
              <span className="text-[11px] text-slate-500">
                {isMuted ? 'Muted' : 'Audio ringer & alarms active'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleMute}
            className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-extrabold active:scale-95"
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
        </div>
      </div>

      {/* Tax & Operational Rates */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-900">Taxes & Base Delivery Fee</span>
          {isEditingRates ? (
            <button
              type="button"
              onClick={handleSaveRates}
              className="text-xs font-bold text-emerald-700 underline"
            >
              Save Changes
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingRates(true)}
              className="text-xs font-bold text-emerald-700 underline"
            >
              Edit Rates
            </button>
          )}
        </div>

        {isEditingRates ? (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">GST %</label>
              <input
                type="number"
                value={tempGst}
                onChange={(e) => setTempGst(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Delivery Fee (₹)</label>
              <input
                type="number"
                value={tempDeliveryFee}
                onChange={(e) => setTempDeliveryFee(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 block">Store GST:</span>
              <strong className="text-sm font-bold text-slate-900">{gstPercent}%</strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 block">Delivery Fee:</span>
              <strong className="text-sm font-bold text-slate-900">{formatCurrency(deliveryFeePaise)}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Logout (Auto-Offlines store) */}
      <button
        type="button"
        onClick={logout}
        className="w-full p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 active:scale-95 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>Logout & Switch Store OFFLINE</span>
      </button>
    </div>
  );
};
