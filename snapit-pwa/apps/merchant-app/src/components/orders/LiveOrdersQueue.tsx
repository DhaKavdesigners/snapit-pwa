import React from 'react';
import {
  ShoppingBag,
  BellRing,
  Sparkles,
  Inbox,
  Layers,
  Radio,
} from 'lucide-react';
import { useMerchantStore } from '../../store/useMerchantStore';
import { LiveOrderCard } from './LiveOrderCard';
import type { Order } from '../../types/snapit-types';

export const LiveOrdersQueue: React.FC = () => {
  const {
    orders,
    orderFilter,
    setOrderFilter,
    isOnline,
    toggleStoreStatus,
  } = useMerchantStore();

  const placedCount = orders.filter((o) => o.status === 'PLACED' || o.status === 'PENDING').length;
  const preparingCount = orders.filter((o) => o.status === 'PREPARING' || o.status === 'ACCEPTED').length;
  const readyCount = orders.filter((o) => o.status === 'READY_FOR_PICKUP' || o.status === 'READY').length;
  const outOfShopCount = orders.filter((o) => o.status === 'OUT_OF_SHOP').length;

  // Natural priority sorting: Placed (top priority) -> Preparing -> Ready for Pickup -> Out of shop
  const priorityScore = (order: Order) => {
    if (order.status === 'PLACED' || order.status === 'PENDING') return 1;
    if (order.status === 'PREPARING' || order.status === 'ACCEPTED') return 2;
    if (order.status === 'READY_FOR_PICKUP' || order.status === 'READY') return 3;
    if (order.status === 'OUT_OF_SHOP') return 4;
    return 5;
  };

  const sortedOrders = [...orders].sort((a, b) => {
    const scoreDiff = priorityScore(a) - priorityScore(b);
    if (scoreDiff !== 0) return scoreDiff;
    // Newest first within same group
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Filter orders (Default is ALL so merchant sees everything without changing tabs)
  const filteredOrders = sortedOrders.filter((order) => {
    if (orderFilter === 'ALL') return true;
    if (orderFilter === 'PLACED') return order.status === 'PLACED' || order.status === 'PENDING';
    if (orderFilter === 'PREPARING') return order.status === 'PREPARING' || order.status === 'ACCEPTED';
    if (orderFilter === 'READY_FOR_PICKUP') return order.status === 'READY_FOR_PICKUP' || order.status === 'READY';
    if (orderFilter === 'OUT_OF_SHOP') return order.status === 'OUT_OF_SHOP';
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 flex flex-col h-full">
      {/* 1. Header & Controls */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm sm:text-base font-black text-slate-950 tracking-tight">
              LIVE QUEUE
            </h2>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono flex items-center gap-1 ${
              isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Real-time order progression
          </p>
        </div>

        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
          orders.length > 0
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-xs'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <ShoppingBag className={`w-3.5 h-3.5 ${orders.length > 0 ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span className="text-[11px] font-black font-mono tracking-tight">
            {orders.length} ACTIVE {orders.length === 1 ? 'ORDER' : 'ORDERS'}
          </span>
        </div>
      </div>

      {/* 2. Counter Status Summary Bar (Clickable quick filters, default is ALL ACTIVE) */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-3 scrollbar-none border-b border-slate-100 text-xs">
        {/* Default All Live Feed */}
        <button
          type="button"
          onClick={() => setOrderFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl font-extrabold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
            orderFilter === 'ALL'
              ? 'bg-slate-950 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Live Counter ({orders.length})</span>
        </button>

        {/* New / Placed Count */}
        <button
          type="button"
          onClick={() => setOrderFilter(orderFilter === 'PLACED' ? 'ALL' : 'PLACED')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
            orderFilter === 'PLACED'
              ? 'bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-500/30'
              : placedCount > 0
              ? 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BellRing className="w-3.5 h-3.5 text-amber-600" />
          <span>New / Placed</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
            placedCount > 0 ? 'bg-amber-950 text-amber-300 animate-pulse' : 'bg-slate-200 text-slate-700'
          }`}>
            {placedCount}
          </span>
        </button>

        {/* Packing Count */}
        <button
          type="button"
          onClick={() => setOrderFilter(orderFilter === 'PREPARING' ? 'ALL' : 'PREPARING')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
            orderFilter === 'PREPARING'
              ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/30'
              : preparingCount > 0
              ? 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
          <span>Packing</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
            preparingCount > 0 ? 'bg-blue-200 text-blue-950' : 'bg-slate-200 text-slate-700'
          }`}>
            {preparingCount}
          </span>
        </button>

        {/* Ready for Pickup Count */}
        <button
          type="button"
          onClick={() => setOrderFilter(orderFilter === 'READY_FOR_PICKUP' ? 'ALL' : 'READY_FOR_PICKUP')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
            orderFilter === 'READY_FOR_PICKUP'
              ? 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-500/30'
              : readyCount > 0
              ? 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>Ready for Pickup</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
            readyCount > 0 ? 'bg-purple-200 text-purple-950' : 'bg-slate-200 text-slate-700'
          }`}>
            {readyCount}
          </span>
        </button>

        {/* Handed Over / Out of Shop Count */}
        {outOfShopCount > 0 && (
          <button
            type="button"
            onClick={() => setOrderFilter(orderFilter === 'OUT_OF_SHOP' ? 'ALL' : 'OUT_OF_SHOP')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
              orderFilter === 'OUT_OF_SHOP'
                ? 'bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-500/30'
                : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
            <span>Handed Over</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-amber-200 text-amber-950">
              {outOfShopCount}
            </span>
          </button>
        )}
      </div>

      {/* 3. Orders List (In-Place Flow) */}
      <div className="pt-4 flex-1">
        {filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <LiveOrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 mb-3">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              No active orders in this queue
            </h3>
            <p className="text-xs text-slate-600 max-w-sm mb-4">
              {isOnline
                ? 'Your store is ONLINE and ready. Real orders placed in the Customer app will ring here automatically.'
                : 'Your store is currently OFFLINE. Switch your store ONLINE to start accepting customer orders.'}
            </p>
            {!isOnline && (
              <button
                type="button"
                onClick={toggleStoreStatus}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-extrabold rounded-xl shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Switch Store ONLINE</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveOrdersQueue;
