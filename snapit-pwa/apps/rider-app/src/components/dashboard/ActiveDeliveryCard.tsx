'use client';

import React from 'react';
import { Order } from '@/types';
import { openGoogleMapsNavigation, hasValidCoordinates } from '@/utils/navigationLauncher';
import { DeliveryProgressScooter } from './DeliveryProgressScooter';
import {
  Store,
  MapPin,
  Phone,
  Navigation,
  Clock,
  Package,
  CheckCircle2,
  Check,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

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

  const isPickupStage = isPreparing || isReadyForPickup || isOutOfShop;

  // Coordinate check for shop
  const hasShopCoords = hasValidCoordinates(
    activeOrder.shopLocation?.lat,
    activeOrder.shopLocation?.lng
  );
  const canNavShop =
    hasShopCoords ||
    Boolean(
      activeOrder.restaurantAddress &&
        activeOrder.restaurantAddress.trim() &&
        activeOrder.restaurantAddress !== 'Store Location'
    );

  // Coordinate check for customer
  const hasCustCoords = hasValidCoordinates(
    activeOrder.customerLocation?.lat,
    activeOrder.customerLocation?.lng
  );
  const canNavCust =
    hasCustCoords ||
    Boolean(
      activeOrder.deliveryAddress &&
        activeOrder.deliveryAddress.trim() &&
        activeOrder.deliveryAddress !== 'Customer Address'
    );

  return (
    <div className="bg-white rounded-3xl p-5 shadow-lg border-2 border-emerald-500/50 space-y-4 animate-fade-in">
      {/* ── CARD HEADER: ACTIVE DELIVERY + ORDER # + PAYOUT ── */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
              Active Delivery
            </span>
          </div>
          <h2 className="text-base font-black text-slate-900 font-mono">
            Order #{activeOrder.orderNumber}
          </h2>
        </div>

        <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
          ₹{activeOrder.earnings || 45} Payout
        </span>
      </div>

      {/* ── 1. PICKUP SECTION ── */}
      <div
        className={`rounded-2xl p-3.5 border transition-all ${
          isPickupStage
            ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/15 shadow-xs'
            : 'bg-slate-50/80 border-slate-200/80 opacity-90'
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                isPickupStage
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              <Store className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Pickup Store
                </span>
                {/* Store Status Sub-badge */}
                {isPreparing && (
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                    <Clock className="w-2.5 h-2.5 text-amber-600" />
                    Preparing
                  </span>
                )}
                {isReadyForPickup && (
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-300">
                    <Package className="w-2.5 h-2.5 text-blue-600" />
                    Ready
                  </span>
                )}
                {isOutOfShop && (
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 animate-pulse">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                    Handed Over
                  </span>
                )}
                {!isPickupStage && (
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                    <Check className="w-2.5 h-2.5" />
                    Collected
                  </span>
                )}
              </div>

              <h3 className="text-sm font-black text-slate-900 truncate">
                {activeOrder.restaurantName}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                {activeOrder.restaurantAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Pickup Action Buttons */}
        <div className="flex gap-2 pt-1">
          <a
            href="tel:8217649688"
            className="flex-1 py-2 bg-white border border-emerald-300 text-emerald-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-2xs hover:bg-emerald-50 active:scale-95 transition-all"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
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
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer transition-all"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span>Navigate to Shop</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="flex-1 py-2 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-200 cursor-not-allowed"
            >
              <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Location unavailable</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 2. DELIVERY PROGRESS SCOOTER ANIMATION ── */}
      <DeliveryProgressScooter order={activeOrder} />

      {/* ── 3. DELIVERY SECTION (Privacy-conscious) ── */}
      <div
        className={`rounded-2xl p-3.5 border transition-all ${
          !isPickupStage
            ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/15 shadow-xs'
            : 'bg-slate-50/80 border-slate-200/80'
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                !isPickupStage
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              <MapPin className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Delivery Location
                </span>
                {isArrivedAtCustomer && (
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 border border-purple-300 animate-pulse">
                    <CheckCircle2 className="w-2.5 h-2.5 text-purple-600" />
                    At Doorstep
                  </span>
                )}
                {isOutForDelivery && (
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Navigation className="w-2.5 h-2.5 text-emerald-600" />
                    In Transit
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                {activeOrder.deliveryAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Action Buttons */}
        <div className="flex gap-2 pt-1">
          {activeOrder.customerPhone ? (
            <a
              href={`tel:${activeOrder.customerPhone}`}
              className="flex-1 py-2 bg-white border border-blue-300 text-blue-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-2xs hover:bg-blue-50 active:scale-95 transition-all"
            >
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>Call Customer</span>
            </a>
          ) : (
            <button
              disabled
              className="flex-1 py-2 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-200 cursor-not-allowed"
            >
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Call Customer</span>
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
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer transition-all"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-400" />
              <span>Navigate to Delivery</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="flex-1 py-2 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-200 cursor-not-allowed"
            >
              <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Location unavailable</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 4. STAGE-SPECIFIC PROGRESSION BUTTON (Exact Handshake & OTP Logic) ── */}
      <div>
        {isPreparing ? (
          <button
            disabled
            className="w-full py-4 bg-amber-100 text-amber-900 font-bold text-xs rounded-2xl border border-amber-300 flex items-center justify-center gap-2 cursor-not-allowed opacity-90"
          >
            <Clock className="w-4 h-4 text-amber-700 animate-spin" />
            <span>WAITING FOR MERCHANT TO PACK ORDER...</span>
          </button>
        ) : isReadyForPickup ? (
          <button
            disabled
            className="w-full py-4 bg-blue-100 text-blue-900 font-bold text-xs rounded-2xl border border-blue-300 flex items-center justify-center gap-2 cursor-not-allowed opacity-90"
          >
            <Package className="w-4 h-4 text-blue-700" />
            <span>ORDER PACKED • WAITING FOR MERCHANT HANDOVER</span>
          </button>
        ) : isOutOfShop ? (
          <button
            onClick={onMarkPickedUp}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-2xl ring-4 ring-emerald-400/30 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer animate-pulse"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>CONFIRM PARCEL PICKED UP ➔</span>
          </button>
        ) : isOutForDelivery ? (
          <button
            onClick={onAdvanceStatus}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-2xl shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <MapPin className="w-5 h-5" />
            <span>ARRIVED AT CUSTOMER LOCATION ➔</span>
          </button>
        ) : (
          <button
            onClick={() => router.push('/confirm-delivery')}
            className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-black text-sm rounded-2xl shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer animate-pulse"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>ENTER 4-DIGIT PIN TO COMPLETE ➔</span>
          </button>
        )}
      </div>
    </div>
  );
};
