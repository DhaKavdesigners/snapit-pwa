'use client';

import React, { useMemo } from 'react';
import { Order } from '@/types';
import {
  openGoogleMapsNavigation,
  hasValidCoordinates,
} from '@/utils/navigationLauncher';
import {
  Navigation,
  Store,
  MapPin,
  Phone,
  ExternalLink,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface LiveRiderNavigationProps {
  order: Order;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onCloseNav?: () => void;
}

export const LiveRiderNavigation: React.FC<LiveRiderNavigationProps> = ({
  order,
}) => {
  // Determine if order is in pickup stage or dropoff/delivery stage
  const isBeforePickup = useMemo(() => {
    const s = (order.status || '').toLowerCase();
    const dbS = (order.dbStatus || '').toUpperCase();
    return (
      s === 'pending' ||
      s === 'accepted' ||
      s === 'picking_up' ||
      s === 'arrived_at_pickup' ||
      dbS === 'PLACED' ||
      dbS === 'PREPARING' ||
      dbS === 'PACKING' ||
      dbS === 'ACCEPTED' ||
      dbS === 'READY_FOR_PICKUP' ||
      dbS === 'ARRIVED_AT_STORE' ||
      dbS === 'OUT_OF_SHOP'
    );
  }, [order]);

  const shopLat = order.shopLocation?.lat;
  const shopLng = order.shopLocation?.lng;
  const hasShopCoords = hasValidCoordinates(shopLat, shopLng);

  const custLat = order.customerLocation?.lat;
  const custLng = order.customerLocation?.lng;
  const hasCustCoords = hasValidCoordinates(custLat, custLng);

  const activeHasCoords = isBeforePickup ? hasShopCoords : hasCustCoords;
  const activeLat = isBeforePickup ? shopLat : custLat;
  const activeLng = isBeforePickup ? shopLng : custLng;
  const activeAddress = isBeforePickup
    ? (order.restaurantAddress || order.shopLocation?.address)
    : (order.deliveryAddress || order.customerLocation?.address);
  const canNavigate = activeHasCoords || Boolean(activeAddress && activeAddress.trim() && activeAddress !== 'Customer Address' && activeAddress !== 'Store Location');

  const handleNavigate = () => {
    if (!canNavigate) return;
    openGoogleMapsNavigation(activeLat, activeLng, activeAddress);
  };

  return (
    <div className="w-full bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Target Destination Header Banner */}
      <div className={`p-4 border-b ${isBeforePickup ? 'bg-emerald-50/70 border-emerald-100' : 'bg-blue-50/70 border-blue-100'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              isBeforePickup ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
            }`}>
              {isBeforePickup ? (
                <Store className="w-5 h-5" />
              ) : (
                <MapPin className="w-5 h-5" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isBeforePickup
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  {isBeforePickup ? 'Pickup Navigation' : 'Delivery Navigation'}
                </span>
                {!canNavigate && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Location unavailable
                  </span>
                )}
              </div>

              <h3 className="font-black text-base text-slate-900 truncate">
                {isBeforePickup ? (order.restaurantName || 'Store') : (order.customerName || 'Customer')}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                {isBeforePickup ? (order.restaurantAddress || 'Store Address') : (order.deliveryAddress || 'Customer Address')}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="mt-3.5 flex gap-2">
          {/* Primary Navigation Action Button */}
          <button
            type="button"
            onClick={handleNavigate}
            disabled={!canNavigate}
            className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
              canNavigate
                ? 'bg-slate-900 hover:bg-slate-800 text-white active:scale-98 shadow-md'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <Navigation className={`w-4 h-4 ${canNavigate ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>
              {isBeforePickup ? 'Navigate to Shop' : 'Navigate to Customer'}
            </span>
            {canNavigate && (
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            )}
          </button>

          {/* Quick Call Button */}
          {isBeforePickup ? (
            <a
              href="tel:8217649688"
              className="py-3 px-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs"
              title="Call Store"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Call Store</span>
            </a>
          ) : (
            <a
              href={`tel:${order.customerPhone}`}
              className="py-3 px-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs"
              title="Call Customer"
            >
              <Phone className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Call Customer</span>
            </a>
          )}
        </div>
      </div>

      {/* Navigation Info Footer */}
      <div className="px-4 py-2.5 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Navigation handled directly by <strong>Google Maps</strong></span>
        </div>
        <span className="font-mono font-bold text-slate-600">
          ~{order.estimatedMinutes || 12} mins ({order.distanceKm || 2.4} km)
        </span>
      </div>
    </div>
  );
};

export const LiveNavigationMap = LiveRiderNavigation;
