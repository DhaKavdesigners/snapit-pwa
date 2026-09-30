/**
 * Google Maps Navigation Launcher Utility
 * Generates direct Google Maps Directions URLs for turn-by-turn navigation.
 * Cost: 100% Free (zero Google Maps API billing, zero API keys, no embedded SDKs).
 */

/**
 * Validates whether latitude and longitude are valid numeric coordinates.
 */
export function hasValidCoordinates(
  lat?: number | null,
  lng?: number | null
): boolean {
  if (lat === undefined || lat === null || lng === undefined || lng === null) {
    return false;
  }
  const nLat = Number(lat);
  const nLng = Number(lng);
  if (isNaN(nLat) || isNaN(nLng)) {
    return false;
  }
  if (nLat === 0 && nLng === 0) {
    return false; // Reject Null Island
  }
  return nLat >= -90 && nLat <= 90 && nLng >= -180 && nLng <= 180;
}

// Backward-compatible alias
export const isValidCoordinate = hasValidCoordinates;

/**
 * Builds the canonical Google Maps directions URL for driving navigation.
 * Format: https://www.google.com/maps/dir/?api=1&destination=LATITUDE,LONGITUDE&travelmode=driving
 */
export function getGoogleMapsNavigationUrl(
  latitude: number,
  longitude: number
): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
}

/**
 * Opens Google Maps turn-by-turn driving navigation on the rider's phone.
 * Launches the native Google Maps app when available on Android / iOS / PWA,
 * with standard browser fallback.
 */
export const openGoogleMapsNavigation = (
  latitude?: number | null,
  longitude?: number | null,
  fallbackAddress?: string | null
): void => {
  let url = '';

  if (hasValidCoordinates(latitude, longitude)) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    url = getGoogleMapsNavigationUrl(lat, lng);
  } else if (fallbackAddress && fallbackAddress.trim() && fallbackAddress.trim() !== 'Customer Address' && fallbackAddress.trim() !== 'Store Location') {
    url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fallbackAddress.trim())}&travelmode=driving`;
  } else {
    console.warn('Missing or invalid destination coordinates and address for Google Maps navigation', {
      latitude,
      longitude,
      fallbackAddress,
    });
    return;
  }

  if (typeof window === 'undefined') return;

  // On mobile browsers and PWAs, window.open with _blank allows the OS
  // to hand off the Universal / App Link to the native Google Maps application.
  try {
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    // If popup was blocked or in standalone PWA mode where window.open is restricted:
    if (!opened || opened.closed || typeof opened.closed === 'undefined') {
      window.location.href = url;
    }
  } catch (err) {
    console.warn('Fallback navigation redirect', err);
    window.location.href = url;
  }
};

export interface NavigationTarget {
  lat: number;
  lng: number;
  label?: string;
  address?: string;
}

/**
 * Backward-compatible helper for existing callers
 */
export function openTurnByTurnNavigation(target: NavigationTarget): void {
  openGoogleMapsNavigation(target.lat, target.lng);
}
