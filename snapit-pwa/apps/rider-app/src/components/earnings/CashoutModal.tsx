'use client';

import React, { useState } from 'react';
import { useRider } from '@/context/RiderContext';
import { X, CheckCircle2, ArrowRight, ShieldCheck, Building2, Wallet } from 'lucide-react';

interface CashoutModalProps {
  onClose: () => void;
}

export const CashoutModal: React.FC<CashoutModalProps> = ({ onClose }) => {
  const { rider, transferWalletToBank } = useRider();
  const [amount, setAmount] = useState(rider.walletBalance);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCashout = () => {
    if (amount <= 0 || amount > rider.walletBalance) return;
    setIsProcessing(true);
    setTimeout(() => {
      transferWalletToBank(amount);
      setIsProcessing(false);
      setIsSuccess(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-5 animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-on-surface leading-tight">
                Transfer Wallet to Main Account
              </h2>
              <p className="text-[11px] text-secondary">Instant settlement (0% fee)</p>
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
          /* Transfer Success Receipt */
          <div className="flex flex-col items-center text-center py-4 gap-3 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-primary-container/20 text-primary flex items-center justify-center mb-1">
              <CheckCircle2 className="w-10 h-10 animate-pulse-soft" />
            </div>
            <h3 className="font-bold text-lg text-on-surface">Transfer Successful!</h3>
            <p className="text-xs text-secondary max-w-[280px]">
              ₹{amount.toLocaleString()} was transferred from your Snapit Wallet to <br />
              <strong className="font-mono text-on-surface">{rider.upiId}</strong> ({rider.bankName || 'HDFC Bank'})
            </p>

            <div className="bg-surface-container-low rounded-2xl p-4 w-full text-left space-y-2 border border-slate-200 text-xs mt-2">
              <div className="flex justify-between">
                <span className="text-secondary">Transaction Ref</span>
                <span className="font-mono font-bold">TXN-{Date.now().toString().slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Destination Bank</span>
                <span className="font-semibold text-on-surface">{rider.bankName || 'HDFC Bank Ltd'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Settlement Status</span>
                <span className="text-primary font-bold">Credited Instantly</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 mt-3 bg-primary text-white font-bold text-xs rounded-xl shadow-lift hover:bg-primary/90 transition-colors"
            >
              Done & Return to Wallet
            </button>
          </div>
        ) : (
          /* Transfer Form */
          <>
            {/* Available Wallet Balance */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Available Wallet Balance
              </span>
              <p className="text-3xl font-black font-mono mt-1 text-white">
                ₹{rider.walletBalance.toLocaleString()}
              </p>
            </div>

            {/* Destination Main Bank / UPI Account Details */}
            <div className="flex items-center justify-between p-3.5 bg-surface-container-low border border-slate-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface">
                    {rider.bankName || 'HDFC Bank'} ({rider.upiId})
                  </p>
                  <p className="text-[10px] text-secondary font-mono">
                    A/C: ••••{rider.accountNumber?.slice(-4) || '9281'} • Verified
                  </p>
                </div>
              </div>
              <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
            </div>

            {/* Amount input & Quick All button */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-secondary">
                <span>Enter Amount to Transfer</span>
                <button
                  onClick={() => setAmount(rider.walletBalance)}
                  className="text-primary hover:underline font-bold text-[11px]"
                >
                  Transfer Max (₹{rider.walletBalance})
                </button>
              </div>

              <div className="relative flex items-center">
                <span className="absolute left-4 text-xl font-bold text-secondary">₹</span>
                <input
                  type="number"
                  min={1}
                  max={rider.walletBalance}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full pl-9 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-lg font-bold font-mono outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleCashout}
              disabled={isProcessing || amount <= 0 || amount > rider.walletBalance}
              className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-white font-bold text-sm rounded-2xl shadow-lift hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Transferring to Main Account...</span>
                </>
              ) : (
                <>
                  <span>Confirm Transfer ₹{amount.toLocaleString()}</span>
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
