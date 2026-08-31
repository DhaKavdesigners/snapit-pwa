/**
 * Navigation Launcher Utility
 * Generates deep links to launch native turn-by-turn navigation in Google Maps / Apple Maps.
 * Cost: 100% Free (zero Google Maps API billing).
 */

export interface NavigationTarget {
  lat: number;
  lng: number;
  label?: string;
  address?: string;
}

/**
 * Returns a universal Google Maps navigation URL with direct driving mode.
 */
export function getGoogleMapsNavigationUrl(target: NavigationTarget): string {
  const query = target.label
    ? encodeURIComponent(`${target.lat},${target.lng} (${target.label})`)
    : `${target.lat},${target.lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving`;
}

/**
 * Returns an Android-specific navigation intent URL to launch the native Google Maps app immediately in turn-by-turn mode.
 */
export function getAndroidNavigationIntent(target: NavigationTarget): string {
  return `google.navigation:q=${target.lat},${target.lng}&mode=d`;
}

/**
 * Returns an Apple Maps navigation URL for iOS devices.
 */
export function getAppleMapsNavigationUrl(target: NavigationTarget): string {
  const label = target.label ? encodeURIComponent(target.label) : '';
  return `maps://?daddr=${target.lat},${target.lng}&q=${label}&dirflg=d`;
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
    // Attempt android native intent or open direct URL
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
