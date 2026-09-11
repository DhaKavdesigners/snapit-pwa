'use client';

import React, { useState, useEffect } from 'react';
import { Order } from '@/types';
import { formatOrderNumber } from '@/utils/orderUtils';
import { Store, Home, Coffee, Info, X } from 'lucide-react';

interface BreakOrderPreviewCardProps {
  order: Order;
  onDismiss: () => void;
  durationMs?: number;
}

export const BreakOrderPreviewCard: React.FC<BreakOrderPreviewCardProps> = ({
  order,
  onDismiss,
  durationMs = 5000,
}) => {
  const [showNotice, setShowNotice] = useState(false);
  const [progressWidth, setProgressWidth] = useState(100);

  // Smooth visual 3s progress indicator
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgressWidth(remainingPct);
      if (remainingPct <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [durationMs]);

  const handleCardClick = () => {
    setShowNotice(true);
    setTimeout(() => setShowNotice(false), 2000);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-slate-100 dark:bg-slate-900/95 text-slate-700 dark:text-slate-300 rounded-[28px] p-5 shadow-md border border-slate-300/80 dark:border-slate-800 relative overflow-hidden animate-slide-up space-y-4 filter grayscale-[0.70] opacity-95 select-none transition-all cursor-default"
      title="You're currently on break • Preview only"
    >
      {/* Top 5-Second Visual Indicator Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-slate-400 dark:bg-slate-600 transition-all duration-75 ease-linear shadow-xs"
          style={{ width: `${progressWidth}%` }}
        />
      </div>

      {/* Header: Break Live Preview Badge + Muted Payout */}
      <div className="flex items-center justify-between pt-1">
        <span className="inline-flex items-center gap-1.5 bg-slate-200/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-black uppercase px-3 py-1 rounded-full border border-slate-300/80 dark:border-slate-700">
          <Coffee className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>ON BREAK • LIVE PREVIEW #{formatOrderNumber(order.orderNumber)}</span>
        </span>

        <div className="flex items-baseline gap-1.5 bg-slate-200/80 dark:bg-slate-800 border border-slate-300/70 dark:border-slate-700 px-3 py-1 rounded-xl shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
            Payout
          </span>
          <span className="text-xl font-black text-slate-700 dark:text-slate-200 font-mono">
            ₹{order.earnings || 45}
          </span>
        </div>
      </div>

      {/* Restaurant Hero Title & Trip Specs */}
      <div>
        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
          {order.restaurantName}
        </h3>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mt-1.5">
          <span className="text-slate-700 dark:text-slate-300">📍 {order.distanceKm} km trip</span>
          <span className="text-slate-400">•</span>
          <span>⏱️ ~{order.estimatedMinutes} mins</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600 dark:text-slate-400 font-extrabold">Food Delivery</span>
        </div>
      </div>

      {/* Connected Route Timeline (Desaturated/Muted) */}
      <div className="bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-300/70 dark:border-slate-700/60 space-y-2">
        {/* Pickup Point */}
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-xl bg-slate-300/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
            <Store className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Pick Up From Store
            </span>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate mt-0.5">
              {order.restaurantAddress}
            </p>
          </div>
        </div>

        {/* Connecting Line */}
        <div className="ml-3.5 border-l-2 border-dashed border-slate-300 dark:border-slate-600 h-3" />

        {/* Drop-off Point */}
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-xl bg-slate-300/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
            <Home className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Deliver To Customer
            </span>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate mt-0.5">
              {order.deliveryAddress}
            </p>
          </div>
        </div>
      </div>

      {/* Read-Only Notice Banner (Strictly NO Accept / Pass buttons) */}
      <div className="w-full py-3 px-4 bg-slate-200/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-2xl border border-slate-300/80 dark:border-slate-700 flex items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <Info className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-[11px] leading-tight truncate">
            {showNotice ? "You're on break. Tap Resume below to work." : "You're on break • Read-only preview (~5s)"}
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
          title="Dismiss preview"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
