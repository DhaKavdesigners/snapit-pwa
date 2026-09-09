'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRider } from '@/context/RiderContext';
import { updateRiderLiveLocation } from '@/services/supabaseOrderService';

export interface GpsLocation {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface UseDeviceGpsReturn {
  location: GpsLocation | null;
  status: 'searching' | 'locked' | 'permission_denied' | 'error';
  errorMessage: string | null;
  isHighAccuracy: boolean;
  refreshGps: () => void;
}

// Calculate bearing between two GPS coordinates in degrees (0 = North, 90 = East, etc.)
function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  return (toDeg(θ) + 360) % 360;
}

export function useDeviceGps(enabled: boolean = true): UseDeviceGpsReturn {
  const { isMockLocationEnabled, gpsCoords: mockCoords, rider, isOnline } = useRider();
  const [location, setLocation] = useState<GpsLocation | null>(null);
  const [status, setStatus] = useState<'searching' | 'locked' | 'permission_denied' | 'error'>('searching');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isHighAccuracy, setIsHighAccuracy] = useState<boolean>(true);

  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastBroadcastTsRef = useRef<number>(0);
  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Screen Wake Lock to prevent phone from sleeping during active duty
  useEffect(() => {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) return;

    let isMounted = true;
    const requestLock = async () => {
      try {
        if (enabled && document.visibilityState === 'visible') {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch {
        // WakeLock may be rejected in low power mode or if not supported
      }
    };

    requestLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled && isMounted) {
        requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        try {
          wakeLockRef.current.release();
        } catch {}
      }
    };
  }, [enabled]);

  // Main GPS Watching Logic
  const startWatching = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setStatus('error');
      setErrorMessage('Geolocation is not supported by your browser');
      return;
    }

    // If Mock Location is enabled in Dev Tester Mode, use mock coordinates
    if (isMockLocationEnabled && mockCoords) {
      setLocation({
        lat: mockCoords.lat,
        lng: mockCoords.lng,
        accuracy: 5,
        heading: 45,
        speed: 8.5,
        timestamp: Date.now(),
      });
      setStatus('locked');
      setErrorMessage(null);
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setStatus('searching');
    setErrorMessage(null);

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 0, // Never use cached stale GPS points
      timeout: 12000,
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, heading, speed } = pos.coords;

        // Calculate heading if device heading is null or unavailable
        let computedHeading = heading;
        if (computedHeading === null && lastCoordsRef.current) {
          const prev = lastCoordsRef.current;
          const dist = Math.hypot(latitude - prev.lat, longitude - prev.lng);
          // If moved more than ~3 meters (~0.00003 deg)
          if (dist > 0.00003) {
            computedHeading = calculateBearing(prev.lat, prev.lng, latitude, longitude);
          }
        }

        lastCoordsRef.current = { lat: latitude, lng: longitude };

        setLocation({
          lat: latitude,
          lng: longitude,
          accuracy: accuracy || 10,
          heading: computedHeading ?? 0,
          speed: speed ?? 0,
          timestamp: pos.timestamp,
        });

        setStatus('locked');
        setIsHighAccuracy(accuracy <= 30);

        // Throttle-broadcast live GPS location to Supabase every 6 seconds
        const now = Date.now();
        if (now - lastBroadcastTsRef.current > 6000 && rider.phone) {
          lastBroadcastTsRef.current = now;
          updateRiderLiveLocation(rider.phone, latitude, longitude, isOnline);
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('permission_denied');
          setErrorMessage('Location permission denied. Please allow GPS access in settings.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setStatus('error');
          setErrorMessage('GPS signal unavailable. Ensure location is enabled on device.');
        } else if (err.code === err.TIMEOUT) {
          // Timeout occurred, attempt retry with relaxed timeout
          setStatus('searching');
        } else {
          setStatus('error');
          setErrorMessage(err.message || 'GPS location error');
        }
      },
      geoOptions
    );
  }, [isMockLocationEnabled, mockCoords, rider.phone, isOnline]);

  useEffect(() => {
    if (!enabled) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    startWatching();

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, startWatching]);

  return {
    location,
    status,
    errorMessage,
    isHighAccuracy,
    refreshGps: startWatching,
  };
}
