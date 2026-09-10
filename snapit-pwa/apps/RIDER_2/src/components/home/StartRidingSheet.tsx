'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, AlertCircle, ChevronRight, Clock } from 'lucide-react';

interface DurationOption {
  mins: number;
  label: string;
  sublabel: string;
  emoji: string;
}

const DURATION_OPTIONS: DurationOption[] = [
  { mins: 120, label: '2 Hours',  sublabel: 'Quick session',    emoji: '⚡' },
  { mins: 240, label: '4 Hours',  sublabel: 'Standard session', emoji: '🏍️' },
  { mins: 360, label: '6 Hours',  sublabel: 'Long session',     emoji: '💪' },
];

interface StartRidingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSession: (durationMins: number, zoneId: string, zoneName: string, lat?: number, lng?: number) => Promise<void>;
  zones: { id: string; name: string; centerLat?: number; centerLng?: number; radiusMeters?: number }[];
  defaultZoneId: string;
  defaultZoneName: string;
}

type GpsState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

export const StartRidingSheet: React.FC<StartRidingSheetProps> = ({
  isOpen,
  onClose,
  onStartSession,
  zones,
  defaultZoneId,
  defaultZoneName,
}) => {
  const [selectedDuration, setSelectedDuration] = useState<number>(240); // default 4h
  const [gpsState, setGpsState] = useState<GpsState>('idle');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [detectedZoneId, setDetectedZoneId] = useState<string>(defaultZoneId);
  const [detectedZoneName, setDetectedZoneName] = useState<string>(defaultZoneName);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Request GPS as soon as sheet opens
  useEffect(() => {
    if (!isOpen) {
      setGpsState('idle');
      setGpsCoords(null);
      setIsStarting(false);
      setError(null);
      return;
    }

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsState('unavailable');
      return;
    }

    setGpsState('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGpsCoords({ lat: latitude, lng: longitude });
        setGpsState('granted');

        // Detect nearest zone using haversine
        const detected = detectZoneFromCoords(latitude, longitude, zones);
        if (detected) {
          setDetectedZoneId(detected.id);
          setDetectedZoneName(detected.name);
        }
      },
      (err) => {
        console.warn('[StartRidingSheet] GPS error:', err.message);
        setGpsState(err.code === 1 ? 'denied' : 'unavailable');
        // Fall back to registered zone — rider can still start
        setDetectedZoneId(defaultZoneId);
        setDetectedZoneName(defaultZoneName);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  }, [isOpen, defaultZoneId, defaultZoneName]);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  const handleStart = async () => {
    setError(null);
    setIsStarting(true);
    try {
      await onStartSession(
        selectedDuration,
        detectedZoneId,
        detectedZoneName,
        gpsCoords?.lat,
        gpsCoords?.lng
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to start session. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  if (!isOpen) return null;

  // Compute end time preview
  const endTime = new Date(Date.now() + selectedDuration * 60 * 1000);
  const endTimeStr = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Sheet */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl animate-slide-up shadow-2xl overflow-hidden">
        
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="px-5 pb-6 pt-2 space-y-5">

          {/* Header */}
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              How long are you riding today?
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Pick your session to start earning
            </p>
          </div>

          {/* Duration picker */}
          <div className="grid grid-cols-3 gap-2.5">
            {DURATION_OPTIONS.map((opt) => {
              const isSelected = selectedDuration === opt.mins;
              return (
                <button
                  key={opt.mins}
                  type="button"
                  onClick={() => setSelectedDuration(opt.mins)}
                  className={`relative flex flex-col items-center justify-center py-4 px-2 rounded-2xl border-2 transition-all active:scale-95 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-2 right-2 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-[8px] font-black">✓</span>
                    </span>
                  )}
                  <span className="text-2xl mb-1">{opt.emoji}</span>
                  <span className={`text-sm font-black ${isSelected ? 'text-emerald-800' : 'text-slate-800'}`}>
                    {opt.label}
                  </span>
                  <span className={`text-[10px] font-semibold mt-0.5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {opt.sublabel}
                  </span>
                </button>
              );
            })}
          </div>

          {/* End time preview */}
          <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-3.5 py-2.5 border border-slate-200/80">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-slate-600">
                Session ends at <strong className="text-slate-900">{endTimeStr}</strong>
              </span>
            </div>
          </div>

          {/* Zone detection */}
          <div className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 border ${
            gpsState === 'denied' || gpsState === 'unavailable'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-slate-50 border-slate-200/80'
          }`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              gpsState === 'granted' ? 'bg-emerald-100' :
              gpsState === 'requesting' ? 'bg-blue-100' :
              gpsState === 'denied' ? 'bg-amber-100' : 'bg-slate-100'
            }`}>
              {gpsState === 'requesting' ? (
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              ) : (
                <MapPin className={`w-4 h-4 ${
                  gpsState === 'granted' ? 'text-emerald-600' :
                  gpsState === 'denied' ? 'text-amber-600' : 'text-slate-500'
                }`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {gpsState === 'requesting' && (
                <>
                  <p className="text-xs font-bold text-slate-700">Detecting your zone...</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Getting GPS location</p>
                </>
              )}
              {(gpsState === 'granted') && (
                <>
                  <p className="text-xs font-bold text-emerald-800">📍 {detectedZoneName}</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">Zone detected from GPS</p>
                </>
              )}
              {gpsState === 'denied' && (
                <>
                  <p className="text-xs font-bold text-amber-900">📍 {detectedZoneName}</p>
                  <p className="text-[10px] text-amber-700 mt-0.5">
                    Using registered zone. Enable GPS for accuracy.
                  </p>
                </>
              )}
              {(gpsState === 'idle' || gpsState === 'unavailable') && (
                <>
                  <p className="text-xs font-bold text-slate-700">📍 {detectedZoneName}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Using registered zone</p>
                </>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-3.5 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs font-semibold text-red-700">{error}</p>
            </div>
          )}

          {/* GPS denied warning */}
          {gpsState === 'denied' && (
            <button
              type="button"
              onClick={() => {
                // Try requesting again
                setGpsState('requesting');
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setGpsState('granted');
                  },
                  () => setGpsState('denied'),
                  { enableHighAccuracy: true, timeout: 8000 }
                );
              }}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 py-2.5 rounded-2xl active:scale-98 transition-all"
            >
              <MapPin className="w-3.5 h-3.5" />
              Retry GPS Permission
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Start Button */}
          <button
            type="button"
            onClick={handleStart}
            disabled={isStarting}
            className="w-full min-h-touch bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/25 active:scale-98 transition-all flex items-center justify-center gap-2 tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Starting Session...
              </>
            ) : (
              <>
                <span className="text-lg">🚀</span>
                START RIDING
              </>
            )}
          </button>

          <p className="text-center text-[10px] text-slate-400 font-medium">
            You can end your session early anytime. No penalties in Phase 1.
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Zone detection helper (haversine) ────────────────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function detectZoneFromCoords(
  lat: number,
  lng: number,
  zones: { id: string; name: string; centerLat?: number; centerLng?: number; radiusMeters?: number }[]
): { id: string; name: string } | null {
  let nearest: { id: string; name: string; dist: number } | null = null;
  for (const zone of zones) {
    if (!zone.centerLat || !zone.centerLng) continue;
    const distKm = haversineKm(lat, lng, zone.centerLat, zone.centerLng);
    const radiusKm = (zone.radiusMeters ?? 5000) / 1000;
    if (distKm <= radiusKm) {
      if (!nearest || distKm < nearest.dist) {
        nearest = { id: zone.id, name: zone.name, dist: distKm };
      }
    }
  }
  // If not inside any zone, return the nearest one
  if (!nearest && zones.length > 0) {
    let fallback = zones[0];
    let minDist = Infinity;
    for (const zone of zones) {
      if (!zone.centerLat || !zone.centerLng) continue;
      const d = haversineKm(lat, lng, zone.centerLat, zone.centerLng);
      if (d < minDist) { minDist = d; fallback = zone; }
    }
    return { id: fallback.id, name: fallback.name };
  }
  return nearest ? { id: nearest.id, name: nearest.name } : null;
}
