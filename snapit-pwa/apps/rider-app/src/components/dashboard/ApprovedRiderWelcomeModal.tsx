'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { soundEngine } from '@/services/soundService';
import {
  Sparkles,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Bike,
  Award,
  Zap,
} from 'lucide-react';
import { RiderProfile } from '@/types';

interface ApprovedRiderWelcomeModalProps {
  rider: RiderProfile;
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
}

export const ApprovedRiderWelcomeModal: React.FC<ApprovedRiderWelcomeModalProps> = ({
  rider,
  isOpen,
  onClose,
  onStartTour,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    // 1. Play celebratory success audio chime
    try {
      soundEngine.playSuccessChime();
    } catch {}

    // 2. Multi-stage celebratory confetti cannons
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#10b981', '#059669', '#34d399', '#fbbf24', '#f59e0b', '#38bdf8'],
      });

      const timer = setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0.15, y: 0.6 },
          colors: ['#10b981', '#fbbf24', '#3b82f6'],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 0.85, y: 0.6 },
          colors: ['#10b981', '#fbbf24', '#3b82f6'],
        });
      }, 350);

      return () => clearTimeout(timer);
    } catch {}
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      {/* Radiant Glowing Atmosphere Aura */}
      <div className="absolute w-80 h-80 rounded-full bg-gradient-to-tr from-emerald-500/25 via-teal-400/20 to-amber-400/20 blur-3xl pointer-events-none animate-pulse" />

      {/* Main Modal Card */}
      <div className="relative bg-white w-full max-w-sm rounded-[36px] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border border-emerald-500/30 flex flex-col max-h-[92vh] ring-4 ring-emerald-500/10 animate-scale-up">
        
        {/* Top Celebration Ribbon Header */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 py-3 px-4 text-center overflow-hidden">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
          <div className="relative flex items-center justify-center gap-1.5 text-white">
            <Award className="w-4 h-4 text-amber-300 stroke-[2.5]" />
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-50 drop-shadow-sm">
              Official Rider Certification
            </span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </div>
        </div>

        <div className="p-6 flex flex-col items-center text-center space-y-4 overflow-y-auto no-scrollbar">
          
          {/* Momo Welcome Mascot in Golden Radiant Circle */}
          <div className="relative mt-0.5 flex flex-col items-center">
            {/* Glowing circular aura */}
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-tr from-emerald-100 via-teal-50 to-amber-100 p-2.5 flex items-center justify-center border-2 border-emerald-400/50 shadow-xl shadow-emerald-500/20 ring-8 ring-emerald-50/80">
              <img
                src="/images/momo/templates/momo_helmet_ready.png"
                alt="Momo Rider Mascot"
                className="w-full h-full object-contain filter drop-shadow-md transform hover:scale-105 transition-transform"
              />
              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white shadow-md ring-2 ring-white">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            {/* Momo Speech Greeting */}
            <div className="mt-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/90 rounded-2xl px-4 py-2 shadow-2xs text-center max-w-[290px]">
              <p className="text-xs font-black text-emerald-950 leading-snug">
                &ldquo;Welcome to Minnit, {rider.name?.split(' ')[0] || 'Partner'}! 🎉 Let&apos;s do a quick live delivery demo!&rdquo;
              </p>
            </div>
          </div>

          {/* Approved Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-black uppercase px-4 py-1.5 rounded-full tracking-wider shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
            <span>Profile Verified &amp; Active</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Congratulations! 🚀
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-[280px] leading-relaxed">
              Your documents are fully approved by Minnit OPS. You are certified to earn on the Minnit delivery network.
            </p>
          </div>

          {/* Rider Credentials Card */}
          <div className="w-full bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3.5 text-left space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-[11px] font-bold text-slate-500">Minnit Partner ID</span>
              <span className="text-xs font-mono font-black text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                {rider.Rider_ID || rider.riderId || 'MM0001'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500">Allotted Operating Zone</span>
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                {rider.selectedZone || 'Robertsonpet, KGF'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500">Registered Vehicle</span>
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <Bike className="w-3.5 h-3.5 text-slate-700" />
                {rider.vehicleType || 'Motorcycle'} ({rider.vehicleNumber || 'Verified'})
              </span>
            </div>
          </div>

          {/* Super CTA Actions */}
          <div className="w-full space-y-2 pt-1">
            <button
              type="button"
              onClick={onStartTour}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 border border-emerald-400/40 ring-4 ring-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider group"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300 group-hover:scale-110 transition-transform" />
              <span>START INTERACTIVE DEMO 🚀</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 text-slate-400 hover:text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Explore Cockpit directly
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
