'use client';

import React from 'react';
import { Info } from 'lucide-react';

export const SettlementInfoNotice: React.FC = () => {
  return (
    <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/60 flex items-start gap-2.5 text-[11px] text-slate-500 leading-relaxed">
      <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
      <span>
        Your earnings are added to your Snapit wallet after each completed delivery. Payouts are processed through Razorpay after the settlement period.
      </span>
    </div>
  );
};
