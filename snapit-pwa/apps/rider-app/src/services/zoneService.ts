import { DeliveryZone, ZoneStatus } from '@/types';
import { getTestMode } from './mockService';

// Haversine distance in meters between two coordinates
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Mock zone geofence boundaries for the 3 existing zones
const ZONE_GEOFENCES: Record<string, { lat: number; lng: number; radiusMeters: number }> = {
  'zone-1': { lat: 12.9716, lng: 77.6412, radiusMeters: 5000 },  // Downtown Central / Indiranagar
  'zone-2': { lat: 12.9698, lng: 77.7499, radiusMeters: 8000 },  // North Tech Park / Whitefield
  'zone-3': { lat: 12.9289, lng: 77.5838, radiusMeters: 12000 }, // South Suburbs / Jayanagar
};

export interface MockLocationConfig {
  enabled: boolean;
  coords: { lat: number; lng: number } | null;
  zoneId?: string;
}

let mockLocationConfig: MockLocationConfig = {
  enabled: false,
  coords: null,
};

let activeWatchZone: DeliveryZone | null = null;
let activeWatchCallback: ((result: ZoneCheckResult) => void) | null = null;

export function setMockLocationConfig(config: MockLocationConfig): void {
  mockLocationConfig = config;

  if (activeWatchZone && activeWatchCallback) {
    if (mockLocationConfig.enabled && mockLocationConfig.coords) {
      const inside = isInsideZone(mockLocationConfig.coords.lat, mockLocationConfig.coords.lng, activeWatchZone);
      const fence = ZONE_GEOFENCES[activeWatchZone.id];
      const dist = fence
        ? haversineDistance(mockLocationConfig.coords.lat, mockLocationConfig.coords.lng, fence.lat, fence.lng)
        : null;
      activeWatchCallback({
        status: inside ? 'inside' : 'outside',
        distanceMeters: dist,
        accuracy: 5,
      });
    } else {
      // Re-initialize watching real device GPS
      const zoneToWatch = activeWatchZone;
      const callbackToUse = activeWatchCallback;
      stopWatchingZone();
      startWatchingZone(zoneToWatch, callbackToUse);
    }
  }
}

export function getMockLocationConfig(): MockLocationConfig {
  return mockLocationConfig;
}

/** Check if given GPS coords are inside a zone */
export function isInsideZone(
  lat: number,
  lng: number,
  zone: DeliveryZone
): boolean {
  // Use stored geofence or zone's own data
  const fence = ZONE_GEOFENCES[zone.id];
  const centerLat = zone.centerLat ?? fence?.lat;
  const centerLng = zone.centerLng ?? fence?.lng;
  const radius = zone.radiusMeters ?? fence?.radiusMeters;

  if (centerLat === undefined || centerLng === undefined || radius === undefined) {
    // No geofence data — assume inside for graceful degradation
    return true;
  }

  const dist = haversineDistance(lat, lng, centerLat, centerLng);
  return dist <= radius;
}

export interface ZoneCheckResult {
  status: ZoneStatus;
  distanceMeters: number | null;
  accuracy: number | null;
}

/** One-shot zone check using browser geolocation */
export function checkZoneStatus(
  zone: DeliveryZone
): Promise<ZoneCheckResult> {
  return new Promise((resolve) => {
    if (
      getTestMode() === 'tester' &&
      mockLocationConfig.enabled &&
      mockLocationConfig.coords
    ) {
      const inside = isInsideZone(mockLocationConfig.coords.lat, mockLocationConfig.coords.lng, zone);
      const fence = ZONE_GEOFENCES[zone.id];
      const dist = fence
        ? haversineDistance(mockLocationConfig.coords.lat, mockLocationConfig.coords.lng, fence.lat, fence.lng)
        : null;
      resolve({
        status: inside ? 'inside' : 'outside',
        distanceMeters: dist,
        accuracy: 5,
      });
      return;
    }

    if (!navigator.geolocation) {
      resolve({ status: 'gps_disabled', distanceMeters: null, accuracy: null });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (accuracy > 100) {
          // Low accuracy — still proceed but flag it
          const inside = isInsideZone(latitude, longitude, zone);
          const fence = ZONE_GEOFENCES[zone.id];
          const dist = fence
            ? haversineDistance(latitude, longitude, fence.lat, fence.lng)
            : null;
          resolve({
            status: inside ? 'inside' : 'low_accuracy',
            distanceMeters: dist,
            accuracy,
          });
          return;
        }
        const inside = isInsideZone(latitude, longitude, zone);
        const fence = ZONE_GEOFENCES[zone.id];
        const dist = fence
          ? haversineDistance(latitude, longitude, fence.lat, fence.lng)
          : null;
        resolve({
          status: inside ? 'inside' : 'outside',
          distanceMeters: dist,
          accuracy,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          resolve({ status: 'permission_denied', distanceMeters: null, accuracy: null });
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          resolve({ status: 'gps_error', distanceMeters: null, accuracy: null });
        } else {
          resolve({ status: 'gps_error', distanceMeters: null, accuracy: null });
        }
      },
      { timeout: 10000, maximumAge: 30000, enableHighAccuracy: true }
    );
  });
}

let watchId: number | null = null;

/** Continuously watch zone status (watches GPS position) */
export function startWatchingZone(
  zone: DeliveryZone,
  onUpdate: (result: ZoneCheckResult) => void
): void {
  stopWatchingZone();
  activeWatchZone = zone;
  activeWatchCallback = onUpdate;

  if (
    getTestMode() === 'tester' &&
    mockLocationConfig.enabled &&
    mockLocationConfig.coords
  ) {
    const inside = isInsideZone(mockLocationConfig.coords.lat, mockLocationConfig.coords.lng, zone);
    const fence = ZONE_GEOFENCES[zone.id];
    const dist = fence
      ? haversineDistance(mockLocationConfig.coords.lat, mockLocationConfig.coords.lng, fence.lat, fence.lng)
      : null;
    onUpdate({
      status: inside ? 'inside' : 'outside',
      distanceMeters: dist,
      accuracy: 5,
    });
    return;
  }

  if (!navigator.geolocation) {
    onUpdate({ status: 'gps_disabled', distanceMeters: null, accuracy: null });
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      const inside = isInsideZone(latitude, longitude, zone);
      const fence = ZONE_GEOFENCES[zone.id];
      const dist = fence
        ? haversineDistance(latitude, longitude, fence.lat, fence.lng)
        : null;
      onUpdate({
        status: inside ? 'inside' : accuracy > 100 ? 'low_accuracy' : 'outside',
        distanceMeters: dist,
        accuracy,
      });
    },
    (err) => {
      if (err.code === err.PERMISSION_DENIED) {
        onUpdate({ status: 'permission_denied', distanceMeters: null, accuracy: null });
      } else {
        onUpdate({ status: 'gps_error', distanceMeters: null, accuracy: null });
      }
    },
    { enableHighAccuracy: true, maximumAge: 10000 }
  );
}

export function stopWatchingZone(): void {
  if (watchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

