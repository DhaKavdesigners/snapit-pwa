'use client';

import React from 'react';
import { useRider } from '@/context/RiderContext';
import Link from 'next/link';

export const QuickStatsBento: React.FC = () => {
  const { earnings } = useRider();

  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {/* Earnings Bento Box */}
      <Link
        href="/earnings"
        className="bg-white/85 backdrop-blur-md border border-outline-variant/30 rounded-2xl p-3.5 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] transition-all hover:bg-white hover:shadow-md active:scale-98 flex flex-col justify-between group"
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
            Today&apos;s Earnings
          </p>
          <span className="material-symbols-outlined text-[16px] text-primary group-hover:translate-x-0.5 transition-transform">
            trending_up
          </span>
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold tracking-tight text-on-surface">
            ₹{earnings.today.toLocaleString()}
          </p>
          <p className="text-[10px] text-primary font-semibold mt-0.5 flex items-center gap-0.5">
            +15% vs yesterday
          </p>
        </div>
      </Link>

      {/* Deliveries Bento Box */}
      <Link
        href="/orders"
        className="bg-white/85 backdrop-blur-md border border-outline-variant/30 rounded-2xl p-3.5 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] transition-all hover:bg-white hover:shadow-md active:scale-98 flex flex-col justify-between group"
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
            Deliveries
          </p>
          <span className="material-symbols-outlined text-[16px] text-tertiary group-hover:scale-110 transition-transform">
            local_shipping
          </span>
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold tracking-tight text-on-surface">
            {earnings.todayDeliveries}{' '}
            <span className="text-xs text-secondary font-normal">
              / {earnings.todayTargetDeliveries}
            </span>
          </p>
          {/* Mini progress bar towards daily goal */}
          <div className="w-full bg-surface-container rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  (earnings.todayDeliveries / earnings.todayTargetDeliveries) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      </Link>
    </div>
  );
};
