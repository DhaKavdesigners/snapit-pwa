'use client';

import React, { useState, useEffect } from 'react';
import { useRider } from '@/context/RiderContext';
import { Crosshair, Layers, Zap } from 'lucide-react';

interface LiveMapProps {
  showRoute?: boolean;
  interactive?: boolean;
}

export const LiveMap: React.FC<LiveMapProps> = ({ showRoute = false, interactive = true }) => {
  const { isOnline, activeOrder } = useRider();
  const [pulse, setPulse] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Periodic rider pulse effect
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((p) => !p);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#e8ecef] select-none">
      {/* Background Graphic Map Layer from Stitch Asset */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-500 scale-105"
        style={{
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBgtdbyFa1-Md0dje5eC0PGii_kvQZXy3o-YKjm93DNqIpa_oEFEYWjpWIjQnk8dRhZKvuUouY2Lnc34P-ZR0nhLbvNECl_aC6Jytk_tziH1Z6zwK4qRbk0aNXxql50yMmFjGEsS8Vd_HiG4Df_ILUgQluS6nX9OA4A58UIWOZHcxYsxs5-mmBNw-Rv-0onSBFBDjFUjaOlcBBUcv6JrJpOyrwiKD5G868NGPi6o8YABlk3v17WdSFUEg')`,
        }}
      />

      {/* SVG Vector Dynamic Map Overlays */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 800">
        <defs>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#006e2f" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <radialGradient id="heatGlow1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(34, 197, 94, 0.45)" />
            <stop offset="70%" stopColor="rgba(34, 197, 94, 0.15)" />
            <stop offset="100%" stopColor="rgba(34, 197, 94, 0)" />
          </radialGradient>
          <radialGradient id="heatGlow2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(234, 179, 8, 0.4)" />
            <stop offset="80%" stopColor="rgba(234, 179, 8, 0.05)" />
            <stop offset="100%" stopColor="rgba(234, 179, 8, 0)" />
          </radialGradient>
        </defs>

        {/* Heatmap demand hot zones */}
        {showHeatmap && (
          <g className="transition-opacity duration-300">
            {/* Zone 1: Downtown Central High Demand */}
            <circle cx="210" cy="380" r="110" fill="url(#heatGlow1)" />
            {/* Zone 2: Tech Park Surge */}
            <circle cx="290" cy="240" r="85" fill="url(#heatGlow2)" />
            {/* Zone 3: Food Hub */}
            <circle cx="120" cy="460" r="75" fill="url(#heatGlow1)" />
          </g>
        )}

        {/* Active Route Pathing if on active order */}
        {showRoute && (
          <g>
            {/* Main navigation route line */}
            <path
              d="M 195 430 Q 230 350 250 280 T 210 200"
              fill="none"
              stroke="#006e2f"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="8 6"
              className="animate-pulse"
            />
            {/* Inner neon line */}
            <path
              d="M 195 430 Q 230 350 250 280 T 210 200"
              fill="none"
              stroke="#6bff8f"
              strokeWidth="3"
              strokeLinecap="round"
            />
            
            {/* Restaurant Pickup Pin */}
            <circle cx="195" cy="430" r="12" fill="#006e2f" />
            <circle cx="195" cy="430" r="6" fill="#ffffff" />
            
            {/* Customer Dropoff Pin */}
            <circle cx="210" cy="200" r="12" fill="#ba1a1a" />
            <circle cx="210" cy="200" r="6" fill="#ffffff" />
          </g>
        )}

        {/* Live Rider Position Pin (GPS) */}
        <g transform="translate(195, 430)">
          {/* Radar Waves */}
          {isOnline && (
            <>
              <circle cx="0" cy="0" r="28" fill="rgba(34, 197, 94, 0.25)" className="radar-ring" />
              <circle cx="0" cy="0" r="45" fill="rgba(34, 197, 94, 0.15)" className="radar-ring" style={{ animationDelay: '0.7s' }} />
            </>
          )}

          {/* Core Rider Pin */}
          <circle
            cx="0"
            cy="0"
            r="16"
            fill={isOnline ? '#006e2f' : '#565e74'}
            stroke="#ffffff"
            strokeWidth="3"
            filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.25))"
          />

          {/* Direction Heading Pointer */}
          <polygon
            points="0,-22 -7,-14 7,-14"
            fill={isOnline ? '#22c55e' : '#565e74'}
            stroke="#ffffff"
            strokeWidth="1.5"
          />

          {/* Scooter Icon inside marker */}
          <circle cx="0" cy="0" r="4" fill="#ffffff" />
        </g>
      </svg>

      {/* Floating Map Controls (Right Side) */}
      {interactive && (
        <div className="absolute right-4 top-24 z-20 flex flex-col gap-2 pointer-events-auto">
          {/* Center Rider GPS */}
          <button
            onClick={() => setZoomLevel(1)}
            className="w-10 h-10 rounded-full glass-panel shadow-soft flex items-center justify-center text-on-surface hover:bg-white transition-all active:scale-90"
            title="Recenter Map"
          >
            <Crosshair className="w-5 h-5 text-primary" />
          </button>

          {/* Toggle Heatmap */}
          <button
            onClick={() => setShowHeatmap((h) => !h)}
            className={`w-10 h-10 rounded-full glass-panel shadow-soft flex items-center justify-center transition-all active:scale-90 ${
              showHeatmap ? 'text-primary bg-primary/10 border-primary/40' : 'text-secondary'
            }`}
            title="Toggle Demand Heatmap"
          >
            <Layers className="w-5 h-5" />
          </button>

          {/* Surge indicator */}
          <div className="w-10 h-10 rounded-full bg-amber-500 text-white shadow-soft flex items-center justify-center animate-bounce">
            <Zap className="w-5 h-5 fill-current" />
          </div>
        </div>
      )}
    </div>
  );
};
