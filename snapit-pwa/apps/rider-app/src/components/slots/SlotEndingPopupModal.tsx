'use client';

import React from 'react';
import { RiderSlot } from '@/types';
import { Clock, Zap, X } from 'lucide-react';

interface SlotEndingPopupModalProps {
  slot: RiderSlot;
  remainingMinutes: number;
  onExtend: () => void;
  onClose: () => void;
}

export const SlotEndingPopupModal: React.FC<SlotEndingPopupModalProps> = ({
  remainingMinutes,
  onExtend,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[300px] bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 animate-scale-in text-center flex flex-col items-center gap-3 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-right close icon */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon Badge */}
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center mt-1 shadow-2xs">
          <Clock className="w-6 h-6 animate-pulse" />
        </div>

        {/* Title & Description */}
        <div className="px-1">
          <h3 className="text-[15px] font-black text-slate-900 leading-tight">
            Slot Ending in {Math.max(1, remainingMinutes)}m
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1 leading-normal">
            Extend duty time by <strong>+1 hour</strong> to continue receiving orders uninterrupted.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2 pt-1">
          <button
            type="button"
            onClick={() => {
              onExtend();
              onClose();
            }}
            className="w-full py-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-xs rounded-xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer ring-2 ring-rose-200/50"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Extend +1 Hour</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-1.5 text-slate-400 hover:text-slate-600 font-bold text-xs transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
