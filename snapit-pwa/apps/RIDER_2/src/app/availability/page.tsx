'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRider } from '@/context/RiderContext';
import {
  PREFERENCE_WINDOWS,
  PreferenceWindow,
  PreferenceWindowId,
  getCurrentWindow,
} from '@/services/preferenceService';
import { Check, Sparkles, Clock, Info, ShieldCheck } from 'lucide-react';

export default function AvailabilityPage() {
  const {
    ridingPreferences,
    updateRidingPreferences,
    isOnline,
    currentWindow,
    isCurrentWindowPreferred,
  } = useRider();

  // Local working copy of selected window IDs
  const [selectedIds, setSelectedIds] = useState<string[]>(ridingPreferences);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sync with context if context loads from DB/storage
  useEffect(() => {
    setSelectedIds(ridingPreferences);
  }, [ridingPreferences]);

  const toggleWindow = (id: string) => {
    setIsSaved(false);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );

    // Light mobile haptic vibration
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(20);
      } catch {}
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateRidingPreferences(selectedIds);
    setIsSaving(false);
    setIsSaved(true);

    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate([30, 40]);
      } catch {}
    }

    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  const hasChanges =
    selectedIds.length !== ridingPreferences.length ||
    selectedIds.some((id) => !ridingPreferences.includes(id));

  return (
    <AppShell
      showBack={false}
      title="Availability"
      subtitle="Set your preferred riding hours"
    >
      <div className="flex flex-col gap-4 pt-4 pb-8 animate-fade-in">

        {/* ── Page Header ── */}
        <div className="px-1">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Riding Availability</h1>
            {selectedIds.length > 0 && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                {selectedIds.length} {selectedIds.length === 1 ? 'window' : 'windows'} selected
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tell us when you usually ride. Preferred riders may receive priority consideration for nearby orders.
          </p>
        </div>

        {/* ── Realtime Priority Banner ── */}
        {currentWindow && (
          <div
            className={`rounded-3xl p-4 border transition-all ${
              isCurrentWindowPreferred && isOnline
                ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white cockpit-shadow-active border-emerald-500'
                : isCurrentWindowPreferred
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 cockpit-shadow'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-xl ${
                  isCurrentWindowPreferred && isOnline
                    ? 'bg-white/20 text-white'
                    : 'bg-white shadow-xs'
                }`}
              >
                {currentWindow.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isCurrentWindowPreferred && isOnline
                        ? 'bg-white/20 text-white'
                        : isCurrentWindowPreferred
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    Current Window · {currentWindow.title}
                  </span>
                  {isCurrentWindowPreferred && isOnline && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-200">
                      <Sparkles className="w-3 h-3 fill-emerald-200" />
                      Priority Active
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-black mt-1 leading-snug">
                  {currentWindow.badge} ({currentWindow.timeRange})
                </h3>
                <p
                  className={`text-[11px] mt-0.5 leading-relaxed ${
                    isCurrentWindowPreferred && isOnline ? 'text-emerald-100' : 'text-slate-500'
                  }`}
                >
                  {isCurrentWindowPreferred && isOnline
                    ? "You're online during your selected preference. You have priority consideration for nearby orders!"
                    : isCurrentWindowPreferred
                    ? "This is one of your preferred riding times. Go online to activate priority consideration."
                    : "Select this time window below if you want earlier assignment priority during this peak."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── 4 Preference Windows ── */}
        <div className="flex flex-col gap-2.5">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">
            Choose Your Usual Daily Routine
          </p>

          {PREFERENCE_WINDOWS.map((win) => {
            const isSelected = selectedIds.includes(win.id);
            const isLiveNow = currentWindow?.id === win.id;

            return (
              <button
                key={win.id}
                type="button"
                onClick={() => toggleWindow(win.id)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all active:scale-98 flex items-start gap-3.5 ${
                  isSelected
                    ? 'border-emerald-500 bg-white cockpit-shadow shadow-emerald-500/10'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-2xl transition-colors ${
                    isSelected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100'
                  }`}
                >
                  {win.emoji}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900">{win.title}</h4>
                      {isLiveNow && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                          Now
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 font-mono">
                      {win.timeRange}
                    </span>
                  </div>

                  <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                    {win.badge}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {win.description}
                  </p>
                </div>

                {/* Checkbox indicator */}
                <div
                  className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 bg-slate-50'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Save Button ── */}
        <div className="sticky bottom-20 pt-2 pb-1 z-10 bg-gradient-to-t from-slate-100 via-slate-100 to-transparent">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full min-h-touch rounded-2xl font-black text-sm transition-all active:scale-98 flex items-center justify-center gap-2 tracking-wide shadow-lg ${
              isSaved
                ? 'bg-teal-600 text-white shadow-teal-600/20'
                : hasChanges
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
                : 'bg-slate-900 text-white shadow-slate-900/10'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-5 h-5 stroke-[3]" />
                Preferences Saved!
              </>
            ) : isSaving ? (
              'Saving...'
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-white" />
                {hasChanges ? 'Save Preferences' : 'Preferences Up To Date'}
              </>
            )}
          </button>
        </div>

        {/* ── Transparent Guidelines Card ── */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 cockpit-shadow space-y-3">
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-600" />
            How Priority Consideration Works
          </h3>

          <div className="space-y-2.5 text-[11px] text-slate-600">
            <div className="flex items-start gap-2">
              <span className="font-black text-slate-900 text-xs mt-0.5">1.</span>
              <p>
                <strong>Distance is always respected</strong> — Minnit prioritizes nearby riders closest to store pick-ups.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-black text-slate-900 text-xs mt-0.5">2.</span>
              <p>
                <strong>Preferred window boost</strong> — When multiple riders are nearby, riders active during their selected window receive priority allocation.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-black text-slate-900 text-xs mt-0.5">3.</span>
              <p>
                <strong>Zero lock-outs</strong> — Preferences are 100% optional. You can ride and earn at any time of day regardless of what you select.
              </p>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
