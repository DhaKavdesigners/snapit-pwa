'use client';

import React, { useState, useEffect } from 'react';
import { useRider } from '@/context/RiderContext';
import { getNow, getMockTimeConfig } from '@/services/mockService';
import { formatTimeAMPM, getTodayDateString } from '@/services/slotService';
import {
  Clock,
  MapPin,
  X,
  RotateCcw,
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Calendar,
  Zap,
} from 'lucide-react';

export const DevTestingToggle: React.FC = () => {
  const {
    rider,
    zones,
    zoneStatus,
    slots,
    activeSlot,
    upcomingSlot,
    bookedSlotIds,
    bookSlot,
    refreshSlots,
    // Mock Location
    isMockLocationEnabled,
    mockZoneId,
    enableMockLocation,
    disableMockLocation,
    setMockZone,
    refreshZoneStatus,
    // Mock Time
    isMockTimeEnabled,
    enableMockTime,
    disableMockTime,
    resetTestEnvironment,
  } = useRider();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState<string>('');

  const initialTimeConfig = getMockTimeConfig();
  const [selectedTimeStr, setSelectedTimeStr] = useState<string>(
    initialTimeConfig.simulatedTimeStr || '10:00'
  );
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    initialTimeConfig.simulatedDateStr || getTodayDateString()
  );

  // Update live clock ticker display in the panel
  useEffect(() => {
    const updateTicker = () => {
      const nowTs = getNow();
      setCurrentTimeDisplay(formatTimeAMPM(nowTs));
    };
    updateTicker();
    const interval = setInterval(updateTicker, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handlers for Custom Time
  const handleApplyCustomTime = () => {
    enableMockTime(selectedTimeStr, selectedDateStr);
  };

  const handleToggleMockTime = () => {
    if (isMockTimeEnabled) {
      disableMockTime();
    } else {
      enableMockTime(selectedTimeStr, selectedDateStr);
    }
  };

  // Find currently booked slot or 1st slot to base relative presets on
  const targetSlot =
    activeSlot ||
    upcomingSlot ||
    slots.find((s) => bookedSlotIds.includes(s.id)) ||
    slots[1] ||
    slots[0];

  const applyRelativeSlotTime = (offsetFromStartMinutes?: number, offsetFromEndMinutes?: number) => {
    if (!targetSlot) return;
    const today = getTodayDateString();
    let targetTs: number;

    if (offsetFromStartMinutes !== undefined) {
      targetTs = targetSlot.startTimestamp + offsetFromStartMinutes * 60000;
    } else if (offsetFromEndMinutes !== undefined) {
      targetTs = targetSlot.endTimestamp + offsetFromEndMinutes * 60000;
    } else {
      targetTs = targetSlot.startTimestamp;
    }

    const d = new Date(targetTs);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    const timeStr = `${h}:${m}`;
    setSelectedTimeStr(timeStr);
    setSelectedDateStr(today);
    enableMockTime(timeStr, today);
  };

  // Handlers for Mock Location
  const handleToggleLocation = () => {
    if (isMockLocationEnabled) {
      disableMockLocation();
    } else {
      enableMockLocation(rider.selectedZoneId || 'zone-1');
    }
  };

  const handleSelectZone = (zoneId: string) => {
    setMockZone(zoneId);
    refreshZoneStatus();
  };

  const handleFarOutside = () => {
    enableMockLocation('far-outside', { lat: 12.0, lng: 77.0 });
    refreshZoneStatus();
  };

  const handleResetAll = () => {
    disableMockTime();
    disableMockLocation();
    resetTestEnvironment();
  };

  const handleQuickBookSlot = () => {
    if (targetSlot) {
      bookSlot(targetSlot.id, targetSlot.zoneId || 'zone-1', targetSlot.zoneName || 'Downtown Central');
    }
  };

  return (
    <>
      {/* ── Floating Test Button ── */}
      <div className="fixed top-20 right-3 z-[9999]">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black shadow-xl border backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
            isMockTimeEnabled || isMockLocationEnabled
              ? 'bg-purple-600 text-white border-purple-300 ring-2 ring-purple-400/50 animate-pulse'
              : 'bg-slate-900/90 text-amber-300 border-amber-400/60 hover:bg-slate-800'
          }`}
          title="Click to toggle Test Time & GPS controls"
        >
          <span className="text-sm">🧪</span>
          <span>Test Controls</span>
          {(isMockTimeEnabled || isMockLocationEnabled) && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          )}
        </button>
      </div>

      {/* ── Floating Test Panel Modal ── */}
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-purple-500/50 text-white rounded-3xl p-4 shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-base">🧪</span>
                <div>
                  <h3 className="text-sm font-black text-white">Temporary Test Panel</h3>
                  <p className="text-[10px] text-slate-400">Simulate time, slot states & GPS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Active Mode Info */}
            <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Current App Time</span>
                <span className="text-base font-black text-amber-400 font-mono">{currentTimeDisplay}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Time Mode</span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                    isMockTimeEnabled
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {isMockTimeEnabled ? 'Simulated' : 'Real Clock'}
                </span>
              </div>
            </div>

            {/* ── 1. Slot Card Color State Presets ── */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  1-Click Slot Color Presets
                </span>
                {bookedSlotIds.length === 0 && (
                  <button
                    type="button"
                    onClick={handleQuickBookSlot}
                    className="text-[10px] font-bold text-emerald-400 hover:underline cursor-pointer"
                  >
                    + Book Slot First
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {/* Green: > 60m remaining */}
                <button
                  type="button"
                  onClick={() => applyRelativeSlotTime(15, undefined)}
                  className="p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-200 text-left transition-all active:scale-95 cursor-pointer"
                >
                  <div className="flex items-center gap-1 font-bold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>&gt; 60m Left</span>
                  </div>
                  <p className="text-[9px] text-emerald-400/80 mt-0.5">Green Card (ACTIVE)</p>
                </button>

                {/* Yellow: 30–60m remaining */}
                <button
                  type="button"
                  onClick={() => applyRelativeSlotTime(undefined, -45)}
                  className="p-2 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/60 text-amber-200 text-left transition-all active:scale-95 cursor-pointer"
                >
                  <div className="flex items-center gap-1 font-bold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>30–60m Left</span>
                  </div>
                  <p className="text-[9px] text-amber-400/80 mt-0.5">Yellow Card (ACTIVE)</p>
                </button>

                {/* Orange: 10–30m remaining */}
                <button
                  type="button"
                  onClick={() => applyRelativeSlotTime(undefined, -20)}
                  className="p-2 rounded-xl bg-orange-950/80 hover:bg-orange-900 border border-orange-500/60 text-orange-200 text-left transition-all active:scale-95 cursor-pointer"
                >
                  <div className="flex items-center gap-1 font-bold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                    <span>&lt; 30m Left</span>
                  </div>
                  <p className="text-[9px] text-orange-400/80 mt-0.5">Orange Card (ENDING)</p>
                </button>

                {/* Red: < 10m remaining */}
                <button
                  type="button"
                  onClick={() => applyRelativeSlotTime(undefined, -5)}
                  className="p-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 text-rose-200 text-left transition-all active:scale-95 cursor-pointer"
                >
                  <div className="flex items-center gap-1 font-bold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                    <span>&lt; 10m Left</span>
                  </div>
                  <p className="text-[9px] text-rose-400/80 mt-0.5">Red Card (ENDING)</p>
                </button>

                {/* Sky: Upcoming */}
                <button
                  type="button"
                  onClick={() => applyRelativeSlotTime(-30, undefined)}
                  className="p-2 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-500/60 text-sky-200 text-left transition-all active:scale-95 cursor-pointer"
                >
                  <div className="flex items-center gap-1 font-bold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span>Upcoming</span>
                  </div>
                  <p className="text-[9px] text-sky-400/80 mt-0.5">Sky Blue (UPCOMING)</p>
                </button>

                {/* Slate: Expired */}
                <button
                  type="button"
                  onClick={() => applyRelativeSlotTime(undefined, 5)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-left transition-all active:scale-95 cursor-pointer"
                >
                  <div className="flex items-center gap-1 font-bold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Slot Expired</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5">Navy / Book 2h</p>
                </button>
              </div>
            </div>

            {/* ── 2. Manual Custom Time Input ── */}
            <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Custom Time Input
                </span>
                <button
                  type="button"
                  onClick={handleToggleMockTime}
                  className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                    isMockTimeEnabled
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {isMockTimeEnabled ? 'MOCK TIME: ON' : 'MOCK TIME: OFF'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-slate-400 font-medium block mb-1">Date</label>
                  <input
                    type="date"
                    value={selectedDateStr}
                    onChange={(e) => setSelectedDateStr(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-medium block mb-1">Time (24h)</label>
                  <input
                    type="time"
                    value={selectedTimeStr}
                    onChange={(e) => setSelectedTimeStr(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyCustomTime}
                className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs rounded-xl transition-all active:scale-95 shadow cursor-pointer"
              >
                Apply Custom Time
              </button>
            </div>

            {/* ── 3. Mock Location / Zone Simulation ── */}
            <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  GPS Location Simulation
                </span>
                <button
                  type="button"
                  onClick={handleToggleLocation}
                  className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                    isMockLocationEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {isMockLocationEnabled ? 'GPS MOCK: ON' : 'GPS MOCK: OFF'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1 pt-1">
                {zones.map((z) => (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => handleSelectZone(z.id)}
                    className={`py-1.5 px-2 rounded-lg text-left text-[10px] font-bold border transition-all cursor-pointer ${
                      isMockLocationEnabled && mockZoneId === z.id
                        ? 'bg-emerald-900/60 border-emerald-400 text-emerald-200 shadow-xs'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    📍 {z.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleFarOutside}
                  className={`py-1.5 px-2 rounded-lg text-left text-[10px] font-bold border col-span-2 transition-all cursor-pointer ${
                    isMockLocationEnabled && mockZoneId === 'far-outside'
                      ? 'bg-red-900/60 border-red-400 text-red-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  🚫 Simulate Far Outside All Zones
                </button>
              </div>
            </div>

            {/* ── Footer: Reset All & Dismiss ── */}
            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={handleResetAll}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Real Clock & GPS</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
