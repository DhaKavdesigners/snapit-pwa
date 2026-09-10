'use client';

import React, { useState } from 'react';
import { ShieldAlert, XCircle } from 'lucide-react';

interface EmergencyBreakModalProps {
  isOpen: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export const EmergencyBreakModal: React.FC<EmergencyBreakModalProps> = ({
  isOpen,
  onConfirm,
  onClose,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for the emergency break.');
      return;
    }
    onConfirm(reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-6 animate-slide-up shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-black text-slate-900">Emergency Break</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center active:scale-95">
            <XCircle className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 leading-relaxed">
            Emergency breaks are logged and subject to admin audit review. Use only for genuine vehicle breakdowns, accidents, or urgent personal emergencies.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Reason for Emergency <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              placeholder="Describe your emergency situation..."
              rows={3}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-red-500 resize-none"
            />
            {error && <p className="text-[11px] font-semibold text-red-600 mt-1">{error}</p>}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] py-3 bg-red-600 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              Declare Emergency Break
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
