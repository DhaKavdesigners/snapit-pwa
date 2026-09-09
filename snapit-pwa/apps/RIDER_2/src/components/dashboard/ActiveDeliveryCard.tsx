'use client';

import React from 'react';
import { Order } from '@/types';
import { openGoogleMapsNavigation, hasValidCoordinates } from '@/utils/navigationLauncher';
import { SlideButton } from '@/components/common/SlideButton';
import {
  MapPin,
  Phone,
  Navigation,
  Clock,
  Package,
  Check,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatOrderNumber } from '@/utils/orderUtils';

interface ActiveDeliveryCardProps {
  activeOrder: Order;
  onMarkPickedUp: () => void;
  onAdvanceStatus: () => void;
}

export const ActiveDeliveryCard: React.FC<ActiveDeliveryCardProps> = ({
  activeOrder,
  onMarkPickedUp,
  onAdvanceStatus,
}) => {
  const router = useRouter();
  const rawDbStatus = (activeOrder.dbStatus || '').toUpperCase();

  // Status mapping
  const isOutOfShop = rawDbStatus === 'OUT_OF_SHOP';
  const isReadyForPickup = !isOutOfShop && rawDbStatus === 'READY_FOR_PICKUP';
  const isPreparing =
    !isOutOfShop &&
    !isReadyForPickup &&
    (rawDbStatus === 'PREPARING' ||
      rawDbStatus === 'PACKING' ||
      rawDbStatus === 'PLACED' ||
      rawDbStatus === 'PENDING' ||
      rawDbStatus === 'ACCEPTED' ||
      rawDbStatus === 'RIDER_ARRIVING_TO_STORE' ||
      (!rawDbStatus && Boolean(activeOrder)));

  const isArrivedAtCustomer =
    rawDbStatus === 'RIDER_AT_LOC' ||
    rawDbStatus === 'ARRIVED_AT_CUSTOMER' ||
    activeOrder.status === 'arrived_at_dropoff';

  const isOutForDelivery =
    !isOutOfShop &&
    !isReadyForPickup &&
    !isPreparing &&
    (rawDbStatus === 'OUT_FOR_DELIVERY' ||
      rawDbStatus === 'IN_TRANSIT' ||
      rawDbStatus === 'PICKED_UP') &&
    !isArrivedAtCustomer;

  // Primary operational phase: Pickup vs Delivery
  const isPickupStage = isPreparing || isReadyForPickup || isOutOfShop;

  // Navigation coordinate checks
  const canNavShop =
    hasValidCoordinates(activeOrder.shopLocation?.lat, activeOrder.shopLocation?.lng) ||
    Boolean(
      activeOrder.restaurantAddress &&
        activeOrder.restaurantAddress.trim() &&
        activeOrder.restaurantAddress !== 'Store Location'
    );

  const canNavCust =
    hasValidCoordinates(activeOrder.customerLocation?.lat, activeOrder.customerLocation?.lng) ||
    Boolean(
      activeOrder.deliveryAddress &&
        activeOrder.deliveryAddress.trim() &&
        activeOrder.deliveryAddress !== 'Customer Address'
    );

  const storePhone = activeOrder.shopPhone || '8217649688';

  return (
    <div
      className={`bg-white text-slate-900 rounded-[28px] p-5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.08)] border border-slate-200/90 relative overflow-hidden space-y-4 animate-fade-in ${
        isPickupStage ? 'ring-1 ring-emerald-500/20' : 'ring-1 ring-blue-500/20'
      }`}
    >
      {/* ── CARD HEADER: PHASE BADGE + ORDER NUMBER + SLEEK PAYOUT ── */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {isPickupStage ? (
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[10.5px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                </span>
                Active Delivery
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 text-[10.5px] font-black uppercase px-2.5 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
                </span>
                Active Delivery
              </span>
            )}
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isPickupStage ? 'Step 1: Store Pickup' : 'Step 2: Drop-off'}
            </span>
          </div>

          <h2 className="text-base font-black text-slate-900 font-mono tracking-tight">
            Order #{formatOrderNumber(activeOrder.orderNumber)}
          </h2>
        </div>

        {/* Clean Payout Badge */}
        <div
          className={`flex items-baseline gap-1.5 px-3.5 py-1.5 rounded-xl border shadow-2xs ${
            isPickupStage
              ? 'bg-emerald-50 border-emerald-200/90 text-emerald-800'
              : 'bg-blue-50 border-blue-200/90 text-blue-800'
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-wider">
            Payout
          </span>
          <span
            className={`text-xl font-black font-mono ${
              isPickupStage ? 'text-emerald-600' : 'text-blue-600'
            }`}
          >
            ₹{activeOrder.earnings || 45}
          </span>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* ── PHASE 1: PICKUP STAGE (Direct, Clean, No Nested Box) ── */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {isPickupStage ? (
        <div className="space-y-4">
          {/* Store Name, Address & Trip Metadata */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700">
                Pick Up Food At
              </span>

              {/* Status Indicator */}
              {isPreparing && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                  <Clock className="w-3 h-3 text-amber-700 animate-spin" />
                  Preparing Food
                </span>
              )}
              {isReadyForPickup && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs">
                  <Package className="w-3 h-3 text-blue-700" />
                  Ready at Counter
                </span>
              )}
              {isOutOfShop && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs animate-pulse">
                  <Check className="w-3 h-3 text-emerald-700 stroke-[3]" />
                  Store Handed Over
                </span>
              )}
            </div>

            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {activeOrder.restaurantName}
            </h3>

            <p className="text-xs text-slate-600 font-semibold mt-1 flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{activeOrder.restaurantAddress}</span>
            </p>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mt-2.5">
              <span className="text-slate-800">📍 {activeOrder.distanceKm || 2.2} km trip</span>
              <span className="text-slate-300">•</span>
              <span>⏱️ ~{activeOrder.estimatedMinutes || 12} mins</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 font-extrabold">Food Delivery</span>
            </div>
          </div>

          {/* High-Impact Action Buttons (Call Store + Navigate) */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <a
              href={`tel:${storePhone}`}
              className="col-span-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-2xl border border-slate-300/80 transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Phone className="w-4 h-4 text-slate-700" />
              <span>Call Store</span>
            </a>

            {canNavShop ? (
              <button
                type="button"
                onClick={() =>
                  openGoogleMapsNavigation(
                    activeOrder.shopLocation?.lat,
                    activeOrder.shopLocation?.lng,
                    activeOrder.restaurantAddress
                  )
                }
                className="col-span-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 border border-emerald-500 ring-2 ring-emerald-400/30 active:scale-95 cursor-pointer transition-all tracking-wider"
              >
                <Navigation className="w-4 h-4 fill-white" />
                <span>Navigate to Store</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="col-span-2 py-3.5 bg-slate-100 text-slate-400 font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-200"
              >
                <span>Location Unavailable</span>
              </button>
            )}
          </div>

          {/* Progression Slider or Live Packing Status */}
          <div className="pt-1">
            {isPreparing ? (
              <div className="w-full py-3.5 bg-amber-50/90 border border-amber-200 text-amber-900 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-2xs">
                <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                <span>Waiting for merchant to pack order...</span>
              </div>
            ) : isReadyForPickup ? (
              <div className="w-full py-3.5 bg-blue-50/90 border border-blue-200 text-blue-900 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-2xs">
                <Package className="w-4 h-4 text-blue-600" />
                <span>Order packed • Awaiting store handover</span>
              </div>
            ) : isOutOfShop ? (
              <SlideButton
                label="SLIDE TO CONFIRM PICKUP"
                variant="emerald"
                onConfirm={onMarkPickedUp}
              />
            ) : null}
          </div>
        </div>
      ) : (
        /* ────────────────────────────────────────────────────────────────── */
        /* ── PHASE 2: DELIVERY STAGE (Direct, Clean, No Nested Box) ── */
        /* ────────────────────────────────────────────────────────────────── */
        <div className="space-y-4">
          {/* Destination Customer Address & Details */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-700">
                Deliver To Customer
              </span>

              {/* Status Indicator */}
              {isOutForDelivery && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs">
                  <Navigation className="w-3 h-3 text-blue-700" />
                  In Transit
                </span>
              )}
              {isArrivedAtCustomer && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs animate-pulse">
                  <MapPin className="w-3 h-3 text-purple-700" />
                  At Doorstep
                </span>
              )}
            </div>

            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {activeOrder.deliveryAddress}
            </h3>

            <p className="text-xs text-slate-700 font-semibold mt-1 flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>Customer: <strong className="text-slate-900">{activeOrder.customerName || 'Customer'}</strong></span>
            </p>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mt-2.5">
              <span>Picked up from {activeOrder.restaurantName}</span>
              <span className="text-slate-300">•</span>
              <span className="text-blue-700 font-extrabold">Drop-off Stage</span>
            </div>
          </div>

          {/* High-Impact Action Buttons (Call Customer + Navigate) */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {activeOrder.customerPhone ? (
              <a
                href={`tel:${activeOrder.customerPhone}`}
                className="col-span-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-2xl border border-slate-300/80 transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Phone className="w-4 h-4 text-slate-700" />
                <span>Call Customer</span>
              </a>
            ) : (
              <button
                disabled
                className="col-span-1 py-3.5 bg-slate-100 text-slate-400 font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-200"
              >
                <Phone className="w-4 h-4 text-slate-400" />
                <span>Call</span>
              </button>
            )}

            {canNavCust ? (
              <button
                type="button"
                onClick={() =>
                  openGoogleMapsNavigation(
                    activeOrder.customerLocation?.lat,
                    activeOrder.customerLocation?.lng,
                    activeOrder.deliveryAddress
                  )
                }
                className="col-span-2 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 border border-blue-500 ring-2 ring-blue-400/30 active:scale-95 cursor-pointer transition-all tracking-wider"
              >
                <Navigation className="w-4 h-4 fill-white" />
                <span>Navigate to Delivery</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="col-span-2 py-3.5 bg-slate-100 text-slate-400 font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-200"
              >
                <span>Location Unavailable</span>
              </button>
            )}
          </div>

          {/* Progression Slider Action */}
          <div className="pt-1">
            {isOutForDelivery ? (
              <SlideButton
                label="SLIDE: ARRIVED AT CUSTOMER"
                variant="blue"
                onConfirm={onAdvanceStatus}
              />
            ) : (
              <SlideButton
                label="SLIDE TO ENTER DELIVERY PIN"
                variant="purple"
                icon={<ShieldCheck className="w-5 h-5 text-white stroke-[2.5]" />}
                onConfirm={() => router.push('/confirm-delivery')}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
