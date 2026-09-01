'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Order } from '@/types';
import { useDeviceGps } from '@/hooks/useDeviceGps';
import { openTurnByTurnNavigation } from '@/utils/navigationLauncher';
import { MAP_CONFIG, isValidCoordinate } from '@/config/mapConfig';
import {
  Navigation,
  Crosshair,
  Maximize2,
  Minimize2,
  ExternalLink,
  Store,
  MapPin,
  Clock,
  ChevronRight,
} from 'lucide-react';

interface LiveRiderNavigationProps {
  order: Order;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onCloseNav?: () => void;
}

export const LiveRiderNavigation: React.FC<LiveRiderNavigationProps> = ({
  order,
  isFullScreen = false,
  onToggleFullScreen,
}) => {
  const { location: gpsLoc, status: gpsStatus, refreshGps } = useDeviceGps(true);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapInstance = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);

  // Determine if order is in pickup stage or dropoff stage
  const isBeforePickup = useMemo(() => {
    const s = (order.status || '').toLowerCase();
    const dbS = (order.dbStatus || '').toUpperCase();
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
  }, [order]);

  // Current Rider coordinates (GPS -> Start Coords -> Default Center)
  const riderCoords = useMemo(() => {
    if (gpsLoc && isValidCoordinate(gpsLoc.lat, gpsLoc.lng)) {
      return { lat: gpsLoc.lat, lng: gpsLoc.lng, heading: gpsLoc.heading || 0 };
    }
    if (order.riderStartLocation && isValidCoordinate(order.riderStartLocation.lat, order.riderStartLocation.lng)) {
      return { lat: order.riderStartLocation.lat, lng: order.riderStartLocation.lng, heading: 0 };
    }
    return {
      lat: MAP_CONFIG.defaultCenter.lat,
      lng: MAP_CONFIG.defaultCenter.lng,
      heading: 0,
    };
  }, [gpsLoc, order.riderStartLocation]);

  // Shop coordinates
  const shopCoords = useMemo(() => {
    return {
      lat: isValidCoordinate(order.shopLocation?.lat, order.shopLocation?.lng)
        ? Number(order.shopLocation!.lat)
        : MAP_CONFIG.defaultCenter.lat + 0.004,
      lng: isValidCoordinate(order.shopLocation?.lat, order.shopLocation?.lng)
        ? Number(order.shopLocation!.lng)
        : MAP_CONFIG.defaultCenter.lng + 0.003,
      name: order.restaurantName || 'Store',
      address: order.restaurantAddress || 'Store Address',
    };
  }, [order.shopLocation, order.restaurantName, order.restaurantAddress]);

  // Customer coordinates
  const customerCoords = useMemo(() => {
    return {
      lat: isValidCoordinate(order.customerLocation?.lat, order.customerLocation?.lng)
        ? Number(order.customerLocation!.lat)
        : MAP_CONFIG.defaultCenter.lat - 0.005,
      lng: isValidCoordinate(order.customerLocation?.lat, order.customerLocation?.lng)
        ? Number(order.customerLocation!.lng)
        : MAP_CONFIG.defaultCenter.lng - 0.004,
      name: order.customerName || 'Customer',
      address: order.deliveryAddress || 'Customer Address',
    };
  }, [order.customerLocation, order.customerName, order.deliveryAddress]);

  // Active Destination Target
  const targetCoords = isBeforePickup ? shopCoords : customerCoords;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!isMounted || typeof window === 'undefined' || !mapRef.current) return;

    let L: any;
    let mapInstance: any;

    const initMap = async () => {
      try {
        L = (await import('leaflet')).default;
        if (!mapRef.current) return;

        if (leafletMapInstance.current) {
          leafletMapInstance.current.remove();
          leafletMapInstance.current = null;
        }
        if ((mapRef.current as any)._leaflet_id) {
          (mapRef.current as any)._leaflet_id = null;
        }

        mapInstance = L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false,
          fadeAnimation: true,
          zoomAnimation: true,
        }).setView([riderCoords.lat, riderCoords.lng], MAP_CONFIG.focusedZoom);

        leafletMapInstance.current = mapInstance;

        // Configurable Tile Server Layer
        L.tileLayer(MAP_CONFIG.tileUrl, {
          maxZoom: MAP_CONFIG.maxZoom,
          minZoom: MAP_CONFIG.minZoom,
          attribution: MAP_CONFIG.attribution,
          crossOrigin: true,
        }).addTo(mapInstance);

        const markersGroup = L.layerGroup().addTo(mapInstance);
        markersGroupRef.current = markersGroup;

        // Rider Marker Icon
        const riderIcon = L.divIcon({
          className: 'rider-marker',
          html: `
            <div style="width:38px;height:38px;position:relative;display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;width:38px;height:38px;border-radius:50%;background:rgba(5,150,105,0.3);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
              <div style="position:relative;z-index:10;width:26px;height:26px;border-radius:50%;background:#059669;border:3px solid #fff;box-shadow:0 3px 10px rgba(5,150,105,0.4);display:flex;align-items:center;justify-content:center;transform:rotate(${riderCoords.heading}deg);">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>
              </div>
            </div>`,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });

        const riderMarker = L.marker([riderCoords.lat, riderCoords.lng], { icon: riderIcon, zIndexOffset: 1000 }).addTo(markersGroup);
        riderMarkerRef.current = riderMarker;

        // Target Marker (Store or Customer)
        const targetIcon = L.divIcon({
          className: 'dest-marker',
          html: isBeforePickup
            ? `
            <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
              <div style="background:#0f172a;color:#fff;border-radius:6px;padding:2px 8px;font-size:10px;font-weight:800;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:1px solid #334155;">
                🏬 ${order.restaurantName || 'Store'}
              </div>
              <div style="width:32px;height:32px;border-radius:50%;background:#059669;border:3px solid #fff;box-shadow:0 3px 10px rgba(5,150,105,0.4);display:flex;align-items:center;justify-content:center;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/></svg>
              </div>
            </div>`
            : `
            <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
              <div style="background:#0f172a;color:#fff;border-radius:6px;padding:2px 8px;font-size:10px;font-weight:800;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:1px solid #334155;">
                📍 ${order.customerName || 'Customer'}
              </div>
              <div style="width:32px;height:32px;border-radius:50%;background:#7c3aed;border:3px solid #fff;box-shadow:0 3px 10px rgba(124,58,237,0.4);display:flex;align-items:center;justify-content:center;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
            </div>`,
          iconSize: [110, 54],
          iconAnchor: [55, 54],
        });

        L.marker([targetCoords.lat, targetCoords.lng], { icon: targetIcon }).addTo(markersGroup);

        // Visual Polyline connecting Rider to Target
        const linePoints = [
          [riderCoords.lat, riderCoords.lng],
          [targetCoords.lat, targetCoords.lng],
        ];

        const polyline = L.polyline(linePoints, {
          ...MAP_CONFIG.routeStyle,
          color: isBeforePickup ? '#059669' : '#7c3aed',
        }).addTo(markersGroup);
        routePolylineRef.current = polyline;

        // Fit Bounds
        const bounds = L.latLngBounds(linePoints);
        mapInstance.fitBounds(bounds, { padding: [45, 45], maxZoom: 17 });

        setTimeout(() => {
          if (mapInstance) mapInstance.invalidateSize();
        }, 150);
      } catch (err) {
        console.warn('Leaflet map init error:', err);
      }
    };

    initMap();

    return () => {
      if (leafletMapInstance.current) {
        leafletMapInstance.current.remove();
        leafletMapInstance.current = null;
      }
    };
  }, [isMounted, isBeforePickup, targetCoords, isFullScreen]);

  // Update Rider GPS position dynamically
  useEffect(() => {
    if (riderMarkerRef.current && riderCoords) {
      riderMarkerRef.current.setLatLng([riderCoords.lat, riderCoords.lng]);
    }
  }, [riderCoords]);

  const handleZoomIn = () => leafletMapInstance.current?.zoomIn();
  const handleZoomOut = () => leafletMapInstance.current?.zoomOut();
  const handleRecenter = () => {
    refreshGps();
    if (leafletMapInstance.current && riderCoords) {
      leafletMapInstance.current.setView([riderCoords.lat, riderCoords.lng], MAP_CONFIG.focusedZoom, {
        animate: true,
      });
    }
  };

  const handleLaunchGoogleMaps = () => {
    openTurnByTurnNavigation({
      lat: targetCoords.lat,
      lng: targetCoords.lng,
      label: isBeforePickup ? order.restaurantName : order.customerName,
      address: isBeforePickup ? order.restaurantAddress : order.deliveryAddress,
    });
  };

  return (
    <div
      className={`relative overflow-hidden transition-all duration-300 ${
        isFullScreen
          ? 'fixed inset-0 z-50 flex flex-col bg-white'
          : 'w-full rounded-3xl bg-white shadow-sm border border-slate-200 flex flex-col'
      }`}
    >
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />

      {/* Map Viewport Canvas */}
      <div className={`relative w-full bg-slate-100 ${isFullScreen ? 'flex-1' : 'h-[230px]'}`}>
        <div ref={mapRef} className="w-full h-full z-10" />

        {/* Top Floating Mission Banner */}
        <div className="absolute top-3 left-3 z-20 max-w-[70%] pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl px-3 py-2 flex items-center gap-2.5 shadow-xl border border-slate-800 pointer-events-auto">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              {isBeforePickup ? <Store className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 block truncate">
                {isBeforePickup ? 'Heading to Store' : 'Out for Delivery'}
              </span>
              <p className="text-white font-bold text-xs leading-tight truncate">
                {isBeforePickup ? order.restaurantName : order.customerName}
              </p>
            </div>
          </div>
        </div>

        {/* Right Stack Controls: Recenter + Zoom + Fullscreen */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 pointer-events-auto">
          {onToggleFullScreen && (
            <button
              type="button"
              onClick={onToggleFullScreen}
              className="w-8 h-8 bg-white/95 backdrop-blur-md rounded-full shadow-md flex items-center justify-center border border-slate-200 active:scale-90 transition-transform cursor-pointer"
              title={isFullScreen ? 'Minimize Map' : 'Expand Map'}
            >
              {isFullScreen ? (
                <Minimize2 className="w-3.5 h-3.5 text-slate-700" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-slate-700" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleRecenter}
            className="w-8 h-8 bg-white/95 backdrop-blur-md rounded-full shadow-md flex items-center justify-center border border-slate-200 text-emerald-600 active:scale-90 transition-transform cursor-pointer"
            title="Recenter on My Location"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 bg-white/95 backdrop-blur-md rounded-full shadow-md flex items-center justify-center border border-slate-200 font-bold text-slate-700 text-base active:scale-90 transition-transform cursor-pointer"
            title="Zoom In"
          >
            +
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 bg-white/95 backdrop-blur-md rounded-full shadow-md flex items-center justify-center border border-slate-200 font-bold text-slate-700 text-base active:scale-90 transition-transform cursor-pointer"
            title="Zoom Out"
          >
            −
          </button>
        </div>
      </div>

      {/* Bottom Floating Bar: 1-Tap Google Maps External Deep Link */}
      <div className="bg-white border-t border-slate-100 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 min-w-0">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>~{order.estimatedMinutes || 10} mins</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-slate-400" />
            <span>{order.distanceKm || 2.4} km</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLaunchGoogleMaps}
          className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          title="Open Turn-by-Turn Navigation in Native Google Maps"
        >
          <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
          <span>Google Maps</span>
        </button>
      </div>
    </div>
  );
};

export const LiveNavigationMap = LiveRiderNavigation;
