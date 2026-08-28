'use client';

import React, { useState, useEffect } from 'react';
import { useRider } from '@/context/RiderContext';
import {
  formatTimeAMPM,
  formatRemainingTime,
  generateDailySlots,
  demandLabel,
  checkZoneSwitchAllowed,
} from '@/services/slotService';
import { getNow } from '@/services/mockService';
import { DeliveryZone, RiderSlot, DemandLevel } from '@/types';
import {
  MapPin,
  Lock,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  X,
  Flame,
  Users,
  Sparkles,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';

interface ZoneSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'auto' | 'select' | 'locked';
}

export const ZoneSelectionModal: React.FC<ZoneSelectionModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'auto',
}) => {
  const {
    rider,
    zones,
    activeSlot,
    upcomingSlot,
    adminConfig,
    bookSlot,
    switchZone,
    updateRiderProfile,
  } = useRider();

  const [now, setNow] = useState(getNow());

  useEffect(() => {
    const t = setInterval(() => setNow(getNow()), 1000);
    return () => clearInterval(t);
  }, []);

  // Is there an ongoing active slot currently running?
  const hasActiveSlotDuty = !!activeSlot && now < activeSlot.endTimestamp;

  // View state: 'locked' | 'select_zone' | 'select_slot' | 'success'
  const [viewState, setViewState] = useState<'locked' | 'select_zone' | 'select_slot' | 'success'>('select_zone');
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [bookedSlotInfo, setBookedSlotInfo] = useState<{ slot: RiderSlot; zone: DeliveryZone } | null>(null);
  const [isBookingForNextSlot, setIsBookingForNextSlot] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Initialize view state whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    setErrorMessage('');
    if (initialMode === 'locked' || (initialMode === 'auto' && hasActiveSlotDuty)) {
      setViewState('locked');
      setIsBookingForNextSlot(false);
    } else {
      setViewState('select_zone');
      setIsBookingForNextSlot(false);
    }

    const currentZone = zones.find((z) => z.id === (rider.selectedZoneId || 'zone-1')) || zones[0];
    setSelectedZone(currentZone);
  }, [isOpen, initialMode, hasActiveSlotDuty, rider.selectedZoneId, zones]);

  if (!isOpen) return null;

  // Available slots for currently selected zone
  const targetZone = selectedZone || zones[0];
  const targetZoneSlots = generateDailySlots(
    adminConfig.slot,
    [],
    targetZone.id,
    targetZone.name
  );

  // Filter slots if booking for next slot
  const displaySlots = targetZoneSlots.filter((s) => {
    if (isBookingForNextSlot && activeSlot) {
      return s.startTimestamp >= activeSlot.endTimestamp;
    }
    return now < s.endTimestamp;
  });

  const handleZoneSelect = (zone: DeliveryZone) => {
    setSelectedZone(zone);
    setErrorMessage('');

    if (zone.id !== rider.selectedZoneId) {
      const result = switchZone(zone.id, zone.name);
      if (!result.success) {
        setErrorMessage(result.message || 'Zone switch limit reached for today.');
        return;
      }
    }

    // Instantly select zone and exit modal
    onClose();
  };

  const handleConfirmBookSlot = (slot: RiderSlot) => {
    if (!selectedZone) return;
    bookSlot(slot.id, selectedZone.id, selectedZone.name);
    setBookedSlotInfo({ slot, zone: selectedZone });
    setViewState('success');

    setTimeout(() => {
      onClose();
    }, 1800);
  };

  const remainingActiveMs = activeSlot ? Math.max(0, activeSlot.endTimestamp - now) : 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`w-full ${
          viewState === 'locked' ? 'max-w-xs sm:max-w-sm' : 'max-w-md'
        } bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up max-h-[90vh] flex flex-col relative mx-4`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar with close button */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            {viewState === 'select_slot' && (
              <button
                onClick={() => setViewState(isBookingForNextSlot && hasActiveSlotDuty ? 'locked' : 'select_zone')}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:scale-95 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            {viewState === 'select_zone' && isBookingForNextSlot && hasActiveSlotDuty && (
              <button
                onClick={() => setViewState('locked')}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:scale-95 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h3 className="font-black text-sm text-slate-900">
              {viewState === 'locked' && 'Zone Locked'}
              {viewState === 'select_zone' && (isBookingForNextSlot ? 'Change Next Slot Zone' : 'Select Delivery Zone')}
              {viewState === 'select_slot' && 'Book Zone Slot'}
              {viewState === 'success' && 'Slot Confirmed'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════
            VIEW 1: ZONE LOCKED POPUP (SIMPLE & CONCISE)
        ══════════════════════════════════════════════════════════ */}
        {viewState === 'locked' && activeSlot && (
          <div className="p-6 text-center space-y-4">
            {/* Lock Icon */}
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-7 h-7" />
            </div>

            {/* Title & Short Message */}
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Zone Locked
              </h2>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Your current slot is booked for <strong className="text-slate-900">{activeSlot.zoneName || rider.selectedZone}</strong> ({formatTimeAMPM(activeSlot.startTimestamp)} – {formatTimeAMPM(activeSlot.endTimestamp)}).
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                You can change your zone for your next slot.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setIsBookingForNextSlot(true);
                  setViewState('select_zone');
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-4 h-4" />
                <span>Book for Next Slot</span>
              </button>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl active:scale-95 transition-all"
              >
                Got It
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW 2: SELECT OPERATING ZONE (LIST OF AVAILABLE ZONES)
        ══════════════════════════════════════════════════════════ */}
        {viewState === 'select_zone' && (
          <div className="p-5 overflow-y-auto flex-1 space-y-3">
            <div>
              <p className="text-xs text-slate-500">
                {isBookingForNextSlot
                  ? 'Select the zone you want to deliver in for your next shift.'
                  : 'Choose a delivery zone to view and book your time slots.'}
              </p>
            </div>

            {errorMessage && (
              <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl p-3 text-xs flex items-start gap-2 shadow-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="font-medium">{errorMessage}</p>
              </div>
            )}

            <div className="space-y-2.5">
              {zones.map((zone) => {
                const isCurrent = (rider.selectedZoneId || 'zone-1') === zone.id;
                const isSelected = selectedZone?.id === zone.id;

                return (
                  <div
                    key={zone.id}
                    onClick={() => handleZoneSelect(zone)}
                    className={`rounded-2xl p-4 border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <MapPin className="w-5 h-5" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-black text-sm text-slate-900">{zone.name}</h4>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              {zone.radius}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                Current
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1.5 flex-wrap">
                            <span className="flex items-center gap-1 font-semibold text-emerald-700">
                              <TrendingUp className="w-3 h-3 text-emerald-600" />
                              {zone.estDailyEarnings}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-slate-400" />
                              {zone.activeRiders} riders on duty
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border bg-orange-50 text-orange-600 border-orange-200">
                          {zone.demand === 'HIGH' ? '🔥 High Demand' : 'Normal Demand'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Tap a zone above to choose an available time slot and lock in your duty.</span>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW 3: SELECT & BOOK SLOT FOR SELECTED ZONE
        ══════════════════════════════════════════════════════════ */}
        {viewState === 'select_slot' && selectedZone && (
          <div className="p-5 overflow-y-auto flex-1 space-y-3">
            {/* Zone banner */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Selected Zone</p>
                  <p className="text-sm font-black text-white">{selectedZone.name}</p>
                </div>
              </div>

              <span className="text-[10px] font-extrabold bg-emerald-500 text-slate-950 px-2.5 py-1 rounded-full">
                {selectedZone.demand === 'HIGH' ? '🔥 HIGH DEMAND' : 'ACTIVE ZONE'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-800">
                {isBookingForNextSlot ? 'Select Next Available Slot' : "Today's Available Slots"}
              </p>
              <span className="text-[10px] text-slate-500 font-semibold">
                {displaySlots.length} slot{displaySlots.length !== 1 ? 's' : ''} available
              </span>
            </div>

            {/* Slots list */}
            {displaySlots.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-200">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No Slots Available for this Window</p>
                <p className="text-[11px] text-slate-500 mt-1">Please try another zone or check back shortly.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {displaySlots.map((slot) => {
                  const capacityPct = Math.floor((slot.bookedCount / slot.capacity) * 100);
                  const isFull = slot.bookedCount >= slot.capacity;

                  return (
                    <div
                      key={slot.id}
                      className="bg-white rounded-2xl border border-slate-200 p-3.5 flex items-center justify-between hover:border-emerald-400 transition-all shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-black text-slate-900 font-mono">
                          {formatTimeAMPM(slot.startTimestamp)} – {formatTimeAMPM(slot.endTimestamp)}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" />
                            {slot.bookedCount}/{slot.capacity} riders
                          </span>
                        </div>
                      </div>

                      <div>
                        {isFull ? (
                          <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
                            Full
                          </span>
                        ) : (
                          <button
                            onClick={() => handleConfirmBookSlot(slot)}
                            className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm active:scale-95 transition-all flex items-center gap-1"
                          >
                            <span>Book</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Note */}
            <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Once booked, this slot is reserved for <strong>{selectedZone.name}</strong> and locked during duty hours.
              </span>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW 4: SUCCESS CONFIRMATION
        ══════════════════════════════════════════════════════════ */}
        {viewState === 'success' && bookedSlotInfo && (
          <div className="p-8 flex flex-col items-center text-center space-y-3 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-soft">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <h3 className="text-xl font-black text-slate-900">Slot & Zone Confirmed!</h3>
            <p className="text-xs text-slate-500 max-w-[260px] leading-relaxed">
              You are booked for{' '}
              <strong>
                {formatTimeAMPM(bookedSlotInfo.slot.startTimestamp)} – {formatTimeAMPM(bookedSlotInfo.slot.endTimestamp)}
              </strong>{' '}
              in <strong>{bookedSlotInfo.zone.name}</strong>.
            </p>

            <div className="w-full bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs font-semibold text-slate-700 mt-2">
              Zone locked for this duty duration.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
