'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRider } from '@/context/RiderContext';
import Link from 'next/link';
import { Star, ShieldCheck, Bike, CreditCard, Bell, ChevronRight, RefreshCw, Volume2, Moon } from 'lucide-react';

export default function ProfilePage() {
  const { rider, updateRiderProfile } = useRider();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [surgeAlerts, setSurgeAlerts] = useState(true);

  return (
    <AppShell title="Rider Profile" subtitle="Account, vehicle & preferences">
      <div className="flex flex-col gap-4 pt-2 pb-6 animate-fade-in">
        
        {/* Profile Card Header */}
        <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 flex items-center gap-4 relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-2 border-primary/20 bg-slate-100 shadow-sm">
            <img
              src={rider.avatarUrl}
              alt={rider.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-on-surface truncate">{rider.name}</h2>
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            </div>
            <p className="text-xs text-secondary truncate">{rider.phone}</p>
            <p className="text-[11px] text-secondary truncate">{rider.email}</p>
          </div>
        </div>

        {/* Performance Bento Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-secondary uppercase">Rating</span>
            <div className="flex items-center justify-center gap-1 mt-1 text-amber-500 font-bold text-base">
              <Star className="w-4 h-4 fill-current" />
              <span>{rider.rating}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-secondary uppercase">Trips</span>
            <p className="text-base font-bold text-on-surface font-mono mt-1">
              {rider.totalDeliveries}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-secondary uppercase">Acceptance</span>
            <p className="text-base font-bold text-primary font-mono mt-1">
              {rider.acceptanceRate}%
            </p>
          </div>
        </div>

        {/* Vehicle & Zone Section */}
        <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 flex flex-col gap-3.5">
          <h3 className="font-bold text-sm text-on-surface">Vehicle & Zone</h3>

          <div className="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Bike className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-on-surface">{rider.vehicleType}</p>
                <p className="text-[11px] text-secondary font-mono">{rider.vehicleNumber}</p>
              </div>
            </div>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              Verified
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-on-surface">Payout UPI</p>
                <p className="text-[11px] text-secondary font-mono">{rider.upiId}</p>
              </div>
            </div>
            <span className="text-primary font-bold text-[11px]">Primary</span>
          </div>
        </div>

        {/* Preferences & App Settings */}
        <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 flex flex-col gap-3.5">
          <h3 className="font-bold text-sm text-on-surface">Preferences</h3>

          <div className="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-secondary" />
              <span className="font-medium text-on-surface">Order Audio Alert</span>
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
              <span className="font-medium text-on-surface">Surge & Bonus Alerts</span>
            </div>
            <input
              type="checkbox"
              checked={surgeAlerts}
              onChange={(e) => setSurgeAlerts(e.target.checked)}
              className="w-4 h-4 text-primary rounded accent-primary cursor-pointer"
            />
          </div>
        </div>

        {/* Onboarding & Restart Demo Navigation */}
        <Link
          href="/onboarding"
          className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between text-primary font-bold text-xs hover:bg-primary/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span>Launch Rider Onboarding & Verification Flow</span>
          </div>
          <ChevronRight className="w-4 h-4" />
        </Link>

      </div>
    </AppShell>
  );
}
