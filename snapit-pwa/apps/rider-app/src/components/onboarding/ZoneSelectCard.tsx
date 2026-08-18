'use client';

import React from 'react';
import { DeliveryZone } from '@/types';
import { Check, MapPin } from 'lucide-react';

interface ZoneSelectCardProps {
  zone: DeliveryZone;
  isSelected: boolean;
  onSelect: () => void;
}

export const ZoneSelectCard: React.FC<ZoneSelectCardProps> = ({
  zone,
  isSelected,
  onSelect,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`relative rounded-2xl p-5 cursor-pointer transition-all duration-200 overflow-hidden ${
        isSelected
          ? 'bg-primary-container/10 border-2 border-primary shadow-soft'
          : 'bg-white border border-outline-variant/40 hover:border-outline-variant shadow-sm'
      }`}
    >
      {/* High Demand Ribbon */}
      {zone.demand === 'HIGH' && (
        <div className="absolute top-0 right-0 bg-primary text-white text-[10px] px-3 py-1 rounded-bl-xl font-black tracking-wider uppercase shadow-sm">
          High Demand
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-base text-on-surface mb-1">{zone.name}</h3>
          <p className="text-xs text-secondary flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            {zone.radius} ({zone.activeRiders} riders active)
          </p>
        </div>

        {/* Selected check circle */}
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-primary text-white shadow-sm'
              : 'border-2 border-outline-variant'
          }`}
        >
          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider block">
            Est. Daily Earnings
          </span>
          <span className="text-xs font-bold text-primary font-mono">
            {zone.estDailyEarnings}
          </span>
        </div>
        <span className="text-[10px] text-secondary font-medium">⚡ Instant Approval</span>
      </div>
    </div>
  );
};
