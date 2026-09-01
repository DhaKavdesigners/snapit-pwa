/**
 * Map Configuration & Utilities for Snapit Rider PWA
 * 
 * Centralized, replaceable map configuration.
 * Change the tile URL via NEXT_PUBLIC_MAP_TILE_URL without modifying any React components.
 * 
 * Cost: 100% Free / Zero API keys / OpenStreetMap compatible.
 */

export interface MapCoordinates {
  lat: number;
  lng: number;
}

export const MAP_CONFIG = {
  // Tile server URL (configurable via environment variable)
  tileUrl:
    process.env.NEXT_PUBLIC_MAP_TILE_URL ||
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',

  // Tile attribution (configurable via environment variable)
  attribution:
    process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ||
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',

  // Map display limits
  maxZoom: 19,
  minZoom: 10,
  defaultZoom: 15,
  focusedZoom: 16,

  // Default fallback center (Robertsonpet, KGF)
  defaultCenter: {
    lat: 12.9602,
    lng: 78.2711,
  } as MapCoordinates,

  // Route Polyline styling
  routeStyle: {
    color: '#059669', // Emerald green
    weight: 4,
    opacity: 0.85,
    dashArray: '6, 8',
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
  },
};

/**
 * Validates whether latitude and longitude are valid numeric coordinates.
 */
export function isValidCoordinate(lat?: number | null, lng?: number | null): boolean {
  if (lat === undefined || lat === null || lng === undefined || lng === null) return false;
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat === 0 && lng === 0) return false; // Null island
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Safely extracts valid coordinates or returns the default fallback.
 */
export function getSafeCoordinates(
  coord?: { lat?: number | null; lng?: number | null } | null,
  fallback: MapCoordinates = MAP_CONFIG.defaultCenter
): MapCoordinates {
  if (coord && isValidCoordinate(coord.lat, coord.lng)) {
    return { lat: Number(coord.lat), lng: Number(coord.lng) };
  }
  return fallback;
}
