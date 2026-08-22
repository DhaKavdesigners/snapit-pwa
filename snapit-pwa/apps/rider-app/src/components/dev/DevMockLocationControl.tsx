'use client';

import React, { useState, useEffect } from 'react';
import { useRider } from '@/context/RiderContext';
import { getMockTimeConfig, getMockLocationConfig } from '@/services/mockService';
import { formatTimeAMPM } from '@/services/slotService';
import {
  MapPin,
  Navigation,
  Zap,
  RotateCcw,
  X,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Sparkles,
  Sliders,
  Check,
} from 'lucide-react';

export const DevMockLocationControl: React.FC = () => {
  // Production guard: render nothing if not in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const {
    rider,
    zones,
    zoneStatus,
    activeSlot,
    upcomingSlot,
    isMockLocationEnabled,
    mockZoneId,
    enableMockLocation,
    disableMockLocation,
    setMockZone,
    refreshZoneStatus,
    canGoOnline,
    // Mock Time
    isMockTimeEnabled,
    mockTimestamp,
    enableMockTime,
    disableMockTime,
    setMockTimePreset,
    resetTestEnvironment,
    refreshSlots,
  } = useRider();

  const [isOpen, setIsOpen] = useState(false);

  // Time Form State
  const initialTimeConfig = getMockTimeConfig();
  const [selectedTimeStr, setSelectedTimeStr] = useState<string>(initialTimeConfig.simulatedTimeStr || '10:00');
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    initialTimeConfig.simulatedDateStr || new Date().toISOString().split('T')[0]
  );

  const selectedZone = zones.find((z) => z.id === (rider.selectedZoneId || 'zone-1')) || zones[0];
  const activeOrBookedZoneId = rider.selectedZoneId || 'zone-1';
  const onlineCheck = canGoOnline();

  // Handlers for Mock Time
  const handleApplyTime = () => {
    enableMockTime(selectedTimeStr, selectedDateStr);
  };

  const handleToggleTime = () => {
    if (isMockTimeEnabled) {
      disableMockTime();
    } else {
      enableMockTime(selectedTimeStr, selectedDateStr);
    }
  };

  const handleTimePreset = (preset: 'booked_slot_start' | 'active_slot' | 'slot_expiry' | 'cutoff_passed' | 'morning_10am') => {
    setMockTimePreset(preset);
  };

  // Handlers for Mock Location
  const handleToggleLocation = () => {
    if (isMockLocationEnabled) {
      disableMockLocation();
    } else {
      enableMockLocation(activeOrBookedZoneId);
    }
  };

  const handleSimulateBookedZone = () => {
    enableMockLocation(activeOrBookedZoneId);
    refreshZoneStatus();
  };

  const handleSimulateZone = (zoneId: string) => {
    setMockZone(zoneId);
    refreshZoneStatus();
  };

  const handleSimulateFarOutside = () => {
    enableMockLocation('far-outside', { lat: 12.0, lng: 77.0 });
    refreshZoneStatus();
  };

  const handleFullReset = () => {
    resetTestEnvironment();
  };

  return (
    <>
      {/* Floating Developer Badge */}
      <div className="fixed top-2 right-2 z-[9999]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-bold shadow-xl border backdrop-blur-md transition-all active:scale-95 ${
            isMockTimeEnabled || isMockLocationEnabled
              ? 'bg-purple-950/95 text-purple-200 border-purple-400 ring-2 ring-purple-500/50'
              : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
          title="Open Developer Test Mode Controls"
        >
          <Zap className={`w-3.5 h-3.5 ${isMockTimeEnabled || isMockLocationEnabled ? 'text-amber-400 fill-amber-400 animate-pulse' : 'text-slate-400'}`} />
          <span>DEV TEST MODE</span>
          {isMockTimeEnabled && <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded">⏱️ TIME</span>}
          {isMockLocationEnabled && <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded">📍 GPS</span>}
        </button>
      </div>

      {/* Dev Test Mode Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl text-slate-100 p-4 animate-in fade-in zoom-in duration-150 my-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                  <Sliders className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-wider uppercase">Developer Test Mode</h3>
                  <p className="text-[10px] font-mono text-purple-400">DEV / TEST ENVIRONMENT ONLY</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Reset Environment Bar */}
            <div className="mt-3 mb-3">
              <button
                onClick={handleFullReset}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Reset Test Environment (Restore Real Time & GPS)</span>
              </button>
            </div>

            {/* Live System Gate Status */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs mb-3">
              <div className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" /> Live Gate Evaluation
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Active Slot:</span>
                <span className={`font-mono font-bold ${activeSlot ? 'text-green-400' : 'text-amber-400'}`}>
                  {activeSlot ? `✓ Active (${activeSlot.startTime}-${activeSlot.endTime})` : 'No Active Slot'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Geofence Status:</span>
                <span className={`font-mono font-bold ${zoneStatus === 'inside' ? 'text-green-400' : 'text-amber-400'}`}>
                  {zoneStatus === 'inside' ? '✓ INSIDE ZONE' : 'OUTSIDE ZONE'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Online Gate:</span>
                <span className={`font-bold text-[11px] ${onlineCheck.canGo ? 'text-green-400' : 'text-red-400'}`}>
                  {onlineCheck.canGo ? '✓ ELIGIBLE TO GO ONLINE' : `🔒 ${onlineCheck.reason || 'Blocked'}`}
                </span>
              </div>
            </div>

            {/* ── SECTION 1: MOCK TIME ── */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Mock Time</span>
                </div>
                <button
                  onClick={handleToggleTime}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all border ${
                    isMockTimeEnabled
                      ? 'bg-amber-950 text-amber-300 border-amber-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {isMockTimeEnabled ? 'ON (MOCK)' : 'OFF (REAL)'}
                </button>
              </div>

              {/* Date & Time Selectors */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-medium block mb-1">Simulated Date</label>
                  <input
                    type="date"
                    value={selectedDateStr}
                    onChange={(e) => setSelectedDateStr(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium block mb-1">Simulated Time</label>
                  <input
                    type="time"
                    value={selectedTimeStr}
                    onChange={(e) => setSelectedTimeStr(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                onClick={handleApplyTime}
                className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow transition-colors"
              >
                Apply Custom Time
              </button>

              {/* Time Presets */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
                  Quick Time Presets:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleTimePreset('morning_10am')}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 text-left transition-colors"
                  >
                    🌅 10:00 AM (Open)
                  </button>
                  <button
                    onClick={() => handleTimePreset('booked_slot_start')}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 text-left transition-colors"
                  >
                    ⏱️ Pre-Slot (-15m)
                  </button>
                  <button
                    onClick={() => handleTimePreset('active_slot')}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 text-left transition-colors"
                  >
                    ⚡ Active Slot Window
                  </button>
                  <button
                    onClick={() => handleTimePreset('slot_expiry')}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 text-left transition-colors"
                  >
                    ⌛ Slot Expired (+5m)
                  </button>
                </div>
              </div>
            </div>

            {/* ── SECTION 2: MOCK LOCATION ── */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Mock Location</span>
                </div>
                <button
                  onClick={handleToggleLocation}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all border ${
                    isMockLocationEnabled
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {isMockLocationEnabled ? 'ON (MOCK)' : 'OFF (REAL)'}
                </button>
              </div>

              {/* Simulate Booked Zone Button */}
              <button
                onClick={handleSimulateBookedZone}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-all active:scale-98"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Simulate Inside Booked Zone ({selectedZone.name})</span>
              </button>

              {/* Zone Selector Buttons */}
              <div className="grid grid-cols-1 gap-1 pt-1">
                {zones.map((z) => (
                  <button
                    key={z.id}
                    onClick={() => handleSimulateZone(z.id)}
                    className={`w-full p-1.5 rounded-lg text-left border flex items-center justify-between transition-all text-xs ${
                      isMockLocationEnabled && mockZoneId === z.id
                        ? 'bg-purple-900/40 border-purple-500 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <MapPin className={`w-3 h-3 ${z.id === selectedZone.id ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>{z.name}</span>
                      {z.id === selectedZone.id && (
                        <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1 rounded font-mono">
                          Booked
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {z.id === selectedZone.id ? '→ INSIDE' : '→ OUTSIDE'}
                    </span>
                  </button>
                ))}

                <button
                  onClick={handleSimulateFarOutside}
                  className={`w-full p-1.5 rounded-lg text-left border flex items-center justify-between transition-all text-xs ${
                    isMockLocationEnabled && mockZoneId === 'far-outside'
                      ? 'bg-amber-900/40 border-amber-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3 h-3 text-amber-400" />
                    <span>Far Outside All Zones</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400">→ OUTSIDE</span>
                </button>
              </div>
            </div>

            <div className="pt-1 text-center">
              <p className="text-[9px] text-slate-500">
                Mock inputs feed into standard <code className="text-purple-400">generateDailySlots()</code> & <code className="text-purple-400">isInsideZone()</code>.
                Production builds exclude all mock controls.
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
