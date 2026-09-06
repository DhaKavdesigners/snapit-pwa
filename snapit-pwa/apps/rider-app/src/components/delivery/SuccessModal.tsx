'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Home } from 'lucide-react';
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
    soundEngine.playDeliveredSound(undefined, orderNumber);

    // ── Enhanced Beautiful Celebration Confetti Shower ──
    try {
      // 1. Initial Left & Right High-Velocity Cannon Blasts
      confetti({
        particleCount: 85,
        angle: 60,
        spread: 90,
        origin: { x: 0, y: 0.7 },
        colors: ['#059669', '#10b981', '#34d399', '#f59e0b', '#fbbf24', '#ffffff'],
        gravity: 0.8,
        scalar: 1.25,
        ticks: 350,
      });

      confetti({
        particleCount: 85,
        angle: 120,
        spread: 90,
        origin: { x: 1, y: 0.7 },
        colors: ['#059669', '#10b981', '#34d399', '#f59e0b', '#fbbf24', '#ffffff'],
        gravity: 0.8,
        scalar: 1.25,
        ticks: 350,
      });

      // 2. High-energy Golden & Emerald Burst in Center
      const burstTimer = setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 120,
          origin: { x: 0.5, y: 0.35 },
          colors: ['#fbbf24', '#f59e0b', '#10b981', '#34d399', '#6ee7b7', '#ffffff'],
          gravity: 0.7,
          scalar: 1.35,
          ticks: 380,
        });
      }, 200);

      // 3. Sustained Cascading Victory Rain Shower (3 seconds)
      const duration = 3000;
      const end = Date.now() + duration;

      const showerInterval = setInterval(() => {
        const timeLeft = end - Date.now();
        if (timeLeft <= 0) {
          clearInterval(showerInterval);
          return;
        }
        const count = Math.floor(30 * (timeLeft / duration));
        confetti({
          particleCount: count,
          startVelocity: 0,
          ticks: 250,
          origin: {
            x: Math.random(),
            y: Math.random() * 0.15,
          },
          colors: ['#059669', '#10b981', '#34d399', '#fbbf24', '#f59e0b', '#ffffff'],
          gravity: 0.55,
          scalar: 1.15,
          drift: (Math.random() - 0.5) * 1.8,
        });
      }, 120);

      return () => {
        clearTimeout(burstTimer);
        clearInterval(showerInterval);
      };
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  }, [orderNumber]);

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#e8f8ee] via-[#ecfdf5] to-[#dcfce7] z-50 flex flex-col items-center justify-between p-6 animate-fade-in text-slate-900 overflow-hidden">
      
      {/* ── Smooth Animated Running Background Mesh ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-20 w-96 h-96 bg-emerald-300/35 rounded-full blur-[90px] animate-glow-float-1" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 bg-teal-300/30 rounded-full blur-[100px] animate-glow-float-2" />
        <div className="absolute -bottom-20 left-1/4 w-88 h-88 bg-green-300/30 rounded-full blur-[85px] animate-glow-float-1" />
      </div>

      {/* ── Main Center Content Stack ── */}
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm w-full z-10 py-2 sm:py-4">
        
        {/* Minnit Brand Logo (Moved down & made larger as in mockup, razor-sharp) */}
        <div className="mb-8 sm:mb-9 flex items-center justify-center animate-fade-in">
          <img
            src="/images/minnit_delivered_logo.png"
            alt="Minnit"
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-xs select-none"
            style={{ imageRendering: 'auto' }}
          />
        </div>

        {/* Animated Checkmark with Breathing Glow */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-emerald-400/25 rounded-full blur-md animate-ping opacity-50" />
          <div className="relative w-20 h-20 sm:w-22 sm:h-22 bg-white/95 border-4 border-emerald-300 rounded-full flex items-center justify-center shadow-lg shadow-emerald-600/20 animate-scale-up">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 stroke-[2.5]" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2 text-center">
          Delivery successful!
        </h1>

        {/* Trip Payout without background box */}
        <div className="text-center my-5 sm:my-6 animate-fade-in">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-800/80 block mb-1.5">
            Trip Payout
          </span>
          <div className="text-6xl sm:text-7xl font-black text-emerald-700 font-mono tracking-tight drop-shadow-xs">
            ₹{earningsAmount}
          </div>
        </div>

      </div>

      {/* ── Bottom Action ── */}
      <div className="w-full z-10 pb-safe max-w-sm">
        <Link
          href="/"
          onClick={onDone}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 border border-emerald-500 ring-2 ring-emerald-400/30 transition-all text-center flex items-center justify-center gap-2 active:scale-98 cursor-pointer tracking-wider"
        >
          <Home className="w-4 h-4" />
          <span>BACK TO DASHBOARD</span>
        </Link>
      </div>

    </div>
  );
};
