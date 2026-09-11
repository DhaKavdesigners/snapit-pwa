'use client';

import React, { useState, useEffect } from 'react';
import { useRider } from '@/context/RiderContext';
import { DeliveryZone } from '@/types';
import {
  MapPin,
  Check,
  X,
  TrendingUp,
  Users,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ZoneSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ZoneSelectionModal: React.FC<ZoneSelectionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    rider,
    zones,
    updateRiderProfile,
  } = useRider();

  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = zones.find((z) => z.id === (rider.selectedZoneId || 'zone-1')) || zones[0];
      setSelectedZone(current);
      setIsSaving(false);
    }
  }, [isOpen, rider.selectedZoneId, zones]);

  if (!isOpen) return null;

  const handleSelectZone = (zone: DeliveryZone) => {
    setSelectedZone(zone);
    updateRiderProfile({
      selectedZone: zone.name,
      selectedZoneId: zone.id,
    });

    if (rider.phone) {
      const cleanPhone = rider.phone.replace(/[^0-9+]/g, '');
      Promise.resolve(
        supabase
          .from('rider_profiles')
          .update({
            selected_zone_id: zone.id,
            selected_zone_name: zone.name,
            updated_at: new Date().toISOString(),
          })
          .eq('phone', cleanPhone)
      ).catch(() => {});
    }

    setTimeout(() => {
      onClose();
    }, 250);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up max-h-[85vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Handle for mobile */}
        <div className="w-full flex items-center justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-slate-200" />
        </div>

        {/* Top Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-black text-base text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Select Delivery Zone</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose the area you want to receive delivery orders in
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Zone List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-2.5">
          {zones.map((zone) => {
            const isCurrent = (rider.selectedZoneId || 'zone-1') === zone.id;
            const isSelected = selectedZone?.id === zone.id;

            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => handleSelectZone(zone)}
                className={`w-full text-left rounded-2xl p-4 border transition-all cursor-pointer select-none flex items-center justify-between gap-3 active:scale-[0.99] ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/60 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <MapPin className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-sm text-slate-900 truncate">
                        {zone.name}
                      </h4>
                      {isCurrent && (
                        <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                          Active
                        </span>
                      )}
                      {zone.demand === 'HIGH' && (
                        <span className="text-[9px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                          🔥 High Demand
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 font-bold text-emerald-700">
                        <TrendingUp className="w-3 h-3 text-emerald-600" />
                        {zone.estDailyEarnings}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="w-3 h-3 text-slate-400" />
                        {zone.activeRiders} riders
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'border-2 border-slate-300 bg-slate-50'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}

          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 text-[11px] text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>You can switch your delivery zone anytime you are idle.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
