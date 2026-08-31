import { updateRiderGpsLocation } from './riderService';
import { calculateHaversineDistanceMeters } from '@/hooks/useRiderLocation';

interface LocationTrackerConfig {
  minDistanceMeters?: number; // Minimum movement before sending DB update
  minIntervalMs?: number; // Minimum interval between DB updates
}

let lastSentLat = 0;
let lastSentLng = 0;
let lastSentTimestamp = 0;

/** Throttle and sync rider's GPS location to Supabase rider_profiles */
export async function syncRiderLocationToDb(
  riderPhone: string,
  lat: number,
  lng: number,
  config: LocationTrackerConfig = {}
): Promise<boolean> {
  const { minDistanceMeters = 15, minIntervalMs = 10000 } = config;
  const now = Date.now();

  const distanceMoved = calculateHaversineDistanceMeters(lastSentLat, lastSentLng, lat, lng);
  const timeElapsed = now - lastSentTimestamp;

  // Only update if significant distance moved or minimum interval passed
  if (lastSentTimestamp === 0 || (distanceMoved >= minDistanceMeters && timeElapsed >= minIntervalMs)) {
    lastSentLat = lat;
    lastSentLng = lng;
    lastSentTimestamp = now;

    return updateRiderGpsLocation(riderPhone, lat, lng);
  }

  return false;
}
