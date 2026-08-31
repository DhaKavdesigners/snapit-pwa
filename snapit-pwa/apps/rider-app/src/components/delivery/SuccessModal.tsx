'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, TrendingUp, Home, PackageCheck } from 'lucide-react';
import Link from 'next/link';
import { soundEngine } from '@/services/soundService';

interface SuccessModalProps {
  orderNumber: string;
  earningsAmount: number;
  onDone: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  orderNumber,
  earningsAmount,
  onDone,
}) => {
  useEffect(() => {
    // Play celebratory coin / payout chime
    soundEngine.playPayoutChime();

    // Trigger confetti explosion
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#006e2f', '#22c55e', '#6bff8f', '#ffffff', '#ffd700'],
      });
    } catch (e) {
      console.warn(e);
    }
  }, []);

  return (
    <div className="absolute inset-0 bg-background z-50 flex flex-col items-center justify-between p-6 animate-fade-in">
      {/* Background glow burst */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
        <div className="w-72 h-72 bg-primary rounded-full blur-[100px]" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm w-full z-10">
        {/* Animated Pop Icon */}
        <div className="w-24 h-24 bg-primary-container/20 border-4 border-primary/30 rounded-full flex items-center justify-center mb-6 shadow-lift animate-scale-up">
          <CheckCircle2 className="w-14 h-14 text-primary animate-pulse-soft" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black text-on-surface tracking-tight mb-2">
          Delivery Successful!
        </h1>
        <p className="text-sm text-secondary mb-6">
          Order #{orderNumber} has been verified and delivered to customer.
        </p>

        {/* Earnings Credited Bento Card */}
        <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-primary/20 shadow-soft mb-4 text-left">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
              Trip Payout
            </span>
            <span className="text-2xl font-black text-primary font-mono">
              +₹{earningsAmount}
            </span>
          </div>

          <div className="h-px w-full bg-surface-container mb-3" />

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-primary font-bold">
              <TrendingUp className="w-4 h-4" />
              Wallet Balance Updated
            </span>
            <span className="bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full text-[11px]">
              Instant Credit
            </span>
          </div>
        </div>

        {/* Rating Prompt */}
        <div className="bg-surface-container-low rounded-xl p-3 w-full text-center border border-outline-variant/30">
          <p className="text-xs text-secondary">Customer rated you 5.0 ⭐ for high speed!</p>
        </div>
      </div>

      {/* Bottom Navigation Actions */}
      <div className="w-full flex flex-col gap-3 z-10 pb-safe">
        <Link
          href="/"
          onClick={onDone}
          className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-white font-bold text-sm rounded-2xl shadow-lift hover:opacity-95 transition-all text-center flex items-center justify-center gap-2 active:scale-98"
        >
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <Link
          href="/orders"
          onClick={onDone}
          className="w-full py-3.5 bg-white border border-outline-variant/50 text-on-surface font-semibold text-xs rounded-2xl hover:bg-surface-container transition-colors text-center flex items-center justify-center gap-2 shadow-sm"
        >
          <PackageCheck className="w-4 h-4 text-secondary" />
          View Completed Orders
        </Link>
      </div>
    </div>
  );
};
