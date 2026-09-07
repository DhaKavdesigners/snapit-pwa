'use client';

import React, { useState } from 'react';
import { useRider } from '@/context/RiderContext';
import { Building2, Edit3, ShieldCheck, X, Check } from 'lucide-react';

export const PaymentAccountCard: React.FC = () => {
  const { rider, updateRiderProfile } = useRider();
  const [isEditing, setIsEditing] = useState(false);
  const [inputUpi, setInputUpi] = useState(rider.upiId || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Formatted / masked display of UPI
  const displayUpi = rider.upiId
    ? rider.upiId.length > 6
      ? `••••${rider.upiId.slice(-4)}`
      : rider.upiId
    : '••••1234';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUpi.trim()) return;

    updateRiderProfile({ upiId: inputUpi.trim() });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsEditing(false);
    }, 900);
  };

  return (
    <>
      <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 flex flex-col gap-3">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
          Payment Account
        </span>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-100/80">
              <span className="font-mono text-xs font-black">UPI</span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black font-mono text-slate-900">
                  {displayUpi}
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Primary payout account
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setInputUpi(rider.upiId || '');
              setIsEditing(true);
            }}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/90 px-3 py-1.5 rounded-xl transition-colors active:scale-95 cursor-pointer"
          >
            Edit →
          </button>
        </div>
      </div>

      {/* Edit UPI Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 animate-slide-up">
            {/* Modal Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                  UPI
                </div>
                <h3 className="font-black text-sm text-slate-900">Update Payout Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex flex-col gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Registered UPI ID
                </label>
                <input
                  type="text"
                  value={inputUpi}
                  onChange={(e) => setInputUpi(e.target.value)}
                  placeholder="e.g. yourname@okhdfcbank"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-600 focus:bg-white transition-colors"
                  required
                />
                <p className="text-[10px] text-slate-400">
                  Razorpay payouts will be credited to this UPI account.
                </p>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lift active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save UPI</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
