'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRider } from '@/context/RiderContext';
import { Zap, Heart, Award, Bell, CheckCheck } from 'lucide-react';

export default function AlertsPage() {
  const { alerts, markAlertAsRead } = useRider();

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'surge':
        return <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />;
      case 'tip':
        return <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />;
      case 'system':
      case 'payout':
        return <Award className="w-5 h-5 text-primary" />;
      default:
        return <Bell className="w-5 h-5 text-secondary" />;
    }
  };

  return (
    <AppShell title="Alerts & Surges" subtitle="Live bonuses and system updates">
      <div className="flex flex-col gap-4 pt-2 pb-6 animate-fade-in">
        
        {/* Header Actions */}
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-semibold text-secondary">
            {alerts.filter((a) => !a.read).length} unread updates
          </span>
          <button
            onClick={() => alerts.forEach((a) => markAlertAsRead(a.id))}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        </div>

        {/* Alerts Feed */}
        <div className="flex flex-col gap-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => markAlertAsRead(alert.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                alert.read
                  ? 'bg-white/80 border-slate-200/80'
                  : 'bg-white border-primary/30 shadow-soft ring-1 ring-primary/10'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-surface-container flex items-center justify-center shrink-0">
                  {getAlertIcon(alert.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-xs text-on-surface truncate">
                      {alert.title}
                    </h4>
                    <span className="text-[10px] text-secondary font-mono shrink-0">
                      {alert.time}
                    </span>
                  </div>

                  <p className="text-xs text-secondary mt-1 leading-relaxed">
                    {alert.message}
                  </p>

                  {alert.amount && (
                    <div className="mt-2.5 inline-flex items-center gap-1 bg-primary/10 text-primary text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      <span>Reward: +₹{alert.amount}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </AppShell>
  );
}
