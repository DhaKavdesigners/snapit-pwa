'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight, Zap } from 'lucide-react';
import { useRider } from '@/context/RiderContext';
import { formatTimeAMPM } from '@/services/slotService';
import { getNow } from '@/services/mockService';
import { RiderSlot } from '@/types';
import { SlotEndingPopupModal } from '@/components/slots/SlotEndingPopupModal';

export const HomeSlotCard: React.FC = () => {
  const {
    activeSlot,
    upcomingSlot,
    slots,
    bookedSlotIds,
    bookSlot,
    extendSlot,
    rider,
  } = useRider();

  const [now, setNow] = useState<number>(getNow());
  const [showEndingModal, setShowEndingModal] = useState<boolean>(false);
  const dismissedSlotIdRef = useRef<string | null>(null);

  // Lightweight 1-second live countdown ticker
  useEffect(() => {
    setNow(getNow());
    const interval = setInterval(() => {
      setNow(getNow());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Find user's booked slots
  const userBookedSlots = slots.filter((s) => bookedSlotIds.includes(s.id));

  // Determine active slot currently within its start & end timestamp
  const currentActive = userBookedSlots.find(
    (s) => now >= s.startTimestamp && now < s.endTimestamp
  );

  // Determine earliest upcoming booked slot
  const currentUpcoming = userBookedSlots
    .filter((s) => now < s.startTimestamp)
    .sort((a, b) => a.startTimestamp - b.startTimestamp)[0];

  // Pick target slot with fallback to context active/upcoming if present
  const displaySlot: RiderSlot | null =
    currentActive ||
    (activeSlot && now < activeSlot.endTimestamp ? activeSlot : null) ||
    currentUpcoming ||
    (upcomingSlot && now < upcomingSlot.startTimestamp ? upcomingSlot : null);

  const zoneName =
    displaySlot?.zoneName || rider.selectedZone || 'Downtown Central';

  const isUpcoming = displaySlot ? now < displaySlot.startTimestamp : false;
  const remainingMs = displaySlot ? Math.max(0, displaySlot.endTimestamp - now) : 0;
  const remainingMins = Math.floor(remainingMs / 60000);

  // Trigger ending soon popup 10 minutes before slot end (once per slot session)
  useEffect(() => {
    if (
      displaySlot &&
      !isUpcoming &&
      remainingMins <= 10 &&
      remainingMs > 0 &&
      dismissedSlotIdRef.current !== displaySlot.id
    ) {
      setShowEndingModal(true);
    }
  }, [displaySlot, isUpcoming, remainingMins, remainingMs]);

  // Handler for Extending Slot (+2 hours)
  const handleExtendSlot = () => {
    if (!displaySlot) return;
    const nextSlot = slots.find((s) => s.startTimestamp === displaySlot.endTimestamp);

    if (nextSlot) {
      extendSlot(displaySlot.id, nextSlot.id);
    } else {
      const nextStartTs = displaySlot.endTimestamp;
      const d = new Date(nextStartTs);
      const h = d.getHours();
      const nextSlotId = `slot-${displaySlot.date}-${h}`;
      bookSlot(
        nextSlotId,
        displaySlot.zoneId || rider.selectedZoneId || 'zone-1',
        displaySlot.zoneName || rider.selectedZone || 'Downtown Central'
      );
    }

    setShowEndingModal(false);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. WHEN NO SLOT IS BOOKED OR ALL SLOTS EXPIRED
  // Keep the existing dark navy Slot Booking card in its exact original compact size.
  // ─────────────────────────────────────────────────────────────────────────────
  if (!displaySlot) {
    return (
      <Link
        href="/slots"
        className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-3.5 shadow-sm border border-slate-800 flex items-center justify-between group active:scale-98 transition-transform"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Calendar className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                SLOT BOOKING
              </span>
              <span className="text-[11px] text-slate-300 font-bold">
                {zoneName}
              </span>
            </div>
            <p className="text-sm font-black text-white font-mono mt-0.5">
              No Slot Booked Today
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 group-hover:translate-x-0.5 transition-transform">
          <span>Book 2h</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </Link>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. DYNAMIC BOOKED SLOT STATES (ACTIVE / UPCOMING)
  // ─────────────────────────────────────────────────────────────────────────────
  const timingStr = `${formatTimeAMPM(displaySlot.startTimestamp)} – ${formatTimeAMPM(displaySlot.endTimestamp)}`;
  const totalDurationMs = Math.max(1, displaySlot.endTimestamp - displaySlot.startTimestamp);

  if (isUpcoming) {
    const startsInMs = Math.max(0, displaySlot.startTimestamp - now);
    const startsInMins = Math.floor(startsInMs / 60000);
    const startsInHours = Math.floor(startsInMins / 60);
    const startsInMinsRemainder = startsInMins % 60;
    const countdownStr =
      startsInHours > 0
        ? `Starts in ${startsInHours}h ${startsInMinsRemainder.toString().padStart(2, '0')}m`
        : `Starts in ${Math.max(1, startsInMins)}m`;

    return (
      <Link
        href="/slots"
        className="bg-sky-50/95 text-sky-950 rounded-2xl p-4 shadow-sm border border-sky-200/90 flex flex-col justify-between group active:scale-98 transition-all"
      >
        <div className="flex items-center justify-between w-full gap-2.5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0 shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-300/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  UPCOMING
                </span>
                <span className="text-[11px] text-sky-800 font-bold truncate">
                  {zoneName}
                </span>
              </div>
              <p className="text-[15px] font-black text-sky-950 font-mono mt-1 leading-tight truncate">
                {timingStr}
              </p>
              <p className="text-xs text-sky-700 font-bold mt-0.5 leading-tight">
                {countdownStr}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-sky-700 group-hover:translate-x-0.5 transition-transform shrink-0">
            <span>Change Slot</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Bottom Line Bar */}
        <div className="w-full mt-3 pt-0.5">
          <div className="w-full bg-sky-200/60 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-sky-500 rounded-full w-full" />
          </div>
        </div>
      </Link>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. ACTIVE SLOT COLOR SYSTEM + LIVE BOTTOM TIMING PROGRESS BAR
  // ─────────────────────────────────────────────────────────────────────────────
  const remainingHours = Math.floor(remainingMins / 60);
  const remainingMinsRemainder = remainingMins % 60;
  const remainingStr =
    remainingHours > 0
      ? `${remainingHours}h ${remainingMinsRemainder.toString().padStart(2, '0')}m remaining`
      : `${Math.max(1, remainingMins)}m remaining`;

  // Percentage of slot remaining (e.g. 100% -> 0%)
  const percentRemaining = Math.min(100, Math.max(0, (remainingMs / totalDurationMs) * 100));

  // Determine styling based on remaining minutes
  let cardTheme = {
    cardBg: 'bg-emerald-50/95',
    cardBorder: 'border-emerald-200/90',
    cardText: 'text-emerald-950',
    iconBg: 'bg-emerald-100',
    iconBorder: 'border-emerald-200',
    iconText: 'text-emerald-700',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-300/80',
    statusDot: 'bg-emerald-500 animate-pulse',
    statusLabel: 'ACTIVE',
    zoneText: 'text-emerald-800',
    titleText: 'text-emerald-950',
    remainingText: 'text-emerald-700',
    actionText: 'text-emerald-700',
    trackBg: 'bg-emerald-200/60',
    barBg: 'bg-emerald-500',
    isEndingSoonLast10: false,
  };

  if (remainingMins > 60) {
    // Green (ACTIVE > 60m)
    cardTheme = {
      cardBg: 'bg-emerald-50/95',
      cardBorder: 'border-emerald-200/90',
      cardText: 'text-emerald-950',
      iconBg: 'bg-emerald-100',
      iconBorder: 'border-emerald-200',
      iconText: 'text-emerald-700',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-800',
      badgeBorder: 'border-emerald-300/80',
      statusDot: 'bg-emerald-500 animate-pulse',
      statusLabel: 'ACTIVE',
      zoneText: 'text-emerald-800',
      titleText: 'text-emerald-950',
      remainingText: 'text-emerald-700',
      actionText: 'text-emerald-700',
      trackBg: 'bg-emerald-200/60',
      barBg: 'bg-emerald-500',
      isEndingSoonLast10: false,
    };
  } else if (remainingMins >= 30 && remainingMins <= 60) {
    // Yellow / Amber (ACTIVE 30–60m)
    cardTheme = {
      cardBg: 'bg-amber-50/95',
      cardBorder: 'border-amber-200/90',
      cardText: 'text-amber-950',
      iconBg: 'bg-amber-100',
      iconBorder: 'border-amber-200',
      iconText: 'text-amber-700',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-800',
      badgeBorder: 'border-amber-300/80',
      statusDot: 'bg-amber-500 animate-pulse',
      statusLabel: 'ACTIVE',
      zoneText: 'text-amber-800',
      titleText: 'text-amber-950',
      remainingText: 'text-amber-700',
      actionText: 'text-amber-700',
      trackBg: 'bg-amber-200/60',
      barBg: 'bg-amber-500',
      isEndingSoonLast10: false,
    };
  } else if (remainingMins > 10 && remainingMins < 30) {
    // Orange (ENDING SOON 10–30m)
    cardTheme = {
      cardBg: 'bg-orange-50/95',
      cardBorder: 'border-orange-200/90',
      cardText: 'text-orange-950',
      iconBg: 'bg-orange-100',
      iconBorder: 'border-orange-200',
      iconText: 'text-orange-700',
      badgeBg: 'bg-orange-100',
      badgeText: 'text-orange-800',
      badgeBorder: 'border-orange-300/80',
      statusDot: 'bg-orange-500 animate-pulse',
      statusLabel: 'ENDING SOON',
      zoneText: 'text-orange-800',
      titleText: 'text-orange-950',
      remainingText: 'text-orange-700',
      actionText: 'text-orange-700',
      trackBg: 'bg-orange-200/60',
      barBg: 'bg-orange-500',
      isEndingSoonLast10: false,
    };
  } else {
    // Red / Pink (ENDING SOON <= 10m)
    cardTheme = {
      cardBg: 'bg-rose-50/95',
      cardBorder: 'border-rose-200/90',
      cardText: 'text-rose-950',
      iconBg: 'bg-rose-100',
      iconBorder: 'border-rose-200',
      iconText: 'text-rose-700',
      badgeBg: 'bg-rose-100',
      badgeText: 'text-rose-800',
      badgeBorder: 'border-rose-300/80',
      statusDot: 'bg-rose-500 animate-ping',
      statusLabel: 'ENDING SOON',
      zoneText: 'text-rose-800',
      titleText: 'text-rose-950',
      remainingText: 'text-rose-700',
      actionText: 'text-rose-700',
      trackBg: 'bg-rose-200/60',
      barBg: 'bg-rose-500',
      isEndingSoonLast10: true,
    };
  }

  return (
    <>
      <Link
        href="/slots"
        className={`${cardTheme.cardBg} ${cardTheme.cardText} rounded-2xl ${
          cardTheme.isEndingSoonLast10 ? 'p-4 sm:p-4.5 shadow-md border-2 border-rose-300' : 'p-4 shadow-sm border ' + cardTheme.cardBorder
        } flex flex-col justify-between group active:scale-98 transition-all`}
      >
        {/* Top / Main Details Section */}
        <div className="flex items-center justify-between w-full gap-2.5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`w-10 h-10 rounded-xl ${cardTheme.iconBg} ${cardTheme.iconText} border ${cardTheme.iconBorder} flex items-center justify-center shrink-0 shadow-xs`}>
              <Calendar className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${cardTheme.badgeBg} ${cardTheme.badgeText} border ${cardTheme.badgeBorder}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cardTheme.statusDot}`} />
                  {cardTheme.statusLabel}
                </span>
                <span className={`text-[11px] ${cardTheme.zoneText} font-bold truncate`}>
                  {zoneName}
                </span>
              </div>

              <p className={`text-[15px] font-black font-mono mt-1 leading-tight truncate ${cardTheme.titleText}`}>
                {timingStr}
              </p>

              <p className={`text-xs font-bold mt-0.5 leading-tight ${cardTheme.remainingText}`}>
                {remainingStr}
              </p>
            </div>
          </div>

          {/* Right Action */}
          <div className={`flex items-center gap-1 text-xs font-bold ${cardTheme.actionText} group-hover:translate-x-0.5 transition-transform shrink-0`}>
            <span>Change Slot</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Clear & Prominent Extend 2hr Button at the Bottom of the Box (Last 10 Min) */}
        {cardTheme.isEndingSoonLast10 && (
          <div className="w-full mt-3 pt-2 border-t border-rose-200/70">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleExtendSlot();
              }}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer ring-2 ring-rose-300/40"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Extend +2 Hours ({formatTimeAMPM(displaySlot.endTimestamp)} – {formatTimeAMPM(displaySlot.endTimestamp + 120 * 60 * 1000)})</span>
            </button>
          </div>
        )}

        {/* Live Remaining Timing Line Bar at the Bottom */}
        <div className="w-full mt-3 pt-0.5">
          <div className={`w-full ${cardTheme.trackBg} rounded-full h-1.5 overflow-hidden`}>
            <div
              className={`h-full ${cardTheme.barBg} rounded-full transition-all duration-1000 ease-linear`}
              style={{ width: `${Math.max(2, percentRemaining)}%` }}
            />
          </div>
        </div>
      </Link>

      {/* ── 10-Minute Ending Soon Centered Compact Popup Notification ── */}
      {showEndingModal && displaySlot && !isUpcoming && (
        <SlotEndingPopupModal
          slot={displaySlot}
          remainingMinutes={remainingMins}
          onExtend={handleExtendSlot}
          onClose={() => {
            dismissedSlotIdRef.current = displaySlot.id;
            setShowEndingModal(false);
          }}
        />
      )}
    </>
  );
};
