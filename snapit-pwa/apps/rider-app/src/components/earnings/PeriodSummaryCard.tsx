'use client';

import React, { useState } from 'react';
import { PeriodSummary, PeriodKey } from '@/types/earnings';
import { Package, IndianRupee, Star, TrendingUp } from 'lucide-react';

interface Props {
  data: PeriodSummary;
}

const TABS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

export const PeriodSummaryCard: React.FC<Props> = ({ data }) => {
  const [active, setActive] = useState<PeriodKey>('today');
  const breakdown = data[active];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Tab Bar */}
      <div className="flex border-b border-slate-100">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`flex-1 py-2.5 text-[11px] font-black transition-all cursor-pointer ${
              active === tab.key
                ? 'text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/60'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {/* Deliveries Completed */}
        <div className="bg-slate-50 rounded-xl p-3 flex items-start gap-2.5 border border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
            <Package className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-semibold leading-tight">
              Deliveries
            </p>
            <p className="text-lg font-black text-slate-900 font-mono leading-tight mt-0.5">
              {breakdown.deliveries}
            </p>
          </div>
        </div>

        {/* Total Earned */}
        <div className="bg-emerald-50 rounded-xl p-3 flex items-start gap-2.5 border border-emerald-100">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[10px] text-emerald-700 font-semibold leading-tight">
              Total Earned
            </p>
            <p className="text-lg font-black text-emerald-800 font-mono leading-tight mt-0.5">
              ₹{breakdown.total.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Delivery Pay */}
        <div className="bg-slate-50 rounded-xl p-3 flex items-start gap-2.5 border border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
            <IndianRupee className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-semibold leading-tight">
              Delivery Pay
            </p>
            <p className="text-lg font-black text-slate-900 font-mono leading-tight mt-0.5">
              ₹{breakdown.deliveryPay.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Incentives & Tips */}
        <div className="bg-slate-50 rounded-xl p-3 flex items-start gap-2.5 border border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
            <Star className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-semibold leading-tight">
              Incentives & Tips
            </p>
            <p className="text-lg font-black text-slate-900 font-mono leading-tight mt-0.5">
              ₹{breakdown.incentives.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
