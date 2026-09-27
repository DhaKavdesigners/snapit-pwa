'use client';

import React from 'react';
import { useRider } from '@/context/RiderContext';
import {
  MapPin,
  CheckCircle2,
  ArrowRight,
  Power,
  Store,
  Clock,
  Package,
  Navigation,
  KeyRound,
  X,
  Sparkles,
} from 'lucide-react';

export const RiderDemoController: React.FC = () => {
  const {
    isDemoMode,
    demoStep,
    setDemoStep,
    advanceDemoStep,
    completeInteractiveDemo,
    rider,
    isOnline,
    toggleOnline,
    triggerMockOrder,
    simulateMerchantReadyForPickup,
    simulateShopkeeperHandover,
    activeOrder,
  } = useRider();

  if (!isDemoMode || demoStep === 'idle' || demoStep === 'completed') {
    return null;
  }

  // ─── 1. ZONE CHECK MODAL ──────────────────────────────────────────────────
  if (demoStep === 'zone_check') {
    return (
      <div className="fixed inset-0 z-[99992] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in select-none">
        <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-emerald-500/30 flex flex-col p-6 space-y-4 animate-scale-up">
          
          {/* Header & Momo Avatar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center">
                1
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700">
                Demo Step 1 of 5 • Zone Check
              </span>
            </div>
            <button
              onClick={completeInteractiveDemo}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Visual Hero */}
          <div className="w-full h-28 bg-gradient-to-tr from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center border border-emerald-200/80 overflow-hidden relative">
            <img
              src="/images/momo/templates/momo_zas_store.png"
              alt="Zone Verification"
              className="h-full object-contain filter drop-shadow-sm"
            />
            <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <CheckCircle2 className="w-3 h-3" />
              <span>Zone Verified</span>
            </div>
          </div>

          {/* Explanation */}
          <div className="text-center space-y-1">
            <h3 className="text-lg font-black text-slate-900 leading-tight">
              Check Your Allotted Zone 📍
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Always ensure you are inside your assigned operating zone before switching online so orders can be dispatched to you.
            </p>
          </div>

          {/* Live Zone Check Verification Card */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-2 text-left shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500">Allotted Operating Zone</span>
              <span className="font-black text-slate-900 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                {rider.selectedZone || 'Robertsonpet, KGF'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/70">
              <span className="font-bold text-slate-500">GPS Proximity Status</span>
              <span className="font-black text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                <span>Inside Zone (Verified ✅)</span>
              </span>
            </div>
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={() => setDemoStep('go_online')}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <span>I&apos;m Inside Zone &rarr; Go Online 🚀</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ─── 2. GO ONLINE SPOTLIGHT PROMPT ─────────────────────────────────────────
  if (demoStep === 'go_online') {
    return (
      <div className="fixed top-20 left-4 right-4 max-w-sm mx-auto z-[99992] animate-slide-down">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-4 shadow-2xl border border-emerald-400/40 ring-4 ring-emerald-500/20 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/40">
                <Power className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                  Demo Step 2 of 5
                </span>
                <h4 className="text-xs font-black text-white">
                  Switch Online to Receive Orders
                </h4>
              </div>
            </div>

            <button
              onClick={completeInteractiveDemo}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
            Momo says: &ldquo;Tap the switch at the top right to start your shift. In this demo, tap the button below to turn online instantly!&rdquo;
          </p>

          <button
            type="button"
            onClick={() => {
              if (!isOnline) toggleOnline();
              setDemoStep('accept_order');
              setTimeout(() => {
                triggerMockOrder();
              }, 600);
            }}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <Power className="w-4 h-4 stroke-[2.5]" />
            <span>Turn Online Now &amp; Get Order 🚀</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── 3. ACCEPT ORDER GUIDANCE ──────────────────────────────────────────────
  if (demoStep === 'accept_order') {
    return (
      <div className="fixed top-4 left-4 right-4 max-w-sm mx-auto z-[99992] animate-slide-down">
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-3.5 shadow-2xl border-2 border-emerald-400 ring-4 ring-emerald-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl animate-bounce">🔔</span>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">
                Incoming Delivery Offer
              </span>
              <p className="text-xs font-black text-white truncate">
                Tap ACCEPT ORDER below to take this delivery!
              </p>
            </div>
          </div>

          <button
            onClick={completeInteractiveDemo}
            className="text-emerald-300 hover:text-white p-1 rounded-lg shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // ─── 4. NAVIGATE TO STORE GUIDANCE & ARRIVAL SIMULATION ─────────────────────
  if (demoStep === 'navigate_store' && activeOrder) {
    return (
      <div className="fixed top-4 left-4 right-4 max-w-sm mx-auto z-[99992] animate-slide-down">
        <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-emerald-500 ring-4 ring-emerald-500/20 space-y-2.5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                  Step 3 • Store Navigation
                </span>
                <h4 className="text-xs font-black text-slate-900">
                  Head to {activeOrder.restaurantName}
                </h4>
              </div>
            </div>

            <button
              onClick={completeInteractiveDemo}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
            Follow the map route to the restaurant. When you arrive at the store counter, tap below to simulate arrival!
          </p>

          <button
            type="button"
            onClick={() => {
              setDemoStep('wait_packaging');
            }}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
          >
            <span>I&apos;ve Arrived at Store 🏬</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // ─── 5. WAIT FOR PACKAGING & STORE HANDOVER ────────────────────────────────
  if (demoStep === 'wait_packaging' && activeOrder) {
    return (
      <div className="fixed top-4 left-4 right-4 max-w-sm mx-auto z-[99992] animate-slide-down">
        <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-amber-500 ring-4 ring-amber-500/20 space-y-2.5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Clock className="w-4 h-4 animate-spin" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
                  Step 4 • Store Packaging &amp; Handover
                </span>
                <h4 className="text-xs font-black text-slate-900">
                  Waiting for Store Handover
                </h4>
              </div>
            </div>

            <button
              onClick={completeInteractiveDemo}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
            Wait near counter while store packs items. Ask merchant to swipe <strong>Handover</strong> on their app. Tap below to simulate merchant handover swipe!
          </p>

          <button
            type="button"
            onClick={() => {
              simulateShopkeeperHandover(true);
              setDemoStep('handover_ready');
            }}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
          >
            <span>Merchant Swiped Handover ✅</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // ─── 6. HANDOVER READY GUIDANCE ────────────────────────────────────────────
  if (demoStep === 'handover_ready' && activeOrder) {
    return (
      <div className="fixed top-4 left-4 right-4 max-w-sm mx-auto z-[99992] animate-slide-down">
        <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-emerald-500 ring-4 ring-emerald-500/20 space-y-2">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <h4 className="text-xs font-black text-slate-900">
              Handover Confirmed by Merchant!
            </h4>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
            Now slide <strong>&ldquo;SLIDE TO CONFIRM PICKUP&rdquo;</strong> on the active order card below to begin delivery!
          </p>
        </div>
      </div>
    );
  }

  // ─── 7. NAVIGATE TO CUSTOMER GUIDANCE ──────────────────────────────────────
  if (demoStep === 'navigate_customer' && activeOrder) {
    return (
      <div className="fixed top-4 left-4 right-4 max-w-sm mx-auto z-[99992] animate-slide-down">
        <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-blue-500 ring-4 ring-blue-500/20 space-y-2">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-600" />
            <h4 className="text-xs font-black text-slate-900">
              Delivering to {activeOrder.customerName || 'Customer'}
            </h4>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
            Head to customer address. When you arrive at doorstep, slide <strong>&ldquo;SLIDE: ARRIVED AT LOCATION&rdquo;</strong> below!
          </p>
        </div>
      </div>
    );
  }

  return null;
};
