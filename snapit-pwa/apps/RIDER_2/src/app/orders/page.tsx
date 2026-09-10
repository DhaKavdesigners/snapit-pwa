'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRider } from '@/context/RiderContext';
import { CheckCircle2, AlertCircle, Store, MapPin, Package } from 'lucide-react';
import { formatOrderNumber } from '@/utils/orderUtils';

export default function OrdersPage() {
  const { ordersHistory, cancelledOrders } = useRider();
  const [selectedTab, setSelectedTab] = useState<'completed' | 'cancelled'>('completed');

  const tabs = [
    { key: 'completed', label: 'Completed', count: ordersHistory.length },
    { key: 'cancelled', label: 'Cancelled', count: cancelledOrders.length },
  ] as const;

  return (
    <AppShell showBack={false} title="Orders">
      <div className="flex flex-col gap-4 pt-4 pb-8 animate-fade-in">

        {/* Header */}
        <div className="px-1">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Orders</h1>
          <p className="text-xs text-slate-500 mt-0.5">Your delivery history</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-200/70 p-1 rounded-2xl border border-slate-300/50 shadow-inner">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedTab(tab.key)}
              className={`flex-1 py-2.5 text-center rounded-xl text-xs font-black transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedTab === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center ${
                selectedTab === tab.key ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-300 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Completed orders */}
        {selectedTab === 'completed' && (
          <div className="flex flex-col gap-3 animate-fade-in">
            {ordersHistory.length > 0 ? (
              ordersHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 cockpit-shadow border border-slate-200/80 flex flex-col gap-2.5"
                >
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-500">
                          #{formatOrderNumber(item.orderNumber)}
                        </span>
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full border border-emerald-200">
                          Done
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-slate-900 mt-1 flex items-center gap-1.5 truncate">
                        <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{item.restaurantName}</span>
                      </h3>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="font-black text-lg text-emerald-600 font-mono">
                        +₹{item.earnings}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{item.deliveryAddress}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10.5px] font-semibold text-slate-400 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {item.items?.length || 1} item{(item.items?.length || 1) > 1 ? 's' : ''}
                    </span>
                    <span>{item.distanceKm || 2.2} km</span>
                    <span>{item.paymentMethod || 'Online'}</span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<CheckCircle2 className="w-8 h-8 text-emerald-400" />}
                title="No deliveries yet"
                subtitle="Your completed orders will appear here"
              />
            )}
          </div>
        )}

        {/* Cancelled orders */}
        {selectedTab === 'cancelled' && (
          <div className="flex flex-col gap-3 animate-fade-in">
            {cancelledOrders.length > 0 ? (
              cancelledOrders.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 cockpit-shadow border border-slate-200/80 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-500">
                          #{formatOrderNumber(item.orderNumber)}
                        </span>
                        <span className="bg-red-50 text-red-600 text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full border border-red-200">
                          Cancelled
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-slate-800 mt-1 flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.restaurantName}</span>
                      </h3>
                    </div>
                    <span className="text-sm font-bold text-slate-400 font-mono ml-2">₹{item.earnings}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{item.deliveryAddress}</span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<AlertCircle className="w-8 h-8 text-slate-300" />}
                title="No cancelled orders"
                subtitle="Cancelled orders will show up here"
              />
            )}
          </div>
        )}

      </div>
    </AppShell>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 bg-white rounded-3xl border border-slate-200/80 cockpit-shadow">
      {icon}
      <div className="text-center">
        <p className="text-sm font-black text-slate-700">{title}</p>
        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}
