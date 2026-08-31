'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type RiderLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
};

export type GPSStatusType =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'weak'
  | 'denied'
  | 'unavailable'
  | 'error';

export type AccuracyClassification = 'Excellent' | 'Good' | 'Weak' | 'Unreliable';

export interface UseRiderLocationOptions {
  autoStart?: boolean;
  enableHighAccuracy?: boolean;
  maximumAge?: number;
  timeout?: number;
  maxRealisticSpeedMps?: number;
  maxAccuracyThresholdMeters?: number;
  staleThresholdMs?: number;
}

export interface UseRiderLocationReturn {
  location: RiderLocation | null;
  status: GPSStatusType;
  error: string | null;
  accuracyClassification: AccuracyClassification | null;
  isStale: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  retryPermission: () => void;
}

// Configurable constants
const DEFAULT_MAX_REALISTIC_SPEED_MPS = 45; // ~162 km/h (delivery bike / vehicle threshold)
const DEFAULT_MAX_ACCURACY_THRESHOLD_METERS = 50; // >50m considered unreliable for precision
const DEFAULT_STALE_THRESHOLD_MS = 15000; // 15 seconds without fresh GPS update

// Haversine distance calculator between two GPS coordinates in meters
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// GPS Accuracy classification
export function classifyAccuracy(accuracy: number): AccuracyClassification {
  if (accuracy <= 10) return 'Excellent';
  if (accuracy <= 25) return 'Good';
  if (accuracy <= 50) return 'Weak';
  return 'Unreliable';
}

export function useRiderLocation(options: UseRiderLocationOptions = {}): UseRiderLocationReturn {
  const {
    autoStart = true,
    enableHighAccuracy = true,
    maximumAge = 3000,
    timeout = 10000,
    maxRealisticSpeedMps = DEFAULT_MAX_REALISTIC_SPEED_MPS,
    maxAccuracyThresholdMeters = DEFAULT_MAX_ACCURACY_THRESHOLD_METERS,
    staleThresholdMs = DEFAULT_STALE_THRESHOLD_MS,
  } = options;

  const [location, setLocation] = useState<RiderLocation | null>(null);
  const [status, setStatus] = useState<GPSStatusType>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);
  const lastValidLocationRef = useRef<RiderLocation | null>(null);
  const staleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Helper to reset the stale location timer
  const resetStaleTimer = useCallback(() => {
    if (staleTimerRef.current) {
      clearTimeout(staleTimerRef.current);
    }
    setIsStale(false);

    staleTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setIsStale(true);
      }
    }, staleThresholdMs);
  }, [staleThresholdMs]);

  // Stop tracking handler with cleanup
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null && typeof window !== 'undefined' && 'navigator' in window && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (staleTimerRef.current) {
      clearTimeout(staleTimerRef.current);
      staleTimerRef.current = null;
    }
    if (isMountedRef.current) {
      setStatus('idle');
      setIsStale(false);
    }
  }, []);

  // Start tracking handler
  const startTracking = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setStatus('unavailable');
      setError('Geolocation is not supported by your browser or device.');
      return;
    }

    // Clear any existing active watch before starting
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setStatus('requesting');
    setError(null);

    const geoOptions: PositionOptions = {
      enableHighAccuracy,
      maximumAge,
      timeout,
    };

    const handleSuccess = (position: GeolocationPosition) => {
      if (!isMountedRef.current) return;

      const { latitude, longitude, accuracy, speed, heading } = position.coords;
      const timestamp = position.timestamp || Date.now();

      const newLocation: RiderLocation = {
        latitude,
        longitude,
        accuracy,
        speed: speed !== null && !isNaN(speed) ? speed : null,
        heading: heading !== null && !isNaN(heading) ? heading : null,
        timestamp,
      };

      // ── Step 1: Reject obviously unrealistic GPS jumps ──
      if (lastValidLocationRef.current) {
        const prev = lastValidLocationRef.current;
        const distanceMeters = calculateHaversineDistanceMeters(
          prev.latitude,
          prev.longitude,
          latitude,
          longitude
        );
        const timeDeltaSeconds = Math.max(0.5, (timestamp - prev.timestamp) / 1000);
        const estimatedSpeedMps = distanceMeters / timeDeltaSeconds;

        if (estimatedSpeedMps > maxRealisticSpeedMps && distanceMeters > 100) {
          console.warn(
            `[useRiderLocation] Rejected unrealistic GPS jump: ${Math.round(distanceMeters)}m in ${timeDeltaSeconds.toFixed(1)}s (~${Math.round(estimatedSpeedMps * 3.6)} km/h)`
          );
          // Keep previous location, but refresh stale timer
          resetStaleTimer();
          return;
        }
      }

      // ── Step 2: Accuracy Validation ──
      lastValidLocationRef.current = newLocation;
      setLocation(newLocation);
      setError(null);

      if (accuracy > maxAccuracyThresholdMeters) {
        setStatus('weak');
      } else {
        setStatus('active');
      }

      resetStaleTimer();
    };

    const handleError = (geoError: GeolocationPositionError) => {
      if (!isMountedRef.current) return;

      switch (geoError.code) {
        case geoError.PERMISSION_DENIED:
          setStatus('denied');
          setError('Location permission required. Please allow location access to track delivery.');
          break;
        case geoError.POSITION_UNAVAILABLE:
          setStatus('unavailable');
          setError('GPS unavailable. Please ensure location services are enabled on your device.');
          break;
        case geoError.TIMEOUT:
          // If we already have a previous location, stay active or weak instead of wiping location
          if (!lastValidLocationRef.current) {
            setStatus('error');
            setError('Unable to get current location (timeout). Retrying...');
          } else {
            setIsStale(true);
          }
          break;
        default:
          setStatus('error');
          setError(geoError.message || 'An unknown location error occurred.');
          break;
      }
    };

    try {
      const id = navigator.geolocation.watchPosition(handleSuccess, handleError, geoOptions);
      watchIdRef.current = id;
    } catch (err) {
      setStatus('error');
      setError('Failed to initialize geolocation tracking.');
    }
  }, [enableHighAccuracy, maximumAge, timeout, maxRealisticSpeedMps, maxAccuracyThresholdMeters, resetStaleTimer]);

  const retryPermission = useCallback(() => {
    stopTracking();
    startTracking();
  }, [stopTracking, startTracking]);

  // Lifecycle initialization & cleanup
  useEffect(() => {
    isMountedRef.current = true;
    if (autoStart) {
      startTracking();
    }

    return () => {
      isMountedRef.current = false;
      if (watchIdRef.current !== null && typeof window !== 'undefined' && 'navigator' in window && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (staleTimerRef.current) {
        clearTimeout(staleTimerRef.current);
        staleTimerRef.current = null;
      }
    };
  }, [autoStart, startTracking]);

  const accuracyClassification = location ? classifyAccuracy(location.accuracy) : null;

  return {
    location,
    status,
    error,
    accuracyClassification,
    isStale,
    startTracking,
    stopTracking,
    retryPermission,
  };
}
