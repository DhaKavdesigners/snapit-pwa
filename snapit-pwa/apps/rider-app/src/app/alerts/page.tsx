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
  CheckCheck,
  Calendar,
  MapPin,
  Coffee,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

const getAlertIcon = (type: AlertNotificationType) => {
  switch (type) {
    case 'surge':
      return <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />;
    case 'tip':
      return <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />;
    case 'payout':
    case 'system':
      return <Award className="w-5 h-5 text-primary" />;

    // Slot alerts
    case 'slot_booked':
      return <Calendar className="w-5 h-5 text-blue-600" />;
    case 'slot_reminder':
      return <Clock className="w-5 h-5 text-amber-500" />;
    case 'slot_active':
      return <CheckCircle2 className="w-5 h-5 text-primary" />;
    case 'slot_ending':
      return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    case 'slot_ended':
      return <XCircle className="w-5 h-5 text-slate-500" />;
    case 'slot_extended':
      return <Calendar className="w-5 h-5 text-primary" />;
    case 'slot_cancelled':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'waitlist_available':
      return <Calendar className="w-5 h-5 text-purple-500" />;

    // Zone alerts
    case 'zone_entered':
      return <MapPin className="w-5 h-5 text-primary" />;
    case 'zone_exited':
      return <MapPin className="w-5 h-5 text-amber-500" />;
    case 'zone_required':
      return <MapPin className="w-5 h-5 text-slate-500" />;
    case 'online_enabled':
      return <CheckCircle2 className="w-5 h-5 text-primary" />;
    case 'online_disabled':
      return <XCircle className="w-5 h-5 text-slate-400" />;

    // Break alerts
    case 'break_started':
      return <Coffee className="w-5 h-5 text-amber-500" />;
    case 'break_ending':
      return <Coffee className="w-5 h-5 text-orange-500" />;
    case 'break_exceeded':
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    case 'break_emergency':
      return <ShieldAlert className="w-5 h-5 text-red-600" />;

    // Acceptance alerts
    case 'acceptance_warning':
      return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    case 'acceptance_threshold':
      return <ShieldAlert className="w-5 h-5 text-red-600" />;
    case 'policy_action':
      return <ShieldAlert className="w-5 h-5 text-red-600" />;

    default:
      return <Bell className="w-5 h-5 text-secondary" />;
  }
};

const getAlertBorderStyle = (type: AlertNotificationType, read: boolean) => {
  if (read) return 'bg-white/80 border-slate-200/80';
  switch (type) {
    case 'acceptance_threshold':
    case 'policy_action':
    case 'break_exceeded':
    case 'slot_ended':
      return 'bg-red-50 border-red-300 ring-1 ring-red-200';
    case 'acceptance_warning':
    case 'break_ending':
    case 'zone_exited':
    case 'slot_ending':
    case 'break_emergency':
      return 'bg-amber-50 border-amber-300 ring-1 ring-amber-200';
    case 'slot_booked':
    case 'slot_extended':
    case 'zone_entered':
    case 'slot_active':
    case 'online_enabled':
      return 'bg-green-50 border-green-300 ring-1 ring-green-100';
    case 'slot_reminder':
    case 'zone_required':
    case 'slot_cancelled':
      return 'bg-blue-50 border-blue-200 ring-1 ring-blue-100';
    default:
      return 'bg-white border-primary/30 shadow-soft ring-1 ring-primary/10';
  }
};

const getIconBgStyle = (type: AlertNotificationType) => {
  switch (type) {
    case 'acceptance_threshold':
    case 'policy_action':
    case 'break_exceeded':
    case 'break_emergency':
    case 'slot_ended':
      return 'bg-red-100';
    case 'acceptance_warning':
    case 'break_ending':
    case 'zone_exited':
    case 'slot_ending':
      return 'bg-amber-100';
    case 'slot_booked':
    case 'slot_extended':
    case 'zone_entered':
    case 'slot_active':
      return 'bg-green-100';
    case 'slot_reminder':
    case 'zone_required':
      return 'bg-blue-100';
    case 'break_started':
      return 'bg-amber-50';
    default:
      return 'bg-surface-container';
  }
};

export default function AlertsPage() {
  const { alerts, markAlertAsRead } = useRider();

  // Group alerts by category for the header count
  const slotAlerts = alerts.filter((a) => a.type?.startsWith('slot') || a.type?.startsWith('zone'));
  const breakAlerts = alerts.filter((a) => a.type?.startsWith('break'));
  const acceptanceAlerts = alerts.filter((a) => a.type?.startsWith('acceptance') || a.type === 'policy_action');
  const unread = alerts.filter((a) => !a.read).length;

  return (
    <AppShell title="Alerts & Updates" subtitle="Live bonuses, slots, and system updates">
      <div className="flex flex-col gap-4 pt-2 pb-6 animate-fade-in">

        {/* Header Actions */}
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-semibold text-secondary">{unread} unread</span>
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
          {alerts.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-sm text-slate-700">No Alerts</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Slot updates, surge bonuses, and system alerts will appear here.
              </p>
            </div>
          )}

          {alerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => markAlertAsRead(alert.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${getAlertBorderStyle(
                alert.type,
                alert.read
              )}`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${getIconBgStyle(
                    alert.type
                  )}`}
                >
                  {getAlertIcon(alert.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-xs text-on-surface leading-snug">{alert.title}</h4>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!alert.read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                      <span className="text-[10px] text-secondary font-mono">{alert.time}</span>
                    </div>
                  </div>

                  <p className="text-xs text-secondary mt-1 leading-relaxed">{alert.message}</p>

                  {/* Amount badge */}
                  {alert.amount && (
                    <div className="mt-2.5 inline-flex items-center gap-1 bg-primary/10 text-primary text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      <span>+₹{alert.amount}</span>
                    </div>
                  )}

                  {/* Action link */}
                  {alert.actionLabel && alert.actionRoute && (
                    <a
                      href={alert.actionRoute}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary underline underline-offset-2"
                    >
                      {alert.actionLabel} →
                    </a>
                  )}

                  {/* Priority indicator */}
                  {alert.priority === 'critical' && !alert.read && (
                    <span className="mt-1.5 inline-flex items-center gap-1 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                      🔴 Action Required
                    </span>
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
