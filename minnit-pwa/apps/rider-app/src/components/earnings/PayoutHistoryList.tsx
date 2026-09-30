'use client';

import React from 'react';
import { PayoutRecord } from '@/types/earnings';
import { Check } from 'lucide-react';

interface PayoutHistoryListProps {
  payouts: PayoutRecord[];
}

export const PayoutHistoryList: React.FC<PayoutHistoryListProps> = ({ payouts }) => {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 flex flex-col gap-3">
      {/* Header */}
      <div>
        <h3 className="font-bold text-sm text-slate-900 tracking-tight">Payout History</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">Previously completed payouts</p>
      </div>

      {/* Compact List */}
      <div className="flex flex-col divide-y divide-slate-100 text-xs">
        {payouts.map((payout) => (
          <div
            key={payout.id}
            className="py-3 first:pt-1 last:pb-1 flex items-center justify-between"
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

            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
              <Check className="w-3 h-3 stroke-[2.5]" />
              <span>Paid</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
