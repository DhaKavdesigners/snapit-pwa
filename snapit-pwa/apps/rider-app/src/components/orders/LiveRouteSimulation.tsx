'use client';

import React, { useState, useEffect } from 'react';
import { Order } from '@/types';
import { Navigation2, Volume2, Compass, X } from 'lucide-react';

interface LiveRouteSimulationProps {
  order: Order;
  onClose: () => void;
}

export const LiveRouteSimulation: React.FC<LiveRouteSimulationProps> = ({
  order,
  onClose,
}) => {
  const [eta, setEta] = useState(order.estimatedMinutes || 8);
  const [distance, setDistance] = useState(order.distanceKm || 2.5);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    { instruction: 'Head North on 5th Main Rd towards Culinary Blvd', dist: '250m' },
    { instruction: 'In 300m, Turn Right at signal onto Park View Way', dist: '800m' },
    { instruction: 'Continue straight through Serenity Roundabout', dist: '1.2 km' },
    { instruction: 'Arriving at destination on left: Apt 4B, Serenity Towers', dist: '150m' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % steps.length);
      setDistance((prev) => Math.max(0.2, +(prev - 0.3).toFixed(1)));
      setEta((prev) => Math.max(1, prev - 1));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col justify-between overflow-hidden animate-fade-in">
      {/* Top Turn Navigation Header Banner */}
      <div className="p-4 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between shadow-2xl z-20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-glow">
            <Navigation2 className="w-7 h-7 transform rotate-45 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-bold text-primary-fixed uppercase tracking-wider">
              {steps[stepIndex].dist}
            </span>
            <h2 className="text-sm font-bold text-slate-100 max-w-[240px] leading-snug">
              {steps[stepIndex].instruction}
            </h2>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Simulated 3D GPS Perspective Canvas */}
      <div className="flex-1 relative bg-slate-950 overflow-hidden flex items-center justify-center">
        {/* Animated 3D Road Grid */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, #006e2f 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Animated central highway road */}
        <div className="w-48 h-full bg-slate-800/80 border-x-4 border-slate-600 relative overflow-hidden flex flex-col items-center justify-between">
          <div className="w-1 h-full border-r-2 border-dashed border-yellow-400/80" />

          {/* Moving GPS Arrow */}
          <div className="absolute bottom-16 w-12 h-12 bg-primary rounded-full border-4 border-white flex items-center justify-center shadow-2xl animate-bounce">
            <Navigation2 className="w-6 h-6 text-white transform -rotate-45" />
          </div>
        </div>

        {/* Floating Cockpit Overlay Info */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700">
          <Compass className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '10s' }} />
          <span className="text-xs font-mono font-bold text-slate-200">36 km/h</span>
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700">
          <Volume2 className="w-4 h-4 text-primary-fixed" />
          <span className="text-xs font-semibold text-slate-200">Audio On</span>
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="p-4 bg-slate-950/95 border-t border-slate-800 flex items-center justify-between z-20">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-primary-fixed font-mono">{eta} min</span>
            <span className="text-xs text-slate-400 font-mono">({distance} km)</span>
          </div>
          <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
            To: {order.deliveryAddress}
          </p>
        </div>

        <button
          onClick={onClose}
          className="bg-red-600/90 hover:bg-red-600 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg transition-colors flex items-center gap-1.5"
        >
          Exit Route
        </button>
      </div>
    </div>
  );
};
