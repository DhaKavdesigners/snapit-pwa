'use client';

import React, { useState } from 'react';
import { useRider } from '@/context/RiderContext';
import { Clock, Plus, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface ExtendSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExtendSessionModal: React.FC<ExtendSessionModalProps> = ({ isOpen, onClose }) => {
  const { activeSession, extendSession } = useRider();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !activeSession) return null;

  const currentEndMs = new Date(activeSession.committed_until).getTime();
  const newEndMs = currentEndMs + 60 * 60000;

  const formatTime = (ms: number) => {
    return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleConfirmExtend = async () => {
    setIsSubmitting(true);
    try {
      const ok = await extendSession(1);
      if (ok) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          onClose();
        }, 1200);
      } else {
        onClose();
      }
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
        {/* Top Icon */}
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
          {isSuccess ? (
            <CheckCircle2 className="w-7 h-7 text-emerald-600 stroke-[2.5]" />
          ) : (
            <Clock className="w-7 h-7 stroke-[2.5]" />
          )}
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-lg font-black text-slate-900">
            {isSuccess ? 'Session Extended!' : 'Extend Riding Session?'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {isSuccess
              ? 'Your riding session has been extended by 1 hour.'
              : 'Add +1 hour to your active session to keep receiving delivery orders.'}
          </p>
        </div>

        {/* Time Comparison Pill */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 flex items-center justify-around text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Current End</span>
            <span className="font-mono font-black text-slate-700">{formatTime(currentEndMs)}</span>
          </div>

          <div className="text-emerald-600 font-black text-sm">
            →
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-emerald-700 block">New End (+1 Hr)</span>
            <span className="font-mono font-black text-emerald-600">{formatTime(newEndMs)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isSuccess}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmExtend}
            disabled={isSubmitting || isSuccess}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isSuccess ? (
              <span>Extended!</span>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Extend 1 Hour</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
