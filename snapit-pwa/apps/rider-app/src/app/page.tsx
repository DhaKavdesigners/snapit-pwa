'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { LiveMap } from '@/components/dashboard/LiveMap';
import { QuickStatsBento } from '@/components/dashboard/QuickStatsBento';
import { IncomingOrderModal } from '@/components/dashboard/IncomingOrderModal';
import { LiveOrderTracker } from '@/components/dashboard/LiveOrderTracker';
import { useRider } from '@/context/RiderContext';
import Link from 'next/link';
import { Sparkles, ShieldCheck, UserCheck, Hourglass, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { isOnline, activeOrder, incomingOrder, triggerMockOrder, rider, simulateApproval } = useRider();
  const router = useRouter();

  // STRICT GUARD: If rider is NOT verified, lock them into the Approval Status Screen!
  if (!rider.isVerified) {
    return (
      <AppShell showHeader={false} showNav={false} noPadding={true}>
        <div className="min-h-screen bg-background flex flex-col justify-between p-6 max-w-sm mx-auto animate-fade-in">
          
          <div className="flex flex-col items-center text-center mt-8">
            {/* Animated Hourglass & Radar */}
            <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 rounded-full radar-ring" />
              <div className="relative z-10 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-soft border border-slate-200">
                <Hourglass className="w-8 h-8 text-primary animate-pulse" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-4 py-1 rounded-full text-xs font-bold border border-amber-200 mb-3">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>Status: Verification In Progress</span>
            </div>

            <h1 className="text-2xl font-black text-on-surface tracking-tight">
              Awaiting Admin Approval
            </h1>
            <p className="text-xs text-secondary mt-2 leading-relaxed max-w-[280px]">
              Hi <strong>{rider.name}</strong>, your KYC documents (Aadhaar, PAN, DL) and live selfie are currently under manual review.
            </p>
          </div>

          {/* Verification Status Stepper Card */}
          <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 my-4">
            <h3 className="font-bold text-xs text-on-surface mb-3.5 flex justify-between">
              <span>Verification Checklist</span>
              <span className="text-primary font-mono text-[11px] font-bold">Step 3 of 4</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">
                  <Check className="w-3 h-3" />
                </div>
                <span className="font-semibold text-on-surface">Live Selfie Captured & Matched</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">
                  <Check className="w-3 h-3" />
                </div>
                <span className="font-semibold text-on-surface">Aadhaar & PAN Scans Validated</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary-container text-white flex items-center justify-center text-[10px] animate-pulse">
                  <Check className="w-3 h-3" />
                </div>
                <span className="font-bold text-primary">Driving License Authenticity</span>
              </div>

              <div className="flex items-center gap-3 opacity-50">
                <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">
                  4
                </div>
                <span className="text-secondary">Admin Onboarding Approval</span>
              </div>
            </div>
          </div>

          {/* Actions: Instant Approval Simulator */}
          <div className="space-y-3 pb-4">
            <button
              onClick={() => simulateApproval()}
              className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-white font-bold text-xs rounded-2xl shadow-lift hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Simulate Admin Approval & Unlock Dashboard</span>
            </button>

            <Link
              href="/onboarding"
              className="block text-center text-xs font-bold text-secondary hover:text-primary transition-colors py-1"
            >
              Re-edit Application Form →
            </Link>
          </div>

        </div>
      </AppShell>
    );
  }

  // APPROVED RIDER DASHBOARD
  return (
    <AppShell noPadding={true}>
      <div className="relative w-full h-[calc(100vh-64px)] min-h-[780px] overflow-hidden flex flex-col justify-between">
        
        {/* Full Interactive Live GPS Vector & Demand Map */}
        <LiveMap showRoute={!!activeOrder} />

        {/* Floating Top Demand Pill */}
        <div className="relative z-20 pt-3 px-4 flex flex-col items-center gap-2 pointer-events-auto">
          {isOnline ? (
            <div className="bg-white/90 backdrop-blur-md shadow-[0px_4px_20px_rgba(15,23,42,0.08)] rounded-full px-5 py-2.5 border border-outline-variant/30 flex items-center gap-2.5 animate-fade-in max-w-sm">
              <span
                className="material-symbols-outlined text-primary text-[20px] animate-pulse"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                location_on
              </span>
              <span className="text-xs font-semibold text-on-surface truncate">
                Finding nearby orders in <strong className="text-primary">{rider.selectedZone || 'Downtown Central'}</strong>...
              </span>
            </div>
          ) : (
            <div className="bg-slate-900/80 backdrop-blur-md shadow-soft rounded-full px-5 py-2 border border-slate-700 flex items-center gap-2 text-white animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-xs font-medium text-slate-200">
                You are currently Offline. Turn switch On to receive orders.
              </span>
            </div>
          )}
        </div>

        {/* Bottom Floating Canvas on Home Cockpit */}
        <div className="relative z-20 p-4 pb-20 flex flex-col gap-3 pointer-events-auto">
          
          {/* Active Order with Live Slider Tracking directly on Home Screen! */}
          {activeOrder && <LiveOrderTracker />}

          {/* Incoming Order Request Floating Card */}
          {incomingOrder && !activeOrder && <IncomingOrderModal />}

          {/* Quick Stats Bento Row (Today's Earnings & Deliveries) */}
          <QuickStatsBento />

          {/* Simulation Controls for testing */}
          <div className="flex items-center justify-between px-1">
            {!incomingOrder && !activeOrder && isOnline && (
              <button
                onClick={triggerMockOrder}
                className="text-[11px] font-bold text-primary flex items-center gap-1 bg-white/80 hover:bg-white px-3 py-1.5 rounded-full border border-primary/20 shadow-sm transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Simulate New Delivery Request
              </button>
            )}

            <Link
              href="/onboarding"
              className="text-[11px] font-semibold text-secondary hover:text-primary flex items-center gap-1 ml-auto bg-white/70 px-2.5 py-1 rounded-full border border-outline-variant/30 transition-colors"
            >
              <UserCheck className="w-3 h-3" />
              Re-open Onboarding
            </Link>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
