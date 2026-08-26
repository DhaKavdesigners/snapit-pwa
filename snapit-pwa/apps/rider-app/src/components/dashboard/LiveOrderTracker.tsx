'use client';

import React, { useState } from 'react';
import { useRider } from '@/context/RiderContext';
import { SlideToConfirm } from '@/components/orders/SlideToConfirm';
import { RouteTimeline } from '@/components/orders/RouteTimeline';
import { LiveRouteSimulation } from '@/components/orders/LiveRouteSimulation';
import { Phone, Navigation, PackageCheck, ShoppingBag, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const LiveOrderTracker: React.FC = () => {
  const { activeOrder, advanceActiveOrderStatus } = useRider();
  const [showNavigation, setShowNavigation] = useState(false);
  const router = useRouter();

  if (!activeOrder) return null;

  const handleSlideAction = () => {
    if (activeOrder.status === 'picking_up' || activeOrder.status === 'accepted' || activeOrder.status === 'arrived_at_pickup') {
      advanceActiveOrderStatus(); // -> confirmRiderPickup()
    } else if (activeOrder.status === 'in_transit') {
      advanceActiveOrderStatus(); // -> arrived_at_dropoff
    } else {
      // -> arrived_at_dropoff to delivery OTP
      router.push('/confirm-delivery');
    }
  };

  const getSliderLabels = () => {
    const isReadyForPickup =
      activeOrder.dbStatus === 'READY_FOR_PICKUP' ||
      activeOrder.dbStatus === 'OUT_OF_SHOP' ||
      activeOrder.dbStatus === 'OUT_FOR_DELIVERY' ||
      Boolean(activeOrder.shopkeeperHandoverConfirmed);

    if (activeOrder.status === 'picking_up' || activeOrder.status === 'accepted' || activeOrder.status === 'arrived_at_pickup') {
      const isRiderConfirmed = Boolean(activeOrder.riderPickupConfirmed);
      const isShopConfirmed = Boolean(activeOrder.shopkeeperHandoverConfirmed || activeOrder.dbStatus === 'OUT_OF_SHOP');

      if (!isReadyForPickup) {
        return {
          label: 'Awaiting Order Preparation',
          success: 'Waiting for Store...',
          disabled: true,
        };
      }

      if (isRiderConfirmed && !isShopConfirmed) {
        return {
          label: 'Awaiting Shopkeeper Handover',
          success: 'Waiting for Handover...',
          disabled: true,
        };
      }
      return {
        label: 'Order Picked Up',
        success: 'Order Collected!',
        disabled: false,
      };
    }
    if (activeOrder.status === 'in_transit') {
      return {
        label: 'Arrived at Customer',
        success: 'Arrived at Customer!',
        disabled: false,
      };
    }
    return {
      label: 'Verify Delivery OTP',
      success: 'Opening Verification...',
      disabled: false,
    };
  };

  const { label, success, disabled } = getSliderLabels();

  return (
    <div className="w-full animate-slide-up">
      {/* Floating Active Cockpit Card */}
      <div className="bg-white rounded-3xl p-5 shadow-[0px_10px_30px_rgba(15,23,42,0.14)] border border-primary/30 relative overflow-hidden ring-1 ring-primary/20">
        {/* Top Accent Gradient */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-primary-container" />

        {/* Header Row */}
        <div className="flex justify-between items-start pt-1 mb-2">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="inline-flex items-center gap-1 bg-primary text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                {activeOrder.status === 'picking_up'
                  ? 'Heading to Shop'
                  : activeOrder.status === 'arrived_at_pickup'
                  ? 'At Store (Pickup)'
                  : 'On the Way (Delivery)'}
              </span>
              <span className="text-[11px] font-mono font-bold text-secondary">
                #{activeOrder.orderNumber}
              </span>
            </div>
            <h2 className="font-bold text-base text-on-surface">
              {activeOrder.status === 'picking_up' || activeOrder.status === 'arrived_at_pickup'
                ? activeOrder.restaurantName
                : activeOrder.customerName}
            </h2>
          </div>

          <div className="bg-primary/5 rounded-xl px-2.5 py-1.5 text-right border border-primary/20">
            <span className="font-mono font-black text-lg text-primary leading-tight">
              ₹{activeOrder.earnings}
            </span>
            <p className="text-[9px] uppercase font-bold text-secondary">Payout</p>
          </div>
        </div>

        {/* Route Snapshot */}
        <div className="my-2">
          <RouteTimeline order={activeOrder} />
        </div>

        {/* Actions Row: Navigation, Call, View Basket */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => router.push('/orders')}
            className="flex-1 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white border border-primary/20 rounded-xl text-xs font-bold transition-all shadow-lift flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Navigation className="w-3.5 h-3.5 fill-current" />
            <span>Open Live Navigation</span>
          </button>

          <a
            href={`tel:${activeOrder.customerPhone}`}
            className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-primary hover:bg-slate-100 transition-colors shadow-sm"
          >
            <Phone className="w-4 h-4" />
          </a>
        </div>

        {/* Interactive "Slide to Update Order Status" on Home Screen! */}
        <div className="mt-1">
          <SlideToConfirm
            key={`${activeOrder.status}-${activeOrder.riderPickupConfirmed}-${activeOrder.shopkeeperHandoverConfirmed}`}
            label={label}
            successLabel={success}
            disabled={disabled}
            onConfirm={handleSlideAction}
          />
        </div>
      </div>

      {/* Turn-by-turn Navigation Simulation Overlay */}
      {showNavigation && (
        <LiveRouteSimulation order={activeOrder} onClose={() => setShowNavigation(false)} />
      )}
    </div>
  );
};
