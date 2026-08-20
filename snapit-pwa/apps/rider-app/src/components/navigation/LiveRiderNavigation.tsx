'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRider } from '@/context/RiderContext';
import { Order, LocationPoint } from '@/types';
import {
  Navigation2,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Store,
  Home,
  Sparkles,
  Compass,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Flag,
  Plus,
  Minus,
  Crosshair,
} from 'lucide-react';

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
  onCloseNav,
}) => {
  // Navigation Stage: 'to_shop' or 'to_customer'
  const isToShop =
    order.navStage === 'to_shop' ||
    order.status === 'picking_up' ||
    order.status === 'accepted' ||
    order.status === 'arrived_at_pickup';

  // Target Destination Coordinates
  const shopCoords: LocationPoint = order.shopLocation || {
    lat: 12.9785,
    lng: 77.6450,
    name: order.restaurantName,
    address: order.restaurantAddress,
  };

  const customerCoords: LocationPoint = order.customerLocation || {
    lat: 12.9630,
    lng: 77.6380,
    name: order.customerName,
    address: order.deliveryAddress,
  };

  const startCoords: LocationPoint = order.riderStartLocation || {
    lat: 12.9716,
    lng: 77.6412,
  };

  const targetCoords = isToShop ? shopCoords : customerCoords;

  // Rider position state
  const [currentRiderPos, setCurrentRiderPos] = useState<LocationPoint>(startCoords);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [simProgress, setSimProgress] = useState<number>(0); // 0 to 1
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [remainingDist, setRemainingDist] = useState<number>(order.distanceKm || 2.5);
  const [remainingEta, setRemainingEta] = useState<number>(order.estimatedMinutes || 8);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapInstance = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  // Turn-by-turn steps tailored for current stage
  const shopSteps: NavStep[] = [
    { instruction: 'Head East on 100 Feet Rd toward Indiranagar Metro', dist: '300m', turn: 'straight' },
    { instruction: 'In 200m, turn Left onto Culinary Blvd', dist: '200m', turn: 'left' },
    { instruction: 'Continue 400m past Food District Park', dist: '400m', turn: 'straight' },
    { instruction: `Arriving at Shop on right: ${order.restaurantName}`, dist: '50m', turn: 'arrive' },
  ];

  const customerSteps: NavStep[] = [
    { instruction: 'Head South on Culinary Blvd toward Domlur Flyover', dist: '500m', turn: 'straight' },
    { instruction: 'In 350m, take Right turn at Serenity Signal', dist: '350m', turn: 'right' },
    { instruction: 'Merge onto Park View Way toward Serenity Towers', dist: '800m', turn: 'straight' },
    { instruction: `Arrived at Customer location: ${order.deliveryAddress}`, dist: '30m', turn: 'arrive' },
  ];

  const currentSteps = isToShop ? shopSteps : customerSteps;

  // Audio Voice Prompt (Web Speech API)
  const speakInstruction = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
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
  }, [currentStepIdx, isToShop]);

  // Real GPS Geolocation Watcher
  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!isSimulating) {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentRiderPos(newPos);
        }
      },
      (err) => {
        console.log('GPS watch fallback to simulation:', err.message);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isSimulating]);

  // Simulation loop along interpolating polyline path
  useEffect(() => {
    if (!isSimulating) return;

    const intervalTime = 1000 / simSpeed;
    const timer = setInterval(() => {
      setSimProgress((prev) => {
        if (prev >= 1) {
          return 1;
        }
        const next = prev + 0.03;

        const stepCount = currentSteps.length;
        const newStep = Math.min(stepCount - 1, Math.floor(next * stepCount));
        if (newStep !== currentStepIdx) {
          setCurrentStepIdx(newStep);
        }

        const origin = isToShop ? startCoords : shopCoords;
        const target = targetCoords;

        const currentLat = origin.lat + (target.lat - origin.lat) * next;
        const currentLng = origin.lng + (target.lng - origin.lng) * next;

        setCurrentRiderPos({ lat: currentLat, lng: currentLng });

        const totalDist = order.distanceKm || 2.5;
        const totalEta = order.estimatedMinutes || 8;
        setRemainingDist(Math.max(0.1, +(totalDist * (1 - next)).toFixed(1)));
        setRemainingEta(Math.max(1, Math.ceil(totalEta * (1 - next))));

        // Random off-path auto-reroute simulation trigger at 40% progress
        if (Math.abs(next - 0.4) < 0.015 && !isRecalculating) {
          setIsRecalculating(true);
          setTimeout(() => setIsRecalculating(false), 2000);
        }

        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isSimulating, simSpeed, isToShop, currentStepIdx, isRecalculating]);

  // Reset simulation progress when stage changes (Store -> Customer)
  useEffect(() => {
    setSimProgress(0);
    setCurrentStepIdx(0);
    setRemainingDist(isToShop ? order.distanceKm : Math.max(1.2, +(order.distanceKm * 0.8).toFixed(1)));
    setRemainingEta(isToShop ? order.estimatedMinutes : Math.max(4, order.estimatedMinutes - 2));
  }, [isToShop]);

  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Leaflet Map Initialization and Tile rendering
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

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd',
        }).addTo(map);

        // Scooter Rider Pin
        const riderIcon = L.divIcon({
          className: 'custom-rider-pin',
          html: `
            <div style="position: relative; width: 44px; height: 44px; display: flex; items-center; justify-content: center;">
              <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(0, 110, 47, 0.25); animation: ping 1.8s infinite;"></div>
              <div style="position: relative; z-index: 10; width: 34px; height: 34px; border-radius: 50%; background: #006e2f; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
                </svg>
              </div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });

        // Destination Marker (Shop vs Customer)
        const destIcon = L.divIcon({
          className: 'custom-dest-pin',
          html: `
            <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
              <div style="width: 36px; height: 36px; border-radius: 50%; background: ${isToShop ? '#006e2f' : '#ba1a1a'}; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white;">
                ${
                  isToShop
                    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>`
                    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="10" r="3"></circle><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path></svg>`
                }
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        L.marker([targetCoords.lat, targetCoords.lng], { icon: destIcon }).addTo(map);

        const riderMarker = L.marker([currentRiderPos.lat, currentRiderPos.lng], { icon: riderIcon }).addTo(map);
        riderMarkerRef.current = riderMarker;

        const routePoints = [
          [currentRiderPos.lat, currentRiderPos.lng],
          [(currentRiderPos.lat + targetCoords.lat) / 2 + 0.002, (currentRiderPos.lng + targetCoords.lng) / 2 - 0.002],
          [targetCoords.lat, targetCoords.lng],
        ];

        const polyline = L.polyline(routePoints, {
          color: '#006e2f',
          weight: 6,
          opacity: 0.9,
          dashArray: '8, 8',
          lineCap: 'round',
        }).addTo(map);

        polylineRef.current = polyline;

        const bounds = L.latLngBounds([
          [currentRiderPos.lat, currentRiderPos.lng],
          [targetCoords.lat, targetCoords.lng],
        ]);
        map.fitBounds(bounds, { padding: [40, 40] });
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
  }, [isToShop, isMounted]);

  // Update Rider Marker position dynamically on map
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
  }, [currentRiderPos, isSimulating]);

  // Map Controls: Zoom In, Zoom Out, Recenter
  const handleZoomIn = () => {
    if (leafletMapInstance.current) {
      leafletMapInstance.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (leafletMapInstance.current) {
      leafletMapInstance.current.zoomOut();
    }
  };

  const handleRecenter = () => {
    if (leafletMapInstance.current) {
      leafletMapInstance.current.panTo([currentRiderPos.lat, currentRiderPos.lng]);
    }
  };

  // Turn step icon renderer
  const renderTurnIcon = (turn: string) => {
    switch (turn) {
      case 'left':
        return <ArrowLeft className="w-7 h-7 text-emerald-400" />;
      case 'right':
        return <ArrowRight className="w-7 h-7 text-emerald-400" />;
      case 'u-turn':
        return <RotateCcw className="w-7 h-7 text-amber-400" />;
      case 'arrive':
        return <Flag className="w-7 h-7 text-primary-fixed" />;
      default:
        return <ArrowUp className="w-7 h-7 text-emerald-400" />;
    }
  };

  return (
    <div
      className={`relative overflow-hidden transition-all duration-300 ${
        isFullScreen
          ? 'fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between'
          : 'w-full rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col h-[380px]'
      }`}
    >
      {/* Inject Leaflet CSS for map styling */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />

      {/* TOP TURN-BY-TURN GUIDANCE HEADER */}
      <div className="z-20 bg-slate-950/95 backdrop-blur-md p-3.5 border-b border-slate-800 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center shadow-glow shrink-0">
            {renderTurnIcon(currentSteps[currentStepIdx]?.turn || 'straight')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-widest font-mono">
                {currentSteps[currentStepIdx]?.dist || '100m'}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                {isToShop ? 'NAVIGATING TO SHOP' : 'NAVIGATING TO CUSTOMER'}
              </span>
            </div>
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-100 mt-0.5 line-clamp-1">
              {currentSteps[currentStepIdx]?.instruction}
            </h2>
          </div>
        </div>

        {/* Action Controls: Voice & FullScreen Expand/Minimize */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVoiceEnabled((v) => !v)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              voiceEnabled ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
            }`}
            title="Toggle Voice Navigation"
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {onToggleFullScreen && (
            <button
              onClick={onToggleFullScreen}
              className="w-9 h-9 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center justify-center transition-colors"
              title={isFullScreen ? 'Minimize Map' : 'Expand Map to Full Screen'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          {isFullScreen && onCloseNav && (
            <button
              onClick={onCloseNav}
              className="text-xs font-bold text-slate-400 hover:text-white px-2 py-1"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* RECALCULATING ROUTE WARNING OVERLAY */}
      {isRecalculating && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-30 bg-amber-500 text-slate-950 font-bold text-xs px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 fill-current" />
          <span>Off Route – Auto-Recalculating Path...</span>
        </div>
      )}

      {/* MAP CANVAS CONTAINER */}
      <div className="relative flex-1 w-full bg-slate-900 overflow-hidden">
        {/* Leaflet Map Div */}
        <div ref={mapRef} className="w-full h-full z-10" />

        {/* FLOATING TOP-LEFT SPEEDOMETER & RIDE SIMULATOR CONTROLS */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
          <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-800 flex items-center gap-2 shadow-soft">
            <Compass className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span className="text-xs font-mono font-bold text-slate-200">
              {isSimulating ? `${Math.floor(28 * simSpeed)} km/h` : 'Live GPS'}
            </span>
          </div>

          <button
            onClick={() => setIsSimulating((s) => !s)}
            className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1.5 shadow-soft active:scale-95"
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isSimulating ? 'Pause' : 'Simulate'}</span>
          </button>
        </div>

        {/* FLOATING RIGHT-SIDE PURE MAP CONTROLS: ZOOM IN (+), ZOOM OUT (-), RECENTER */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
          <button
            onClick={handleRecenter}
            className="w-9 h-9 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-200 flex items-center justify-center shadow-soft hover:bg-slate-800 active:scale-95"
            title="Recenter Location"
          >
            <Crosshair className="w-4 h-4 text-emerald-400" />
          </button>

          <button
            onClick={handleZoomIn}
            className="w-9 h-9 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-200 flex items-center justify-center shadow-soft hover:bg-slate-800 active:scale-95 font-bold"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            onClick={handleZoomOut}
            className="w-9 h-9 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-200 flex items-center justify-center shadow-soft hover:bg-slate-800 active:scale-95 font-bold"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* BOTTOM PURE NAVIGATION INFO OVERLAY (NO WORKFLOW BUTTONS INSIDE MAP) */}
      <div className="z-20 bg-slate-950/95 backdrop-blur-md p-3.5 border-t border-slate-800 flex items-center justify-between shadow-2xl">
        {/* Remaining ETA & Distance */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-emerald-400 font-mono leading-none">
            {remainingEta} min
          </span>
          <span className="text-xs font-mono font-semibold text-slate-400">
            ({remainingDist} km away)
          </span>
        </div>

        {/* Current Destination Name & Address */}
        <div className="text-right max-w-[200px]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 justify-end">
            {isToShop ? <Store className="w-3.5 h-3.5 text-emerald-400" /> : <Home className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isToShop ? order.restaurantName : order.customerName}</span>
          </p>
          <p className="text-xs text-slate-300 truncate mt-0.5">
            {isToShop ? order.restaurantAddress : order.deliveryAddress}
          </p>
        </div>
      </div>
    </div>
  );
};

// Re-export alias LiveNavigationMap
export const LiveNavigationMap = LiveRiderNavigation;
