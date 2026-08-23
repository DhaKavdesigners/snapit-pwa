'use client';

import React, { useState } from 'react';
import { useRider } from '@/context/RiderContext';
import { getMockTimeConfig } from '@/services/mockService';
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
  Sliders,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Wrench,
} from 'lucide-react';

export const TestModePanel: React.FC = () => {
  const {
    rider,
    zones,
    zoneStatus,
    activeSlot,
    testMode,
    isMockLocationEnabled,
    mockZoneId,
    enableMockLocation,
    disableMockLocation,
    setMockZone,
    refreshZoneStatus,
    canGoOnline,
    // Mock Time
    isMockTimeEnabled,
    enableMockTime,
    disableMockTime,
    setMockTimePreset,
    resetTestEnvironment,
  } = useRider();

  // If in Driver mode, do not render the tester panel
  if (testMode !== 'tester') {
    return null;
  }

  const [isMinimized, setIsMinimized] = useState(false);

  // Form State
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
    <div className="fixed bottom-20 right-3 z-[9999] max-w-[340px] w-full">
      {/* TEST MODE ACTIVE Pill Badge */}
      <div className="flex items-center justify-between bg-purple-950/95 border border-purple-400 text-purple-200 px-3 py-1.5 rounded-t-2xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-300">
            TEST MODE ACTIVE
          </span>
        </div>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-purple-300 hover:text-white p-0.5 rounded transition-colors"
          title={isMinimized ? 'Expand Tester Panel' : 'Minimize Tester Panel'}
        >
          {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Panel */}
      {!isMinimized && (
        <div className="bg-slate-900/95 border-x border-b border-purple-500/40 rounded-b-2xl shadow-2xl p-3 backdrop-blur-md text-slate-100 text-xs space-y-2.5 max-h-[75vh] overflow-y-auto">

          {/* Reset Environment Bar */}
          <button
            onClick={handleFullReset}
            className="w-full py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1.5 border border-slate-700 transition-colors shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Test Environment</span>
          </button>

          {/* Live Gate Status Summary */}
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Active Slot:</span>
              <span className={`font-mono font-bold ${activeSlot ? 'text-green-400' : 'text-amber-400'}`}>
                {activeSlot ? `✓ Active (${activeSlot.startTime}-${activeSlot.endTime})` : 'No Active Slot'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Geofence Status:</span>
              <span className={`font-mono font-bold ${zoneStatus === 'inside' ? 'text-green-400' : 'text-amber-400'}`}>
                {zoneStatus === 'inside' ? '✓ INSIDE ZONE' : 'OUTSIDE ZONE'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span className="text-slate-400 font-medium">Online Gate:</span>
              <span className={`font-bold text-[10px] ${onlineCheck.canGo ? 'text-green-400' : 'text-red-400'}`}>
                {onlineCheck.canGo ? '✓ ELIGIBLE TO GO ONLINE' : `🔒 ${onlineCheck.reason || 'Blocked'}`}
              </span>
            </div>
          </div>

          {/* ── SECTION 1: MOCK TIME ── */}
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold text-white text-[11px]">Mock Time</span>
              </div>
              <button
                onClick={handleToggleTime}
                className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold transition-all border ${
                  isMockTimeEnabled
                    ? 'bg-amber-950 text-amber-300 border-amber-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isMockTimeEnabled ? 'ON (MOCK)' : 'OFF (REAL)'}
              </button>
            </div>

            {/* Date & Time Selectors */}
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="text-[9px] text-slate-400 font-medium block mb-0.5">Date</label>
                <input
                  type="date"
                  value={selectedDateStr}
                  onChange={(e) => setSelectedDateStr(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 font-medium block mb-0.5">Time</label>
                <input
                  type="time"
                  value={selectedTimeStr}
                  onChange={(e) => setSelectedTimeStr(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              onClick={handleApplyTime}
              className="w-full py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] shadow transition-colors"
            >
              Apply Custom Time
            </button>

            {/* Time Presets */}
            <div className="pt-1.5 border-t border-slate-800/80">
              <span className="text-[9px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                Quick Time Presets:
              </span>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => handleTimePreset('morning_10am')}
                  className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-medium text-slate-300 text-left transition-colors"
                >
                  🌅 10:00 AM (Open)
                </button>
                <button
                  onClick={() => handleTimePreset('booked_slot_start')}
                  className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-medium text-slate-300 text-left transition-colors"
                >
                  ⏱️ Pre-Slot (-15m)
                </button>
                <button
                  onClick={() => handleTimePreset('active_slot')}
                  className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-medium text-slate-300 text-left transition-colors"
                >
                  ⚡ Active Slot
                </button>
                <button
                  onClick={() => handleTimePreset('slot_expiry')}
                  className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-medium text-slate-300 text-left transition-colors"
                >
                  ⌛ Expired (+5m)
                </button>
              </div>
            </div>
          </div>

          {/* ── SECTION 2: MOCK LOCATION ── */}
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold text-white text-[11px]">Mock Location</span>
              </div>
              <button
                onClick={handleToggleLocation}
                className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold transition-all border ${
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
              className="w-full py-1.5 px-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[10px] flex items-center justify-center gap-1.5 shadow transition-all active:scale-98"
            >
              <Navigation className="w-3 h-3" />
              <span>Simulate Inside Booked Zone ({selectedZone.name})</span>
            </button>

            {/* Zone Selector Buttons */}
            <div className="grid grid-cols-1 gap-1 pt-1">
              {zones.map((z) => (
                <button
                  key={z.id}
                  onClick={() => handleSimulateZone(z.id)}
                  className={`w-full p-1 rounded text-left border flex items-center justify-between transition-all text-[10px] ${
                    isMockLocationEnabled && mockZoneId === z.id
                      ? 'bg-purple-900/40 border-purple-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <MapPin className={`w-3 h-3 ${z.id === selectedZone.id ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{z.name}</span>
                    {z.id === selectedZone.id && (
                      <span className="text-[8px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1 rounded font-mono">
                        Booked
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">
                    {z.id === selectedZone.id ? '→ INSIDE' : '→ OUTSIDE'}
                  </span>
                </button>
              ))}

              <button
                onClick={handleSimulateFarOutside}
                className={`w-full p-1 rounded text-left border flex items-center justify-between transition-all text-[10px] ${
                  isMockLocationEnabled && mockZoneId === 'far-outside'
                    ? 'bg-amber-900/40 border-amber-500 text-white font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-amber-400" />
                  <span>Far Outside All Zones</span>
                </div>
                <span className="text-[9px] font-mono text-amber-400">→ OUTSIDE</span>
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
