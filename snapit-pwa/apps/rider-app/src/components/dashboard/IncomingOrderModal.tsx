'use client';

import React, { useState, useEffect } from 'react';
import { useRider } from '@/context/RiderContext';
import { useRouter } from 'next/navigation';

export const IncomingOrderModal: React.FC = () => {
  const { incomingOrder, acceptIncomingOrder, declineIncomingOrder } = useRider();
  const [countdown, setCountdown] = useState(25);
  const router = useRouter();

  useEffect(() => {
    if (!incomingOrder) {
      setCountdown(25);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          declineIncomingOrder();
          return 25;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [incomingOrder, declineIncomingOrder]);

  if (!incomingOrder) return null;

  const handleAccept = () => {
    acceptIncomingOrder();
    router.push('/orders');
  };

  return (
    <div className="w-full animate-slide-up">
      {/* Elevated Card Level 2 */}
      <div className="bg-white rounded-[22px] p-5 shadow-[0px_10px_30px_rgba(15,23,42,0.14)] border border-outline-variant/30 relative overflow-hidden ring-1 ring-primary/20">
        {/* Left vertical primary highlight bar */}
        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />

        {/* Top Countdown Tracker Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-surface-container overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${(countdown / 25) * 100}%` }}
          />
        </div>

        {/* Header & Customer info */}
        <div className="flex justify-between items-start mb-3 pt-1">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary font-bold text-[11px] px-2.5 py-0.5 rounded-full border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                New Request
              </span>
              <span className="text-[10px] text-secondary font-semibold">
                Expires in {countdown}s
              </span>
            </div>
            <h2 className="font-bold text-lg text-on-surface tracking-tight">
              {incomingOrder.customerName}
            </h2>
            <p className="text-xs text-secondary mt-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-primary">
                distance
              </span>
              {incomingOrder.distanceKm} km away ({incomingOrder.estimatedMinutes} mins)
            </p>
          </div>

          {/* Earnings Badge */}
          <div className="bg-primary/5 rounded-xl p-2.5 text-center border border-primary/20 min-w-[76px] shadow-sm">
            <p className="text-[10px] uppercase font-bold tracking-wider text-secondary">
              Est. Earn
            </p>
            <p className="text-xl font-black text-primary leading-tight mt-0.5">
              ₹{incomingOrder.earnings}
            </p>
          </div>
        </div>

        {/* Restaurant & Drop location snapshot */}
        <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/30 space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="font-semibold text-on-surface truncate">
              {incomingOrder.restaurantName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span className="text-secondary truncate">
              {incomingOrder.deliveryAddress}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={declineIncomingOrder}
            className="flex-1 border border-outline-variant/60 text-secondary hover:text-on-surface hover:bg-surface-container transition-all font-semibold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
            Decline
          </button>

          <button
            onClick={handleAccept}
            className="flex-[2] bg-gradient-to-r from-primary to-primary-container text-white shadow-lift hover:opacity-95 transition-all font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 ring-2 ring-primary/20"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            Accept Order
          </button>
        </div>
      </div>
    </div>
  );
};
