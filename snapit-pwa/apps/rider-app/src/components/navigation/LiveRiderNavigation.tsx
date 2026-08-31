'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Order, LocationPoint } from '@/types';
import { useDeviceGps } from '@/hooks/useDeviceGps';
import { openTurnByTurnNavigation } from '@/utils/navigationLauncher';

interface LiveRiderNavigationProps {
  order: Order;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onCloseNav?: () => void;
}

interface NavStep {
  instruction: string;
  dist: string;
  turn: 'straight' | 'left' | 'right' | 'u-turn' | 'arrive';
}

export const LiveRiderNavigation: React.FC<LiveRiderNavigationProps> = ({
  order,
  isFullScreen = false,
  onToggleFullScreen,
}) => {
  const isToShop =
    order.navStage === 'to_shop' ||
    order.status === 'picking_up' ||
    order.status === 'accepted' ||
    order.status === 'arrived_at_pickup';

  const shopCoords: LocationPoint = order.shopLocation || {
    lat: 12.9785,
    lng: 77.645,
    name: order.restaurantName,
    address: order.restaurantAddress,
  };

  const customerCoords: LocationPoint = order.customerLocation || {
    lat: 12.963,
    lng: 77.638,
    name: order.customerName,
    address: order.deliveryAddress,
  };

  const startCoords: LocationPoint = order.riderStartLocation || {
    lat: 12.9716,
    lng: 77.6412,
  };

  const targetCoords = isToShop ? shopCoords : customerCoords;

  const [currentRiderPos, setCurrentRiderPos] = useState<LocationPoint>(startCoords);
  const [isSimulating] = useState<boolean>(true);
  const [simProgress, setSimProgress] = useState<number>(0);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [remainingDist, setRemainingDist] = useState<number>(order.distanceKm || 1.2);
  const [remainingEta, setRemainingEta] = useState<number>(order.estimatedMinutes || 4);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [navMode, setNavMode] = useState<'map' | 'satellite'>('map');

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapInstance = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);

  const shopSteps: NavStep[] = [
    { instruction: `Turn left onto 5th Main Rd`, dist: '150 m', turn: 'left' },
    { instruction: 'Continue on 100 Feet Rd toward Indiranagar Metro', dist: '300 m', turn: 'straight' },
    { instruction: 'Turn left onto Culinary Blvd', dist: '200 m', turn: 'left' },
    { instruction: `Arriving at ${order.restaurantName}`, dist: '50 m', turn: 'arrive' },
  ];

  const customerSteps: NavStep[] = [
    { instruction: 'Head South on Culinary Blvd toward Domlur', dist: '500 m', turn: 'straight' },
    { instruction: 'Take right at Serenity Signal', dist: '350 m', turn: 'right' },
    { instruction: 'Continue onto Park View Way', dist: '800 m', turn: 'straight' },
    { instruction: `Arriving at ${order.customerName}'s location`, dist: '30 m', turn: 'arrive' },
  ];

  const currentSteps = isToShop ? shopSteps : customerSteps;

  const speakInstruction = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  };

  // Announce step change
  useEffect(() => {
    if (currentSteps[currentStepIdx]) {
      speakInstruction(currentSteps[currentStepIdx].instruction);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIdx, isToShop]);

  // Simulation loop
  useEffect(() => {
    if (!isSimulating) return;
    const timer = setInterval(() => {
      setSimProgress((prev) => {
        if (prev >= 1) return 1;
        const next = prev + 0.015;

        const stepCount = currentSteps.length;
        const newStep = Math.min(stepCount - 1, Math.floor(next * stepCount));
        if (newStep !== currentStepIdx) setCurrentStepIdx(newStep);

        const origin = isToShop ? startCoords : shopCoords;
        const lat = origin.lat + (targetCoords.lat - origin.lat) * next;
        const lng = origin.lng + (targetCoords.lng - origin.lng) * next;
        setCurrentRiderPos({ lat, lng });

        const totalDist = order.distanceKm || 1.2;
        const totalEta = order.estimatedMinutes || 4;
        setRemainingDist(Math.max(0.1, +(totalDist * (1 - next)).toFixed(1)));
        setRemainingEta(Math.max(1, Math.ceil(totalEta * (1 - next))));

        return next;
      });
    }, 1200);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSimulating, isToShop, currentStepIdx]);

  // Reset when stage changes
  useEffect(() => {
    setSimProgress(0);
    setCurrentStepIdx(0);
    setRemainingDist(order.distanceKm || 1.2);
    setRemainingEta(order.estimatedMinutes || 4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isToShop]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Leaflet init
  useEffect(() => {
    if (!isMounted || typeof window === 'undefined' || !mapRef.current) return;

    let L: any;
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

        const map = L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false,
        }).setView([currentRiderPos.lat, currentRiderPos.lng], 15);

        leafletMapInstance.current = map;

        // 100% Free OpenStreetMap Tiles (Zero API key, Zero watermark)
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
          maxZoom: 19,
          subdomains: 'abc',
        }).addTo(map);

        // Blue arrow rider marker
        const riderIcon = L.divIcon({
          className: '',
          html: `
            <div style="width:36px;height:36px;position:relative;display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;width:36px;height:36px;border-radius:50%;background:rgba(37,99,235,0.18);animation:ping 1.8s infinite;"></div>
              <div style="position:relative;z-index:10;width:28px;height:28px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 3px 10px rgba(37,99,235,0.4);display:flex;align-items:center;justify-content:center;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>
              </div>
            </div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        // Shop marker — green circle with fork icon + label bubble
        const shopIcon = L.divIcon({
          className: '',
          html: `
            <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
              <div style="background:white;border-radius:6px;padding:2px 6px;font-size:10px;font-weight:700;color:#1a1a1a;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.18);line-height:1.4;">
                ${isToShop ? order.restaurantName : order.customerName}
              </div>
              <div style="width:34px;height:34px;border-radius:50%;background:#16a34a;border:3px solid #fff;box-shadow:0 3px 10px rgba(22,163,74,0.35);display:flex;align-items:center;justify-content:center;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round">
                  ${isToShop
                    ? '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>'
                    : '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'
                  }
                </svg>
              </div>
            </div>`,
          iconSize: [90, 54],
          iconAnchor: [45, 54],
        });

        // Destination label marker (road-side label like reference "Indiranagar 100 Feet Rd")
        const destLabelIcon = L.divIcon({
          className: '',
          html: `
            <div style="background:white;border-radius:6px;padding:2px 8px;font-size:10px;font-weight:600;color:#374151;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.15);border:1px solid #e5e7eb;line-height:1.5;">
              ${isToShop ? order.restaurantAddress?.split(',')[1]?.trim() || 'Indiranagar' : order.deliveryAddress?.split(',')[1]?.trim() || 'Domlur'}
            </div>`,
          iconSize: [140, 24],
          iconAnchor: [70, 12],
        });

        // Place markers
        L.marker([targetCoords.lat, targetCoords.lng], { icon: shopIcon }).addTo(map);

        // Show destination label slightly offset
        const midLat = (currentRiderPos.lat + targetCoords.lat) / 2;
        const midLng = (currentRiderPos.lng + targetCoords.lng) / 2;
        L.marker([midLat + 0.003, midLng + 0.002], { icon: destLabelIcon }).addTo(map);

        const riderMarker = L.marker([currentRiderPos.lat, currentRiderPos.lng], { icon: riderIcon }).addTo(map);
        riderMarkerRef.current = riderMarker;

        // Blue route polyline
        const routePoints = [
          [currentRiderPos.lat, currentRiderPos.lng],
          [midLat + 0.001, midLng - 0.003],
          [targetCoords.lat, targetCoords.lng],
        ];

        L.polyline(routePoints, {
          color: '#2563eb',
          weight: 5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);

        const bounds = L.latLngBounds([
          [currentRiderPos.lat, currentRiderPos.lng],
          [targetCoords.lat, targetCoords.lng],
        ]);
        map.fitBounds(bounds, { padding: [50, 60] });
      } catch (err) {
        console.warn('Leaflet map error:', err);
      }
    };

    initMap();

    return () => {
      if (leafletMapInstance.current) {
        leafletMapInstance.current.remove();
        leafletMapInstance.current = null;
      }
      if (mapRef.current) {
        (mapRef.current as any)._leaflet_id = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isToShop, isMounted, navMode]);

  // Update rider marker on map
  useEffect(() => {
    if (riderMarkerRef.current && currentRiderPos) {
      riderMarkerRef.current.setLatLng([currentRiderPos.lat, currentRiderPos.lng]);
      if (leafletMapInstance.current && isSimulating) {
        leafletMapInstance.current.panTo([currentRiderPos.lat, currentRiderPos.lng], {
          animate: true,
          duration: 0.8,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRiderPos]);

  const handleZoomIn = () => leafletMapInstance.current?.zoomIn();
  const handleZoomOut = () => leafletMapInstance.current?.zoomOut();
  const handleRecenter = () => {
    if (leafletMapInstance.current) {
      leafletMapInstance.current.panTo([currentRiderPos.lat, currentRiderPos.lng]);
    }
  };

  // Turn icon SVG for the banner
  const getTurnSvg = (turn: string) => {
    if (turn === 'left')
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      );
    if (turn === 'right')
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      );
    if (turn === 'arrive')
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
      );
    // straight (default)
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
    );
  };

  // Compute ETA clock time (current time + remaining minutes)
  const etaTime = (() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + remainingEta);
    return now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  })();

  // Google Maps navigation link
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${targetCoords.lat},${targetCoords.lng}&travelmode=driving`;

  const currentStep = currentSteps[currentStepIdx];

  return (
    <div
      className={`relative overflow-hidden transition-all duration-300 ${
        isFullScreen
          ? 'fixed inset-0 z-50 flex flex-col bg-white'
          : 'w-full rounded-2xl bg-white shadow-lg border border-slate-200 flex flex-col'
      }`}
    >
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />

      {/* ═══════════════════════════════════════════════
          MAP AREA (with all overlays INSIDE the map)
      ═══════════════════════════════════════════════ */}
      <div className={`relative w-full bg-slate-100 ${isFullScreen ? 'flex-1' : 'h-[260px]'}`}>
        {/* Leaflet map canvas */}
        <div ref={mapRef} className="w-full h-full z-10" />

        {/* ── OVERLAY: Turn-by-turn banner (top-left) ── */}
        <div className="absolute top-3 left-3 z-20 max-w-[72%]">
          <div className="bg-slate-900/95 backdrop-blur-sm rounded-xl px-3 py-2.5 flex items-center gap-2.5 shadow-xl">
            <div className="shrink-0">{getTurnSvg(currentStep?.turn || 'straight')}</div>
            <div>
              <p className="text-white font-black text-base leading-none">{currentStep?.dist || '150 m'}</p>
              <p className="text-slate-300 text-[11px] font-medium mt-0.5 leading-tight line-clamp-1">
                {currentStep?.instruction || 'Calculating route...'}
              </p>
            </div>
          </div>
        </div>

        {/* ── OVERLAY: Collapse/Minimize (top-right) ── */}
        {onToggleFullScreen && (
          <button
            onClick={onToggleFullScreen}
            className="absolute top-3 right-3 z-20 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center border border-slate-200 active:scale-95"
            title={isFullScreen ? 'Minimize Map' : 'Expand Map'}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#374151"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              {isFullScreen ? (
                <polyline points="18 15 12 9 6 15" />
              ) : (
                <polyline points="6 9 12 15 18 9" />
              )}
            </svg>
          </button>
        )}

        {/* ── OVERLAY: Right-side controls stack ── */}
        <div className="absolute top-14 right-3 z-20 flex flex-col gap-2">
          {/* Sound toggle */}
          <button
            onClick={() => setVoiceEnabled((v) => !v)}
            className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center border border-slate-200 active:scale-95"
            title="Toggle Voice"
          >
            {voiceEnabled ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
          </button>

          {/* Navigation mode toggle */}
          <button
            onClick={() => setNavMode((m) => (m === 'map' ? 'satellite' : 'map'))}
            className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center border border-slate-200 active:scale-95"
            title="Toggle Map Mode"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
          </button>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center border border-slate-200 font-bold text-slate-700 text-lg active:scale-95"
            title="Zoom In"
          >
            +
          </button>

          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center border border-slate-200 font-bold text-slate-700 text-lg active:scale-95"
            title="Zoom Out"
          >
            −
          </button>
        </div>

        {/* ── OVERLAY: Re-center button (bottom-left) ── */}
        <button
          onClick={handleRecenter}
          className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-md border border-slate-200 text-xs font-semibold text-slate-700 active:scale-95"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
          Re-center
        </button>
      </div>

      {/* ═══════════════════════════════════════════════
          STATS BAR — Distance | ETA | Exit
      ═══════════════════════════════════════════════ */}
      <div className="bg-white border-t border-slate-100 px-4 py-3 flex items-center">
        {/* Distance */}
        <div className="flex-1 text-center">
          <p className="text-[15px] font-black text-slate-900">{remainingDist} km</p>
          <p className="text-[10px] text-slate-500 font-medium">Distance</p>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-200 mx-2" />

        {/* ETA */}
        <div className="flex-1 text-center">
          <p className="text-[15px] font-black text-slate-900">{remainingEta} min</p>
          <p className="text-[10px] text-slate-500 font-medium">ETA • {etaTime}</p>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-200 mx-2" />

        {/* Exit button */}
        <div className="flex flex-col items-center gap-1">
          <button
            className="flex items-center gap-1 border border-red-400 text-red-500 rounded-full px-3 py-1 text-[11px] font-bold active:scale-95 hover:bg-red-50 transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Exit
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          GOOGLE MAPS LINK
      ═══════════════════════════════════════════════ */}
      <button
        type="button"
        onClick={() => {
          openTurnByTurnNavigation({
            lat: targetCoords.lat,
            lng: targetCoords.lng,
            label: isToShop ? order.restaurantName : order.customerName,
            address: isToShop ? order.restaurantAddress : order.deliveryAddress,
          });
        }}
        className="w-full bg-slate-50 border-t border-slate-100 px-4 py-2.5 flex items-center justify-center gap-1.5 text-[11px] font-bold text-blue-600 hover:bg-blue-50 transition-colors active:opacity-80 cursor-pointer"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span>Open in Google Maps for turn-by-turn navigation</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export const LiveNavigationMap = LiveRiderNavigation;
