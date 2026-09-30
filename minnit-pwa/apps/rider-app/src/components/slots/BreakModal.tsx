'use client';

import React, { useState, useEffect } from 'react';
import { useRider } from '@/context/RiderContext';
import { computeBreakState } from '@/services/breakService';
import { getNow } from '@/services/mockService';
import { Coffee, AlertCircle, Play, XCircle, ShieldAlert } from 'lucide-react';

interface BreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEmergency?: () => void;
}

export const BreakModal: React.FC<BreakModalProps> = ({
  isOpen,
  onClose,
  onOpenEmergency,
}) => {
  const { riderBreak, adminConfig, startBreak, endBreak } = useRider();
  const [now, setNow] = useState(getNow());

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setNow(getNow()), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const breakState = computeBreakState(riderBreak, adminConfig.break, now);
  const isBreakActive = riderBreak && !riderBreak.endedAt;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-6 animate-slide-up shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-black text-slate-900">
              {isBreakActive ? 'Break In Progress' : 'Take a Break'}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center active:scale-95">
            <XCircle className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {isBreakActive ? (
          <div className="flex flex-col gap-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Break Remaining</p>
              <h3 className="text-4xl font-black text-amber-600 font-mono my-2">
                {breakState.displayCountdown}
              </h3>
              <div className="w-full bg-amber-100 rounded-full h-2 overflow-hidden mt-3">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${breakState.percentUsed}%` }}
                />
              </div>
            </div>

            {breakState.isGrace && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>Break allowance exceeded. Please resume online mode.</span>
              </div>
            )}

            <button
              onClick={() => {
                endBreak();
                onClose();
              }}
              className="w-full py-3.5 bg-primary text-white font-bold text-xs rounded-xl shadow-lift active:scale-95 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              Resume Online Now
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              You are entitled to <strong>{adminConfig.break.allowedBreakMinutes} minutes</strong> break allowance per slot. Taking a break is optional and has no penalties if kept within allowance.
            </p>

            <div className="bg-slate-50 rounded-xl p-3 text-[11px] text-slate-500 border border-slate-200 space-y-1">
              <p>• No new orders assigned during break.</p>
              <p>• Additional time beyond allowance may be subject to rider policy.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  startBreak();
                  onClose();
                }}
                className="flex-1 py-3 bg-amber-500 text-white font-bold text-xs rounded-xl shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Coffee className="w-4 h-4" />
                Start 15m Break
              </button>

              {onOpenEmergency && adminConfig.break.emergencyBreakEnabled && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenEmergency();
                  }}
                  className="py-3 px-3 border border-red-200 bg-red-50 text-red-600 font-bold text-xs rounded-xl active:scale-95 flex items-center justify-center gap-1"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Emergency
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
