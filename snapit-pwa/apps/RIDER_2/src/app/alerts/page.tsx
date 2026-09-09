'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRider } from '@/context/RiderContext';
import { AlertNotificationType } from '@/types';
import {
  Zap,
  Heart,
  Award,
  Bell,
  Calendar,
  MapPin,
  Coffee,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  CheckCheck,
} from 'lucide-react';

const getAlertMeta = (type: AlertNotificationType): { icon: React.ReactNode; accent: string } => {
  switch (type) {
    case 'surge':
      return { icon: <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />, accent: 'bg-amber-50 border-amber-200/80 text-amber-900' };
    case 'tip':
      return { icon: <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />, accent: 'bg-pink-50 border-pink-200/80 text-pink-900' };
    case 'payout':
    case 'system':
      return { icon: <Award className="w-4 h-4 text-emerald-600" />, accent: 'bg-emerald-50 border-emerald-200/80 text-emerald-900' };
    case 'slot_booked':
    case 'slot_extended':
    case 'waitlist_available':
      return { icon: <Calendar className="w-4 h-4 text-blue-600" />, accent: 'bg-blue-50 border-blue-200/80 text-blue-900' };
    case 'slot_reminder':
    case 'slot_ending':
      return { icon: <Clock className="w-4 h-4 text-amber-600" />, accent: 'bg-amber-50 border-amber-200/80 text-amber-900' };
    case 'slot_active':
      return { icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />, accent: 'bg-emerald-50 border-emerald-200/80 text-emerald-900' };
    case 'slot_ended':
    case 'slot_cancelled':
      return { icon: <XCircle className="w-4 h-4 text-slate-500" />, accent: 'bg-slate-100 border-slate-200/80 text-slate-700' };
    case 'zone_entered':
      return { icon: <MapPin className="w-4 h-4 text-emerald-600" />, accent: 'bg-emerald-50 border-emerald-200/80 text-emerald-900' };
    case 'zone_exited':
    case 'zone_required':
      return { icon: <MapPin className="w-4 h-4 text-amber-600" />, accent: 'bg-amber-50 border-amber-200/80 text-amber-900' };
    case 'online_enabled':
      return { icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />, accent: 'bg-emerald-50 border-emerald-200/80 text-emerald-900' };
    case 'online_disabled':
      return { icon: <XCircle className="w-4 h-4 text-slate-500" />, accent: 'bg-slate-100 border-slate-200/80 text-slate-700' };
    case 'break_started':
    case 'break_ending':
      return { icon: <Coffee className="w-4 h-4 text-amber-600" />, accent: 'bg-amber-50 border-amber-200/80 text-amber-900' };
    case 'break_exceeded':
    case 'break_emergency':
    case 'acceptance_warning':
    case 'acceptance_threshold':
    case 'policy_action':
      return { icon: <ShieldAlert className="w-4 h-4 text-red-600" />, accent: 'bg-red-50 border-red-200/80 text-red-900' };
    default:
      return { icon: <Bell className="w-4 h-4 text-slate-500" />, accent: 'bg-slate-100 border-slate-200/80 text-slate-700' };
  }
};

export default function AlertsPage() {
  const { alerts, markAlertAsRead } = useRider();
  const unread = alerts.filter((a) => !a.read);
  const read = alerts.filter((a) => a.read);

  return (
    <AppShell showBack={false} title="Alerts">
      <div className="flex flex-col gap-4 pt-4 pb-8 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Alerts</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {unread.length > 0 ? `${unread.length} unread` : 'All caught up!'}
            </p>
          </div>
          {unread.length > 0 && (
            <button
              onClick={() => unread.forEach((a) => markAlertAsRead(a.id))}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full active:scale-95 transition-all"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 bg-white rounded-3xl border border-slate-200/80 cockpit-shadow">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center">
              <Bell className="w-6 h-6 text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-slate-500">No alerts yet</p>
              <p className="text-xs text-slate-400 mt-1">Order updates and payouts will appear here</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Unread section */}
            {unread.length > 0 && (
              <>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1">New</p>
                {unread.map((alert) => {
                  const { icon, accent } = getAlertMeta(alert.type);
                  return (
                    <button
                      key={alert.id}
                      type="button"
                      onClick={() => markAlertAsRead(alert.id)}
                      className={`w-full text-left flex items-start gap-3 p-3.5 rounded-2xl border cockpit-shadow transition-all active:scale-99 ${accent}`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-white/60 flex items-center justify-center shrink-0 shadow-sm">
                        {icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-black leading-snug truncate">{alert.title}</p>
                          <span className="text-[10px] font-semibold text-current opacity-60 whitespace-nowrap shrink-0">
                            {alert.time}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium opacity-80 mt-0.5 leading-relaxed">
                          {alert.message}
                        </p>
                        {alert.amount && (
                          <span className="inline-block mt-1 text-[11px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                            ₹{alert.amount}
                          </span>
                        )}
                      </div>
                      {/* Unread dot */}
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5 animate-pulse" />
                    </button>
                  );
                })}
              </>
            )}

            {/* Read section */}
            {read.length > 0 && (
              <>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1 mt-2">Earlier</p>
                {read.map((alert) => {
                  const { icon } = getAlertMeta(alert.type);
                  return (
                    <div
                      key={alert.id}
                      className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/70 cockpit-shadow opacity-70"
                    >
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        {icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-slate-800 leading-snug truncate">{alert.title}</p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">{alert.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-relaxed">{alert.message}</p>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

      </div>
    </AppShell>
  );
}
