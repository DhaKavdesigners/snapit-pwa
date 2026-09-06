'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRider } from '@/context/RiderContext';
import { CheckCircle2, AlertCircle, Store, MapPin } from 'lucide-react';
import { formatOrderNumber } from '@/utils/orderUtils';

export default function OrdersPage() {
  const { ordersHistory, cancelledOrders } = useRider();
  const [selectedTab, setSelectedTab] = useState<'completed' | 'cancelled'>('completed');

  return (
    <AppShell>
      <div className="flex flex-col gap-4 pt-2 pb-8 max-w-md mx-auto w-full">

        {/* ── HEADER ── */}
        <div className="px-1">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Orders</h1>
          <p className="text-xs text-slate-500 mt-0.5">Your delivery history</p>
        </div>

        {/* ── SEGMENTED FILTER TABS (History Only: Completed | Cancelled) ── */}
        <div className="flex bg-slate-200/80 p-1 rounded-2xl w-full border border-slate-300/60 shadow-inner">
          <button
            type="button"
            onClick={() => setSelectedTab('completed')}
            className={`flex-1 py-2.5 text-center rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              selectedTab === 'completed'
                ? 'bg-white text-emerald-800 shadow-sm scale-[1.01]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed ({ordersHistory.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab('cancelled')}
            className={`flex-1 py-2.5 text-center rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              selectedTab === 'cancelled'
                ? 'bg-white text-slate-900 shadow-sm scale-[1.01]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cancelled ({cancelledOrders.length})
          </button>
        </div>

        {/* ═══════════════════════════════════════════
            TAB 1: COMPLETED ORDERS
        ═══════════════════════════════════════════ */}
        {selectedTab === 'completed' && (
          <div className="flex flex-col gap-3 animate-fade-in">
            {ordersHistory.length > 0 ? (
              ordersHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-2.5 hover:border-emerald-300/80 transition-colors"
                >
                  {/* Top Row: Order # + Status + Earning */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-900">
                          #{formatOrderNumber(item.orderNumber)}
                        </span>
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full border border-emerald-200">
                          Completed
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{item.restaurantName}</span>
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-black text-base text-emerald-600 font-mono">
                        +₹{item.earnings}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.timestamp}</p>
                    </div>
                  </div>

                  {/* Destination Location Info (Privacy-first) */}
                  <div className="text-xs text-slate-600 flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-medium">
                        Delivered to: {item.deliveryAddress || 'Customer Location'}
                      </span>
                    </div>
                    {item.distanceKm > 0 && (
                      <span className="font-mono text-[11px] text-slate-400 shrink-0 ml-2">
                        {item.distanceKm} km
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              /* Empty State for Completed */
              <div className="bg-white rounded-3xl p-8 shadow-xs border border-slate-200/80 text-center flex flex-col items-center gap-3 py-14">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-2xs">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    No completed deliveries yet
                  </h3>
                  <p className="text-xs text-slate-500 max-w-[240px] mt-1 leading-relaxed">
                    Your completed deliveries will appear here.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════
            TAB 2: CANCELLED ORDERS
        ═══════════════════════════════════════════ */}
        {selectedTab === 'cancelled' && (
          <div className="flex flex-col gap-3 animate-fade-in">
            {cancelledOrders.length > 0 ? (
              cancelledOrders.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-2.5"
                >
                  {/* Top Row: Order # + Status + Earning */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-800">
                          #{formatOrderNumber(item.orderNumber)}
                        </span>
                        <span className="bg-rose-50 text-rose-700 text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full border border-rose-200">
                          Cancelled
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.restaurantName}</span>
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-xs text-slate-400 font-mono">
                        ₹{item.earnings}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.timestamp}</p>
                    </div>
                  </div>

                  {/* Location info */}
                  <div className="text-xs text-slate-600 flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-medium">
                        Area: {item.deliveryAddress || 'Customer Location'}
                      </span>
                    </div>
                    {item.distanceKm > 0 && (
                      <span className="font-mono text-[11px] text-slate-400 shrink-0 ml-2">
                        {item.distanceKm} km
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              /* Empty State for Cancelled */
              <div className="bg-white rounded-3xl p-8 shadow-xs border border-slate-200/80 text-center flex flex-col items-center gap-3 py-14">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    No cancelled orders
                  </h3>
                  <p className="text-xs text-slate-500 max-w-[240px] mt-1 leading-relaxed">
                    There are no cancelled deliveries to show.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </AppShell>
  );
}
