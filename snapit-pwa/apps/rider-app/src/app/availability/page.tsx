'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRider } from '@/context/RiderContext';
import { ZoneSelectionModal } from '@/components/slots/ZoneSelectionModal';
import {
  AVAILABILITY_WINDOWS,
  getActivePreferenceWindow,
  triggerHaptic,
  getWindowCutoffStatus,
  areAllTodayCutoffsPassed,
  getFormattedDayLabel,
  WINDOW_CUTOFFS,
} from '@/services/preferenceService';
import { PreferenceWindowId } from '@/types';
import {
  Sparkles,
  MapPin,
  ChevronDown,
  Check,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Lock,
  ArrowRight,
  Calendar,
  AlertCircle,
  Info,
} from 'lucide-react';

export default function AvailabilityPage() {
  const {
    rider,
    ridingPreferences,
    tomorrowPreferences,
    saveRidingPreferences,
  } = useRider();

  // Active Tab: 'today' or 'tomorrow'
  const [selectedDay, setSelectedDay] = useState<'today' | 'tomorrow'>('today');

  // Separate selection states for Today and Tomorrow
  const [todaySelected, setTodaySelected] = useState<PreferenceWindowId[]>([]);
  const [tomorrowSelected, setTomorrowSelected] = useState<PreferenceWindowId[]>([]);

  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeWindowId, setActiveWindowId] = useState<PreferenceWindowId | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Sync initial selections from context
  useEffect(() => {
    if (ridingPreferences) {
      setTodaySelected(ridingPreferences);
    }
  }, [ridingPreferences]);

  useEffect(() => {
    if (tomorrowPreferences) {
      setTomorrowSelected(tomorrowPreferences);
    }
  }, [tomorrowPreferences]);

  // Update active KGF time window dynamically
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);
      setActiveWindowId(getActivePreferenceWindow(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Check if all today's cutoffs have passed
  const allCutoffsPassedToday = areAllTodayCutoffsPassed(currentTime);

  // Toggle preference for the currently active tab
  const handleTogglePreference = (id: PreferenceWindowId) => {
    triggerHaptic(10);
    setSavedSuccess(false);

    if (selectedDay === 'today') {
      const cutoffStatus = getWindowCutoffStatus(id, todaySelected.includes(id), currentTime);
      // If cutoff has passed and it is not already selected, rider cannot select it for today
      if (cutoffStatus.isPassed && !todaySelected.includes(id)) {
        // Provide haptic feedback and switch to tomorrow
        triggerHaptic([30, 40, 30]);
        setSelectedDay('tomorrow');
        setTomorrowSelected((prev) => (prev.includes(id) ? prev : [...prev, id]));
        return;
      }

      // If cutoff has passed and it was already selected, it is locked in for today
      if (cutoffStatus.isPassed && todaySelected.includes(id)) {
        triggerHaptic([20, 20]);
        return; // Locked in
      }

      setTodaySelected((prev) =>
        prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
      );
    } else {
      // Tomorrow: all windows are open for selection
      setTomorrowSelected((prev) =>
        prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
      );
    }
  };

  // Save preferences for the active day
  const handleSave = async () => {
    triggerHaptic([15, 30, 15]);
    setIsSaving(true);
    try {
      if (selectedDay === 'today') {
        await saveRidingPreferences(todaySelected, 'today');
      } else {
        await saveRidingPreferences(tomorrowSelected, 'tomorrow');
      }
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
      }, 3000);
    } catch {
      setSavedSuccess(true);
    } finally {
      setIsSaving(false);
    }
  };

  const activeWindow = AVAILABILITY_WINDOWS.find((w) => w.id === activeWindowId);
  const isCurrentActiveSelected = activeWindowId ? todaySelected.includes(activeWindowId) : false;

  const currentDaySelectionCount =
    selectedDay === 'today' ? todaySelected.length : tomorrowSelected.length;

  return (
    <AppShell>
      <div className="flex flex-col gap-4 pt-2 pb-10 max-w-md mx-auto w-full px-1">
        {/* ── 1. TOP HEADER & ZONE PICKER ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span>Availability</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Pick your shift windows for order priority.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsZoneModalOpen(true)}
            className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs text-xs font-bold text-slate-700 hover:border-slate-300 active:scale-95 transition-all cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate max-w-[100px]">{rider.selectedZone || 'Robertsonpet'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>
        </div>

        {/* ── 2. ACTIVE WINDOW BANNER (COMPACT) ── */}
        {activeWindow && (
          <div
            className={`rounded-2xl p-3 border flex items-center justify-between gap-3 shadow-2xs ${
              isCurrentActiveSelected
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-amber-50/90 border-amber-200'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl">{activeWindow.emoji}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-slate-900">{activeWindow.label} Active</span>
                  <span className="text-[10px] font-mono font-bold text-slate-600 bg-white/80 px-1.5 py-0.2 rounded border border-slate-200">
                    {activeWindow.timeRange}
                  </span>
                  {isCurrentActiveSelected && (
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                      Priority Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {isCurrentActiveSelected
                    ? 'Your nearby dispatch priority is active.'
                    : 'Riders with this window get nearby priority.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. DAY SELECTOR: TODAY VS TOMORROW (NEXT DAY) ── */}
        <div className="bg-slate-100/90 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/90 shadow-2xs">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(5);
              setSelectedDay('today');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              selectedDay === 'today'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{getFormattedDayLabel('today', currentTime)}</span>
            {allCutoffsPassedToday ? (
              <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-md border border-amber-200">
                Closed
              </span>
            ) : (
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-200">
                {todaySelected.length} active
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(5);
              setSelectedDay('tomorrow');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              selectedDay === 'tomorrow'
                ? 'bg-white text-emerald-950 shadow-xs border border-emerald-300 ring-1 ring-emerald-500/20'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{getFormattedDayLabel('tomorrow', currentTime)}</span>
            <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded-md bg-emerald-600 text-white shadow-2xs">
              Open
            </span>
          </button>
        </div>

        {/* ── 4. DAY NOTICE (SHORT & PUNCHY) ── */}
        {selectedDay === 'today' && allCutoffsPassedToday ? (
          <div className="rounded-xl p-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-bold text-xs truncate">Today's window cutoffs have passed.</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDay('tomorrow')}
              className="shrink-0 text-[11px] font-black text-amber-900 bg-amber-200/90 hover:bg-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <span>Plan Tomorrow</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ) : selectedDay === 'tomorrow' ? (
          <div className="rounded-xl p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 shadow-2xs">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium text-xs">All windows are open for tomorrow. Lock in your priority.</span>
          </div>
        ) : null}

        {/* ── 5. FOUR PREFERENCE WINDOWS (CLEAN & SHORT) ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">
              {selectedDay === 'today' ? "Today's Windows" : "Tomorrow's Windows"}
            </p>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {currentDaySelectionCount} of 4 selected
            </span>
          </div>

          {AVAILABILITY_WINDOWS.map((window) => {
            const isToday = selectedDay === 'today';
            const isSelected = isToday
              ? todaySelected.includes(window.id)
              : tomorrowSelected.includes(window.id);

            const isWindowCurrent = isToday && activeWindowId === window.id;
            const cutoffStatus = isToday
              ? getWindowCutoffStatus(window.id, isSelected, currentTime)
              : null;

            const isCutoffPassedForToday = isToday && cutoffStatus?.isPassed;
            const isLockedInActive = isCutoffPassedForToday && isSelected;
            const isCutoffClosedUnselected = isCutoffPassedForToday && !isSelected;

            return (
              <div
                key={window.id}
                onClick={() => handleTogglePreference(window.id)}
                className={`relative rounded-2xl p-3.5 border transition-all select-none flex items-center justify-between gap-3 shadow-2xs ${
                  isLockedInActive
                    ? 'bg-emerald-50/50 border-emerald-400/80 ring-1 ring-emerald-400/30 opacity-95 cursor-default'
                    : isCutoffClosedUnselected
                    ? 'bg-slate-50/70 border-slate-200 opacity-80 cursor-pointer hover:border-amber-300'
                    : isSelected
                    ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/25 shadow-xs cursor-pointer active:scale-[0.99]'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/40 cursor-pointer active:scale-[0.99]'
                }`}
              >
                {/* Left: Emoji + Window details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isCutoffClosedUnselected
                        ? 'bg-slate-200/70 text-slate-400 border border-slate-300/60'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {window.emoji}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={`font-black text-sm leading-tight ${
                          isCutoffClosedUnselected ? 'text-slate-600' : 'text-slate-900'
                        }`}
                      >
                        {window.label}
                      </h3>

                      {isWindowCurrent && (
                        <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                          Live Now
                        </span>
                      )}

                      {/* Cutoff / Locked Badges */}
                      {isLockedInActive ? (
                        <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          Locked In
                        </span>
                      ) : isCutoffClosedUnselected ? (
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-slate-200/80 text-slate-600 border border-slate-300 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5 text-slate-500" />
                          Cutoff Passed
                        </span>
                      ) : null}
                    </div>

                    <p className="font-mono text-xs font-bold text-slate-500 mt-0.5">
                      {window.timeRange}
                    </p>
                  </div>
                </div>

                {/* Right: Checkbox or Lock control */}
                <div className="shrink-0 pl-1">
                  {isCutoffClosedUnselected ? (
                    <div
                      title="Cutoff passed for today. Tap to select for Tomorrow."
                      className="w-7 h-7 rounded-xl flex items-center justify-center border border-slate-300 bg-slate-100 text-slate-400"
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs scale-105'
                          : 'border-2 border-slate-300 bg-slate-50 text-transparent'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 6. SAVE PREFERENCES BUTTON (STATIC IN FLOW) ── */}
        <div className="flex justify-center pt-1 pb-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`px-8 py-3 rounded-full font-extrabold text-xs tracking-wide shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-emerald-500/20 ${
              savedSuccess
                ? 'bg-emerald-700 text-white shadow-emerald-700/25'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
            style={{ backgroundColor: savedSuccess ? '#047857' : '#059669' }}
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Preferences Saved</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-white/20" />
                <span>
                  {selectedDay === 'today'
                    ? "Save Today's Preferences"
                    : "Save Tomorrow's Preferences"}
                </span>
              </>
            )}
          </button>
        </div>

        {/* ── 7. HOW PRIORITY WORKS (3 SIMPLE POINTS) ── */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>How Priority Works</span>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center justify-center shrink-0">
                1
              </span>
              <p className="leading-snug">
                <strong className="text-slate-900">Nearest rider first:</strong> Distance to store is always priority #1.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center justify-center shrink-0">
                2
              </span>
              <p className="leading-snug">
                <strong className="text-slate-900">500m Priority Boost:</strong> Selected windows give you first offer among nearby riders.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center justify-center shrink-0">
                3
              </span>
              <p className="leading-snug">
                <strong className="text-slate-900">Ride anytime:</strong> Preferences never lock you out. Zero penalties.
              </p>
            </div>
          </div>
        </div>

        {/* ── 8. ZONE SELECTION MODAL ── */}
        <ZoneSelectionModal
          isOpen={isZoneModalOpen}
          onClose={() => setIsZoneModalOpen(false)}
        />
      </div>
    </AppShell>
  );
}
