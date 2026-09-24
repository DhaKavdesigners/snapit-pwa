'use client';

import React from 'react';
import { UnsettledEarnings } from '@/types/earnings';
import { Banknote, CalendarClock, Wallet } from 'lucide-react';

interface Props {
  data: UnsettledEarnings;
}

export const UnsettledEarningsCard: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-5 shadow-md flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
          <Wallet className="w-4 h-4 text-white" />
        </div>
        <span className="text-[11px] font-black text-white/70 uppercase tracking-widest">
          Unsettled Earnings
        </span>
      </div>

      {/* Amount */}
      <div>
        <p className="text-[38px] font-black text-white font-mono leading-none tracking-tight">
          ₹{data.amount.toLocaleString()}
        </p>
        <p className="text-xs text-white/60 mt-1 font-medium">
          Ready to be transferred to your account
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/15 rounded-full" />

      {/* Next Payout + UPI Row */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-3.5 h-3.5 text-white/60 shrink-0" />
          <span className="text-[11px] text-white/60 font-semibold">Next auto-deposit</span>
          <span className="text-[11px] font-black text-white ml-auto">{data.nextPayoutDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <Banknote className="w-3.5 h-3.5 text-white/60 shrink-0" />
          <span className="text-[11px] text-white/60 font-semibold">Credited to</span>
          <span className="text-[11px] font-black text-white/90 ml-auto font-mono truncate max-w-[160px]">
            {data.payoutUpi}
          </span>
        </div>
      </div>
    </div>
  );
};
