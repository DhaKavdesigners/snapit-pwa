'use client';

import React, { useState, useEffect } from 'react';
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
} from '@/services/slotService';
import { getNow } from '@/services/mockService';
import { RiderSlot } from '@/types';

type TimePeriodFilter = 'ALL' | 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';

export default function SlotsPage() {
  const {
    slots,
    activeSlot,
    upcomingSlot,
    bookSlot,
    cancelSlot,
    rider,
    isOnline,
    toggleOnline,
  } = useRider();

  const [selectedDay, setSelectedDay] = useState<'today' | 'tomorrow'>('today');
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriodFilter>('ALL');
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [now, setNow] = useState(getNow());

  useEffect(() => {
    const t = setInterval(() => setNow(getNow()), 1000);
    return () => clearInterval(t);
  }, []);

  // Identify current hour slot window (e.g. 9:00 PM - 10:00 PM if time is 9:34 PM)
  const currentHourSlot = slots.find(
    (s) => now >= s.startTimestamp && now < s.endTimestamp
  );

  // Filter slots by selected 24h period
  const filteredSlots = slots.filter((slot) => {
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

        {/* ── 2. CURRENT ACTIVE HOUR WINDOW (HERO CARD) ── */}
        {currentHourSlot && (
          <div className={`rounded-3xl p-4.5 border-2 shadow-md relative overflow-hidden transition-all ${
            currentHourSlot.status === 'booked' || currentHourSlot.status === 'active'
              ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white border-emerald-400'
              : 'bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white border-emerald-300 text-slate-900'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                currentHourSlot.status === 'booked' || currentHourSlot.status === 'active'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Active Duty Window Right Now
              </span>
              <span className="text-[11px] font-bold opacity-80">
                {formatRemainingTime(currentHourSlot.endTimestamp - now)} left
              </span>
            </div>

            <div className="flex items-center justify-between my-2">
              <div>
                <p className="text-xl font-black font-mono tracking-tight">
                  {formatTimeAMPM(currentHourSlot.startTimestamp)} – {formatTimeAMPM(currentHourSlot.endTimestamp)}
                </p>
                <p className="text-xs font-medium opacity-80 mt-0.5">
                  {currentHourSlot.status === 'booked' || currentHourSlot.status === 'active'
                    ? isOnline ? '🟢 Connected to live store orders' : '⚪ Toggle online in top bar to receive orders'
                    : 'Open slot available right now. Book to start receiving orders.'}
                </p>
              </div>
            </div>

            {/* 1-Touch Action */}
            <div className="mt-2.5 pt-2.5 border-t border-slate-200/40 flex items-center justify-between">
              {currentHourSlot.status === 'booked' || currentHourSlot.status === 'active' ? (
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>You are On Duty</span>
                  </span>
                  <button
                    onClick={() => cancelSlot(currentHourSlot.id)}
                    className="text-xs font-bold text-red-300 hover:text-red-200 underline cursor-pointer"
                  >
                    Cancel Slot
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => bookSlot(currentHourSlot.id, currentHourSlot.zoneId || 'z1', currentHourSlot.zoneName || rider.selectedZone || 'Robertsonpet')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>BOOK & START THIS WINDOW NOW</span>
                </button>
              )}
            </div>
          </div>
        )}

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
            Today (24 Slots)
          </button>
          <button
            onClick={() => setSelectedDay('tomorrow')}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              selectedDay === 'tomorrow'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tomorrow
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
            const isPeak = (startHour >= 12 && startHour < 15) || (startHour >= 19 && startHour < 22);
            const isCurrentWindow = now >= slot.startTimestamp && now < slot.endTimestamp;
            const isPast = slot.endTimestamp <= now && !isBooked;

            return (
              <div
                key={slot.id}
                className={`bg-white rounded-2xl p-3.5 border transition-all flex items-center justify-between gap-3 shadow-2xs ${
                  isBooked
                    ? 'border-emerald-400 bg-emerald-50/25 ring-1 ring-emerald-400/40'
                    : isCurrentWindow
                    ? 'border-emerald-400 bg-emerald-50/10'
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
                      : isCurrentWindow
                      ? 'bg-emerald-100 text-emerald-700 animate-pulse'
                      : isPeak
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isBooked ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : isPeak ? (
                      <Flame className="w-4 h-4 text-amber-600" />
                    ) : isCurrentWindow ? (
                      <Zap className="w-4 h-4 text-emerald-600 fill-current" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-mono font-black text-sm text-slate-900 leading-tight">
                        {formatTimeAMPM(slot.startTimestamp)} – {formatTimeAMPM(slot.endTimestamp)}
                      </p>
                      {isPeak && !isBooked && (
                        <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                          🔥 Surge +₹20
                        </span>
                      )}
                      {isCurrentWindow && !isBooked && (
                        <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200">
                          ⚡ Active Now
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                      {isBooked
                        ? '✓ Booked on your duty roster'
                        : isCurrentWindow
                        ? '🟢 Open right now'
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
                      onClick={() => cancelSlot(slot.id)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all active:scale-95 cursor-pointer"
                    >
                      Cancel
                    </button>
                  ) : isPast ? (
                    <span className="text-xs font-bold text-slate-400 px-3 py-2 block">
                      Passed
                    </span>
                  ) : (
                    <button
                      onClick={() => bookSlot(slot.id, slot.zoneId || 'z1', slot.zoneName || rider.selectedZone || 'Robertsonpet')}
                      className={`px-4 py-2 rounded-xl text-xs font-black text-white shadow-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
                        isCurrentWindow
                          ? 'bg-emerald-600 hover:bg-emerald-500 ring-2 ring-emerald-500/30'
                          : 'bg-emerald-600 hover:bg-emerald-500'
                      }`}
                    >
                      <span>{isCurrentWindow ? 'Book Now' : 'Book'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 6. ZONE SELECTION MODAL ── */}
        <ZoneSelectionModal
          isOpen={isZoneModalOpen}
          onClose={() => setIsZoneModalOpen(false)}
        />

      </div>
    </AppShell>
  );
}
