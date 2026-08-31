'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRider } from '@/context/RiderContext';
import Link from 'next/link';
import {
  ShieldCheck,
  Bike,
  CreditCard,
  Bell,
  ChevronRight,
  RefreshCw,
  Volume2,
  Lock,
  Edit3,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  LifeBuoy,
} from 'lucide-react';

export default function ProfilePage() {
  const { rider, updateRiderProfile, logout } = useRider();
  
  // Editable fields state
  const [altPhone, setAltPhone] = useState(rider.altPhone || '');
  const [address, setAddress] = useState(rider.address || '');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [surgeAlerts, setSurgeAlerts] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveEditable = (e: React.FormEvent) => {
    e.preventDefault();
    updateRiderProfile({
      altPhone,
      address,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-4 pt-2 pb-6 animate-fade-in">
        
        {/* Profile Card Header */}
        <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 flex items-center gap-4 relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-2 border-primary/30 bg-slate-100 shadow-sm relative">
            <img
              src={rider.selfieCapturedUrl || rider.avatarUrl}
              alt={rider.name}
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center text-[10px]">
              ✓
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-base text-on-surface truncate">{rider.name || 'Rider'}</h2>
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            </div>
            <p className="text-xs font-semibold text-amber-500 flex items-center gap-1 mt-0.5">
              <span>⭐ {rider.rating}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-medium">{rider.totalDeliveries} trips</span>
            </p>
            <p className="text-xs font-mono font-semibold text-secondary mt-0.5">{rider.selectedZone || 'Robertsonpet'}</p>
            <span className="inline-block bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 mt-1.5">
              Verified Partner
            </span>
          </div>
        </div>



        {/* SECTION 1: LOCKED & VERIFIED DOCUMENTS (NON-EDITABLE) */}
        <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-sm text-on-surface">Verified Documents (Locked)</h3>
            </div>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200">
              Read-Only
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-[11px] text-secondary flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>Government verified documents cannot be modified. Contact support to submit updated KYC files.</span>
          </div>

          <div className="space-y-2 text-xs">
            {/* DOB (Locked) */}
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-secondary font-medium">Date of Birth</span>
              <span className="font-mono font-bold text-on-surface flex items-center gap-1.5">
                <span>{rider.dob || 'Not Provided'}</span>
                <Lock className="w-3 h-3 text-slate-400" />
              </span>
            </div>

            {/* Primary Phone (Locked) */}
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-secondary font-medium">Primary Mobile</span>
              <span className="font-mono font-bold text-on-surface flex items-center gap-1.5">
                <span>{rider.phone}</span>
                <Lock className="w-3 h-3 text-slate-400" />
              </span>
            </div>

            {/* Aadhaar (Locked) */}
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-secondary font-medium">Aadhaar Number</span>
              <span className="font-mono font-bold text-on-surface flex items-center gap-1.5">
                <span>{rider.aadhaarNumber ? `XXXX-XXXX-${rider.aadhaarNumber.slice(-4)}` : 'Verified'}</span>
                <FileCheck2 className="w-3.5 h-3.5 text-primary" />
              </span>
            </div>

            {/* PAN Card (Locked) */}
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-secondary font-medium">PAN Number</span>
              <span className="font-mono font-bold text-on-surface flex items-center gap-1.5">
                <span>{rider.panNumber ? `${rider.panNumber.slice(0, 5)}****${rider.panNumber.slice(-1)}` : 'Verified'}</span>
                <FileCheck2 className="w-3.5 h-3.5 text-primary" />
              </span>
            </div>

            {/* Driving License (Locked) */}
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-secondary font-medium">Driving License</span>
              <span className="font-mono font-bold text-on-surface flex items-center gap-1.5">
                <span>{rider.dlNumber || 'Verified'}</span>
                <FileCheck2 className="w-3.5 h-3.5 text-primary" />
              </span>
            </div>

            {/* Vehicle Details (Locked) */}
            <div className="flex justify-between items-center py-2">
              <span className="text-secondary font-medium">Registered Vehicle</span>
              <span className="font-mono font-bold text-on-surface flex items-center gap-1.5">
                <span>{rider.vehicleNumber || 'Registered'} ({rider.vehicleType?.split(' ')[0] || 'Bike'})</span>
                <Lock className="w-3 h-3 text-slate-400" />
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 2: EDITABLE INFORMATION (ADDRESS, ALT PHONE) */}
        <form
          onSubmit={handleSaveEditable}
          className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 flex flex-col gap-3.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm text-on-surface">Editable Contact Details</h3>
            </div>
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
              Editable
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Alternative Phone */}
            <div className="space-y-1">
              <label className="font-semibold text-secondary">Alternative Phone Number</label>
              <input
                type="tel"
                value={altPhone}
                onChange={(e) => setAltPhone(e.target.value)}
                placeholder="+91 98000 00000"
                className="w-full bg-surface-container-low border border-slate-200 rounded-xl p-2.5 font-mono text-xs font-semibold text-on-surface outline-none focus:border-primary"
              />
            </div>

            {/* Current Address */}
            <div className="space-y-1">
              <label className="font-semibold text-secondary">Current Residential Address</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Current Address"
                className="w-full bg-surface-container-low border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-on-surface outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl shadow-lift transition-all active:scale-98 flex items-center justify-center gap-1.5"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Changes Saved Successfully!</span>
                </>
              ) : (
                <span>Save Contact Changes</span>
              )}
            </button>
          </div>
        </form>

        {/* SECTION 3: APP PREFERENCES */}
        <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 flex flex-col gap-3.5">
          <h3 className="font-bold text-sm text-on-surface">App Preferences</h3>

          <div className="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-secondary" />
              <span className="font-medium text-on-surface">Order Audio & Beep Alert</span>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-4 h-4 text-primary rounded accent-primary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2 text-xs">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-secondary" />
              <span className="font-medium text-on-surface">Surge & High Demand Alerts</span>
            </div>
            <input
              type="checkbox"
              checked={surgeAlerts}
              onChange={(e) => setSurgeAlerts(e.target.checked)}
              className="w-4 h-4 text-primary rounded accent-primary cursor-pointer"
            />
          </div>
        </div>

        {/* Support & Help Link */}
        <Link
          href="/support"
          className="bg-white rounded-3xl p-4 shadow-soft border border-slate-200/80 flex items-center justify-between group active:scale-98 transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">Rider Support & Helpdesk</p>
              <p className="text-[10px] text-slate-500 font-medium">Raise tickets, report order or wallet issues</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Log Out / Switch Account */}
        <button
          type="button"
          onClick={() => {
            logout();
            window.location.href = '/onboarding';
          }}
          className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-xs rounded-2xl p-4 flex items-center justify-center gap-2 transition-colors active:scale-98"
        >
          <span>Log Out / Switch Account</span>
        </button>

      </div>
    </AppShell>
  );
}
