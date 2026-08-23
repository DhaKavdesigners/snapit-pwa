import React, { useState } from 'react';
import { MapPin, ChevronDown, Zap, X, Check, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';

const KGF_AREAS = [
  { id: 'area_robertsonpet', name: 'Robertsonpet Main', desc: 'Central Market & Clock Tower' },
  { id: 'area_andersonpet', name: 'Andersonpet Circle', desc: 'Bazaar Street & Bus Stand' },
  { id: 'area_geetha', name: 'Geetha Road', desc: '1st Cross & School Zone' },
  { id: 'area_coromandel', name: 'Coromandel / Marikuppam', desc: 'Colony & Railway Station' },
  { id: 'area_champion', name: 'Champion Reefs', desc: 'Hospital Road & Quarters' },
  { id: 'area_beml', name: 'BEML Nagar', desc: 'Township & Layout' },
  { id: 'area_oorgaum', name: 'Oorgaum', desc: 'Club Road & Main Gate' },
];

export const TopBar: React.FC = () => {
  const { isLoggedIn, userLandmark, login } = useAuthStore();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const currentDisplayLocation = userLandmark?.trim() || 'Robertsonpet, KGF';

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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100/90 shadow-xs px-3.5 h-15 flex items-center justify-between">
        {/* Left Side: Brand Logo & 10 MINS Speed Badge */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <div className="relative flex items-center justify-center">
            <img
              src="/images/snapit_logo.png"
              alt="SnapIt"
              className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xl tracking-tight text-brand leading-none">SnapIt</span>
              <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-xs flex items-center gap-0.5 uppercase tracking-wider animate-pulse">
                <Zap className="w-2.5 h-2.5 fill-amber-950" />
                10m
              </span>
            </div>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-tight mt-0.5">
              KGF Quick Delivery
            </span>
          </div>
        </Link>

        {/* Right Side: Interactive Location Pill */}
        <button
          onClick={() => setIsLocationModalOpen(true)}
          className="flex flex-col items-end text-right bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 border border-emerald-200/80 rounded-2xl px-2.5 py-1 shadow-xs hover:border-emerald-300 active:scale-96 transition-all max-w-[170px]"
          aria-label="Select delivery location"
        >
          <div className="flex items-center gap-1 leading-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <span className="text-[9.5px] text-emerald-800 font-black uppercase tracking-wider">
              10-15 Min Drop
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5 max-w-full">
            <MapPin className="h-3 w-3 text-brand shrink-0" />
            <span className="text-xs font-black text-gray-900 truncate">
              {currentDisplayLocation}
            </span>
            <ChevronDown className="h-3 w-3 text-gray-400 shrink-0" />
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
