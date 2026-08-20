'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRider } from '@/context/RiderContext';
import { RouteTimeline } from '@/components/orders/RouteTimeline';
import { SlideToConfirm } from '@/components/orders/SlideToConfirm';
import { LiveRiderNavigation } from '@/components/navigation/LiveRiderNavigation';
import { Phone, Navigation, Check, Package, Clock, AlertCircle, Maximize2, ShieldCheck, Store, Home } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function OrdersPage() {
  const { activeOrder, ordersHistory, advanceActiveOrderStatus, triggerMockOrder, markOrderPickedUp } = useRider();
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed' | 'cancelled'>('active');
  const [isNavActive, setIsNavActive] = useState<boolean>(true);
  const [isFullScreenNav, setIsFullScreenNav] = useState<boolean>(false);
  const router = useRouter();

  // Strict Sequential Action Handlers
  const handleNextStepAction = () => {
    if (!activeOrder) return;

    if (activeOrder.status === 'accepted' || activeOrder.status === 'picking_up') {
      // Step 1 -> Step 2: Slide to Arrive at Store
      advanceActiveOrderStatus(); // Status becomes 'arrived_at_pickup'
    } else if (activeOrder.status === 'arrived_at_pickup') {
      // Step 2 -> Step 3: Slide to Confirm Pickup (Order Collected)
      markOrderPickedUp(); // Status becomes 'in_transit', navStage becomes 'to_customer'
    } else if (activeOrder.status === 'in_transit') {
      // Step 3 -> Step 4: Slide to Arrive at Customer
      advanceActiveOrderStatus(); // Status becomes 'arrived_at_dropoff'
    } else if (activeOrder.status === 'arrived_at_dropoff') {
      // Step 4 -> OTP Page
      router.push('/confirm-delivery');
    }
  };

  // Label configuration for the single active slider/button below the map
  const getSingleNextActionConfig = () => {
    if (!activeOrder) return { type: 'slider', label: '', success: '' };

    if (activeOrder.status === 'accepted' || activeOrder.status === 'picking_up') {
      return {
        type: 'slider',
        label: 'Slide to Arrive at Store',
        success: 'Arrived at Store!',
      };
    }
    if (activeOrder.status === 'arrived_at_pickup') {
      return {
        type: 'slider',
        label: 'Slide to Confirm Pickup (Order Collected)',
        success: 'Order Collected! Switched to Customer Route',
      };
    }
    if (activeOrder.status === 'in_transit') {
      return {
        type: 'slider',
        label: 'Slide to Arrive at Customer',
        success: 'Arrived at Customer Location!',
      };
    }
    if (activeOrder.status === 'arrived_at_dropoff') {
      return {
        type: 'button',
        label: 'Proceed to Delivery OTP Verification →',
        success: '',
      };
    }

    return { type: 'slider', label: 'Slide to Update Status', success: 'Done' };
  };

  const actionConfig = getSingleNextActionConfig();

  // Status Badge Label
  const getStatusBadgeLabel = () => {
    if (!activeOrder) return '';
    if (activeOrder.status === 'accepted' || activeOrder.status === 'picking_up') return 'Order Accepted';
    if (activeOrder.status === 'arrived_at_pickup') return 'Arrived at Store';
    if (activeOrder.status === 'in_transit') return 'Order Picked Up (On the Way)';
    if (activeOrder.status === 'arrived_at_dropoff') return 'Arrived at Customer';
    if (activeOrder.status === 'delivered') return 'Delivered';
    return 'Active Order';
  };

  // Timeline Stepper Stage Highlighting
  const isPickupDone = activeOrder?.status === 'in_transit' || activeOrder?.status === 'arrived_at_dropoff' || activeOrder?.status === 'delivered';
  const isDeliveredDone = activeOrder?.status === 'delivered';

  return (
    <AppShell title="My Orders" subtitle="Manage active & past trips">
      <div className="flex flex-col gap-5 pt-2 pb-6">
        
        {/* Segmented Control Filter Tabs */}
        <div className="flex bg-slate-200/80 p-1 rounded-2xl w-full border border-slate-300/60 shadow-inner">
          <button
            onClick={() => setSelectedTab('active')}
            className={`flex-1 py-2 text-center rounded-xl text-xs font-bold transition-all duration-200 ${
              selectedTab === 'active'
                ? 'bg-white text-primary shadow-soft scale-[1.02]'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Active {activeOrder ? '(1)' : ''}
          </button>

          <button
            onClick={() => setSelectedTab('completed')}
            className={`flex-1 py-2 text-center rounded-xl text-xs font-bold transition-all duration-200 ${
              selectedTab === 'completed'
                ? 'bg-white text-primary shadow-soft scale-[1.02]'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Completed ({ordersHistory.length})
          </button>

          <button
            onClick={() => setSelectedTab('cancelled')}
            className={`flex-1 py-2 text-center rounded-xl text-xs font-bold transition-all duration-200 ${
              selectedTab === 'cancelled'
                ? 'bg-white text-primary shadow-soft scale-[1.02]'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Cancelled (0)
          </button>
        </div>

        {/* TAB 1: ACTIVE ORDERS */}
        {selectedTab === 'active' && (
          <>
            {activeOrder ? (
              <div className="flex flex-col gap-4 animate-fade-in">
                
                {/* 1. COMPACT LIVE NAVIGATION MAP AT TOP OF ORDER PAGE (ONLY NAVIGATION CONTROLS INSIDE MAP) */}
                <LiveRiderNavigation
                  order={activeOrder}
                  isFullScreen={isFullScreenNav}
                  onToggleFullScreen={() => setIsFullScreenNav((fs) => !fs)}
                  onCloseNav={() => setIsNavActive(false)}
                />

                {/* 2. ORDER DETAILS CARD BELOW THE MAP (ONLY ORDER WORKFLOW & ACTIONS BELOW MAP) */}
                <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 flex flex-col gap-4 relative overflow-hidden">
                  {/* Decorative top green gradient */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-primary-container" />

                  {/* Header Row */}
                  <div className="flex justify-between items-start pt-1">
                    <div>
                      <span className="inline-block bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
                        {getStatusBadgeLabel()}
                      </span>
                      <h3 className="font-bold text-base text-on-surface mt-1.5 font-mono">
                        Order #{activeOrder.orderNumber}
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-xl text-primary font-mono leading-none">
                        ₹{activeOrder.earnings}
                      </span>
                      <p className="text-[10px] text-secondary font-semibold uppercase mt-0.5">
                        Est. Earnings
                      </p>
                    </div>
                  </div>

                  {/* Address Snapshot Route Timeline */}
                  <RouteTimeline order={activeOrder} />

                  <hr className="border-slate-100" />

                  {/* Customer Quick Call & Fullscreen Map Action */}
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={() => setIsFullScreenNav(true)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-200"
                    >
                      <Maximize2 className="w-4 h-4 text-primary" />
                      <span>Expand Map View</span>
                    </button>

                    <a
                      href={`tel:${activeOrder.customerPhone}`}
                      className="w-11 h-11 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center text-primary hover:bg-slate-100 transition-colors shadow-sm active:scale-95 shrink-0"
                      title="Call Customer"
                    >
                      <Phone className="w-5 h-5" />
                    </a>
                  </div>

                  {/* 3. STRICT SEQUENTIAL SINGLE NEXT ACTION WORKFLOW BELOW THE MAP */}
                  <div className="mt-1">
                    {actionConfig.type === 'slider' ? (
                      <SlideToConfirm
                        key={activeOrder.status}
                        label={actionConfig.label}
                        successLabel={actionConfig.success}
                        onConfirm={handleNextStepAction}
                      />
                    ) : (
                      <button
                        onClick={handleNextStepAction}
                        className="w-full py-4 bg-gradient-to-r from-primary to-primary-container hover:opacity-95 text-white font-extrabold text-xs rounded-2xl shadow-lift transition-all flex items-center justify-center gap-2 active:scale-98 ring-2 ring-primary/30"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{actionConfig.label}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 4. ORDER ITEMS & LIVE TIMELINE CARD */}
                <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm text-on-surface">Order Items</h3>
                    <span className="text-[11px] font-semibold text-secondary">
                      {activeOrder.items.length} items
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="flex flex-col gap-2.5">
                    {activeOrder.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 rounded-2xl bg-surface-container-low border border-slate-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-white text-primary border border-primary/20 w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs font-mono shadow-sm">
                            {item.quantity}x
                          </div>
                          <span className="text-xs font-semibold text-on-surface">{item.name}</span>
                        </div>
                        {item.price && (
                          <span className="text-xs font-mono font-bold text-secondary">
                            ₹{item.price}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <hr className="border-slate-100" />

                  {/* DYNAMIC LIVE DELIVERY TIMELINE STEPPER */}
                  <div className="flex flex-col gap-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                      Live Delivery Progress
                    </h4>
                    
                    <div className="flex items-center relative py-2">
                      {/* Step 1: Accepted */}
                      <div className="flex flex-col items-center gap-1 z-10">
                        <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-sm">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-primary">Accepted</span>
                      </div>

                      {/* Connecting Line 1 */}
                      <div
                        className={`flex-1 h-1 transition-colors ${
                          isPickupDone ? 'bg-primary' : 'bg-slate-200'
                        }`}
                      />

                      {/* Step 2: Pickup */}
                      <div className="flex flex-col items-center gap-1 z-10">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                            isPickupDone
                              ? 'bg-primary text-white'
                              : 'bg-amber-500 text-white shadow-glow animate-pulse'
                          }`}
                        >
                          {isPickupDone ? <Check className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                        </div>
                        <span
                          className={`text-[10px] font-bold ${
                            isPickupDone ? 'text-primary' : 'text-amber-600'
                          }`}
                        >
                          Pickup
                        </span>
                      </div>

                      {/* Connecting Line 2 */}
                      <div
                        className={`flex-1 h-1 transition-colors ${
                          isDeliveredDone ? 'bg-primary' : 'bg-slate-200'
                        }`}
                      />

                      {/* Step 3: Delivered */}
                      <div className="flex flex-col items-center gap-1 z-10">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                            isDeliveredDone
                              ? 'bg-primary text-white'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span
                          className={`text-[10px] font-bold ${
                            isDeliveredDone ? 'text-primary' : 'text-slate-400'
                          }`}
                        >
                          Delivered
                        </span>
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
                    You're online in Downtown Central. New orders will appear here automatically.
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
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-2.5 transition-all hover:border-primary/30"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-on-surface">
                        #{item.orderNumber}
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        Delivered
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-secondary mt-1">{item.restaurantName}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-base text-primary font-mono">
                      +₹{item.earnings}
                    </span>
                    <p className="text-[10px] text-secondary">{item.timestamp}</p>
                  </div>
                </div>

                <div className="text-[11px] text-secondary flex items-center justify-between pt-2 border-t border-slate-100">
                  <span>Customer: {item.customerName}</span>
                  <span className="font-mono">{item.distanceKm} km</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: CANCELLED ORDERS */}
        {selectedTab === 'cancelled' && (
          <div className="bg-white rounded-3xl p-8 shadow-soft border border-slate-200 text-center flex flex-col items-center gap-3 py-12 animate-fade-in">
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
    </AppShell>
  );
}
