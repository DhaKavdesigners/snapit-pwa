'use client';

import React, { useState } from 'react';
import { useRider } from '@/context/RiderContext';
import { getSessionRemainingMs, formatRemainingSessionTime } from '@/services/sessionService';
import { Power } from 'lucide-react';

interface EndSessionEarlyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EndSessionEarlyModal: React.FC<EndSessionEarlyModalProps> = ({ isOpen, onClose }) => {
  const { activeSession, endSessionEarly } = useRider();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const remainingMs = getSessionRemainingMs(activeSession);
  const remainingStr = formatRemainingSessionTime(remainingMs);

  const handleConfirmOffline = async () => {
    setIsSubmitting(true);
    try {
      await endSessionEarly();
      onClose();
    } catch {
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 animate-scale-up text-center space-y-4 relative mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Power Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
          <Power className="w-7 h-7 stroke-[2.5]" />
        </div>

        {/* Title & Prompt */}
        <div>
          <h3 className="text-base font-black text-slate-900">
            Ending Session Early
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            You still have <strong className="text-slate-800 font-black">{remainingStr}</strong> in your active session. Do you want to go offline?
          </p>
        </div>


        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
          >
            CONTINUE RIDING
          </button>

          <button
            type="button"
            onClick={handleConfirmOffline}
            disabled={isSubmitting}
            className="w-full py-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
            ) : (
              <span>GO OFFLINE</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
