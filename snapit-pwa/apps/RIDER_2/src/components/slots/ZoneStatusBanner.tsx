'use client';

import React from 'react';
import { useRider } from '@/context/RiderContext';
import { MapPin, RefreshCw } from 'lucide-react';

export const ZoneStatusBanner: React.FC = () => {
  const { zoneStatus, rider, refreshZoneStatus, activeSlot, upcomingSlot } = useRider();

  if (!activeSlot && !upcomingSlot) return null;
  if (zoneStatus === 'inside' || zoneStatus === 'unknown') return null;

  return (
    <div
      className={`rounded-2xl px-4 py-3 flex items-start gap-2.5 border transition-all ${
        zoneStatus === 'outside'
          ? 'bg-amber-50 border-amber-200'
          : zoneStatus === 'permission_denied' || zoneStatus === 'gps_disabled'
          ? 'bg-red-50 border-red-200'
          : 'bg-yellow-50 border-yellow-200'
      }`}
    >
      <MapPin
        className={`w-4 h-4 shrink-0 mt-0.5 ${
          zoneStatus === 'outside' ? 'text-amber-600' : 'text-red-500'
        }`}
      />
      <div className="flex-1">
        <p className="text-xs font-bold text-slate-800">
          {zoneStatus === 'outside'
            ? `You're outside ${rider.selectedZone}`
            : zoneStatus === 'permission_denied'
            ? 'Location permission denied'
            : zoneStatus === 'gps_disabled'
            ? 'GPS is disabled'
            : zoneStatus === 'low_accuracy'
            ? 'GPS signal is weak'
            : 'Location unavailable'}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {zoneStatus === 'outside'
            ? `Go to ${rider.selectedZone} to receive orders`
            : 'Enable location services to verify your zone status'}
        </p>
      </div>
      <button
        onClick={refreshZoneStatus}
        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-white border border-slate-200 active:scale-95 shadow-sm"
      >
        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
      </button>
    </div>
  );
};
