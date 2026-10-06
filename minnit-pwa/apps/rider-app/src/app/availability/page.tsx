'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRider } from '@/context/RiderContext';
import { ZoneSelectionModal } from '@/components/slots/ZoneSelectionModal';
import {
  AVAILABILITY_WINDOWS,
  triggerHaptic,
  getFormattedDayLabel,
  getActivePreferenceWindow,
  areAllTodayCutoffsPassed,
} from '@/services/preferenceService';
import { PreferenceWindowId } from '@/types';
import {
  MapPin,
  ChevronDown,
  Check,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';

/* ─── 8 Tutorial Slides starring Momo ─── */
const MOMO_SLIDES = [
  { id: 1, src: '/images/rider_instructions/preference_shift/1.jpg', title: 'Select Your Time Slots' },
  { id: 2, src: '/images/rider_instructions/preference_shift/2.jpeg', title: 'Be Inside Your Allotted Zone' },
  { id: 3, src: '/images/rider_instructions/preference_shift/3.jpeg', title: 'Shift Priority Active' },
  { id: 4, src: '/images/rider_instructions/preference_shift/4.jpeg', title: 'Priority Dispatch Advantage' },
  { id: 5, src: '/images/rider_instructions/preference_shift/5.jpeg', title: 'First Offer on Nearby Orders' },
  { id: 6, src: '/images/rider_instructions/preference_shift/6.jpeg', title: 'Ride Anytime — Zero Lock-in' },
  { id: 7, src: '/images/rider_instructions/preference_shift/7.jpg', title: 'Plan Tomorrow Ahead' },
  { id: 8, src: '/images/rider_instructions/preference_shift/8.jpeg', title: 'More Relevant Orders & Earnings!' },
];

export default function AvailabilityPage() {
  const {
    rider,
    ridingPreferences,
    tomorrowPreferences,
    saveRidingPreferences,
  } = useRider();

  // Active Tab: 'today' or 'tomorrow'
  const [selectedDay, setSelectedDay] = useState<'today' | 'tomorrow'>('tomorrow');

  // Selection states
  const [todaySelected, setTodaySelected] = useState<PreferenceWindowId[]>([]);
  const [tomorrowSelected, setTomorrowSelected] = useState<PreferenceWindowId[]>([]);

  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Momo Slide Guide Modal State
  const [isMomoGuideOpen, setIsMomoGuideOpen] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Sync initial selections from context
  useEffect(() => {
    if (ridingPreferences) setTodaySelected(ridingPreferences);
  }, [ridingPreferences]);

  useEffect(() => {
    if (tomorrowPreferences) setTomorrowSelected(tomorrowPreferences);
  }, [tomorrowPreferences]);

  const activeWindowId = getActivePreferenceWindow();
  const activeWindow = AVAILABILITY_WINDOWS.find((w) => w.id === activeWindowId);
  const allTodayCutoffsPassed = areAllTodayCutoffsPassed();

  // Toggle preference for active day
  const handleTogglePreference = (id: PreferenceWindowId) => {
    triggerHaptic(10);
    setSavedSuccess(false);

    if (selectedDay === 'today') {
      setTodaySelected((prev) =>
        prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
      );
    } else {
      setTomorrowSelected((prev) =>
        prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
      );
    }
  };

  // Save preferences
  const handleSave = async () => {
    triggerHaptic([15, 35, 15]);
    setIsSaving(true);
    try {
      if (selectedDay === 'today') {
        await saveRidingPreferences(todaySelected, 'today');
      } else {
        await saveRidingPreferences(tomorrowSelected, 'tomorrow');
      }
      setSavedSuccess(true);
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#059669', '#34d399', '#f59e0b'],
        });
      } catch {}
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      setSavedSuccess(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Momo Guide slide controls
  const handleOpenMomoGuide = () => {
    triggerHaptic(12);
    setCurrentSlideIndex(0);
    setIsMomoGuideOpen(true);
  };

  const handleNextSlide = () => {
    triggerHaptic(8);
    if (currentSlideIndex < MOMO_SLIDES.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    } else {
      setIsMomoGuideOpen(false);
      try {
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      } catch {}
    }
  };

  const handlePrevSlide = () => {
    triggerHaptic(8);
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  // Touch swipe handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 50) {
      handleNextSlide(); // Swiped left -> next
    } else if (diff < -50) {
      handlePrevSlide(); // Swiped right -> prev
    }
    setTouchStartX(null);
  };

  const currentDayCount =
    selectedDay === 'today' ? todaySelected.length : tomorrowSelected.length;
  const todayLabel = getFormattedDayLabel('today');
  const tomorrowLabel = getFormattedDayLabel('tomorrow');

  return (
    <AppShell>
      <div className="flex flex-col gap-3.5 pt-1 pb-16 max-w-md mx-auto w-full px-3">
        {/* ── 1. TOP HEADER & ZONE / GUIDE BUTTONS ── */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Availability</span>
            </h1>
            <p className="text-[11px] font-bold text-slate-500">
              Pick your shift windows for order priority.
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Momo Quick Guide Button */}
            <button
              type="button"
              onClick={handleOpenMomoGuide}
              className="flex items-center gap-1 bg-emerald-50 border border-emerald-300 rounded-full px-2.5 py-1.5 text-xs font-black text-emerald-800 shadow-2xs hover:bg-emerald-100 active:scale-95 transition-all cursor-pointer"
              title="Learn how shift priority works"
            >
              <img
                src="/images/momo/characters/hi_momo.jpeg"
                alt="Momo"
                className="w-4 h-4 rounded-full object-cover"
              />
              <span>Guide</span>
            </button>

            {/* Zone Selector */}
            <button
              type="button"
              onClick={() => setIsZoneModalOpen(true)}
              className="flex items-center gap-1 bg-white border border-slate-200/90 rounded-full px-2.5 py-1.5 shadow-2xs text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate max-w-[95px]">{rider.selectedZone || 'Robertsonpet'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* ── 2. ACTIVE WINDOW BANNER (Exact UI from screenshot) ── */}
        {activeWindow && (
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{activeWindow.emoji}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-xs text-slate-900">
                    {activeWindow.label} Active
                  </h4>
                  <span className="font-mono text-[10px] font-bold text-slate-600 bg-white/90 px-2 py-0.5 rounded border border-slate-200">
                    {activeWindow.timeRange}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Riders with this window get nearby priority.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. DAY SELECTOR (Today vs Tomorrow - Exact UI) ── */}
        <div className="bg-slate-100/90 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(6);
              setSelectedDay('today');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              selectedDay === 'today'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>{todayLabel}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {todaySelected.length} active
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(6);
              setSelectedDay('tomorrow');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              selectedDay === 'tomorrow'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>{tomorrowLabel}</span>
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              OPEN
            </span>
          </button>
        </div>

        {/* ── 4. STATUS PILL (Exact UI from screenshot) ── */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 flex items-center gap-2 text-xs font-semibold text-emerald-900">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="leading-snug">
            {selectedDay === 'tomorrow'
              ? 'All windows are open for tomorrow. Lock in your priority.'
              : allTodayCutoffsPassed
              ? "Today's window cutoffs have passed. Plan Tomorrow."
              : 'Lock in your shift windows to get nearby order priority.'}
          </p>
        </div>

        {/* ── 5. SECTION HEADER (Exact UI from screenshot) ── */}
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">
            {selectedDay === 'today' ? "TODAY'S WINDOWS" : "TOMORROW'S WINDOWS"}
          </h3>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            {currentDayCount} of 4 selected
          </span>
        </div>

        {/* ── 6. 4 SHIFT WINDOW CARDS (Exact UI from screenshot) ── */}
        <div className="flex flex-col gap-2.5">
          {AVAILABILITY_WINDOWS.map((window) => {
            const isToday = selectedDay === 'today';
            const isSelected = isToday
              ? todaySelected.includes(window.id)
              : tomorrowSelected.includes(window.id);

            return (
              <div
                key={window.id}
                onClick={() => handleTogglePreference(window.id)}
                className={`rounded-2xl p-3.5 border-2 transition-all duration-150 select-none flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] ${
                  isSelected
                    ? 'bg-emerald-50/40 border-emerald-500 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {/* Left: Icon Squircle + Title & Time */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-xl transition-colors ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>{window.emoji}</span>
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-black text-sm text-slate-900 leading-tight">
                      {window.label}
                    </h4>
                    <p className="font-mono text-xs font-bold text-slate-600 mt-0.5">
                      {window.timeRange}
                    </p>
                  </div>
                </div>

                {/* Right: Checkmark Circle */}
                <div className="shrink-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'border-2 border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 7. MOMO WAITING TO EXPLAIN IT (Friendly Mascot Card) ── */}
        <div
          onClick={handleOpenMomoGuide}
          className="bg-gradient-to-r from-emerald-50 via-white to-teal-50 border border-emerald-200/90 rounded-2xl p-3 shadow-2xs flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-300 active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-emerald-300 shadow-xs shrink-0 bg-white">
              <img
                src="/images/momo/characters/hi_momo.jpeg"
                alt="Momo Guide"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                  Momo Explains
                </span>
              </div>
              <h4 className="text-xs font-black text-slate-900 mt-0.5 truncate">
                How does shift priority work?
              </h4>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                Tap to see the 8-step visual walkthrough 🚀
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1.5 rounded-xl">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Guide</span>
          </div>
        </div>

        {/* ── 8. SAVE PREFERENCES BUTTON (Exact UI from screenshot) ── */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full py-4 px-6 rounded-full font-black text-sm tracking-wide shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border ${
              savedSuccess
                ? 'bg-emerald-700 border-emerald-600 text-white shadow-emerald-700/30'
                : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500/30 text-white shadow-emerald-600/30'
            }`}
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Preferences...</span>
              </>
            ) : savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Preferences Saved!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>
                  {selectedDay === 'today'
                    ? "Save Today's Preferences"
                    : "Save Tomorrow's Preferences"}
                </span>
              </>
            )}
          </button>
        </div>

        {/* ── 9. ZONE SELECTION MODAL ── */}
        <ZoneSelectionModal
          isOpen={isZoneModalOpen}
          onClose={() => setIsZoneModalOpen(false)}
        />

        {/* ── 10. MOMO 8-SLIDE EXPLANATION MODAL (Slide Walkthrough) ── */}
        {isMomoGuideOpen && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md animate-fade-in"
            onClick={() => setIsMomoGuideOpen(false)}
          >
            <div
              className="bg-white rounded-3xl p-4 max-w-sm w-full shadow-2xl border border-slate-200 flex flex-col gap-3 relative animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Modal Bar */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-300 shrink-0">
                    <img
                      src="/images/momo/characters/hi_momo.jpeg"
                      alt="Momo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 leading-none">
                      Momo&apos;s Shift Guide
                    </h3>
                    <p className="text-[10px] font-bold text-emerald-700 mt-0.5">
                      Step {currentSlideIndex + 1} of {MOMO_SLIDES.length}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMomoGuideOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Current Slide Image (Swipeable) */}
              <div
                className="relative w-full flex items-center justify-center min-h-[340px] max-h-[56vh] overflow-hidden rounded-2xl bg-slate-50 border border-slate-100 select-none"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={MOMO_SLIDES[currentSlideIndex].src}
                  alt={MOMO_SLIDES[currentSlideIndex].title}
                  className="w-full h-full object-contain max-h-[56vh] rounded-2xl"
                />

                {/* Left Arrow overlay */}
                {currentSlideIndex > 0 && (
                  <button
                    type="button"
                    onClick={handlePrevSlide}
                    className="absolute left-2 w-8 h-8 rounded-full bg-white/90 shadow-md text-slate-800 flex items-center justify-center cursor-pointer hover:bg-white active:scale-95 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                {/* Right Arrow overlay */}
                {currentSlideIndex < MOMO_SLIDES.length - 1 && (
                  <button
                    type="button"
                    onClick={handleNextSlide}
                    className="absolute right-2 w-8 h-8 rounded-full bg-white/90 shadow-md text-slate-800 flex items-center justify-center cursor-pointer hover:bg-white active:scale-95 transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* 8 Dot Pagination Indicators */}
              <div className="flex items-center justify-center gap-1.5 py-0.5">
                {MOMO_SLIDES.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic(5);
                      setCurrentSlideIndex(idx);
                    }}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === currentSlideIndex
                        ? 'w-6 bg-emerald-600 shadow-xs'
                        : 'w-2 bg-slate-200 hover:bg-slate-300'
                    }`}
                  />
                ))}
              </div>

              {/* Bottom Navigation Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  disabled={currentSlideIndex === 0}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                    currentSlideIndex === 0
                      ? 'text-slate-300 bg-slate-50 cursor-not-allowed'
                      : 'text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer active:scale-95'
                  }`}
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={handleNextSlide}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  {currentSlideIndex === MOMO_SLIDES.length - 1 ? (
                    <span>Got It! Let&apos;s Ride 🚀</span>
                  ) : (
                    <span>Next ({currentSlideIndex + 1}/8) →</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
