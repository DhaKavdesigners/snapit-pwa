'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRider } from '@/context/RiderContext';
import { useDeviceGps } from '@/hooks/useDeviceGps';
import { openTurnByTurnNavigation } from '@/utils/navigationLauncher';
import { MAP_CONFIG, isValidCoordinate, getSafeCoordinates } from '@/config/mapConfig';
import {
  Crosshair,
  Maximize2,
  Minimize2,
  Navigation,
  Store,
  Compass,
  ExternalLink,
} from 'lucide-react';

interface LiveMapProps {
  showRoute?: boolean;
  interactive?: boolean;
  className?: string;
  defaultHeight?: string;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  showRoute = true,
  interactive = true,
  className = '',
  defaultHeight = 'h-[210px]',
}) => {
  const { isOnline, activeOrder, rider, zones } = useRider();
  const { location: gpsLoc, status: gpsStatus, isHighAccuracy, refreshGps } = useDeviceGps(isOnline);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const hasAutoCenteredRef = useRef<boolean>(false);

  // Selected Zone fallback
  const currentZone = useMemo(() => {
    return zones.find((z) => z.id === rider.selectedZoneId) || zones[0] || {
      id: 'zone-1',
      name: 'Robertsonpet',
      centerLat: MAP_CONFIG.defaultCenter.lat,
      centerLng: MAP_CONFIG.defaultCenter.lng,
      radiusMeters: 5000,
    };
  }, [zones, rider.selectedZoneId]);

  // Current effective rider coordinates (Hardware GPS -> Zone Center -> Default KGF)
  const riderCoords = useMemo(() => {
    if (gpsLoc && isValidCoordinate(gpsLoc.lat, gpsLoc.lng)) {
      return { lat: gpsLoc.lat, lng: gpsLoc.lng, heading: gpsLoc.heading || 0 };
    }
    if (activeOrder?.riderStartLocation && isValidCoordinate(activeOrder.riderStartLocation.lat, activeOrder.riderStartLocation.lng)) {
      return { lat: activeOrder.riderStartLocation.lat, lng: activeOrder.riderStartLocation.lng, heading: 0 };
    }
    const zoneLat = currentZone.centerLat ?? MAP_CONFIG.defaultCenter.lat;
    const zoneLng = currentZone.centerLng ?? MAP_CONFIG.defaultCenter.lng;
    return {
      lat: zoneLat,
      lng: zoneLng,
      heading: 0,
    };
  }, [gpsLoc, activeOrder, currentZone]);

  // Determine if order is before pickup or after pickup
  const isBeforePickup = useMemo(() => {
    if (!activeOrder) return true;
    const s = (activeOrder.status || '').toLowerCase();
    const dbS = (activeOrder.dbStatus || '').toUpperCase();
    return (
      s === 'pending' ||
      s === 'accepted' ||
      s === 'picking_up' ||
      s === 'arrived_at_pickup' ||
      dbS === 'PLACED' ||
      dbS === 'PREPARING' ||
      dbS === 'PACKING' ||
      dbS === 'ACCEPTED' ||
      dbS === 'READY_FOR_PICKUP' ||
      dbS === 'ARRIVED_AT_STORE' ||
      dbS === 'OUT_OF_SHOP'
    );
  }, [activeOrder]);

  // Safe Store / Pickup coordinates
  const shopCoords = useMemo(() => {
    if (!activeOrder) return null;
    const fallbackLat = (currentZone.centerLat ?? MAP_CONFIG.defaultCenter.lat) + 0.004;
    const fallbackLng = (currentZone.centerLng ?? MAP_CONFIG.defaultCenter.lng) + 0.003;

    return {
      lat: isValidCoordinate(activeOrder.shopLocation?.lat, activeOrder.shopLocation?.lng)
        ? Number(activeOrder.shopLocation!.lat)
        : fallbackLat,
      lng: isValidCoordinate(activeOrder.shopLocation?.lat, activeOrder.shopLocation?.lng)
        ? Number(activeOrder.shopLocation!.lng)
        : fallbackLng,
      name: activeOrder.restaurantName || 'Store',
      address: activeOrder.restaurantAddress || 'Store Address',
    };
  }, [activeOrder, currentZone]);

  // Safe Customer / Dropoff coordinates
  const customerCoords = useMemo(() => {
    if (!activeOrder) return null;
    const fallbackLat = (currentZone.centerLat ?? MAP_CONFIG.defaultCenter.lat) - 0.005;
    const fallbackLng = (currentZone.centerLng ?? MAP_CONFIG.defaultCenter.lng) - 0.004;

    return {
      lat: isValidCoordinate(activeOrder.customerLocation?.lat, activeOrder.customerLocation?.lng)
        ? Number(activeOrder.customerLocation!.lat)
        : fallbackLat,
      lng: isValidCoordinate(activeOrder.customerLocation?.lat, activeOrder.customerLocation?.lng)
        ? Number(activeOrder.customerLocation!.lng)
        : fallbackLng,
      name: activeOrder.customerName || 'Customer',
      address: activeOrder.deliveryAddress || 'Customer Address',
    };
  }, [activeOrder, currentZone]);

  // Active Navigation Target (Shop before pickup, Customer after pickup)
  const currentNavTarget = useMemo(() => {
    if (!activeOrder) return null;

    if (isBeforePickup && shopCoords) {
      return {
        lat: shopCoords.lat,
        lng: shopCoords.lng,
        label: activeOrder.restaurantName,
        address: activeOrder.restaurantAddress,
        stage: 'Pickup: Store',
      };
    } else if (customerCoords) {
      return {
        lat: customerCoords.lat,
        lng: customerCoords.lng,
        label: activeOrder.customerName,
        address: activeOrder.deliveryAddress,
        stage: 'Dropoff: Customer',
      };
    }
    return null;
  }, [activeOrder, isBeforePickup, shopCoords, customerCoords]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize Leaflet Map Instance
  useEffect(() => {
    if (!isMounted || typeof window === 'undefined' || !mapContainerRef.current) return;

    let L: any;
    let mapInstance: any;

    const initMap = async () => {
      try {
        L = (await import('leaflet')).default;
        if (!mapContainerRef.current) return;

        // Clean up previous instance
        if (leafletMapRef.current) {
          leafletMapRef.current.remove();
          leafletMapRef.current = null;
        }
        if ((mapContainerRef.current as any)._leaflet_id) {
          (mapContainerRef.current as any)._leaflet_id = null;
        }

        const initialZoom = activeOrder ? MAP_CONFIG.focusedZoom : (gpsLoc ? MAP_CONFIG.focusedZoom : MAP_CONFIG.defaultZoom);

        // Initialize Map
        mapInstance = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false,
          fadeAnimation: true,
          zoomAnimation: true,
        }).setView([riderCoords.lat, riderCoords.lng], initialZoom);

        leafletMapRef.current = mapInstance;

        // Configurable Tile Server Layer (OpenStreetMap-compatible)
        L.tileLayer(MAP_CONFIG.tileUrl, {
          maxZoom: MAP_CONFIG.maxZoom,
          minZoom: MAP_CONFIG.minZoom,
          attribution: MAP_CONFIG.attribution,
          crossOrigin: true,
        }).addTo(mapInstance);

        // Feature Group for dynamic overlays
        const markersGroup = L.layerGroup().addTo(mapInstance);
        markersGroupRef.current = markersGroup;

        // Draw Zone Geofence Circle
        if (currentZone.centerLat && currentZone.centerLng) {
          L.circle([currentZone.centerLat, currentZone.centerLng], {
            radius: currentZone.radiusMeters || 5000,
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.05,
            weight: 1.5,
            dashArray: '6, 6',
          }).addTo(markersGroup);
        }

        // GPS Accuracy halo circle
        const accuracyRadius = gpsLoc?.accuracy || 25;
        const accuracyCircle = L.circle([riderCoords.lat, riderCoords.lng], {
          radius: Math.min(accuracyRadius, 80),
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.15,
          weight: 1,
        }).addTo(markersGroup);
        accuracyCircleRef.current = accuracyCircle;

        // Rider Icon
        const riderIcon = L.divIcon({
          className: 'rider-gps-marker',
          html: `
            <div style="width: 38px; height: 38px; position: relative; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: ${
                isOnline ? 'rgba(16, 185, 129, 0.35)' : 'rgba(100, 116, 139, 0.2)'
              }; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: relative; z-index: 10; width: 26px; height: 26px; border-radius: 50%; background: ${
                isOnline ? '#059669' : '#475569'
              }; border: 3px solid #ffffff; box-shadow: 0 3px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; transform: rotate(${
            riderCoords.heading
          }deg); transition: transform 0.3s ease;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                  <polygon points="12 2 19 21 12 17 5 21 12 2"/>
                </svg>
              </div>
            </div>`,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });

        const riderMarker = L.marker([riderCoords.lat, riderCoords.lng], {
          icon: riderIcon,
          zIndexOffset: 1000,
        }).addTo(markersGroup);
        riderMarkerRef.current = riderMarker;

        // If Active Order: Add Target Pin(s) & Visual Route Line
        if (activeOrder && shopCoords && customerCoords && showRoute) {
          const activeTarget = isBeforePickup ? shopCoords : customerCoords;

          // Target Pin (Store or Customer)
          const targetIcon = L.divIcon({
            className: 'target-marker',
            html: isBeforePickup
              ? `
              <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                <div style="background: #0f172a; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 8px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 1px solid #334155;">
                  🏬 ${activeOrder.restaurantName || 'Store'}
                </div>
                <div style="width: 30px; height: 30px; border-radius: 50%; background: #059669; border: 3px solid #fff; box-shadow: 0 4px 10px rgba(5,150,105,0.4); display: flex; align-items: center; justify-content: center;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/></svg>
                </div>
              </div>`
              : `
              <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                <div style="background: #0f172a; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 8px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 1px solid #334155;">
                  📍 ${activeOrder.customerName || 'Customer'}
                </div>
                <div style="width: 30px; height: 30px; border-radius: 50%; background: #7c3aed; border: 3px solid #fff; box-shadow: 0 4px 10px rgba(124,58,237,0.4); display: flex; align-items: center; justify-content: center;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
              </div>`,
            iconSize: [110, 52],
            iconAnchor: [55, 52],
          });

          L.marker([activeTarget.lat, activeTarget.lng], { icon: targetIcon }).addTo(markersGroup);

          // Direct visual route polyline from Rider to Active Destination
          const linePoints = [
            [riderCoords.lat, riderCoords.lng],
            [activeTarget.lat, activeTarget.lng],
          ];

          const polyline = L.polyline(linePoints, {
            ...MAP_CONFIG.routeStyle,
            color: isBeforePickup ? '#059669' : '#7c3aed',
          }).addTo(markersGroup);
          routePolylineRef.current = polyline;

          // Fit bounds to show both Rider and Target comfortably
          const bounds = L.latLngBounds(linePoints);
          mapInstance.fitBounds(bounds, { padding: [35, 35], maxZoom: 17 });
        } else {
          mapInstance.setView([riderCoords.lat, riderCoords.lng], initialZoom);
        }

        // Adjust size after mount
        setTimeout(() => {
          if (mapInstance) mapInstance.invalidateSize();
        }, 150);
      } catch (err) {
        console.warn('Leaflet map error:', err);
      }
    };

    initMap();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [
    isMounted,
    isOnline,
    currentZone.id,
    currentZone.centerLat,
    currentZone.centerLng,
    activeOrder?.id,
    activeOrder?.status,
    activeOrder?.dbStatus,
    isBeforePickup,
    isFullScreen,
  ]);

  // Update Rider GPS position on map dynamically
  useEffect(() => {
    if (riderMarkerRef.current && riderCoords) {
      riderMarkerRef.current.setLatLng([riderCoords.lat, riderCoords.lng]);

      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setLatLng([riderCoords.lat, riderCoords.lng]);
        if (gpsLoc?.accuracy) {
          accuracyCircleRef.current.setRadius(Math.min(gpsLoc.accuracy, 80));
        }
      }

      // Auto-center camera to exact GPS position on first lock if no active order
      if (leafletMapRef.current && gpsLoc && !activeOrder) {
        if (!hasAutoCenteredRef.current) {
          hasAutoCenteredRef.current = true;
          leafletMapRef.current.setView([gpsLoc.lat, gpsLoc.lng], MAP_CONFIG.focusedZoom, { animate: true });
        }
      }
    }
  }, [riderCoords, gpsLoc, activeOrder]);

  // Recenter Map on Rider Position
  const handleRecenter = () => {
    refreshGps();
    if (leafletMapRef.current && riderCoords) {
      leafletMapRef.current.setView([riderCoords.lat, riderCoords.lng], MAP_CONFIG.focusedZoom, {
        animate: true,
        duration: 0.5,
      });
    }
  };

  // Launch Turn-by-Turn Navigation in Native Google Maps App ($0 Cost)
  const handleLaunchGoogleMaps = () => {
    if (currentNavTarget) {
      openTurnByTurnNavigation({
        lat: currentNavTarget.lat,
        lng: currentNavTarget.lng,
        label: currentNavTarget.label,
        address: currentNavTarget.address,
      });
    } else {
      openTurnByTurnNavigation({
        lat: riderCoords.lat,
        lng: riderCoords.lng,
        label: rider.selectedZone || 'Current Location',
      });
    }
  };

  return (
    <div
      className={`relative transition-all duration-300 ${
        isFullScreen
          ? 'fixed inset-0 z-50 flex flex-col bg-slate-950 p-2 sm:p-4'
          : `w-full rounded-3xl bg-slate-900 border border-slate-200/80 shadow-soft overflow-hidden ${className}`
      }`}
    >
      {/* Leaflet CSS CDN */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />

      {/* Map Header / Mini Status Bar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-none">
        {/* Left Badge: Zone & GPS Status */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/80 shadow-md pointer-events-auto">
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline
                ? isHighAccuracy
                  ? 'bg-emerald-400 animate-ping'
                  : 'bg-emerald-400'
                : 'bg-slate-400'
            }`}
          />
          <span className="text-[11px] font-bold text-white font-mono">
            {gpsLoc ? 'Exact GPS Lock' : rider.selectedZone || 'Robertsonpet'}
          </span>
          {gpsStatus === 'locked' && (
            <span className="text-[9px] text-emerald-400 font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-800">
              {gpsLoc?.accuracy ? `±${Math.round(gpsLoc.accuracy)}m` : 'Active'}
            </span>
          )}
        </div>

        {/* Right Action Icons: Recenter + Expand/Minimize */}
        {interactive && (
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={handleRecenter}
              className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-md shadow-md flex items-center justify-center text-slate-800 hover:bg-white active:scale-90 transition-transform border border-slate-200 cursor-pointer"
              title="Recenter on My Location"
            >
              <Crosshair className="w-4 h-4 text-emerald-600" />
            </button>

            <button
              type="button"
              onClick={() => setIsFullScreen((prev) => !prev)}
              className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-md shadow-md flex items-center justify-center text-slate-800 hover:bg-white active:scale-90 transition-transform border border-slate-200 cursor-pointer"
              title={isFullScreen ? 'Minimize Window' : 'Expand Map'}
            >
              {isFullScreen ? (
                <Minimize2 className="w-4 h-4 text-slate-700" />
              ) : (
                <Maximize2 className="w-4 h-4 text-slate-700" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Map Canvas Window */}
      <div
        className={`relative w-full overflow-hidden ${
          isFullScreen ? 'flex-1 rounded-2xl' : defaultHeight
        }`}
      >
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Offline Overlay Mask */}
        {!isOnline && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] z-15 flex items-center justify-center pointer-events-none">
            <div className="bg-slate-900/90 border border-slate-700 text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-slate-400" />
              <span>Map Inactive (Offline)</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Bar: 1-Tap Google Maps Navigation Launcher */}
      <div
        className={`z-20 bg-slate-900 border-t border-slate-800 p-2.5 flex items-center justify-between gap-2 ${
          isFullScreen ? 'mt-2 rounded-2xl' : ''
        }`}
      >
        {activeOrder && currentNavTarget ? (
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Navigation className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider truncate">
                {currentNavTarget.stage}
              </p>
              <p className="text-xs font-black text-white truncate">
                {currentNavTarget.label}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
              <Store className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Live Location</p>
              <p className="text-xs font-bold text-white truncate">
                {gpsLoc ? `Lat: ${gpsLoc.lat.toFixed(4)}, Lng: ${gpsLoc.lng.toFixed(4)}` : `${rider.selectedZone || 'Robertsonpet'} Active`}
              </p>
            </div>
          </div>
        )}

        {/* 1-Tap Google Maps Button ($0 Cost) */}
        <button
          type="button"
          onClick={handleLaunchGoogleMaps}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
          title="Open Turn-by-Turn Navigation in Native Google Maps"
        >
          <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Google Maps</span>
        </button>
      </div>
    </div>
  );
};
