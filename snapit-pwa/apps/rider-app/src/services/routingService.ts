/**
 * OSRM Road Routing Service
 * Fetches real turn-by-turn road geometry along actual streets for driving navigation.
 * Cost: 100% Free ($0 / zero API keys).
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteGeometryResult {
  coordinates: [number, number][]; // Array of [lat, lng]
  distanceKm: number;
  durationMinutes: number;
  success: boolean;
}

/**
 * Fetches real street driving route between origin and destination using OSRM.
 */
export async function fetchRoadRoute(
  origin: LatLng,
  destination: LatLng
): Promise<RouteGeometryResult> {
  try {
    // OSRM expects coordinates in lng,lat format
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return getFallbackStraightRoute(origin, destination);
    }

    const data = await res.json();
    if (!data.routes || data.routes.length === 0) {
      return getFallbackStraightRoute(origin, destination);
    }

    const route = data.routes[0];
    // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
    const leafletCoords: [number, number][] = route.geometry.coordinates.map(
      (coord: [number, number]) => [coord[1], coord[0]]
    );

    const distanceKm = +(route.distance / 1000).toFixed(1);
    const durationMinutes = Math.max(1, Math.round(route.duration / 60));

    return {
      coordinates: leafletCoords,
      distanceKm,
      durationMinutes,
      success: true,
    };
  } catch (err) {
    return getFallbackStraightRoute(origin, destination);
  }
}

/**
 * Fallback straight route if network is offline or OSRM times out
 */
function getFallbackStraightRoute(origin: LatLng, destination: LatLng): RouteGeometryResult {
  const dist = Math.hypot(destination.lat - origin.lat, destination.lng - origin.lng) * 111;
  return {
    coordinates: [
      [origin.lat, origin.lng],
      [destination.lat, destination.lng],
    ],
    distanceKm: +dist.toFixed(1) || 1.5,
    durationMinutes: Math.max(1, Math.round((dist || 1.5) * 3)),
    success: false,
  };
}
