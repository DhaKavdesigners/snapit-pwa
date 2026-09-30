'use client';

import React from 'react';
import { useRider } from '@/context/RiderContext';
import { User, Wrench } from 'lucide-react';

export const TestModeToggle: React.FC = () => {
  const { testMode, setTestMode } = useRider();

  return (
    <div className="inline-flex items-center p-0.5 bg-slate-200/80 border border-slate-300/80 rounded-full shadow-inner text-[10px] font-bold shrink-0">
      <button
        onClick={() => setTestMode('driver')}
        className={`px-2 py-0.5 rounded-full flex items-center gap-1 transition-all duration-200 active:scale-95 ${
          testMode === 'driver'
            ? 'bg-white text-slate-900 shadow-sm font-extrabold'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        title="Rider Mode: Real system time & real GPS"
      >
        <User className={`w-3 h-3 ${testMode === 'driver' ? 'text-primary' : 'text-slate-500'}`} />
        <span>Rider</span>
      </button>

      <button
        onClick={() => setTestMode('tester')}
        className={`px-2 py-0.5 rounded-full flex items-center gap-1 transition-all duration-200 active:scale-95 ${
          testMode === 'tester'
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm font-extrabold ring-1 ring-purple-400/30'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        title="Tester Mode: Enable simulated time & simulated location"
      >
        <Wrench className={`w-3 h-3 ${testMode === 'tester' ? 'text-amber-300' : 'text-slate-500'}`} />
        <span>Tester</span>
      </button>
    </div>
  );
};

