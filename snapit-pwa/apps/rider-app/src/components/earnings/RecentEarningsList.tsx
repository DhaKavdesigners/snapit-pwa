'use client';

import React from 'react';
import Link from 'next/link';
import { RecentEarning } from '@/types/earnings';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface RecentEarningsListProps {
  earnings: RecentEarning[];
}

export const RecentEarningsList: React.FC<RecentEarningsListProps> = ({ earnings }) => {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 flex flex-col gap-3.5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm text-slate-900 tracking-tight">Recent Earnings</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Per-delivery earnings</p>
        </div>

        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* List of Entries */}
      <div className="flex flex-col gap-2.5">
        {earnings.map((entry) => (
          <div
            key={entry.id}
            className="bg-slate-50/90 rounded-2xl p-3.5 border border-slate-200/80 flex items-center justify-between gap-3 hover:border-emerald-200 transition-colors"
          >
            {/* Left: Order details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black font-mono text-slate-900">
                  Order #{entry.orderId}
                </span>
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Completed</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mt-1">
                <span>{entry.distanceKm} km trip</span>
                <span>•</span>
                <span>{entry.timestamp}</span>
              </div>
            </div>

            {/* Right: +₹ Amount */}
            <div className="text-right shrink-0">
              <span className="text-lg font-black font-mono text-emerald-600 block leading-tight">
                +₹{entry.amount}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
