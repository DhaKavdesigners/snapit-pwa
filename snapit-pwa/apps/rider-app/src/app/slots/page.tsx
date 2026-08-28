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
  Check,
  X,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  PackageCheck,
  PackageX,
  Layers,
  Timer,
  Lock,
} from 'lucide-react';
import { ZoneSelectionModal } from '@/components/slots/ZoneSelectionModal';
import {
  formatTimeAMPM,
  formatRemainingTime,
  getTodayDateString,
  generateDailySlots,
  checkZoneSwitchAllowed,
} from '@/services/slotService';
import { getNow } from '@/services/mockService';
import { RiderSlot } from '@/types';

type SlotFilterType = 'ALL' | 'CLOSES_SOON' | 'OPEN' | 'PAST';

export default function SlotsPage() {
  const {
    slots: todayContextSlots,
    bookedSlotIds,
    activeSlot,
    bookSlot,
    cancelSlot,
    rider,
    isOnline,
    zones,
    adminConfig,
  } = useRider();

  const [selectedDay, setSelectedDay] = useState<'today' | 'tomorrow'>('today');
  const [activeFilter, setActiveFilter] = useState<SlotFilterType>('ALL');
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [now, setNow] = useState(getNow());

  useEffect(() => {
    const t = setInterval(() => setNow(getNow()), 1000);
    return () => clearInterval(t);
  }, []);

  // Today & Tomorrow strings
  const todayStr = getTodayDateString();
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  // Active Zone ID & Name
  const targetZoneId = rider.selectedZoneId || 'zone-1';
  const targetZoneName = rider.selectedZone || 'Robertsonpet';

  // Compute 24 slots for selected day (Today vs Tomorrow)
  const currentDaySlots: RiderSlot[] = React.useMemo(() => {
    if (selectedDay === 'today') {
      return todayContextSlots;
    }
    // Generate tomorrow's 24 slots with real bookedSlotIds
    return generateDailySlots(
      adminConfig.slot,
      bookedSlotIds,
      targetZoneId,
      targetZoneName,
      tomorrowStr
    );
  }, [selectedDay, todayContextSlots, bookedSlotIds, adminConfig.slot, targetZoneId, targetZoneName, tomorrowStr]);

  // Compute tomorrow slots for the My Bookings summary banner
  const tomorrowSlots = React.useMemo(() => {
    return generateDailySlots(
      adminConfig.slot,
      bookedSlotIds,
      targetZoneId,
      targetZoneName,
      tomorrowStr
    );
  }, [adminConfig.slot, bookedSlotIds, targetZoneId, targetZoneName, tomorrowStr]);

  // ── "MY BOOKINGS" DATA (PERSISTENT & ALWAYS VISIBLE AT THE TOP) ──
  const todayBookings = todayContextSlots.filter((s) => s.status === 'booked' || s.status === 'active');
  const tomorrowBookings = tomorrowSlots.filter((s) => s.status === 'booked');
  const totalBookingsCount = todayBookings.length + tomorrowBookings.length;

  // Counts for current day's filter pills
  const closesSoonCount = currentDaySlots.filter((s) => s.status === 'expiring_soon').length;
  const openCount = currentDaySlots.filter((s) => s.status === 'available').length;
  const pastCount = currentDaySlots.filter((s) => s.status === 'past').length;
  const totalCount = currentDaySlots.length;

  // Filter slots based on active selectable filter
  const filteredSlots = currentDaySlots.filter((slot) => {
    if (activeFilter === 'CLOSES_SOON') return slot.status === 'expiring_soon';
    if (activeFilter === 'OPEN') return slot.status === 'available';
    if (activeFilter === 'PAST') return slot.status === 'past';
    return true; // ALL
  });

  // Sort slots: Yellow (Expiring Soon) -> Green (Open) -> Active/Booked -> Red (Past)
  const sortedSlots = [...filteredSlots].sort((a, b) => {
    const priorityWeight = (slot: RiderSlot) => {
      if (slot.status === 'active') return 1;
      if (slot.status === 'expiring_soon') return 2;
      if (slot.status === 'available') return 3;
      if (slot.status === 'booked') return 4;
      if (slot.status === 'past') return 5;
      return 6;
    };

    const weightDiff = priorityWeight(a) - priorityWeight(b);
    if (weightDiff !== 0) return weightDiff;
    return a.startTimestamp - b.startTimestamp;
  });

  const toggleFilter = (type: SlotFilterType) => {
    setActiveFilter((prev) => (prev === type ? 'ALL' : type));
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-3.5 pt-2 pb-12 max-w-lg mx-auto w-full px-2 sm:px-0">

        {/* ── 1. HEADER ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span>Time Slot Booking</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              24-Hour Shifts • Real-time Demand Intelligence
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-black text-emerald-800 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{openCount + closesSoonCount} Open</span>
          </div>
        </div>

        {/* ── 2. OPERATING ZONE SELECTION (UNRESTRICTED IN TEST MODE) ── */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 rounded-2xl p-3.5 text-white shadow-md relative overflow-hidden border border-emerald-800/40">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Operating Delivery Zone</span>
              </div>
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2 truncate">
                <span>{rider.selectedZone || 'Robertsonpet'}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active Area
                </span>
              </h2>
            </div>

            <button
              onClick={() => setIsZoneModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer backdrop-blur-sm shadow-xs"
            >
              <span>Change Zone</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
            </button>
          </div>
        </div>

        {/* ── 3. "MY BOOKINGS" (PERSISTENT BETWEEN ZONE & TODAY/TOMORROW TABS) ── */}
        {totalBookingsCount > 0 && (
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>My Bookings</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {totalBookingsCount} Scheduled
              </span>
            </div>

            <div className="overflow-x-auto space-y-2">
              {/* Today's Bookings */}
              {todayBookings.length > 0 && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-600 uppercase text-[9.5px] font-black tracking-wider border-b border-slate-200">
                      <th className="py-2 px-2.5 rounded-l-lg">Today's Shift</th>
                      <th className="py-2 px-2.5">Zone</th>
                      <th className="py-2 px-2.5">Status</th>
                      <th className="py-2 px-2.5 text-right rounded-r-lg">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {todayBookings.map((bSlot) => (
                      <tr key={bSlot.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-2.5 font-mono font-bold text-emerald-700 whitespace-nowrap text-[11px]">
                          {formatTimeAMPM(bSlot.startTimestamp)} – {formatTimeAMPM(bSlot.endTimestamp)}
                        </td>
                        <td className="py-2 px-2.5 font-bold text-slate-700 text-[11px]">
                          {bSlot.zoneName || targetZoneName}
                        </td>
                        <td className="py-2 px-2.5">
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-700" />
                            <span>{bSlot.status === 'active' ? 'Active' : 'Booked'}</span>
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-right">
                          <button
                            onClick={() => cancelSlot(bSlot.id)}
                            className="text-[11px] font-bold text-red-600 hover:text-red-700 underline cursor-pointer"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Tomorrow's Bookings (Separated with clean thin divider line) */}
              {tomorrowBookings.length > 0 && (
                <div>
                  {todayBookings.length > 0 && (
                    <div className="my-2 border-t border-slate-200 flex items-center gap-2 pt-2">
                      <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Tomorrow's Bookings ({tomorrowBookings.length})
                      </span>
                      <span className="h-px bg-slate-200 flex-1" />
                    </div>
                  )}

                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-emerald-50/70 text-emerald-900 uppercase text-[9.5px] font-black tracking-wider border-b border-emerald-200/80">
                        <th className="py-2 px-2.5 rounded-l-lg">Tomorrow's Shift</th>
                        <th className="py-2 px-2.5">Zone</th>
                        <th className="py-2 px-2.5">Status</th>
                        <th className="py-2 px-2.5 text-right rounded-r-lg">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {tomorrowBookings.map((bSlot) => (
                        <tr key={bSlot.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-2.5 font-mono font-bold text-emerald-700 whitespace-nowrap text-[11px]">
                            {formatTimeAMPM(bSlot.startTimestamp)} – {formatTimeAMPM(bSlot.endTimestamp)}
                          </td>
                          <td className="py-2 px-2.5 font-bold text-slate-700 text-[11px]">
                            {bSlot.zoneName || targetZoneName}
                          </td>
                          <td className="py-2 px-2.5">
                            <span className="inline-flex items-center gap-1 text-[9.5px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-700" />
                              <span>Booked</span>
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-right">
                            <button
                              onClick={() => cancelSlot(bSlot.id)}
                              className="text-[11px] font-bold text-red-600 hover:text-red-700 underline cursor-pointer"
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 4. DATE SELECTOR (TODAY / TOMORROW ONLY) ── */}
        <div className="flex bg-slate-200/80 p-1 rounded-2xl border border-slate-300/70 shadow-inner">
          <button
            onClick={() => {
              setSelectedDay('today');
              setActiveFilter('ALL');
            }}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              selectedDay === 'today'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Today (24 Slots)</span>
          </button>

          <button
            onClick={() => {
              setSelectedDay('tomorrow');
              setActiveFilter('ALL');
            }}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              selectedDay === 'tomorrow'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Tomorrow (All Open)</span>
          </button>
        </div>

        {/* ── 5. INTERACTIVE SELECTABLE FILTER PILLS (ORDER: Closes Soon -> Open -> Past -> All) ── */}
        <div className="grid grid-cols-4 gap-1.5 text-center">
          {/* 1. Closes Soon */}
          <button
            onClick={() => toggleFilter('CLOSES_SOON')}
            className={`p-2 rounded-xl border transition-all flex flex-col items-center justify-center cursor-pointer ${
              activeFilter === 'CLOSES_SOON'
                ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400/40 shadow-xs'
                : 'bg-amber-50/70 border-amber-200/90 hover:bg-amber-100/60'
            }`}
          >
            <span className="text-[10.5px] font-black text-amber-950 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              <span>Closes Soon</span>
            </span>
            <span className="text-[9.5px] font-bold text-amber-700 mt-0.5">
              ({closesSoonCount})
            </span>
          </button>

          {/* 2. Open to Book */}
          <button
            onClick={() => toggleFilter('OPEN')}
            className={`p-2 rounded-xl border transition-all flex flex-col items-center justify-center cursor-pointer ${
              activeFilter === 'OPEN'
                ? 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-500/40 shadow-xs'
                : 'bg-emerald-50/70 border-emerald-200/90 hover:bg-emerald-100/60'
            }`}
          >
            <span className="text-[10.5px] font-black text-emerald-950 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Open</span>
            </span>
            <span className="text-[9.5px] font-bold text-emerald-700 mt-0.5">
              ({openCount})
            </span>
          </button>

          {/* 3. Past / Expired */}
          <button
            onClick={() => toggleFilter('PAST')}
            className={`p-2 rounded-xl border transition-all flex flex-col items-center justify-center cursor-pointer ${
              activeFilter === 'PAST'
                ? 'bg-rose-100 border-rose-400 ring-2 ring-rose-400/40 shadow-xs'
                : 'bg-rose-50/70 border-rose-200/90 hover:bg-rose-100/60'
            }`}
          >
            <span className="text-[10.5px] font-black text-rose-950 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Past</span>
            </span>
            <span className="text-[9.5px] font-bold text-rose-700 mt-0.5">
              ({pastCount})
            </span>
          </button>

          {/* 4. Show All (Placed on Right Side Last after Past) */}
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`p-2 rounded-xl border transition-all flex flex-col items-center justify-center cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-950 ring-2 ring-emerald-500/40 shadow-xs'
                : 'bg-slate-100 border-slate-200/90 hover:bg-slate-200/60'
            }`}
          >
            <span className={`text-[10.5px] font-black ${activeFilter === 'ALL' ? 'text-white' : 'text-slate-900'}`}>
              Show All
            </span>
            <span className={`text-[9.5px] font-bold mt-0.5 ${activeFilter === 'ALL' ? 'text-emerald-300' : 'text-slate-600'}`}>
              ({totalCount})
            </span>
          </button>
        </div>

        {/* ── 6. 2-IN-A-ROW (2-COLUMN) SHIFT GRID ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {activeFilter === 'ALL'
                  ? selectedDay === 'today' ? 'Today Shifts (Sorted by Urgency)' : "Tomorrow Shifts (All 24h Open)"
                  : `${activeFilter.replace('_', ' ')} Shifts`}
              </span>
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              {sortedSlots.length} Windows
            </span>
          </div>

          {sortedSlots.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-200">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No shifts match this filter</p>
              <button
                onClick={() => setActiveFilter('ALL')}
                className="mt-2 text-xs font-black text-emerald-600 underline cursor-pointer"
              >
                Show All Shifts
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {sortedSlots.map((slot) => {
                const isBooked = slot.status === 'booked' || slot.status === 'active';
                const isPast = slot.status === 'past';
                const isExpiringSoon = slot.status === 'expiring_soon';
                const isAvailable = slot.status === 'available';

                // Visual styling & border themes
                let cardClasses = 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs';
                let badgeClasses = 'bg-slate-100 text-slate-700 border-slate-200';
                let badgeText = 'Available';

                if (isBooked) {
                  cardClasses = 'border-emerald-500 bg-gradient-to-br from-emerald-950 to-slate-900 text-white shadow-md ring-1 ring-emerald-500/20';
                  badgeClasses = 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40';
                  badgeText = slot.status === 'active' ? 'Active' : 'Booked';
                } else if (isExpiringSoon) {
                  cardClasses = 'border-amber-400 bg-gradient-to-br from-amber-50 to-amber-100/40 shadow-sm ring-1 ring-amber-400/50';
                  badgeClasses = 'bg-amber-200/90 text-amber-950 border border-amber-300 animate-pulse font-black';
                  badgeText = `⚡ ${slot.closesInMinutes || 18}m left`;
                } else if (isAvailable) {
                  cardClasses = 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-400 hover:bg-emerald-50/40 shadow-2xs';
                  badgeClasses = 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold';
                  badgeText = 'Open';
                } else if (isPast) {
                  cardClasses = 'border-rose-200 bg-rose-50/30 opacity-75';
                  badgeClasses = 'bg-rose-100 text-rose-800 border border-rose-200';
                  badgeText = 'Past';
                }

                return (
                  <div
                    key={slot.id}
                    className={`rounded-2xl p-2.5 sm:p-3 border transition-all flex flex-col justify-between gap-2 ${cardClasses}`}
                  >
                    {/* Top Row: Straight-line Time + Status Badge */}
                    <div className="flex items-start justify-between gap-1">
                      <p className={`font-mono font-black text-[11px] sm:text-xs tracking-tight leading-tight ${
                        isBooked ? 'text-white' : isPast ? 'text-rose-950' : 'text-slate-900'
                      }`}>
                        {formatTimeAMPM(slot.startTimestamp)} – {formatTimeAMPM(slot.endTimestamp)}
                      </p>

                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 border ${badgeClasses}`}>
                        {badgeText}
                      </span>
                    </div>

                    {/* Middle Row: Subtitle / Insights */}
                    <div className="text-[10px]">
                      {isPast ? (
                        <div className="bg-white/90 rounded-lg p-1.5 border border-rose-200 text-rose-900 font-semibold flex flex-col gap-0.5">
                          <span className="text-emerald-700">📦 {slot.ordersFulfilled || 12} Fulfilled</span>
                          <span className="text-rose-700">⚠️ {slot.ordersMissed || 2} Missed</span>
                        </div>
                      ) : isExpiringSoon ? (
                        <div className="bg-amber-100/90 rounded-lg p-1.5 border border-amber-200 text-amber-950 font-bold flex items-center justify-between">
                          <span className="flex items-center gap-0.5">
                            <Flame className="w-3 h-3 text-amber-600 fill-current" />
                            <span>Surge Peak</span>
                          </span>
                          <span className="text-[9px] bg-amber-200 px-1 py-0.2 rounded font-black">+₹15</span>
                        </div>
                      ) : isBooked ? (
                        <div className="bg-white/10 rounded-lg p-1.5 border border-white/15 text-emerald-200 text-[10px] font-medium">
                          ✓ On Duty ({slot.zoneName || targetZoneName})
                        </div>
                      ) : (
                        <div className="bg-white/80 rounded-lg p-1.5 border border-slate-200 text-slate-600 font-medium flex items-center justify-between">
                          <span>High Demand</span>
                          <span className="text-emerald-700 font-bold">~₹200/h</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Compact 1-Tap Button */}
                    <div>
                      {isBooked ? (
                        <button
                          onClick={() => cancelSlot(slot.id)}
                          className="w-full py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-[10.5px] font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          <span>Cancel</span>
                        </button>
                      ) : isPast ? (
                        <div className="w-full py-1.5 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-bold text-center border border-slate-200/70 cursor-not-allowed">
                          Expired
                        </div>
                      ) : (
                        <button
                          onClick={() => bookSlot(slot.id, slot.zoneId || targetZoneId, slot.zoneName || targetZoneName)}
                          className={`w-full py-2 rounded-xl text-[11px] font-black text-white shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${
                            isExpiringSoon
                              ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-600/20'
                              : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                          }`}
                        >
                          <Zap className="w-3 h-3 fill-current" />
                          <span>{isExpiringSoon ? 'Instant Book' : 'Book Shift'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 7. ZONE SELECTION MODAL ── */}
        <ZoneSelectionModal
          isOpen={isZoneModalOpen}
          onClose={() => setIsZoneModalOpen(false)}
        />

      </div>
    </AppShell>
  );
}
