import React, { useState } from 'react';
import { MapPin, ChevronDown, Zap, X, Check, Navigation, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';

const KGF_AREAS = [
  { id: 'area_robertsonpet', name: 'Robertsonpet Main', desc: 'Central Market & Clock Tower, KGF' },
  { id: 'area_andersonpet', name: 'Andersonpet Circle', desc: 'Bazaar Street & Bus Stand, KGF' },
  { id: 'area_geetha', name: 'Geetha Road', desc: '1st Cross & School Zone, KGF' },
  { id: 'area_coromandel', name: 'Coromandel / Marikuppam', desc: 'Colony & Railway Station, KGF' },
  { id: 'area_champion', name: 'Champion Reefs', desc: 'Hospital Road & Quarters, KGF' },
  { id: 'area_beml', name: 'BEML Nagar', desc: 'Township & Layout, KGF' },
  { id: 'area_oorgaum', name: 'Oorgaum', desc: 'Club Road & Main Gate, KGF' },
];

export const TopBar: React.FC = () => {
  const { isLoggedIn, userLandmark, userProfile, login } = useAuthStore();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');

  // Detailed deliverable location string
  const detailedAddressString = userProfile?.landmark 
    ? `${userProfile.landmark}, ${userProfile.addressLine1 || 'Robertsonpet'}, KGF` 
    : userLandmark?.trim() 
      ? `${userLandmark}, KGF` 
      : 'Robertsonpet Main, KGF 563122';

  const currentDisplayLocation = userProfile?.landmark || userLandmark?.trim() || 'Robertsonpet';

  const handleSelectArea = (areaName: string) => {
    login(areaName);
    setIsLocationModalOpen(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      login(customInput.trim());
      setCustomInput('');
      setIsLocationModalOpen(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-xs px-4 py-3 flex flex-col gap-2.5">
        {/* Row 1: Brand & User Action (Login or Profile Avatar) */}
        <div className="flex items-center justify-between gap-3">
          {/* Left: SnapIt Brand + 10-Min Delivery Tagline */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <img
              src="/images/snapit_logo.png"
              alt="SnapIt"
              className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="flex items-center gap-1.5">
              <span className="font-black text-2xl tracking-tight text-brand leading-none">SnapIt</span>
              <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-black text-[9.5px] px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5 uppercase tracking-wider">
                <Zap className="w-2.5 h-2.5 fill-amber-950" />
                10 MINS
              </span>
            </div>
          </Link>

          {/* Right: Login/Sign In Button or Profile Pill */}
          {isLoggedIn ? (
            <Link
              to="/profile"
              className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 rounded-full py-1.5 px-3 transition-all active:scale-95 shadow-2xs shrink-0"
              aria-label="My Account"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-bold text-gray-800 max-w-[90px] truncate">
                {userProfile?.name?.split(' ')[0] || 'Profile'}
              </span>
            </Link>
          ) : (
            <Link
              to="/profile"
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-brand hover:from-emerald-700 hover:to-emerald-800 text-white font-black text-xs px-4 py-2 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 shrink-0"
              aria-label="Sign In / Register"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>

        {/* Row 2: Spacious Detailed Delivery Location Bar */}
        <button
          onClick={() => setIsLocationModalOpen(true)}
          className="w-full bg-slate-50 hover:bg-emerald-50/50 border border-gray-200/80 hover:border-emerald-300/80 rounded-2xl px-3.5 py-2 flex items-center justify-between gap-2 transition-all active:scale-[0.99] text-left group shadow-xs"
          aria-label="Select delivery location"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-brand flex items-center justify-center shrink-0 group-hover:bg-brand group-hover:text-white transition-colors">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-gray-900 leading-none">
                  {isLoggedIn ? (userProfile?.landmark ? 'Deliver to Home' : 'Delivering to') : 'Delivery Location'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              </div>
              <p className="text-xs text-gray-600 font-semibold truncate leading-tight mt-0.5">
                {detailedAddressString}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-emerald-700 text-xs font-black shrink-0 pl-1">
            <span>Change</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-700 transition-colors" />
          </div>
        </button>
      </header>

      {/* ── Location & Delivery Area Selector Sheet ── */}
      <AnimatePresence>
        {isLocationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLocationModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Sheet */}
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="relative bg-white rounded-t-[2.5rem] shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden z-10"
            >
              {/* Header */}
              <div className="p-5 pb-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-lg text-gray-900 tracking-tight flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-brand" />
                    Delivering in KGF
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">Select your area for instant 10-15 minute delivery</p>
                </div>
                <button
                  onClick={() => setIsLocationModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto space-y-4">
                {/* Custom Address Input */}
                <form onSubmit={handleCustomSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Type custom spot (e.g. Near Big Temple)"
                      className="w-full pl-9.5 pr-3 py-2.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-brand text-white font-black text-xs rounded-2xl shadow-sm uppercase tracking-wider shrink-0 active:scale-95 transition-transform"
                  >
                    Set
                  </button>
                </form>

                {/* Popular KGF Areas Grid */}
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2.5">
                    Popular KGF Hubs &amp; Localities
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {KGF_AREAS.map((area) => {
                      const isSelected = currentDisplayLocation.toLowerCase().includes(area.name.toLowerCase());
                      return (
                        <button
                          key={area.id}
                          onClick={() => handleSelectArea(area.name)}
                          className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-[0.98] ${
                            isSelected
                              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-200'
                              : 'bg-gray-50/60 border-gray-100 hover:bg-gray-100/70'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-500'
                            }`}>
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-black text-xs text-gray-900">{area.name}</h4>
                              <p className="text-[10px] text-gray-500 font-medium">{area.desc}</p>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-xs">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
