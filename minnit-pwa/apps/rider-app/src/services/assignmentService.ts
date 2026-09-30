import { LocationPoint, PreferenceWindowId } from '@/types';
import { getActivePreferenceWindow } from './preferenceService';

/**
 * Configurable parameters for Minnit dispatch & priority assignment
 */
export interface AssignmentFairnessConfig {
  /** Maximum distance difference in meters where a preferred rider can override a closer rider */
  preferencePriorityDistanceThresholdMeters: number;
}

export const DEFAULT_ASSIGNMENT_CONFIG: AssignmentFairnessConfig = {
  preferencePriorityDistanceThresholdMeters: 500,
};

/** Candidate rider evaluated for order dispatch */
export interface CandidateRider {
  id: string;
  name: string;
  phone: string;
  isOnline: boolean;
  isVerified: boolean;
  selectedZoneId?: string;
  availableForOrder: boolean;
  currentLocation?: LocationPoint;
  ridingPreferences?: PreferenceWindowId[];
}

/** Calculate straight-line distance in meters between two coordinates */
export function calculateDistanceMeters(p1: LocationPoint, p2: LocationPoint): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (p1.lat * Math.PI) / 180;
  const φ2 = (p2.lat * Math.PI) / 180;
  const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
  const Δλ = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if a candidate rider is eligible for an incoming order:
 * 1. Rider is verified & active
 * 2. Rider is online
 * 3. Rider is in/associated with the target zone
 * 4. Rider is available for an order (not busy with another order, not on break)
 */
export function isRiderEligibleForOrder(
  rider: CandidateRider,
  targetZoneId: string
): boolean {
  if (!rider.isVerified) return false;
  if (!rider.isOnline) return false;
  if (!rider.availableForOrder) return false;
  if (rider.selectedZoneId && targetZoneId && rider.selectedZoneId !== targetZoneId) {
    return false;
  }
  return true;
}

/**
 * Check if rider has preference active for current time window
 */
export function isRiderPreferenceActive(
  riderPreferences?: PreferenceWindowId[],
  currentTime: Date = new Date()
): boolean {
  if (!riderPreferences || riderPreferences.length === 0) return false;
  const activeWindow = getActivePreferenceWindow(currentTime);
  if (!activeWindow) return false;
  return riderPreferences.includes(activeWindow);
}

/**
 * Compare two eligible riders for order assignment priority:
 * - If preferred rider and nearest non-preferred rider are within 500 meters of each other,
 *   the preferred rider receives priority.
 * - If the distance difference is MORE than 500 meters, proximity overrides preference.
 * 
 * Returns negative if riderA has priority, positive if riderB has priority, 0 if equal.
 */
export function compareRiderPriority(
  riderA: CandidateRider,
  riderB: CandidateRider,
  pickupLocation: LocationPoint,
  config: AssignmentFairnessConfig = DEFAULT_ASSIGNMENT_CONFIG,
  currentTime: Date = new Date()
): number {
  const locA = riderA.currentLocation || { lat: 12.9602, lng: 78.2711 };
  const locB = riderB.currentLocation || { lat: 12.9602, lng: 78.2711 };

  const distA = calculateDistanceMeters(locA, pickupLocation);
  const distB = calculateDistanceMeters(locB, pickupLocation);

  const prefA = isRiderPreferenceActive(riderA.ridingPreferences, currentTime);
  const prefB = isRiderPreferenceActive(riderB.ridingPreferences, currentTime);

  // Both preferred or neither preferred: strict distance proximity
  if (prefA === prefB) {
    return distA - distB;
  }

  // One preferred, one non-preferred:
  const preferredDist = prefA ? distA : distB;
  const nonPreferredDist = prefA ? distB : distA;
  const threshold = config.preferencePriorityDistanceThresholdMeters;

  // If preferred rider is already closer or equal, preferred rider wins
  if (preferredDist <= nonPreferredDist) {
    return prefA ? -1 : 1;
  }

  // If preferred rider is further, check if within the fairness threshold (500m)
  const distanceGap = preferredDist - nonPreferredDist;
  if (distanceGap <= threshold) {
    // Within 500m fairness window: preferred rider gets priority boost!
    return prefA ? -1 : 1;
  }

  // Beyond 500m: store proximity wins, nearest rider gets the order
  return distA - distB;
}
