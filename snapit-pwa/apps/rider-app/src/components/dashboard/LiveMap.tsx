'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRider } from '@/context/RiderContext';
import { useDeviceGps } from '@/hooks/useDeviceGps';
import { openTurnByTurnNavigation } from '@/utils/navigationLauncher';
import {
  Crosshair,
  Maximize2,
  Minimize2,
  Navigation,
  Layers,
  MapPin,
  Store,
  Compass,
  AlertCircle,
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
  defaultHeight = 'h-[230px]',
}) => {
  const { isOnline, activeOrder, rider, zones } = useRider();
  const { location: gpsLoc, status: gpsStatus, isHighAccuracy, refreshGps } = useDeviceGps(isOnline);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const zoneCircleRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);

  // Selected Zone fallback
  const currentZone = useMemo(() => {
    return zones.find((z) => z.id === rider.selectedZoneId) || zones[0] || {
      id: 'zone-1',
      name: 'Robertsonpet',
      centerLat: 12.9602,
      centerLng: 78.2711,
      radiusMeters: 5000,
    };
  }, [zones, rider.selectedZoneId]);

  // Current effective rider coordinates (Hardware GPS -> Mock GPS -> Zone Center)
  const riderCoords = useMemo(() => {
    if (gpsLoc) {
      return { lat: gpsLoc.lat, lng: gpsLoc.lng, heading: gpsLoc.heading || 0 };
    }
    if (activeOrder?.riderStartLocation) {
      return { lat: activeOrder.riderStartLocation.lat, lng: activeOrder.riderStartLocation.lng, heading: 0 };
    }
    return {
      lat: currentZone.centerLat ?? 12.9602,
      lng: currentZone.centerLng ?? 78.2711,
      heading: 0,
    };
  }, [gpsLoc, activeOrder, currentZone]);

  // Shop and Customer coordinates for active order
  const shopCoords = useMemo(() => {
    if (!activeOrder) return null;
    return activeOrder.shopLocation || {
      lat: (currentZone.centerLat ?? 12.9602) + 0.005,
      lng: (currentZone.centerLng ?? 78.2711) + 0.004,
      name: activeOrder.restaurantName,
      address: activeOrder.restaurantAddress,
    };
  }, [activeOrder, currentZone]);

  const customerCoords = useMemo(() => {
    if (!activeOrder) return null;
    return activeOrder.customerLocation || {
      lat: (currentZone.centerLat ?? 12.9602) - 0.007,
      lng: (currentZone.centerLng ?? 78.2711) - 0.005,
      name: activeOrder.customerName,
      address: activeOrder.deliveryAddress,
    };
  }, [activeOrder, currentZone]);

  // Target navigation destination based on active order stage
  const currentNavTarget = useMemo(() => {
    if (!activeOrder) return null;
    const isToShop =
      activeOrder.status === 'accepted' ||
      activeOrder.status === 'picking_up' ||
      activeOrder.status === 'arrived_at_pickup';

    if (isToShop && shopCoords) {
      return {
        lat: shopCoords.lat,
        lng: shopCoords.lng,
        label: activeOrder.restaurantName,
        address: activeOrder.restaurantAddress,
        stage: 'Pickup Store',
      };
    } else if (customerCoords) {
      return {
        lat: customerCoords.lat,
        lng: customerCoords.lng,
        label: activeOrder.customerName,
        address: activeOrder.deliveryAddress,
        stage: 'Customer Delivery',
      };
    }
    return null;
  }, [activeOrder, shopCoords, customerCoords]);

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

        // Initialize Map centered on rider
        mapInstance = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false,
          fadeAnimation: true,
          zoomAnimation: true,
        }).setView([riderCoords.lat, riderCoords.lng], 15);

        leafletMapRef.current = mapInstance;

        // 100% Free OpenStreetMap Humanitarian/Standard Tiles (Zero API key, Zero watermark)
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
          maxZoom: 19,
          subdomains: 'abc',
        }).addTo(mapInstance);

        // Feature Group for dynamic overlays
        const markersGroup = L.layerGroup().addTo(mapInstance);
        markersGroupRef.current = markersGroup;

        // Draw Zone Geofence Circle
        if (currentZone.centerLat && currentZone.centerLng) {
          const zoneCircle = L.circle([currentZone.centerLat, currentZone.centerLng], {
            radius: currentZone.radiusMeters || 5000,
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.08,
            weight: 2,
            dashArray: '6, 6',
          }).addTo(markersGroup);
          zoneCircleRef.current = zoneCircle;
        }

        // Rider Icon
        const riderIcon = L.divIcon({
          className: 'rider-gps-marker',
          html: `
            <div style="width: 42px; height: 42px; position: relative; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 42px; height: 42px; border-radius: 50%; background: ${
                isOnline ? 'rgba(16, 185, 129, 0.25)' : 'rgba(100, 116, 139, 0.2)'
              }; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: relative; z-index: 10; width: 30px; height: 30px; border-radius: 50%; background: ${
                isOnline ? '#059669' : '#475569'
              }; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; transform: rotate(${
            riderCoords.heading
          }deg); transition: transform 0.4s ease;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                  <polygon points="12 2 19 21 12 17 5 21 12 2"/>
                </svg>
              </div>
            </div>`,
          iconSize: [42, 42],
          iconAnchor: [21, 21],
        });

        const riderMarker = L.marker([riderCoords.lat, riderCoords.lng], {
          icon: riderIcon,
          zIndexOffset: 1000,
        }).addTo(markersGroup);
        riderMarkerRef.current = riderMarker;

        // If Active Order: Add Store, Customer pins & Polyline
        if (activeOrder && shopCoords && customerCoords && showRoute) {
          // Shop Pin
          const shopIcon = L.divIcon({
            className: 'shop-marker',
            html: `
              <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                <div style="background: #0f172a; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 8px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 1px solid #334155;">
                  🏬 ${activeOrder.restaurantName}
                </div>
                <div style="width: 32px; height: 32px; border-radius: 50%; background: #059669; border: 3px solid #fff; box-shadow: 0 4px 10px rgba(5,150,105,0.4); display: flex; align-items: center; justify-content: center;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/></svg>
                </div>
              </div>`,
            iconSize: [120, 56],
            iconAnchor: [60, 56],
          });

          // Customer Pin
          const customerIcon = L.divIcon({
            className: 'customer-marker',
            html: `
              <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                <div style="background: #0f172a; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 8px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 1px solid #334155;">
                  📍 ${activeOrder.customerName}
                </div>
                <div style="width: 32px; height: 32px; border-radius: 50%; background: #7c3aed; border: 3px solid #fff; box-shadow: 0 4px 10px rgba(124,58,237,0.4); display: flex; align-items: center; justify-content: center;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
              </div>`,
            iconSize: [120, 56],
            iconAnchor: [60, 56],
          });

          L.marker([shopCoords.lat, shopCoords.lng], { icon: shopIcon }).addTo(markersGroup);
          L.marker([customerCoords.lat, customerCoords.lng], { icon: customerIcon }).addTo(markersGroup);

          // Route Polyline (Rider -> Shop -> Customer)
          const polyline = L.polyline(
            [
              [riderCoords.lat, riderCoords.lng],
              [shopCoords.lat, shopCoords.lng],
              [customerCoords.lat, customerCoords.lng],
            ],
            {
              color: '#059669',
              weight: 5,
              opacity: 0.85,
              dashArray: '8, 6',
              lineCap: 'round',
              lineJoin: 'round',
            }
          ).addTo(markersGroup);
          routePolylineRef.current = polyline;

          // Fit bounds to show full route nicely
          const bounds = L.latLngBounds([
            [riderCoords.lat, riderCoords.lng],
            [shopCoords.lat, shopCoords.lng],
            [customerCoords.lat, customerCoords.lng],
          ]);
          mapInstance.fitBounds(bounds, { padding: [35, 35] });
        } else {
          // Centered on Rider
          mapInstance.setView([riderCoords.lat, riderCoords.lng], 15);
        }

        // Trigger resize calculation after render
        setTimeout(() => {
          if (mapInstance) {
            mapInstance.invalidateSize();
          }
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
    isFullScreen,
  ]);

  // Update Rider GPS position on the live map without full reload
  useEffect(() => {
    if (riderMarkerRef.current && riderCoords) {
      riderMarkerRef.current.setLatLng([riderCoords.lat, riderCoords.lng]);
    }
  }, [riderCoords]);

  // Recenter Map on Rider Position
  const handleRecenter = () => {
    if (leafletMapRef.current && riderCoords) {
      leafletMapRef.current.setView([riderCoords.lat, riderCoords.lng], 16, {
        animate: true,
        duration: 0.6,
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
      // Default to opening rider zone center in Google Maps
      openTurnByTurnNavigation({
        lat: riderCoords.lat,
        lng: riderCoords.lng,
        label: rider.selectedZone || 'Current Zone',
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

      {/* Map Header / Mini Nav Bar (Inside Window) */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-none">
        {/* Left Badge: Zone & Accuracy Status */}
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
            {rider.selectedZone || 'Robertsonpet'}
          </span>
          {gpsStatus === 'locked' && (
            <span className="text-[9px] text-emerald-400 font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-800">
              GPS {gpsLoc?.accuracy ? `±${Math.round(gpsLoc.accuracy)}m` : 'Active'}
            </span>
          )}
        </div>

        {/* Right Action Icons: Recenter + Expand/Minimize */}
        {interactive && (
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* Recenter GPS */}
            <button
              onClick={handleRecenter}
              className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-md shadow-md flex items-center justify-center text-slate-800 hover:bg-white active:scale-90 transition-transform border border-slate-200"
              title="Recenter on My Location"
            >
              <Crosshair className="w-4 h-4 text-emerald-600" />
            </button>

            {/* Toggle Fullscreen / Window */}
            <button
              onClick={() => setIsFullScreen((prev) => !prev)}
              className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-md shadow-md flex items-center justify-center text-slate-800 hover:bg-white active:scale-90 transition-transform border border-slate-200"
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

        {/* Offline Overlay Mask if rider is offline */}
        {!isOnline && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] z-15 flex items-center justify-center pointer-events-none">
            <div className="bg-slate-900/90 border border-slate-700 text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-slate-400" />
              <span>Map Inactive (Offline)</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Bar: 1-Tap Google Maps Navigation Launcher */}
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
              <p className="text-[10px] text-slate-400 font-bold uppercase">Coverage Zone</p>
              <p className="text-xs font-bold text-white truncate">
                {rider.selectedZone || 'Robertsonpet'} Core
              </p>
            </div>
          </div>
        )}

        {/* 1-Tap Google Maps Button ($0 Cost) */}
        <button
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
