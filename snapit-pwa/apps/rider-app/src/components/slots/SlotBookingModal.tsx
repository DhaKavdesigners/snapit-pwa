'use client';

import React from 'react';
import { RiderSlot } from '@/types';
import { formatTimeAMPM } from '@/services/slotService';
import { Calendar, MapPin, XCircle, AlertCircle } from 'lucide-react';

interface SlotBookingModalProps {
  slot: RiderSlot | null;
  onConfirm: () => void;
  onClose: () => void;
}

export const SlotBookingModal: React.FC<SlotBookingModalProps> = ({
  slot,
  onConfirm,
  onClose,
}) => {
  if (!slot) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-6 animate-slide-up shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-slate-900">Confirm Slot Booking</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center active:scale-95">
            <XCircle className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-[18px] font-black text-slate-900 font-mono">
                {formatTimeAMPM(slot.startTimestamp)} – {formatTimeAMPM(slot.endTimestamp)}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-slate-600">{slot.zoneName}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 mb-5 text-[11px] text-slate-500 flex items-start gap-2 border border-slate-200">
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            You must be inside <strong>{slot.zoneName}</strong> during the booked time slot to receive orders.
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-[2] py-3 bg-gradient-to-r from-primary to-primary-container text-white font-bold text-xs rounded-xl shadow-lift active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            Book Slot
          </button>
        </div>
      </div>
    </div>
  );
};
