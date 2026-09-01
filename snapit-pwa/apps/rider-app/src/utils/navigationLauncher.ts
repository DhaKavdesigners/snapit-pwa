/**
 * Navigation Launcher Utility
 * Generates deep links to launch native turn-by-turn navigation in Google Maps / Apple Maps.
 * Cost: 100% Free (zero Google Maps API billing, zero API keys).
 */

import { isValidCoordinate, MAP_CONFIG } from '@/config/mapConfig';

export interface NavigationTarget {
  lat: number;
  lng: number;
  label?: string;
  address?: string;
}

/**
 * Returns a universal Google Maps navigation URL with direct driving mode.
 * Sensitive data (e.g. PIN / OTP) is strictly omitted.
 */
export function getGoogleMapsNavigationUrl(target: NavigationTarget): string {
  const safeLat = isValidCoordinate(target.lat, target.lng) ? target.lat : MAP_CONFIG.defaultCenter.lat;
  const safeLng = isValidCoordinate(target.lat, target.lng) ? target.lng : MAP_CONFIG.defaultCenter.lng;
  
  // Clean label to avoid passing sensitive info
  const cleanLabel = target.label ? encodeURIComponent(target.label.replace(/pin|otp|\d{4}/gi, '').trim()) : '';
  const destination = cleanLabel ? `${safeLat},${safeLng} (${cleanLabel})` : `${safeLat},${safeLng}`;

  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
}

/**
 * Returns an Android-specific navigation intent URL to launch the native Google Maps app in turn-by-turn mode.
 */
export function getAndroidNavigationIntent(target: NavigationTarget): string {
  const safeLat = isValidCoordinate(target.lat, target.lng) ? target.lat : MAP_CONFIG.defaultCenter.lat;
  const safeLng = isValidCoordinate(target.lat, target.lng) ? target.lng : MAP_CONFIG.defaultCenter.lng;
  return `google.navigation:q=${safeLat},${safeLng}&mode=d`;
}

/**
 * Returns an Apple Maps navigation URL for iOS devices.
 */
export function getAppleMapsNavigationUrl(target: NavigationTarget): string {
  const safeLat = isValidCoordinate(target.lat, target.lng) ? target.lat : MAP_CONFIG.defaultCenter.lat;
  const safeLng = isValidCoordinate(target.lat, target.lng) ? target.lng : MAP_CONFIG.defaultCenter.lng;
  const cleanLabel = target.label ? encodeURIComponent(target.label.replace(/pin|otp|\d{4}/gi, '').trim()) : '';
  return `maps://?daddr=${safeLat},${safeLng}&q=${cleanLabel}&dirflg=d`;
}

/**
 * Launches turn-by-turn navigation in the best available map application on the device.
 */
export function openTurnByTurnNavigation(target: NavigationTarget): void {
  if (typeof window === 'undefined') return;

  const fallbackUrl = getGoogleMapsNavigationUrl(target);
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isAndroid) {
    try {
      window.location.href = getAndroidNavigationIntent(target);
    } catch {
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    }
  } else if (isIOS) {
    window.location.href = fallbackUrl;
  } else {
    window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
  }
}
