'use client';

import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  Power,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Bike,
  X,
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
        <div className="p-6 flex flex-col items-center text-center space-y-4 overflow-y-auto no-scrollbar animate-scale-up">
          {/* Momo Welcome Mascot Graphic */}
          <div className="relative mt-1 flex flex-col items-center">
            <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-emerald-500/10 p-2 flex items-center justify-center border-2 border-emerald-400/40 shadow-lg shadow-emerald-500/15 ring-8 ring-emerald-50">
              <img
                src="/images/momo/characters/momo_welcome.png"
                alt="Momo Rider Assistant"
                className="w-full h-full object-contain filter drop-shadow-md"
              />
              <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center text-white shadow-sm ring-2 ring-white">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            {/* Momo Speech Bubble greeting */}
            <div className="mt-2.5 bg-emerald-50 border border-emerald-200/90 rounded-2xl px-3.5 py-1.5 shadow-2xs text-center max-w-[280px]">
              <p className="text-xs font-black text-emerald-900 leading-tight">
                &ldquo;Hi! I&apos;m Momo 👋 I&apos;ll show you how to use the app and start delivering!&rdquo;
              </p>
            </div>
          </div>

          {/* Approved Badge */}
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-black uppercase px-3.5 py-1 rounded-full tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Profile Approved by Admin
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">
              Congratulations, {rider.name || 'Rider'}! 🎉
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Your profile &amp; KYC documents have been reviewed and approved by Minnit OPS. Your account is fully active and ready for orders!
            </p>
          </div>

          {/* Rider Credentials Card */}
          <div className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 text-left space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-[11px] font-bold text-slate-500">Your Minnit Rider ID</span>
              <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                {rider.Rider_ID || rider.riderId || 'MM0001'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500">Operating Zone</span>
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                {rider.selectedZone || 'Robertsonpet, KGF'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500">Vehicle Registered</span>
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <Bike className="w-3.5 h-3.5 text-slate-600" />
                {rider.vehicleType || 'Motorcycle'} ({rider.vehicleNumber || 'Verified'})
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full space-y-2 pt-1">
            <button
              type="button"
              onClick={onStartTour}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-2xl shadow-lift hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Start Interactive UI Tour 🎯</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 text-slate-500 hover:text-slate-800 font-bold text-xs transition-colors cursor-pointer"
            >
              Explore Dashboard directly
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
