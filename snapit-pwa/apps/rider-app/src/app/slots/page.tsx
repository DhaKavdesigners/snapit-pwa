'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AppShell } from '@/components/layout/AppShell';
import { useRider } from '@/context/RiderContext';
import {
  Calendar,
  Clock,
  MapPin,
  Flame,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Zap,
  Coffee,
  Check,
  X,
  ArrowRight,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  ShieldCheck,
  Power,
} from 'lucide-react';
import { ZoneSelectionModal } from '@/components/slots/ZoneSelectionModal';
import {
  formatTimeAMPM,
  formatRemainingTime,
  getTodayDateString,
  getTomorrowDateString,
} from '@/services/slotService';
import { getNow } from '@/services/mockService';
import { RiderSlot } from '@/types';

type TimePeriodFilter = 'ALL' | 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';

export default function SlotsPage() {
  const {
    slots,
    activeSlot,
    upcomingSlot,
    bookedSlotIds,
    bookSlot,
    cancelSlot,
    extendSlot,
    rider,
    isOnline,
    toggleOnline,
    getSlotEligibility,
    demandStatus,
  } = useRider();

  const [selectedDay, setSelectedDay] = useState<'today' | 'tomorrow'>('today');
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriodFilter>('ALL');
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [slotToCancel, setSlotToCancel] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(getNow());

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setNow(getNow()), 1000);
    return () => clearInterval(t);
  }, []);

  // Lock scroll & listen for Escape key when cancel modal is open
  useEffect(() => {
    if (slotToCancel) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setSlotToCancel(null);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [slotToCancel]);

  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString();
  const targetDateStr = selectedDay === 'today' ? todayStr : tomorrowStr;

  // Identify current 1-hour slot window for today
  const currentHourSlot = slots.find(
    (s) => s.date === todayStr && now >= s.startTimestamp && now < s.endTimestamp
  );

  // Separate today and tomorrow slots, filtering out passed slots for today
  const todaySlots = slots.filter((slot) => slot.date === todayStr);
  const activeAndFutureTodaySlots = todaySlots.filter((slot) => slot.endTimestamp > now);
  const tomorrowSlots = slots.filter((slot) => slot.date === tomorrowStr);
  const daySlots = selectedDay === 'today' ? activeAndFutureTodaySlots : tomorrowSlots;

  // Filter slots by selected 24h period and selected day, excluding passed slots
  const filteredSlots = daySlots.filter((slot) => {
    if (slot.endTimestamp <= now) return false;

    const d = new Date(slot.startTimestamp);
    const hour = d.getHours();

    if (selectedPeriod === 'MORNING') return hour >= 6 && hour < 12;
    if (selectedPeriod === 'AFTERNOON') return hour >= 12 && hour < 17;
    if (selectedPeriod === 'EVENING') return hour >= 17 && hour < 22;
    if (selectedPeriod === 'NIGHT') return hour >= 22 || hour < 6;
    return true;
  });

  return (
    <AppShell>
      <div className="flex flex-col gap-3.5 pt-2 pb-8 max-w-md mx-auto w-full">

        {/* ── 1. HEADER WITH ZONE PICKER ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span>24h Duty Slots</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              1-Hour Shifts • Instant Booking
            </p>
          </div>

          <button
            onClick={() => setIsZoneModalOpen(true)}
            className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs text-xs font-bold text-slate-700 hover:border-slate-300 transition-all cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span className="truncate max-w-[110px]">{rider.selectedZone || 'Robertsonpet'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        {/* ── 2. CURRENT ACTIVE HOUR (HERO CARD FOR TODAY) ── */}
        {selectedDay === 'today' && currentHourSlot && (() => {
          const isBooked = currentHourSlot.status === 'booked' || currentHourSlot.status === 'active' || bookedSlotIds.includes(currentHourSlot.id);
          const remainingMs = Math.max(0, currentHourSlot.endTimestamp - now);
          const remainingMins = Math.floor(remainingMs / 60000);
          const totalDurationMs = Math.max(1, currentHourSlot.endTimestamp - currentHourSlot.startTimestamp);
          const percentRemaining = Math.min(100, Math.max(0, (remainingMs / totalDurationMs) * 100));

          if (isBooked) {
            // Active slot: Light green when active (> 10m remaining), Light red during last 10 minutes (<= 10m remaining)
            let cardTheme = {
              cardBg: 'bg-emerald-50/95',
              cardBorder: 'border-emerald-200/90',
              cardText: 'text-emerald-950',
              badgeBg: 'bg-emerald-100',
              badgeText: 'text-emerald-800',
              badgeBorder: 'border-emerald-300/80',
              statusDot: 'bg-emerald-500 animate-pulse',
              statusLabel: 'ACTIVE DUTY',
              subtitleText: 'text-emerald-700',
              actionText: 'text-emerald-700',
              trackBg: 'bg-emerald-200/60',
              barBg: 'bg-emerald-500',
              isEndingSoonLast10: false,
            };

            if (remainingMins <= 10) {
              // Light Red (ENDING SOON <= 10m)
              cardTheme = {
                cardBg: 'bg-rose-50/95',
                cardBorder: 'border-rose-200/90',
                cardText: 'text-rose-950',
                badgeBg: 'bg-rose-100',
                badgeText: 'text-rose-800',
                badgeBorder: 'border-rose-300/80',
                statusDot: 'bg-rose-500 animate-ping',
                statusLabel: 'ENDING SOON',
                subtitleText: 'text-rose-700',
                actionText: 'text-rose-700',
                trackBg: 'bg-rose-200/60',
                barBg: 'bg-rose-500',
                isEndingSoonLast10: true,
              };
            }

            const nextSlot = slots.find((s) => s.startTimestamp === currentHourSlot.endTimestamp);

            return (
              <div className={`rounded-3xl p-4 sm:p-4.5 border shadow-sm relative overflow-hidden transition-all ${cardTheme.cardBg} ${cardTheme.cardBorder} ${cardTheme.cardText}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${cardTheme.badgeBg} ${cardTheme.badgeText} border ${cardTheme.badgeBorder}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cardTheme.statusDot}`} />
                    <span>{cardTheme.statusLabel}</span>
                  </span>
                  <span className={`text-[11px] font-bold font-mono shrink-0 ${cardTheme.subtitleText}`}>
                    {formatRemainingTime(remainingMs)} left
                  </span>
                </div>

                <div className="my-2">
                  <p className={`text-xl font-black font-mono tracking-tight ${cardTheme.cardText}`}>
                    {formatTimeAMPM(currentHourSlot.startTimestamp)} – {formatTimeAMPM(currentHourSlot.endTimestamp)}
                  </p>
                  <p className={`text-xs font-semibold mt-0.5 ${cardTheme.subtitleText}`}>
                    {isOnline ? '🟢 Connected to live store orders' : '⚪ Toggle online in top bar to receive orders'}
                  </p>
                </div>

                {/* Extend Button (Last 10 Min) */}
                {cardTheme.isEndingSoonLast10 && (
                  <div className="my-2.5 pt-2 border-t border-rose-200/70">
                    <button
                      type="button"
                      onClick={() => {
                        if (nextSlot) {
                          extendSlot(currentHourSlot.id, nextSlot.id);
                        } else {
                          const nextStartTs = currentHourSlot.endTimestamp;
                          const d = new Date(nextStartTs);
                          const h = d.getHours();
                          const nextSlotId = `slot-${currentHourSlot.date}-${h}`;
                          bookSlot(
                            nextSlotId,
                            currentHourSlot.zoneId || rider.selectedZoneId || 'zone-1',
                            currentHourSlot.zoneName || rider.selectedZone || 'Robertsonpet'
                          );
                        }
                      }}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer ring-2 ring-rose-300/40"
                    >
                      <Zap className="w-4 h-4 fill-white" />
                      <span>Extend +1 Hour ({formatTimeAMPM(currentHourSlot.endTimestamp)} – {formatTimeAMPM(currentHourSlot.endTimestamp + 60 * 60 * 1000)})</span>
                    </button>
                  </div>
                )}

                {/* 1-Touch Action Row */}
                <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between gap-2">
                  <span className={`text-xs font-bold flex items-center gap-1 ${cardTheme.actionText}`}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>You are On Duty</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSlotToCancel(currentHourSlot.id)}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer shrink-0"
                  >
                    Cancel Slot
                  </button>
                </div>

                {/* Live Remaining Timing Line Bar at the Bottom */}
                <div className="w-full mt-2.5 pt-0.5">
                  <div className={`w-full ${cardTheme.trackBg} rounded-full h-1.5 overflow-hidden`}>
                    <div
                      className={`h-full ${cardTheme.barBg} rounded-full transition-all duration-1000 ease-linear`}
                      style={{ width: `${Math.max(2, percentRemaining)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          }

          const heroEligibility = getSlotEligibility(currentHourSlot);

          if (!heroEligibility.canBook) {
            return (
              <div className="rounded-3xl p-4 border shadow-sm relative overflow-hidden transition-all bg-slate-50 border-slate-200 text-slate-900">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-200/80 text-slate-700 border border-slate-300">
                    <span>BOOKING CLOSED</span>
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 font-mono shrink-0">
                    {formatRemainingTime(remainingMs)} left
                  </span>
                </div>

                <div className="my-2">
                  <p className="text-xl font-black text-slate-800 font-mono tracking-tight">
                    {formatTimeAMPM(currentHourSlot.startTimestamp)} – {formatTimeAMPM(currentHourSlot.endTimestamp)}
                  </p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    Booking is closed for this slot. Please book the next available hourly slot below.
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200">
                  <div className="w-full py-2.5 bg-slate-100 text-slate-500 font-bold text-xs rounded-xl text-center border border-slate-200">
                    Booking Closed • Book Next Slot Below
                  </div>
                </div>
              </div>
            );
          }

          if (heroEligibility.isHighDemandOverride) {
            return (
              <div className="rounded-3xl p-4 border shadow-sm relative overflow-hidden transition-all bg-orange-50/90 border-orange-300 text-slate-900 ring-2 ring-orange-400/30">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-900 border border-orange-300 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping shrink-0" />
                    <span>HIGH DEMAND — INSTANT BOOKING AVAILABLE</span>
                  </span>
                  <span className="text-[11px] font-bold text-orange-700 font-mono shrink-0">
                    {formatRemainingTime(remainingMs)} left
                  </span>
                </div>

                <div className="my-2">
                  <p className="text-xl font-black text-slate-900 font-mono tracking-tight">
                    {formatTimeAMPM(currentHourSlot.startTimestamp)} – {formatTimeAMPM(currentHourSlot.endTimestamp)}
                  </p>
                  <p className="text-xs font-medium text-orange-900 mt-0.5">
                    High customer order demand detected! Emergency instant booking open to handle incoming orders.
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-orange-200/60">
                  <button
                    type="button"
                    onClick={() => bookSlot(currentHourSlot.id, currentHourSlot.zoneId || 'z1', currentHourSlot.zoneName || rider.selectedZone || 'Robertsonpet')}
                    className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ring-2 ring-orange-300/50"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>HIGH DEMAND: INSTANT BOOK NOW</span>
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div className="rounded-3xl p-4 border shadow-sm relative overflow-hidden transition-all bg-emerald-50/70 border-emerald-200/90 text-slate-900">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span>CURRENT 1H SLOT</span>
                </span>
                <span className="text-[11px] font-bold text-emerald-700 font-mono shrink-0">
                  {formatRemainingTime(remainingMs)} left
                </span>
              </div>

              <div className="my-2">
                <p className="text-xl font-black text-slate-900 font-mono tracking-tight">
                  {formatTimeAMPM(currentHourSlot.startTimestamp)} – {formatTimeAMPM(currentHourSlot.endTimestamp)}
                </p>
                <p className="text-xs font-medium text-slate-600 mt-0.5">
                  Open 1-hour slot available right now. Book to start receiving orders.
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-emerald-200/60">
                <button
                  type="button"
                  onClick={() => bookSlot(currentHourSlot.id, currentHourSlot.zoneId || 'z1', currentHourSlot.zoneName || rider.selectedZone || 'Robertsonpet')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>BOOK & START NOW</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* ── 3. DAY SELECTOR (TODAY / TOMORROW) ── */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setSelectedDay('today')}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              selectedDay === 'today'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Today ({activeAndFutureTodaySlots.length})
          </button>
          <button
            onClick={() => setSelectedDay('tomorrow')}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              selectedDay === 'tomorrow'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tomorrow ({tomorrowSlots.length})
          </button>
        </div>

        {/* ── 4. TIME PERIOD PILLS (CLEAN SCROLL WITH ZERO SCROLLBAR TRACK) ── */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { key: 'ALL', label: 'All 24h', icon: Clock },
            { key: 'MORNING', label: 'Morning (6A-12P)', icon: Sunrise },
            { key: 'AFTERNOON', label: 'Afternoon (12P-5P)', icon: Sun },
            { key: 'EVENING', label: 'Evening (5P-10P) 🔥', icon: Sunset },
            { key: 'NIGHT', label: 'Night (10P-6A)', icon: Moon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedPeriod === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setSelectedPeriod(tab.key as TimePeriodFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── 5. CLEAN 24-HOUR SLOTS LIST ── */}
        <div className="space-y-2">
          {filteredSlots.map((slot) => {
            const isBooked = slot.status === 'booked' || slot.status === 'active';
            const startHour = new Date(slot.startTimestamp).getHours();
            const isPeak = (startHour >= 12 && startHour < 16) || (startHour >= 18 && startHour < 22);
            const eligibility = getSlotEligibility(slot);
            const isCurrentWindow = eligibility.isCurrentSlot && slot.date === todayStr;
            const isPast = eligibility.isPast && !isBooked && slot.date === todayStr;

            return (
              <div
                key={slot.id}
                className={`bg-white rounded-2xl p-3.5 border transition-all flex items-center justify-between gap-3 shadow-2xs ${
                  isBooked
                    ? 'border-emerald-400 bg-emerald-50/25 ring-1 ring-emerald-400/40'
                    : isCurrentWindow && eligibility.isHighDemandOverride
                    ? 'border-orange-400 bg-orange-50/20 ring-1 ring-orange-300'
                    : isCurrentWindow && eligibility.canBook
                    ? 'border-emerald-400 bg-emerald-50/10'
                    : isCurrentWindow && !eligibility.canBook
                    ? 'border-slate-200 bg-slate-50/70'
                    : isPast
                    ? 'border-slate-200 opacity-60 bg-slate-50/60'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Left: Time & Surge Badge */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isBooked
                      ? 'bg-emerald-600 text-white font-bold'
                      : isCurrentWindow && eligibility.isHighDemandOverride
                      ? 'bg-orange-100 text-orange-700 animate-pulse'
                      : isCurrentWindow && eligibility.canBook
                      ? 'bg-emerald-100 text-emerald-700 animate-pulse'
                      : isCurrentWindow && !eligibility.canBook
                      ? 'bg-slate-200 text-slate-500'
                      : isPeak
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isBooked ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : isPeak ? (
                      <Flame className="w-4 h-4 text-amber-600" />
                    ) : isCurrentWindow ? (
                      <Zap className={`w-4 h-4 ${eligibility.isHighDemandOverride ? 'text-orange-600' : 'text-emerald-600'} fill-current`} />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-mono font-black text-sm text-slate-900 leading-tight">
                        {formatTimeAMPM(slot.startTimestamp)} – {formatTimeAMPM(slot.endTimestamp)}
                      </p>
                      {isPeak && !isBooked && (
                        <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                          🔥 Surge +₹20
                        </span>
                      )}
                      {isCurrentWindow && !isBooked && eligibility.isHighDemandOverride && (
                        <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-900 border border-orange-200 animate-pulse">
                          🔥 High Demand Override
                        </span>
                      )}
                      {isCurrentWindow && !isBooked && !eligibility.isHighDemandOverride && eligibility.canBook && (
                        <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200">
                          ⚡ Active Now
                        </span>
                      )}
                      {isCurrentWindow && !isBooked && !eligibility.canBook && (
                        <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          Booking Closed
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                      {isBooked
                        ? '✓ Booked on your duty roster'
                        : isCurrentWindow && eligibility.isHighDemandOverride
                        ? 'High demand: instant booking open'
                        : isCurrentWindow && eligibility.canBook
                        ? '🟢 Open right now'
                        : isCurrentWindow && !eligibility.canBook
                        ? 'Instant booking closed for current slot'
                        : isPast
                        ? 'Slot expired'
                        : `${slot.capacity - slot.bookedCount} rider spots open`}
                    </p>
                  </div>
                </div>

                {/* Right: Action Button */}
                <div className="shrink-0">
                  {isBooked ? (
                    <button
                      type="button"
                      onClick={() => setSlotToCancel(slot.id)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all active:scale-95 cursor-pointer"
                    >
                      Cancel
                    </button>
                  ) : isPast ? (
                    <span className="text-xs font-bold text-slate-400 px-3 py-2 block">
                      Passed
                    </span>
                  ) : isCurrentWindow && !eligibility.canBook ? (
                    <span className="text-xs font-bold text-slate-400 px-3 py-2 block">
                      Closed
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => bookSlot(slot.id, slot.zoneId || 'z1', slot.zoneName || rider.selectedZone || 'Robertsonpet')}
                      className={`px-4 py-2 rounded-xl text-xs font-black text-white shadow-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
                        eligibility.isHighDemandOverride
                          ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 ring-2 ring-orange-400/40'
                          : isCurrentWindow
                          ? 'bg-emerald-600 hover:bg-emerald-500 ring-2 ring-emerald-500/30'
                          : 'bg-emerald-600 hover:bg-emerald-500'
                      }`}
                    >
                      <span>{eligibility.isHighDemandOverride ? 'Instant Book' : isCurrentWindow ? 'Book Now' : 'Book'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredSlots.length === 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 text-center space-y-2 shadow-2xs">
              <p className="text-sm font-bold text-slate-700">No active or upcoming slots in this period</p>
              <p className="text-xs text-slate-400">All earlier slots for this period have ended.</p>
              {selectedDay === 'today' && tomorrowSlots.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedDay('tomorrow')}
                  className="mt-2 text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                >
                  View Tomorrow&apos;s Slots &rarr;
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── 6. ZONE SELECTION MODAL ── */}
        <ZoneSelectionModal
          isOpen={isZoneModalOpen}
          onClose={() => setIsZoneModalOpen(false)}
        />

        {/* ── 7. SIMPLE, SHORT & PROFESSIONAL CANCEL BOOKING CONFIRMATION MODAL ── */}
        {mounted && slotToCancel && createPortal(
          <div
            className="fixed inset-0 z-[99999] w-screen h-screen min-h-[100dvh] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setSlotToCancel(null)}
            aria-modal="true"
            role="dialog"
          >
            <div
              className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 animate-scale-up text-center space-y-3.5 relative mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Amber / Red Calendar Icon */}
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
                <Calendar className="w-6 h-6 stroke-[2.5]" />
              </div>

              {/* Short Title & Prompt */}
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Cancel Booking?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to cancel this slot?
                </p>
              </div>

              {/* Simple Yes / No Buttons */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setSlotToCancel(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
                >
                  No
                </button>

                <button
                  type="button"
                  onClick={() => {
                    cancelSlot(slotToCancel);
                    setSlotToCancel(null);
                  }}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      </div>
    </AppShell>
  );
}
