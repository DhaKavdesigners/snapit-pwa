import { DeliveryZone, ZoneStatus } from '@/types';
import { getTestMode } from './mockService';
import { supabase } from '@/lib/supabase';

// Haversine distance in meters between two coordinates
export function haversineDistance(
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

export function getZoneDistance(
  lat: number,
  lng: number,
  zone: DeliveryZone
): number | null {
  if (zone.centerLat === undefined || zone.centerLng === undefined) return null;
  return haversineDistance(lat, lng, zone.centerLat, zone.centerLng);
}

/** Check if given GPS coords are inside a zone (supports polygon geofences & circular radius) */
export function isInsideZone(
  lat: number,
  lng: number,
  zone: DeliveryZone
): boolean {
  // 1. If polygon coordinates are provided (3+ vertices), do point-in-polygon ray casting
  if (zone.polygon && Array.isArray(zone.polygon) && zone.polygon.length >= 3) {
    let inside = false;
    const poly = zone.polygon;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].lat;
      const yi = poly[i].lng;
      const xj = poly[j].lat;
      const yj = poly[j].lng;
      const intersect =
        yi > lng !== yj > lng &&
        lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    if (inside) return true;
  }

  // 2. Circular geofence check
  const centerLat = zone.centerLat;
  const centerLng = zone.centerLng;
  const radius = zone.radiusMeters || (zone.outerRadiusKm ? zone.outerRadiusKm * 1000 : 5000);

  if (centerLat === undefined || centerLng === undefined) {
    // No coordinate data — allow access gracefully
    return true;
  }

  const dist = haversineDistance(lat, lng, centerLat, centerLng);
  return dist <= radius;
}

/** Convert a raw Supabase public.zones row into a typed DeliveryZone object */
export function mapDbZoneToDeliveryZone(z: any): DeliveryZone {
  const outerKm = Number(z.outer_radius_km) || 5;
  const innerKm = Number(z.inner_radius_km) || 1.5;
  const dailyMin = Number(z.daily_min) || 800;
  const dailyMax = Number(z.daily_max) || 1200;
  const rawDemand = z.demand_level || 'NORMAL';
  const demand: 'HIGH' | 'MEDIUM' | 'NORMAL' =
    rawDemand === 'SURGE' || rawDemand === 'HIGH' ? 'HIGH' : rawDemand === 'MEDIUM' ? 'MEDIUM' : 'NORMAL';

  return {
    id: String(z.id),
    name: String(z.name),
    city: z.city || '',
    radius: `${outerKm}km radius`,
    demand,
    estDailyEarnings: `₹${dailyMin.toLocaleString('en-IN')} - ₹${dailyMax.toLocaleString('en-IN')}/day`,
    activeRiders: 10,
    centerLat: z.center_lat !== undefined && z.center_lat !== null ? Number(z.center_lat) : undefined,
    centerLng: z.center_lng !== undefined && z.center_lng !== null ? Number(z.center_lng) : undefined,
    radiusMeters: outerKm * 1000,
    innerRadiusKm: innerKm,
    outerRadiusKm: outerKm,
    polygon: Array.isArray(z.polygon) ? z.polygon : undefined,
    dailyMin,
    dailyMax,
    sessionRate2h: z.session_rate_2h ? Number(z.session_rate_2h) : undefined,
    sessionRate3h: z.session_rate_3h ? Number(z.session_rate_3h) : undefined,
    sessionRate4h: z.session_rate_4h ? Number(z.session_rate_4h) : undefined,
    demandLevel: rawDemand,
    isActive: z.is_active !== false,
    sortOrder: z.sort_order !== undefined && z.sort_order !== null ? Number(z.sort_order) : 1,
    capacity: 20,
    booked: 0,
  };
}

const ZONES_CACHE_KEY = 'minnit_cached_zones_v2';

export function getCachedZones(): DeliveryZone[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ZONES_CACHE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function setCachedZones(zones: DeliveryZone[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ZONES_CACHE_KEY, JSON.stringify(zones));
  } catch {}
}

/** Direct fetch of all active zones from Supabase public.zones */
export async function fetchLiveZonesFromSupabase(): Promise<DeliveryZone[]> {
  try {
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('[ZoneService] Error fetching zones from Supabase:', error);
      return [];
    }

    if (data && data.length > 0) {
      // Respect is_active if column exists
      const activeData = data.filter((z: any) => z.is_active !== false);
      const mapped = activeData.map(mapDbZoneToDeliveryZone);
      setCachedZones(mapped);
      return mapped;
    }
    return [];
  } catch (err) {
    console.warn('[ZoneService] Failed to fetch live zones from Supabase:', err);
    return [];
  }
}

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
      const dist = getZoneDistance(mockLocationConfig.coords.lat, mockLocationConfig.coords.lng, activeWatchZone);
      activeWatchCallback({
        status: inside ? 'inside' : 'outside',
        distanceMeters: dist,
        accuracy: 5,
      });
    } else {
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
      const dist = getZoneDistance(mockLocationConfig.coords.lat, mockLocationConfig.coords.lng, zone);
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
        const inside = isInsideZone(latitude, longitude, zone);
        const dist = getZoneDistance(latitude, longitude, zone);
        
        if (accuracy > 100) {
          resolve({
            status: inside ? 'inside' : 'low_accuracy',
            distanceMeters: dist,
            accuracy,
          });
          return;
        }

        resolve({
          status: inside ? 'inside' : 'outside',
          distanceMeters: dist,
          accuracy,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          resolve({ status: 'permission_denied', distanceMeters: null, accuracy: null });
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
    const dist = getZoneDistance(mockLocationConfig.coords.lat, mockLocationConfig.coords.lng, zone);
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
      const dist = getZoneDistance(latitude, longitude, zone);
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
  if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}
