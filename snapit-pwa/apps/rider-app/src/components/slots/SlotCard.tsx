'use client';

import React from 'react';
import { RiderSlot, AdminSlotConfig, DemandLevel, SlotStatus } from '@/types';
import { formatTimeAMPM, isBookingOpen } from '@/services/slotService';
import { MapPin, Users, CheckCircle2 } from 'lucide-react';

interface SlotCardProps {
  slot: RiderSlot;
  onBook: () => void;
  onWaitlist?: () => void;
  adminConfig: AdminSlotConfig;
  isBooked: boolean;
}

const DemandBadge: React.FC<{ level: DemandLevel }> = ({ level }) => {
  const config = {
    LOW: { cls: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Low Demand' },
    MEDIUM: { cls: 'bg-blue-50 text-blue-600 border-blue-200', label: 'Medium Demand' },
    HIGH: { cls: 'bg-orange-50 text-orange-600 border-orange-200', label: '🔥 High Demand' },
    VERY_HIGH: { cls: 'bg-red-50 text-red-600 border-red-200', label: '🔥 Very High Demand' },
  }[level];

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.cls}`}>
      {config.label}
    </span>
  );
};

const SlotStatusBadge: React.FC<{ status: SlotStatus }> = ({ status }) => {
  const config: Record<SlotStatus, { cls: string; label: string }> = {
    available: { cls: 'bg-green-100 text-green-700 border-green-300', label: 'AVAILABLE' },
    booked: { cls: 'bg-blue-100 text-blue-700 border-blue-300', label: 'BOOKED' },
    active: { cls: 'bg-primary/10 text-primary border-primary/30 animate-pulse', label: 'ACTIVE' },
    completed: { cls: 'bg-slate-100 text-slate-500 border-slate-200', label: 'COMPLETED' },
    cancelled: { cls: 'bg-red-100 text-red-600 border-red-200', label: 'CANCELLED' },
    missed: { cls: 'bg-amber-100 text-amber-600 border-amber-300', label: 'MISSED' },
    full: { cls: 'bg-red-100 text-red-600 border-red-200', label: 'FULL' },
    waitlisted: { cls: 'bg-purple-100 text-purple-600 border-purple-200', label: 'WAITLISTED' },
    booking_closed: { cls: 'bg-slate-100 text-slate-400 border-slate-200', label: 'CLOSED' },
  };
  const { cls, label } = config[status] || config.available;
  return (
    <span className={`text-[10px] font-extrabold tracking-wider px-2.5 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  );
};

export const SlotCard: React.FC<SlotCardProps> = ({
  slot,
  onBook,
  onWaitlist,
  adminConfig,
  isBooked,
}) => {
  const now = Date.now();
  const isPast = now >= slot.endTimestamp;
  const bookingOpen = isBookingOpen(slot, adminConfig);
  const capacityPct = Math.floor((slot.bookedCount / slot.capacity) * 100);

  if (isPast) return null;

  return (
    <div
      className={`bg-white rounded-2xl border p-4 shadow-sm transition-all ${
        isBooked ? 'border-primary/30 bg-primary/5' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[18px] font-black text-slate-900 font-mono">
            {formatTimeAMPM(slot.startTimestamp)} – {formatTimeAMPM(slot.endTimestamp)}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{slot.zoneName}</span>
          </div>
        </div>
        <SlotStatusBadge status={isBooked ? (slot.status === 'active' ? 'active' : 'booked') : slot.status} />
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DemandBadge level={slot.demandLevel} />
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Users className="w-3 h-3" />
            {slot.bookedCount}/{slot.capacity}
          </span>
        </div>

        <div>
          {isBooked ? (
            <div className="flex items-center gap-1 text-primary text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Booked</span>
            </div>
          ) : slot.status === 'full' && adminConfig.waitlistEnabled && onWaitlist ? (
            <button
              onClick={onWaitlist}
              className="text-xs font-bold text-purple-600 border border-purple-200 bg-purple-50 px-3 py-1.5 rounded-xl active:scale-95"
            >
              Join Waitlist
            </button>
          ) : slot.status === 'full' ? (
            <span className="text-xs font-bold text-slate-400">Slot Full</span>
          ) : !bookingOpen ? (
            <span className="text-xs font-bold text-slate-400">Booking Closed</span>
          ) : (
            <button
              onClick={onBook}
              className="text-xs font-bold text-white bg-primary px-4 py-1.5 rounded-xl active:scale-95 shadow-sm"
            >
              Book Slot
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
