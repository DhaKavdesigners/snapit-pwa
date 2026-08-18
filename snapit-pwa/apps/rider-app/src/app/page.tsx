'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { LiveMap } from '@/components/dashboard/LiveMap';
import { QuickStatsBento } from '@/components/dashboard/QuickStatsBento';
import { IncomingOrderModal } from '@/components/dashboard/IncomingOrderModal';
import { useRider } from '@/context/RiderContext';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export default function DashboardPage() {
  const { isOnline, activeOrder, incomingOrder, triggerMockOrder, rider } = useRider();

  return (
    <AppShell noPadding={true}>
      {/* Container holding Live Map and Floating Layers */}
      <div className="relative w-full h-[calc(100vh-64px)] min-h-[780px] overflow-hidden flex flex-col justify-between">
        
        {/* Full Interactive Live Vector & Satellite Map */}
        <LiveMap showRoute={!!activeOrder} />

        {/* Floating Top Demand Pill matching Stitch Screen 1 */}
        <div className="relative z-20 pt-3 px-4 flex flex-col items-center gap-2 pointer-events-auto">
          {/* If rider is not verified yet, show warning badge to complete onboarding */}
          {!rider.isVerified ? (
            <Link
              href="/onboarding"
              className="w-full bg-amber-500 text-white rounded-2xl p-3 shadow-floating flex items-center justify-between animate-pulse"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-xs font-bold">Profile Verification Incomplete</span>
              </div>
              <span className="text-[11px] font-semibold underline">Complete Now →</span>
            </Link>
          ) : isOnline ? (
            <div className="bg-white/90 backdrop-blur-md shadow-[0px_4px_20px_rgba(15,23,42,0.08)] rounded-full px-5 py-2.5 border border-outline-variant/30 flex items-center gap-2.5 animate-fade-in max-w-sm">
              <span
                className="material-symbols-outlined text-primary text-[20px] animate-pulse"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                location_on
              </span>
              <span className="text-xs font-semibold text-on-surface truncate">
                Finding nearby orders in <strong className="text-primary">Downtown Central</strong>...
              </span>
            </div>
          ) : (
            <div className="bg-slate-900/80 backdrop-blur-md shadow-soft rounded-full px-5 py-2 border border-slate-700 flex items-center gap-2 text-white animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-xs font-medium text-slate-200">
                You are currently Offline. Turn Online to receive orders.
              </span>
            </div>
          )}
        </div>

        {/* Floating Bottom Cockpit Canvas matching Stitch Level 1 & 2 Elevation */}
        <div className="relative z-20 p-4 pb-20 flex flex-col gap-3 pointer-events-auto">
          
          {/* Active Order in Progress Banner (if active delivery exists) */}
          {activeOrder && (
            <Link
              href="/orders"
              className="bg-primary text-white rounded-2xl p-4 shadow-lift flex items-center justify-between animate-slide-up group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">local_shipping</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                      Active Delivery
                    </span>
                    <span className="text-xs font-mono font-bold">#{activeOrder.orderNumber}</span>
                  </div>
                  <p className="text-xs font-semibold mt-0.5">{activeOrder.restaurantName}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold bg-white text-primary px-3 py-1.5 rounded-xl group-hover:bg-primary-fixed transition-colors">
                <span>View Route</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          )}

          {/* Incoming Order Request Card (Stitch Screen 1 Floating Card) */}
          {incomingOrder && !activeOrder && <IncomingOrderModal />}

          {/* Bento Stats Row (Today's Earnings & Deliveries Count) */}
          <QuickStatsBento />

          {/* Quick Simulation Bar (Helper for testing) */}
          <div className="flex items-center justify-between px-1">
            {!incomingOrder && !activeOrder && isOnline && (
              <button
                onClick={triggerMockOrder}
                className="text-[11px] font-bold text-primary flex items-center gap-1 bg-white/80 hover:bg-white px-3 py-1.5 rounded-full border border-primary/20 shadow-sm transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Simulate New Request
              </button>
            )}

            <Link
              href="/onboarding"
              className="text-[11px] font-semibold text-secondary hover:text-primary flex items-center gap-1 ml-auto bg-white/70 px-2.5 py-1 rounded-full border border-outline-variant/30 transition-colors"
            >
              <UserCheck className="w-3 h-3" />
              Onboarding Flow
            </Link>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
