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
    <>
      {/* Semi-transparent Backdrop Overlay for Floating Window */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 animate-fade-in" onClick={declineIncomingOrder} />

      {/* Floating Window Container */}
      <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-50 animate-slide-up">
        {/* Floating Card Window */}
        <div className="bg-white/95 backdrop-blur-md rounded-[24px] p-5 shadow-[0px_20px_50px_rgba(0,0,0,0.25)] border border-emerald-500/30 relative overflow-hidden ring-2 ring-emerald-500/20">
          {/* Top Floating Badge */}
          <div className="absolute top-2 right-4 bg-emerald-50 text-emerald-700 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-200">
            Floating Request
          </div>

          {/* Left vertical primary highlight bar */}
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600" />

          {/* Top Countdown Tracker Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 25) * 100}%` }}
            />
          </div>

          {/* Header & Customer info */}
          <div className="flex justify-between items-start mb-3 pt-2">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold text-[11px] px-2.5 py-0.5 rounded-full border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                  New Incoming Order
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  Expires in {countdown}s
                </span>
              </div>
              <h2 className="font-black text-lg text-slate-900 tracking-tight">
                {incomingOrder.customerName}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[15px] text-emerald-600">
                  distance
                </span>
                {incomingOrder.distanceKm} km away ({incomingOrder.estimatedMinutes} mins)
              </p>
            </div>

            {/* Earnings Badge */}
            <div className="bg-emerald-50 rounded-xl p-2.5 text-center border border-emerald-200 min-w-[76px] shadow-sm">
              <p className="text-[9px] uppercase font-extrabold tracking-wider text-emerald-800">
                Est. Earn
              </p>
              <p className="text-xl font-black text-emerald-600 font-mono leading-tight mt-0.5">
                ₹{incomingOrder.earnings}
              </p>
            </div>
          </div>

          {/* Restaurant & Drop location snapshot */}
          <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/80 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
              <span className="font-bold text-slate-800 truncate">
                {incomingOrder.restaurantName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-slate-600 truncate font-medium">
                {incomingOrder.deliveryAddress}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={declineIncomingOrder}
              className="flex-1 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
              Decline
            </button>

            <button
              onClick={handleAccept}
              className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg font-black text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 ring-2 ring-emerald-500/30 transition-all"
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
    </>
  );
};
