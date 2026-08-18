'use client';

import React, { useState } from 'react';
import { useRider } from '@/context/RiderContext';
import { X, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

interface CashoutModalProps {
  onClose: () => void;
}

export const CashoutModal: React.FC<CashoutModalProps> = ({ onClose }) => {
  const { earnings, rider, cashoutEarnings } = useRider();
  const [amount, setAmount] = useState(earnings.today);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCashout = () => {
    if (amount <= 0 || amount > earnings.today) return;
    setIsProcessing(true);
    setTimeout(() => {
      cashoutEarnings(amount);
      setIsProcessing(false);
      setIsSuccess(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-5 animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
            <div>
              <h2 className="font-bold text-base text-on-surface">Instant Payout</h2>
              <p className="text-[11px] text-secondary">Direct UPI Transfer (Zero fee)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          /* Transfer Success Receipt State */
          <div className="flex flex-col items-center text-center py-4 gap-3 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-primary-container/20 text-primary flex items-center justify-center mb-1">
              <CheckCircle2 className="w-10 h-10 animate-pulse-soft" />
            </div>
            <h3 className="font-bold text-lg text-on-surface">Transfer Initiated!</h3>
            <p className="text-xs text-secondary max-w-[260px]">
              ₹{amount.toLocaleString()} has been sent to UPI ID <br />
              <span className="font-mono font-bold text-on-surface">{rider.upiId}</span>
            </p>

            <div className="bg-surface-container-low rounded-2xl p-4 w-full text-left space-y-2 border border-slate-200 text-xs mt-2">
              <div className="flex justify-between">
                <span className="text-secondary">Transaction Ref</span>
                <span className="font-mono font-bold">UPI-{Date.now().toString().slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Bank Status</span>
                <span className="text-primary font-bold">Processing (Instant)</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 mt-3 bg-primary text-white font-bold text-xs rounded-xl shadow-lift hover:bg-primary/90 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          /* Amount & Transfer Form */
          <>
            <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/30">
              <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider">
                Available to Withdraw
              </span>
              <p className="text-3xl font-black text-on-surface font-mono mt-1">
                ₹{earnings.today.toLocaleString()}
              </p>
            </div>

            {/* Target UPI Account details */}
            <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  UPI
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface">{rider.upiId}</p>
                  <p className="text-[10px] text-secondary">Verified Bank Account</p>
                </div>
              </div>
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>

            {/* Amount Slider or Quick Select */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-secondary">
                <span>Enter Amount</span>
                <button
                  onClick={() => setAmount(earnings.today)}
                  className="text-primary hover:underline font-bold"
                >
                  Withdraw All
                </button>
              </div>

              <div className="relative flex items-center">
                <span className="absolute left-4 text-xl font-bold text-secondary">₹</span>
                <input
                  type="number"
                  min={100}
                  max={earnings.today}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full pl-9 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-lg font-bold font-mono outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Cashout Button */}
            <button
              onClick={handleCashout}
              disabled={isProcessing || amount <= 0 || amount > earnings.today}
              className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-white font-bold text-sm rounded-xl shadow-lift hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Transfer...</span>
                </>
              ) : (
                <>
                  <span>Transfer ₹{amount.toLocaleString()} Now</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
