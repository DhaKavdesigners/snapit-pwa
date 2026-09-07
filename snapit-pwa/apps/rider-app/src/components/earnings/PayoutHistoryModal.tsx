'use client';

import React, { useEffect } from 'react';
import { PayoutRecord } from '@/types/earnings';
import { X, Check, History, ShieldCheck } from 'lucide-react';

interface PayoutHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  payouts: PayoutRecord[];
}

export const PayoutHistoryModal: React.FC<PayoutHistoryModalProps> = ({
  isOpen,
  onClose,
  payouts,
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col gap-4 animate-slide-up max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shadow-2xs">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">Payout History</h3>
              <p className="text-[11px] text-slate-500 font-medium">Completed bank transfers</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Payouts List */}
        <div className="flex flex-col divide-y divide-slate-100">
          {payouts.map((payout) => (
            <div
              key={payout.id}
              className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
            >
              <div>
                <span className="text-base font-black font-mono text-slate-900 block leading-tight">
                  ₹{payout.amount.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                  <span className="text-emerald-700 font-bold">Paid</span>
                  <span>•</span>
                  <span>{payout.date}</span>
                </span>
              </div>

              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs">
                <Check className="w-3 h-3 stroke-[2.5]" />
                <span>Paid</span>
              </span>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 text-[11px] text-slate-500 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Payouts are directly credited to your registered account.</span>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl active:scale-98 transition-all cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
