'use client';

import React, { useState, useEffect } from 'react';
import { useRider } from '@/context/RiderContext';
import { DeliveryZone } from '@/types';
import { ALLOWED_SESSION_DURATIONS, SessionDurationHours, DEFAULT_SESSION_DURATION } from '@/services/sessionService';
import {
  MapPin,
  Clock,
  Zap,
  Bike,
  Flame,
  Check,
  X,
  Sparkles,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface StartRidingSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DurationOption {
  hours: SessionDurationHours;
  title: string;
  subtitle: string;
  badge?: string;
  icon: React.ReactNode;
}

const DURATION_OPTIONS: DurationOption[] = [
  {
    hours: 2,
    title: '2 Hours',
    subtitle: 'Quick session',
    icon: <Zap className="w-5 h-5 text-amber-500" />,
  },
  {
    hours: 3,
    title: '3 Hours',
    subtitle: 'Recommended',
    badge: 'Popular',
    icon: <Bike className="w-5 h-5 text-emerald-600" />,
  },
  {
    hours: 4,
    title: '4 Hours',
    subtitle: 'Long session',
    badge: 'Max Earnings',
    icon: <Flame className="w-5 h-5 text-orange-500" />,
  },
];

export const StartRidingSheet: React.FC<StartRidingSheetProps> = ({ isOpen, onClose }) => {
  const { rider, zones, startSession } = useRider();

  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<SessionDurationHours>(DEFAULT_SESSION_DURATION);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize selected zone to current rider's zone or first zone
  useEffect(() => {
    if (isOpen) {
      const current = zones.find((z) => z.id === (rider.selectedZoneId || 'zone-1')) || zones[0];
      setSelectedZone(current);
      setSelectedDuration(DEFAULT_SESSION_DURATION);
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen, rider.selectedZoneId, zones]);

  if (!isOpen) return null;

  const handleStartRiding = async () => {
    if (!selectedZone) {
      setErrorMessage('Please select a working zone.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await startSession(selectedZone.id, selectedZone.name, selectedDuration);
      onClose();
    } catch (err: any) {
      console.warn('Failed to start riding session:', err);
      // Even if network fails, sessionService guarantees local persistence
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up max-h-[92vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drag Handle for mobile */}
        <div className="w-full flex items-center justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>Start Riding Session</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Choose your zone & session duration to start receiving orders
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 active:scale-95 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs text-red-700 font-bold">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ── STEP 1: SELECT YOUR ZONE ── */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>1. Select Working Zone</span>
              </label>
              <span className="text-[11px] font-bold text-slate-400">
                Where you will deliver
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {zones.map((zone) => {
                const isSelected = selectedZone?.id === zone.id;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => setSelectedZone(zone)}
                    className={`w-full text-left rounded-2xl p-3.5 border transition-all cursor-pointer select-none flex items-center justify-between gap-3 active:scale-[0.99] ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/25 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-sm text-slate-900 leading-tight truncate">
                            {zone.name}
                          </h4>
                          {zone.demand === 'HIGH' && (
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                              🔥 High Demand
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                          <span>{zone.radius}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold">{zone.estDailyEarnings}</span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'border-2 border-slate-300 bg-slate-50'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── STEP 2: SELECT RIDING DURATION ── */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>2. Select Session Duration</span>
              </label>
              <span className="text-[11px] font-bold text-slate-400">
                Continuous duty window
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {DURATION_OPTIONS.map((opt) => {
                const isSelected = selectedDuration === opt.hours;
                return (
                  <button
                    key={opt.hours}
                    type="button"
                    onClick={() => setSelectedDuration(opt.hours)}
                    className={`relative rounded-2xl p-3.5 border transition-all cursor-pointer select-none flex flex-col items-center text-center justify-between min-h-[110px] active:scale-95 ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/25 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Optional Top Badge */}
                    {opt.badge && (
                      <span
                        className={`absolute -top-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    )}

                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mb-1 mt-0.5">
                      {opt.icon}
                    </div>

                    <div>
                      <p className="text-sm font-black text-slate-900 leading-tight">
                        {opt.title}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                        {opt.subtitle}
                      </p>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full mt-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'border border-slate-300 bg-slate-50'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Notice */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Flexible Riding Perks</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              You can extend your session by +1 hour anytime, or take a short rest break when idle. No rigid shift lockouts.
            </p>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 border-t border-slate-100 bg-white shrink-0">
          <button
            type="button"
            onClick={handleStartRiding}
            disabled={isSubmitting}
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/25 border border-emerald-500 ring-2 ring-emerald-400/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            {isSubmitting ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Starting your session...</span>
              </>
            ) : (
              <>
                <Bike className="w-5 h-5 stroke-[2.5]" />
                <span>START RIDING NOW ({selectedDuration} HOURS)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
