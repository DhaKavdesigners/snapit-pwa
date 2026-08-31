'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { RefreshCw, Navigation, Crosshair, MapPin, AlertCircle, RotateCcw } from 'lucide-react';
import { RiderLocation, GPSStatusType, AccuracyClassification } from '@/hooks/useRiderLocation';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface SnapitMapProps {
  riderLocation?: RiderLocation | null;
  shopLocation?: LocationPoint | null;
  customerLocation?: LocationPoint | null;
  routePoints?: [number, number][]; // Array of [lng, lat]
  gpsStatus?: GPSStatusType | string;
  accuracyClassification?: AccuracyClassification | null;
  isStale?: boolean;
  errorMessage?: string | null;
  className?: string;
  height?: string;
  onRecenter?: () => void;
  onNavigateGoogleMaps?: () => void;
  onRetryPermission?: () => void;
}

// Initial fallback location (Bengaluru / KGF test area)
const DEFAULT_CENTER: [number, number] = [77.5946, 12.9716]; // [lng, lat]
const DEFAULT_ZOOM = 14;

// Helper to generate a GeoJSON Polygon representing a circle of radiusInMeters
function createGeoJSONCircle(center: [number, number], radiusInMeters: number, points = 64) {
  const [lng, lat] = center;
  const coords: [number, number][] = [];
  // 1 degree of latitude is ~110540 meters; 1 degree of longitude is ~111320 * cos(lat) meters
  const distanceX = radiusInMeters / (111320 * Math.cos((lat * Math.PI) / 180));
  const distanceY = radiusInMeters / 110540;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([lng + x, lat + y]);
  }
  coords.push(coords[0]); // Close ring

  return {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'Polygon' as const,
      coordinates: [coords],
    },
  };
}

export const SnapitMap: React.FC<SnapitMapProps> = ({
  riderLocation = null,
  shopLocation = null,
  customerLocation = null,
  routePoints = [],
  gpsStatus = 'idle',
  accuracyClassification = null,
  isStale = false,
  errorMessage = null,
  className = '',
  height = 'h-64',
  onRecenter,
  onNavigateGoogleMaps,
  onRetryPermission,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  // Marker DOM & instance references
  const riderMarkerRef = useRef<maplibregl.Marker | null>(null);
  const riderMarkerElementRef = useRef<HTMLDivElement | null>(null);
  const shopMarkerRef = useRef<maplibregl.Marker | null>(null);
  const customerMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasInitialCenteredRef = useRef<boolean>(false);

  // Environment variable resolution
  const maptilerKey =
    process.env.VITE_MAPTILER_KEY ||
    process.env.NEXT_PUBLIC_MAPTILER_KEY ||
    '';

  const isRealKey = maptilerKey && maptilerKey !== 'YOUR_MAPTILER_KEY';
  const styleUrl = isRealKey
    ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptilerKey}`
    : 'https://demotiles.maplibre.org/style.json';

  // Determine current map center target
  const currentCenter: [number, number] = riderLocation
    ? [riderLocation.longitude, riderLocation.latitude]
    : DEFAULT_CENTER;

  // Initialize MapLibre GL instance safely
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing instance if any to prevent duplicate canvas / memory leaks
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleUrl,
      center: currentCenter,
      zoom: riderLocation ? 16 : DEFAULT_ZOOM,
      attributionControl: false,
    });

    // Add compact navigation control
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      setMapLoaded(true);

      // ── Layer 1: Accuracy Circle Source & Layer ──
      map.addSource('snapit-accuracy-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addLayer({
        id: 'snapit-accuracy-layer',
        type: 'fill',
        source: 'snapit-accuracy-source',
        paint: {
          'fill-color': '#22c55e',
          'fill-opacity': 0.18,
        },
      });

      map.addLayer({
        id: 'snapit-accuracy-outline',
        type: 'line',
        source: 'snapit-accuracy-source',
        paint: {
          'line-color': '#16a34a',
          'line-width': 1.5,
          'line-opacity': 0.6,
        },
      });

      // ── Layer 2: Future Route Polyline Layer ──
      map.addSource('snapit-route-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routePoints.length > 0 ? routePoints : [],
          },
        },
      });

      map.addLayer({
        id: 'snapit-route-layer',
        type: 'line',
        source: 'snapit-route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#006e2f',
          'line-width': 5,
          'line-opacity': 0.8,
        },
      });
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Rider Marker, Heading & Dynamic Accuracy Circle on live GPS updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (riderLocation) {
      const coords: [number, number] = [riderLocation.longitude, riderLocation.latitude];

      // Auto-center on the FIRST valid GPS fix only (allows free panning afterwards)
      if (!hasInitialCenteredRef.current) {
        hasInitialCenteredRef.current = true;
        map.flyTo({
          center: coords,
          zoom: 16,
          essential: true,
        });
      }

      // 1. Update or create Rider Marker
      if (!riderMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'snapit-rider-marker';
        el.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
        el.innerHTML = `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;width:38px;height:38px;">
            <div style="position:absolute;inset:0;border-radius:50%;background:rgba(34,197,94,0.35);animation:ping 2.2s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="position:relative;z-index:10;width:32px;height:32px;border-radius:50%;background:#006e2f;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.3);">
              <span style="font-size:15px;line-height:1;">🚴</span>
            </div>
            ${
              riderLocation.heading !== null && !isNaN(riderLocation.heading)
                ? `<div style="position:absolute;top:-4px;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:7px solid #006e2f;transform:rotate(${riderLocation.heading}deg);transform-origin:50% 23px;"></div>`
                : ''
            }
          </div>
        `;

        riderMarkerElementRef.current = el;
        riderMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat(coords)
          .addTo(map);
      } else {
        // Smoothly update existing marker coordinate
        riderMarkerRef.current.setLngLat(coords);

        // Update heading pointer if available
        if (riderMarkerElementRef.current && riderLocation.heading !== null && !isNaN(riderLocation.heading)) {
          const pointer = riderMarkerElementRef.current.querySelector('.snapit-heading-pointer') as HTMLElement;
          if (pointer) {
            pointer.style.transform = `rotate(${riderLocation.heading}deg)`;
          }
        }
      }

      // 2. Update dynamic accuracy circle in MapLibre GeoJSON layer
      if (mapLoaded) {
        const accuracySource = map.getSource('snapit-accuracy-source') as maplibregl.GeoJSONSource;
        if (accuracySource && riderLocation.accuracy > 0) {
          const circleFeature = createGeoJSONCircle(coords, riderLocation.accuracy);
          accuracySource.setData({
            type: 'FeatureCollection',
            features: [circleFeature],
          });
        }
      }
    } else {
      // Clean up marker and accuracy circle if riderLocation is null
      if (riderMarkerRef.current) {
        riderMarkerRef.current.remove();
        riderMarkerRef.current = null;
      }
      if (mapLoaded) {
        const accuracySource = map.getSource('snapit-accuracy-source') as maplibregl.GeoJSONSource;
        if (accuracySource) {
          accuracySource.setData({
            type: 'FeatureCollection',
            features: [],
          });
        }
      }
    }
  }, [riderLocation, mapLoaded]);

  // Update Shop Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (shopLocation) {
      const coords: [number, number] = [shopLocation.longitude, shopLocation.latitude];
      if (!shopMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'snapit-shop-marker';
        el.innerHTML = `
          <div style="width:32px;height:32px;border-radius:50%;background:#0284c7;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 8px rgba(0,0,0,0.25);">
            <span style="font-size:15px;line-height:1;">🏪</span>
          </div>
        `;
        shopMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat(coords)
          .addTo(map);
      } else {
        shopMarkerRef.current.setLngLat(coords);
      }
    } else if (shopMarkerRef.current) {
      shopMarkerRef.current.remove();
      shopMarkerRef.current = null;
    }
  }, [shopLocation]);

  // Update Customer Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (customerLocation) {
      const coords: [number, number] = [customerLocation.longitude, customerLocation.latitude];
      if (!customerMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'snapit-customer-marker';
        el.innerHTML = `
          <div style="width:32px;height:32px;border-radius:50%;background:#e11d48;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 8px rgba(0,0,0,0.25);">
            <span style="font-size:15px;line-height:1;">🏠</span>
          </div>
        `;
        customerMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat(coords)
          .addTo(map);
      } else {
        customerMarkerRef.current.setLngLat(coords);
      }
    } else if (customerMarkerRef.current) {
      customerMarkerRef.current.remove();
      customerMarkerRef.current = null;
    }
  }, [customerLocation]);

  // Recenter Map Handler
  const handleRecenterClick = () => {
    if (onRecenter) {
      onRecenter();
    }
    if (mapInstanceRef.current) {
      const target = riderLocation
        ? [riderLocation.longitude, riderLocation.latitude]
        : currentCenter;

      mapInstanceRef.current.flyTo({
        center: target as [number, number],
        zoom: riderLocation ? 16 : DEFAULT_ZOOM,
        essential: true,
      });
    }
  };

  // Manual Refresh Handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.resize();
    }
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Google Maps external navigation handler
  const handleGoogleMapsClick = () => {
    if (onNavigateGoogleMaps) {
      onNavigateGoogleMaps();
      return;
    }

    const target = shopLocation || customerLocation;
    let url = 'https://www.google.com/maps';
    if (target) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${target.latitude},${target.longitude}&travelmode=driving`;
    } else if (riderLocation) {
      url = `https://www.google.com/maps/search/?api=1&query=${riderLocation.latitude},${riderLocation.longitude}`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${DEFAULT_CENTER[1]},${DEFAULT_CENTER[0]}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Dynamic GPS Status Label & Badge formatting
  const renderGpsStatusInfo = () => {
    const rawStatus = (gpsStatus || 'idle').toLowerCase();

    if (rawStatus === 'denied') {
      return {
        label: 'GPS: Permission Required',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        dotClass: 'bg-rose-500',
        accuracyText: 'Permission Denied',
      };
    }
    if (rawStatus === 'unavailable') {
      return {
        label: 'GPS: Unavailable',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
        dotClass: 'bg-slate-400',
        accuracyText: 'Device Location Off',
      };
    }
    if (rawStatus === 'requesting' || rawStatus === 'connecting') {
      return {
        label: 'GPS: Connecting...',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse',
        dotClass: 'bg-amber-500 animate-ping',
        accuracyText: 'Acquiring Fix...',
      };
    }
    if (isStale) {
      return {
        label: 'GPS: Updating...',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        dotClass: 'bg-amber-500',
        accuracyText: riderLocation ? `±${Math.round(riderLocation.accuracy)} m (Stale)` : 'Updating',
      };
    }
    if (rawStatus === 'active') {
      const acc = riderLocation ? Math.round(riderLocation.accuracy) : null;
      return {
        label: 'GPS: Active',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        dotClass: 'bg-emerald-500',
        accuracyText: acc !== null ? `±${acc} m` : 'Locked',
      };
    }
    if (rawStatus === 'weak') {
      const acc = riderLocation ? Math.round(riderLocation.accuracy) : null;
      return {
        label: 'GPS: Weak',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        dotClass: 'bg-amber-500',
        accuracyText: acc !== null ? `±${acc} m (Weak)` : 'Weak Signal',
      };
    }

    // Default / idle
    return {
      label: 'GPS: Waiting',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
      dotClass: 'bg-slate-400',
      accuracyText: 'Idle',
    };
  };

  const statusInfo = renderGpsStatusInfo();

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ${className}`}>
      {/* ── 1. Top Header ── */}
      <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusInfo.dotClass}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusInfo.dotClass}`}></span>
          </span>
          <h4 className="text-xs font-black uppercase tracking-wider">Live Location</h4>
        </div>

        <button
          onClick={handleRefresh}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors active:scale-95 cursor-pointer"
          title="Refresh Map View"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* ── 2. Embedded Maplibre Canvas Window ── */}
      <div className={`relative w-full ${height} bg-slate-100 select-none overflow-hidden`}>
        {/* Map Canvas */}
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

        {/* Fallback Location Tag Overlay (Bengaluru / KGF test area) */}
        {!riderLocation && (
          <div className="absolute top-3 left-3 z-10 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-700/60 shadow-sm flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-400" />
            <span>Bengaluru fallback area</span>
          </div>
        )}

        {/* Live GPS Active Banner */}
        {riderLocation && (
          <div className="absolute top-3 left-3 z-10 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-700/60 shadow-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Live GPS • ±{Math.round(riderLocation.accuracy)}m</span>
            {accuracyClassification && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-mono">
                {accuracyClassification}
              </span>
            )}
          </div>
        )}

        {/* ── Recenter Map Button Control (📍 Recenter) ── */}
        <button
          onClick={handleRecenterClick}
          className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs px-3 py-1.5 rounded-full shadow-md border border-slate-200 transition-all active:scale-95 cursor-pointer"
          title="Recenter map on current GPS position"
        >
          <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
          <span>📍 Recenter</span>
        </button>
      </div>

      {/* ── 3. Dynamic GPS Status Bar ── */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
            GPS Status
          </span>
          {accuracyClassification && riderLocation && (
            <span className="text-[10px] font-mono font-bold text-slate-400">
              ({statusInfo.accuracyText})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {gpsStatus === 'denied' && onRetryPermission && (
            <button
              onClick={onRetryPermission}
              className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white hover:bg-rose-500 flex items-center gap-1 transition-colors active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}

          <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-md border flex items-center gap-1.5 ${statusInfo.badgeClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
            <span>{statusInfo.label}</span>
          </span>
        </div>
      </div>

      {/* ── 3.5. Error Notification Banner (if permission denied or unavailable) ── */}
      {errorMessage && (
        <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 text-rose-800 text-[11px] font-medium flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          {onRetryPermission && (
            <button
              onClick={onRetryPermission}
              className="text-rose-700 font-bold underline hover:text-rose-900 shrink-0 ml-2"
            >
              Enable GPS
            </button>
          )}
        </div>
      )}

      {/* ── 4. Google Maps External Navigation Section ── */}
      <div className="p-3 bg-white border-t border-slate-100">
        <button
          onClick={handleGoogleMapsClick}
          className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
        >
          <Navigation className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
          <span>Navigate with Google Maps</span>
        </button>
      </div>
    </div>
  );
};
