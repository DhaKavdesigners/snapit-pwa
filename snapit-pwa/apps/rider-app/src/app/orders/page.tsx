'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRider } from '@/context/RiderContext';
import { SlideToConfirm } from '@/components/orders/SlideToConfirm';
import { LiveRiderNavigation } from '@/components/navigation/LiveRiderNavigation';
import { Phone, Check, Package, Clock, AlertCircle, ShieldCheck, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OrdersPage() {
  const {
    rider,
    activeOrder,
    ordersHistory,
    cancelledOrders,
    advanceActiveOrderStatus,
    triggerMockOrder,
    markOrderPickedUp,
    nonAcceptanceCount,
    simulateMerchantReadyForPickup,
    simulateShopkeeperHandover,
    resetActiveOrder,
  } = useRider();
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed' | 'cancelled'>('active');
  const [isFullScreenNav, setIsFullScreenNav] = useState<boolean>(false);
  const router = useRouter();

  // Strict Sequential Action Handlers
  const handleNextStepAction = () => {
    if (!activeOrder) return;
    if (activeOrder.status === 'accepted' || activeOrder.status === 'picking_up' || activeOrder.status === 'arrived_at_pickup') {
      markOrderPickedUp();
    } else if (activeOrder.status === 'in_transit') {
      advanceActiveOrderStatus();
    } else if (activeOrder.status === 'arrived_at_dropoff') {
      router.push('/confirm-delivery');
    }
  };

  // Label configuration for the slider
  const getSingleNextActionConfig = () => {
    if (!activeOrder) return { type: 'slider', label: '', success: '', hint: '', disabled: false };
    
    // Check if store has prepared and marked order ready in Supabase
    const isReadyForPickup =
      activeOrder.dbStatus === 'READY_FOR_PICKUP' ||
      activeOrder.dbStatus === 'OUT_OF_SHOP' ||
      activeOrder.dbStatus === 'OUT_FOR_DELIVERY' ||
      Boolean(activeOrder.shopkeeperHandoverConfirmed);

    // Pickup & Handover Stage
    if (activeOrder.status === 'accepted' || activeOrder.status === 'picking_up' || activeOrder.status === 'arrived_at_pickup') {
      const isRiderConfirmed = Boolean(activeOrder.riderPickupConfirmed);
      const isShopConfirmed = Boolean(activeOrder.shopkeeperHandoverConfirmed || activeOrder.dbStatus === 'OUT_OF_SHOP');

      if (!isReadyForPickup) {
        return {
          type: 'slider',
          label: 'ORDER PICKED UP',
          success: 'Waiting for Store...',
          hint: '⏳ Store is preparing the order... Waiting for store to mark Ready for Pickup.',
          disabled: true,
        };
      }

      if (isRiderConfirmed && !isShopConfirmed) {
        return {
          type: 'slider',
          label: 'AWAITING SHOPKEEPER HANDOVER',
          success: 'Waiting...',
          hint: 'You confirmed pickup. Waiting for shopkeeper to hand over package.',
          disabled: true,
        };
      }

      return {
        type: 'slider',
        label: 'ORDER PICKED UP',
        success: 'Order Collected!',
        hint: 'Order is ready at store. Slide to confirm physical pickup from merchant.',
        disabled: false,
      };
    }

    // Stage 3: Out for delivery (Both confirmed)
    if (activeOrder.status === 'in_transit') {
      return {
        type: 'slider',
        label: 'ARRIVED AT CUSTOMER',
        success: 'Arrived at Customer!',
        hint: 'You are at the customer delivery location',
        disabled: false,
      };
    }

    // Stage 4: Arrived at dropoff -> OTP verification
    if (activeOrder.status === 'arrived_at_dropoff') {
      return {
        type: 'button',
        label: 'Verify Delivery OTP',
        success: '',
        hint: 'Verify the OTP with the customer to complete delivery',
        disabled: false,
      };
    }

    return { type: 'slider', label: 'Update Status', success: 'Done', hint: '', disabled: false };
  };

  const actionConfig = getSingleNextActionConfig();

  // Status badge
  const getStatusBadgeLabel = () => {
    if (!activeOrder) return '';
    const isReadyForPickup =
      activeOrder.dbStatus === 'READY_FOR_PICKUP' ||
      activeOrder.dbStatus === 'OUT_OF_SHOP' ||
      activeOrder.dbStatus === 'OUT_FOR_DELIVERY' ||
      Boolean(activeOrder.shopkeeperHandoverConfirmed);

    if (activeOrder.status === 'accepted' || activeOrder.status === 'picking_up' || activeOrder.status === 'arrived_at_pickup') {
      if (!isReadyForPickup) return 'STORE PREPARING ORDER';
      if (activeOrder.riderPickupConfirmed && !activeOrder.shopkeeperHandoverConfirmed && activeOrder.dbStatus !== 'OUT_OF_SHOP') {
        return 'AWAITING SHOPKEEPER HANDOVER';
      }
      return 'READY FOR PICKUP';
    }
    if (activeOrder.status === 'in_transit') return 'OUT FOR DELIVERY';
    if (activeOrder.status === 'arrived_at_dropoff') return 'ARRIVED AT CUSTOMER';
    if (activeOrder.status === 'delivered') return 'DELIVERED';
    return 'ACTIVE ORDER';
  };

  const isPickupDone = activeOrder?.status === 'in_transit' || activeOrder?.status === 'arrived_at_dropoff' || activeOrder?.status === 'delivered';
  const isDeliveredDone = activeOrder?.status === 'delivered';

  return (
    <AppShell>
      <div className="flex flex-col gap-4 pt-2 pb-8">

        {/* Acceptance warning banner */}
        {nonAcceptanceCount >= 1 && (
          <div className={`rounded-2xl px-4 py-3 flex items-center gap-2.5 border ${
            nonAcceptanceCount >= 3 ? 'bg-red-50 border-red-300' : 'bg-amber-50 border-amber-300'
          }`}>
            <AlertCircle className={`w-4 h-4 shrink-0 ${nonAcceptanceCount >= 3 ? 'text-red-500' : 'text-amber-600'}`} />
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-800">
                {nonAcceptanceCount >= 3 ? '🔴 Acceptance Threshold Reached' : '⚠️ Order Acceptance Warning'}
              </p>
              <p className="text-[11px] text-slate-500">
                {nonAcceptanceCount} non-accepted order{nonAcceptanceCount !== 1 ? 's' : ''} during current slot.
              </p>
            </div>
          </div>
        )}

        {/* Segmented Control Filter Tabs */}
        <div className="flex bg-slate-200/80 p-1 rounded-2xl w-full border border-slate-300/60 shadow-inner">
          {(['active', 'completed', 'cancelled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`flex-1 py-2 text-center rounded-xl text-xs font-bold transition-all duration-200 ${
                selectedTab === tab
                  ? 'bg-white text-primary shadow-soft scale-[1.02]'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              {tab === 'active' ? `Active${activeOrder ? ' (1)' : ''}` : tab === 'completed' ? `Completed (${ordersHistory.length})` : `Cancelled (${cancelledOrders.length})`}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════
            TAB 1: ACTIVE ORDERS
        ═══════════════════════════════════════════ */}
        {selectedTab === 'active' && (
          <>
            {activeOrder ? (
              <div className="flex flex-col gap-3 animate-fade-in">

                {/* 1. LIVE NAVIGATION MAP — compact, light-themed, in-map overlays */}
                <LiveRiderNavigation
                  order={activeOrder}
                  isFullScreen={isFullScreenNav}
                  onToggleFullScreen={() => setIsFullScreenNav((fs) => !fs)}
                />

                {/* 2. ORDER DETAILS CARD — matches reference screenshot layout */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                  {/* Header: Status badge + Earnings */}
                  <div className="px-4 pt-4 pb-3 flex items-start justify-between">
                    <div>
                      <span className="inline-block border border-green-500 text-green-600 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                        {getStatusBadgeLabel()}
                      </span>
                      <h3 className="font-bold text-[15px] text-slate-900 mt-1.5 font-mono tracking-tight">
                        Order #{activeOrder.orderNumber}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[22px] text-green-600 font-mono leading-none">
                        ₹{activeOrder.earnings}
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">
                        Est. Earnings
                      </p>
                    </div>
                  </div>

                  {/* Route: Pickup → Dropoff vertical layout (matches reference) */}
                  <div className="px-4 pb-3 flex flex-col gap-0">
                    {/* Pickup row */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center pt-0.5">
                        <div className="w-4 h-4 rounded-full border-2 border-green-500 bg-white flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        </div>
                        {/* Dashed vertical line */}
                        <div className="w-px h-8 border-l-2 border-dashed border-slate-300 mt-0.5" />
                      </div>
                      <div className="pb-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Pickup Store
                        </p>
                        <p className="text-[13px] font-bold text-slate-900 mt-0.5">
                          {activeOrder.restaurantName}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                          {activeOrder.restaurantAddress}
                        </p>
                      </div>
                    </div>

                    {/* Customer dropoff row */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center pt-0.5">
                        <div className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Customer Dropoff
                        </p>
                        <p className="text-[13px] font-bold text-slate-900 mt-0.5">
                          {activeOrder.customerName}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                          {activeOrder.deliveryAddress}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Distance & time info row */}
                  <div className="px-4 pb-3 flex items-center gap-4">
                    <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{activeOrder.estimatedMinutes} min</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>{activeOrder.distanceKm} km</span>
                    </div>
                    {/* Call customer */}
                    <div className="ml-auto">
                      <a
                        href={`tel:${activeOrder.customerPhone}`}
                        className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-primary active:scale-95"
                        title="Call Customer"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Hint strip — "Collect the order and head to customer location" */}
                  {actionConfig.hint && (
                    <div className="mx-4 mb-3 bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span className="text-[11px] text-green-700 font-medium">{actionConfig.hint}</span>
                    </div>
                  )}

                    {/* ── SLIDE TO ACTION — dark green pill (matches reference) ── */}
                  <div className="px-4 pb-3">
                    {actionConfig.type === 'slider' ? (
                      <div className="relative">
                        <SlideToConfirm
                          key={`${activeOrder.status}-${activeOrder.riderPickupConfirmed}-${activeOrder.shopkeeperHandoverConfirmed}`}
                          label={actionConfig.label}
                          successLabel={actionConfig.success}
                          disabled={actionConfig.disabled}
                          onConfirm={handleNextStepAction}
                        />
                      </div>
                    ) : (
                      <button
                        onClick={handleNextStepAction}
                        className="w-full py-4 bg-gradient-to-r from-green-700 to-green-600 hover:opacity-95 text-white font-extrabold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{actionConfig.label}</span>
                      </button>
                    )}
                  </div>

                  {/* ── TEMPORARY DEV HANDOVER SIMULATOR ── */}
                  <div className="mx-4 mb-4 p-3 rounded-2xl bg-slate-900 text-white shadow-md border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="flex items-center gap-1.5 text-purple-300">
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                        🧪 Temporary Dev Handover Simulator
                      </span>
                      <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        DB: {activeOrder.dbStatus || 'PREPARING'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {/* Step 1: Merchant Marks Ready for Pickup */}
                      <button
                        onClick={() => simulateMerchantReadyForPickup(activeOrder.dbStatus !== 'READY_FOR_PICKUP')}
                        className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 ${
                          activeOrder.dbStatus === 'READY_FOR_PICKUP' || activeOrder.dbStatus === 'OUT_OF_SHOP' || activeOrder.dbStatus === 'OUT_FOR_DELIVERY'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                      >
                        <span>
                          {activeOrder.dbStatus === 'READY_FOR_PICKUP' || activeOrder.dbStatus === 'OUT_OF_SHOP' || activeOrder.dbStatus === 'OUT_FOR_DELIVERY'
                            ? '✓ 1. Ready for Pickup'
                            : '🏪 1. Mark Ready'}
                        </span>
                      </button>

                      {/* Step 2: Merchant Slide Out of Shop */}
                      <button
                        onClick={() => simulateShopkeeperHandover(!activeOrder.shopkeeperHandoverConfirmed)}
                        className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 ${
                          activeOrder.shopkeeperHandoverConfirmed
                            ? 'bg-amber-950 text-amber-300 border border-amber-500'
                            : 'bg-teal-600 hover:bg-teal-500 text-white'
                        }`}
                      >
                        <span>{activeOrder.shopkeeperHandoverConfirmed ? '✓ 2. Out of Shop' : '🏪 2. Out of Shop'}</span>
                      </button>
                    </div>

                    <div className="pt-0.5">
                      <button
                        onClick={resetActiveOrder}
                        className="w-full py-1.5 px-2 rounded-xl text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center justify-center gap-1 active:scale-95"
                      >
                        <span>✕ Clear Test Order</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. ORDER ITEMS + PROGRESS TIMELINE */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm text-slate-900">Order Items</h3>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {activeOrder.items.length} items
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {activeOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="bg-white text-primary border border-primary/20 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs font-mono shadow-sm">
                            {item.quantity}x
                          </div>
                          <span className="text-xs font-semibold text-slate-800">{item.name}</span>
                        </div>
                        {item.price && (
                          <span className="text-xs font-mono font-bold text-slate-500">₹{item.price}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <hr className="border-slate-100" />

                  {/* Delivery progress stepper */}
                  <div className="flex flex-col gap-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Live Delivery Progress
                    </h4>
                    <div className="flex items-center relative py-1">
                      {/* Step 1: Accepted */}
                      <div className="flex flex-col items-center gap-1 z-10">
                        <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-sm">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-primary">Accepted</span>
                      </div>
                      <div className={`flex-1 h-1 transition-colors ${isPickupDone ? 'bg-primary' : 'bg-slate-200'}`} />
                      {/* Step 2: Pickup */}
                      <div className="flex flex-col items-center gap-1 z-10">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isPickupDone ? 'bg-primary text-white' : 'bg-amber-500 text-white animate-pulse'}`}>
                          {isPickupDone ? <Check className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                        </div>
                        <span className={`text-[10px] font-bold ${isPickupDone ? 'text-primary' : 'text-amber-600'}`}>Pickup</span>
                      </div>
                      <div className={`flex-1 h-1 transition-colors ${isDeliveredDone ? 'bg-primary' : 'bg-slate-200'}`} />
                      {/* Step 3: Delivered */}
                      <div className="flex flex-col items-center gap-1 z-10">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isDeliveredDone ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span className={`text-[10px] font-bold ${isDeliveredDone ? 'text-primary' : 'text-slate-400'}`}>Delivered</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* Empty Active State */
              <div className="bg-white rounded-3xl p-8 shadow-soft border border-slate-200 text-center flex flex-col items-center gap-4 py-12 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[32px]">two_wheeler</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-on-surface">No Active Deliveries</h3>
                  <p className="text-xs text-secondary max-w-[240px] mt-1">
                    You&apos;re online in {rider.selectedZone || 'Robertsonpet'}. New orders will appear here automatically.
                  </p>
                </div>
                <button
                  onClick={triggerMockOrder}
                  className="bg-primary text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lift hover:bg-primary/90 transition-all active:scale-95"
                >
                  Generate Test Delivery Request
                </button>
              </div>
            )}
          </>
        )}

        {/* TAB 2: COMPLETED ORDERS */}
        {selectedTab === 'completed' && (
          <div className="flex flex-col gap-3 animate-fade-in">
            {ordersHistory.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-800">#{item.orderNumber}</span>
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        Delivered
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 mt-1">{item.restaurantName}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-base text-primary font-mono">+₹{item.earnings}</span>
                    <p className="text-[10px] text-slate-400">{item.timestamp}</p>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
                  <span>Customer: {item.customerName}</span>
                  <span className="font-mono">{item.distanceKm} km</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: CANCELLED ORDERS */}
        {selectedTab === 'cancelled' && (
          <div className="flex flex-col gap-3 animate-fade-in">
            {cancelledOrders.length > 0 ? (
              cancelledOrders.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-800">#{item.orderNumber}</span>
                        <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                          Declined / Cancelled
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 mt-1">{item.restaurantName}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-xs text-slate-400 font-mono">₹{item.earnings}</span>
                      <p className="text-[10px] text-slate-400">{item.timestamp}</p>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
                    <span>Customer: {item.customerName}</span>
                    <span className="font-mono">{item.distanceKm} km</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-3xl p-8 shadow-soft border border-slate-200 text-center flex flex-col items-center gap-3 py-12">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-on-surface">No Cancelled Orders</h3>
                <p className="text-xs text-secondary">
                  Great job! Your cancellation rate is 0% this week.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </AppShell>
  );
}
