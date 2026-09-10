'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRider } from '@/context/RiderContext';
import { ZoneSelectionModal } from '@/components/slots/ZoneSelectionModal';
import {
  AVAILABILITY_WINDOWS,
  getActivePreferenceWindow,
  triggerHaptic,
} from '@/services/preferenceService';
import { PreferenceWindowId } from '@/types';
import {
  Sparkles,
  MapPin,
  ChevronDown,
  Check,
  CheckCircle2,
  Clock,
  Navigation,
  ShieldCheck,
  AlertCircle,
  Flame,
  Info,
} from 'lucide-react';

export default function AvailabilityPage() {
  const { rider, ridingPreferences, saveRidingPreferences } = useRider();

  // Local selection state (rider can multi-select before clicking Save)
  const [selectedPreferences, setSelectedPreferences] = useState<PreferenceWindowId[]>([]);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeWindowId, setActiveWindowId] = useState<PreferenceWindowId | null>(null);

  // Sync initial selection from context
  useEffect(() => {
    if (ridingPreferences) {
      setSelectedPreferences(ridingPreferences);
    }
  }, [ridingPreferences]);

  // Update active KGF time window dynamically
  useEffect(() => {
    setActiveWindowId(getActivePreferenceWindow());
    const interval = setInterval(() => {
      setActiveWindowId(getActivePreferenceWindow());
    }, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Toggle a preference window
  const handleTogglePreference = (id: PreferenceWindowId) => {
    triggerHaptic(10);
    setSavedSuccess(false);
    setSelectedPreferences((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  // Save preferences
  const handleSave = async () => {
    triggerHaptic([15, 30, 15]);
    setIsSaving(true);
    try {
      await saveRidingPreferences(selectedPreferences);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
      }, 3000);
    } catch {
      // Local storage is already guaranteed by saveRidingPreferences
      setSavedSuccess(true);
    } finally {
      setIsSaving(false);
    }
  };

  const activeWindow = AVAILABILITY_WINDOWS.find((w) => w.id === activeWindowId);
  const isCurrentActiveSelected = activeWindowId ? selectedPreferences.includes(activeWindowId) : false;

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
              Set your preferred riding windows for priority dispatch
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

        {/* ── 2. ACTIVE WINDOW BANNER ── */}
        {activeWindow ? (
          <div
            className={`rounded-2xl p-4 border transition-all shadow-xs ${
              isCurrentActiveSelected
                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 ring-2 ring-emerald-500/20'
                : 'bg-amber-50/80 border-amber-200/80'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                  isCurrentActiveSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {activeWindow.emoji}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isCurrentActiveSelected ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wide text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      ⭐ Priority Active Now
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                      Window Active ({activeWindow.timeRange})
                    </span>
                  )}
                </div>

                <p className="text-sm font-extrabold text-slate-900 mt-1">
                  {activeWindow.label} is active right now
                </p>

                <p className="text-xs text-slate-600 mt-0.5">
                  {isCurrentActiveSelected
                    ? 'Your nearby-order priority preference is active. Store proximity remains priority #1.'
                    : 'Select this window to give yourself priority for orders nearby.'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-3.5 bg-slate-100/80 border border-slate-200 text-slate-700 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-slate-800">No preferred window is active right now.</p>
              <p className="text-slate-500 mt-0.2">
                Preferences will automatically activate during your selected windows.
              </p>
            </div>
          </div>
        )}

        {/* ── 3. FOUR PREFERENCE WINDOWS ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">
              Select Your Preferred Windows
            </p>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {selectedPreferences.length} of 4 selected
            </span>
          </div>

          {AVAILABILITY_WINDOWS.map((window) => {
            const isSelected = selectedPreferences.includes(window.id);
            const isWindowCurrent = activeWindowId === window.id;

            return (
              <div
                key={window.id}
                onClick={() => handleTogglePreference(window.id)}
                className={`relative rounded-2xl p-4 border transition-all cursor-pointer select-none active:scale-[0.99] flex items-center justify-between gap-3 shadow-2xs ${
                  isSelected
                    ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/25 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/40'
                }`}
              >
                {/* Left: Window details */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {window.emoji}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-sm text-slate-900 leading-tight">
                        {window.label}
                      </h3>
                      {isWindowCurrent && (
                        <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                          Live Now
                        </span>
                      )}
                    </div>

                    <p className="font-mono text-xs font-bold text-emerald-700 mt-0.5">
                      {window.timeRange}
                    </p>

                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                      {window.description}
                    </p>
                  </div>
                </div>

                {/* Right: Checkbox control (large touch target) */}
                <div className="shrink-0 pl-1">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs scale-105'
                        : 'border-2 border-slate-300 bg-slate-50 text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 4. SAVE PREFERENCES BUTTON (STATIC IN FLOW) ── */}
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
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>

        {/* ── 5. HOW PRIORITY WORKS RULES ── */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>How Priority Works</span>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <p className="leading-snug">
                <strong className="text-slate-900">Store Proximity:</strong> Distance to the store is always priority #1 for order dispatch.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <p className="leading-snug">
                <strong className="text-slate-900">Priority Boost:</strong> Your availability preferences provide an additional dispatch priority boost among nearby riders.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <p className="leading-snug">
                <strong className="text-slate-900">No Lockout:</strong> Preferences never lock you out. You can start riding anytime you are free.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                4
              </span>
              <p className="leading-snug">
                <strong className="text-slate-900">Zero Penalties:</strong> There are no missed-slot penalties or rigid schedules.
              </p>
            </div>
          </div>
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
