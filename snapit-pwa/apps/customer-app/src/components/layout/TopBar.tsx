import React from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuthStore } from '../../store/authStore';

export const TopBar: React.FC = () => {
  const { isLoggedIn, userLandmark } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm px-4 h-14 flex items-center justify-between">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <img
          src="/images/snapit_logo.png"
          alt="SnapIt Logo"
          className="h-10 w-auto object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <span className="font-black text-xl tracking-tight text-brand">SnapIt</span>
      </Link>

      {/* Delivery Location Selector */}
      {isLoggedIn ? (
        <button
          className="flex flex-col items-end gap-0 active:opacity-70 transition-opacity"
          aria-label="Change delivery location"
        >
          <span className="text-[10px] text-gray-400 font-medium leading-none">Delivering to</span>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="h-3.5 w-3.5 text-brand fill-brand/20" />
            <span className="text-sm font-black text-gray-900">{userLandmark}</span>
            <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
          </div>
        </button>
      ) : (
        <Link
          to="/profile"
          className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-3 py-1.5 rounded-full font-semibold text-xs flex items-center gap-1.5 shadow-sm hover:scale-105 transition-transform cursor-pointer"
        >
          📍 Where should we deliver? ▾
        </Link>
      )}
    </header>
  );
};
