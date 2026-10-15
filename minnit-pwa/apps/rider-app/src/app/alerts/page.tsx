'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { useRider } from '@/context/RiderContext';
import { AlertNotification, AlertNotificationType } from '@/types';
import {
  Bell,
  CheckCheck,
  Trash2,
  Clock,
  Calendar,
  Coffee,
  MapPin,
  AlertTriangle,
  Wallet,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Info,
  ShieldAlert,
  ChevronRight,
  Zap,
} from 'lucide-react';

type FilterCategory = 'all' | 'unread' | 'orders' | 'shifts' | 'earnings' | 'system';

export default function AlertsPage() {
  const router = useRouter();
  const { alerts, markAlertAsRead, markAllAlertsAsRead, clearAllAlerts } = useRider();
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');

  const unreadCount = useMemo(() => {
    return alerts.filter((a) => !a.read).length;
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (activeFilter === 'unread') return !alert.read;
      if (activeFilter === 'orders') {
        return (
          alert.type.includes('order') ||
          alert.type.includes('handover') ||
          alert.type.includes('acceptance') ||
          alert.type.includes('ready')
        );
      }
      if (activeFilter === 'shifts') {
        return (
          alert.type.includes('slot') ||
          alert.type.includes('session') ||
          alert.type.includes('break') ||
          alert.type.includes('zone')
        );
      }
      if (activeFilter === 'earnings') {
        return (
          alert.type === 'payout' ||
          alert.type === 'tip' ||
          alert.type === 'surge'
        );
      }
      if (activeFilter === 'system') {
        return alert.type === 'system' || alert.type.includes('policy');
      }
      return true;
    });
  }, [alerts, activeFilter]);

  const getAlertIconConfig = (type: AlertNotificationType) => {
    switch (type) {
      case 'slot_booked':
      case 'slot_active':
      case 'slot_extended':
        return {
          icon: <Calendar className="w-4 h-4 text-emerald-700" />,
          bg: 'bg-emerald-50 border-emerald-200',
          badgeText: 'Shift',
          badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        };
      case 'slot_reminder':
      case 'slot_ending':
        return {
          icon: <Clock className="w-4 h-4 text-amber-700" />,
          bg: 'bg-amber-50 border-amber-200',
          badgeText: 'Timing',
          badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
        };
      case 'slot_cancelled':
      case 'slot_ended':
        return {
          icon: <Clock className="w-4 h-4 text-rose-700" />,
          bg: 'bg-rose-50 border-rose-200',
          badgeText: 'Offline',
          badgeColor: 'text-rose-700 bg-rose-50 border-rose-200',
        };
      case 'break_started':
      case 'break_ending':
      case 'break_exceeded':
      case 'break_emergency':
        return {
          icon: <Coffee className="w-4 h-4 text-amber-700" />,
          bg: 'bg-amber-50 border-amber-200',
          badgeText: 'Break',
          badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
        };
      case 'zone_entered':
      case 'zone_exited':
      case 'zone_required':
        return {
          icon: <MapPin className="w-4 h-4 text-teal-700" />,
          bg: 'bg-teal-50 border-teal-200',
          badgeText: 'Zone',
          badgeColor: 'text-teal-700 bg-teal-50 border-teal-200',
        };
      case 'acceptance_warning':
      case 'acceptance_threshold':
      case 'policy_action':
        return {
          icon: <ShieldAlert className="w-4 h-4 text-rose-700" />,
          bg: 'bg-rose-50 border-rose-200',
          badgeText: 'Attention',
          badgeColor: 'text-rose-700 bg-rose-50 border-rose-200',
        };
      case 'payout':
      case 'tip':
      case 'surge':
        return {
          icon: <Wallet className="w-4 h-4 text-emerald-700" />,
          bg: 'bg-emerald-50 border-emerald-200',
          badgeText: 'Earnings',
          badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        };
      default:
        return {
          icon: <Bell className="w-4 h-4 text-slate-700" />,
          bg: 'bg-slate-100 border-slate-200',
          badgeText: 'Notice',
          badgeColor: 'text-slate-700 bg-slate-100 border-slate-200',
        };
    }
  };

  const handleAlertClick = (alert: AlertNotification) => {
    markAlertAsRead(alert.id);
    if (alert.actionRoute) {
      router.push(alert.actionRoute);
    }
  };

  return (
    <AppShell title="Notifications" subtitle="Important alerts & dispatch updates" showBack={true}>
      <div className="flex flex-col gap-3 pt-1 pb-6 max-w-md mx-auto w-full">
        {/* ── TOP ACTION BAR: SUMMARY & MARK ALL READ ── */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 leading-tight">
                {alerts.length} Total Alerts
              </p>
              <p className="text-[11px] font-bold text-slate-500">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && markAllAlertsAsRead && (
              <button
                type="button"
                onClick={() => markAllAlertsAsRead()}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark All Read</span>
              </button>
            )}

            {alerts.length > 0 && clearAllAlerts && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Clear all notifications?')) {
                    clearAllAlerts();
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                title="Clear all alerts"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── FILTER PILLS ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {(
            [
              { id: 'all', label: 'All', count: alerts.length },
              { id: 'unread', label: 'Unread', count: unreadCount },
              { id: 'orders', label: 'Orders' },
              { id: 'shifts', label: 'Shifts' },
              { id: 'earnings', label: 'Earnings' },
              { id: 'system', label: 'System' },
            ] as Array<{ id: FilterCategory; label: string; count?: number }>
          ).map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
                }`}
              >
                <span>{filter.label}</span>
                {filter.count !== undefined && filter.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive
                        ? filter.id === 'unread'
                          ? 'bg-rose-500 text-white'
                          : 'bg-white/20 text-white'
                        : filter.id === 'unread'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {filter.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── NOTIFICATIONS LIST ── */}
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-2xs text-center space-y-3 mt-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
              <Bell className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {activeFilter === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                {activeFilter === 'unread'
                  ? 'All notifications have been read. Switch to "All" to review past updates.'
                  : 'Important notifications about order dispatches, riding sessions, and daily payouts will appear here.'}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all active:scale-95 shadow-2xs"
              >
                <span>Back to Home</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredAlerts.map((alert) => {
              const cfg = getAlertIconConfig(alert.type);
              const isUnread = !alert.read;

              return (
                <div
                  key={alert.id}
                  onClick={() => handleAlertClick(alert)}
                  className={`bg-white rounded-2xl p-3.5 border transition-all cursor-pointer relative overflow-hidden group active:scale-[0.99] ${
                    isUnread
                      ? 'border-emerald-300 shadow-sm bg-gradient-to-r from-emerald-50/20 via-white to-white'
                      : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  {/* Left accent bar for unread notifications */}
                  {isUnread && (
                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-emerald-500" />
                  )}

                  <div className="flex items-start gap-3 pl-1">
                    {/* Icon medallion */}
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${cfg.bg}`}
                    >
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border shrink-0 ${cfg.badgeColor}`}
                          >
                            {cfg.badgeText}
                          </span>
                          {alert.priority === 'critical' && (
                            <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded text-[9px] font-black uppercase tracking-wider shrink-0">
                              Urgent
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-bold text-slate-400 shrink-0">
                          {alert.time || 'Today'}
                        </span>
                      </div>

                      <h4
                        className={`text-xs mt-1 leading-snug line-clamp-1 ${
                          isUnread ? 'font-black text-slate-900' : 'font-extrabold text-slate-800'
                        }`}
                      >
                        {alert.title}
                      </h4>

                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        {alert.message}
                      </p>

                      {/* Action route button if alert has dedicated action */}
                      {alert.actionRoute && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] font-black text-emerald-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            <span>{alert.actionLabel || 'View Details'}</span>
                            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                          </span>

                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
