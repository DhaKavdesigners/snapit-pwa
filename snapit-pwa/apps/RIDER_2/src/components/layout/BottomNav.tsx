'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRider } from '@/context/RiderContext';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const {
    activeOrder,
    activeSlot,
    riderBreak,
    alerts,
    nonAcceptanceCount,
    adminConfig,
    isCurrentWindowPreferred,
    isOnline,
  } = useRider();

  const isBreakActive = riderBreak && !riderBreak?.endedAt;
  const hasSlotWarning = nonAcceptanceCount >= adminConfig.orderAcceptance.warning1Threshold;
  const unreadCount = alerts?.filter((a) => !a.read).length || 0;

  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: 'home',
      active: pathname === '/',
    },
    {
      label: 'Orders',
      href: '/orders',
      icon: 'local_mall',
      active: pathname.startsWith('/orders'),
    },
    {
      label: 'Availability',
      href: '/availability',
      icon: 'event_available',
      active: pathname.startsWith('/availability') || pathname.startsWith('/slots'),
      badge: isCurrentWindowPreferred && isOnline ? '★' : undefined,
      badgeColor: 'bg-amber-500',
    },

    {
      label: 'Earnings',
      href: '/earnings',
      icon: 'payments',
      active: pathname === '/earnings',
    },
    {
      label: 'Alerts',
      href: '/alerts',
      icon: 'notifications',
      active: pathname.startsWith('/alerts'),
      badge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : `${unreadCount}`) : undefined,
      badgeColor: 'bg-red-500',
    },
  ];

  // Hide nav on onboarding or delivery confirmation
  if (pathname.includes('/onboarding') || pathname === '/confirm-delivery') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      <div className="w-full max-w-md glass-nav border-t border-slate-200/70 pb-safe">
        <div className="h-[60px] flex items-center justify-around px-1">
          {navItems.map((item) => {
            const isActive = item.active;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl min-w-touch transition-all duration-200 active:scale-90 ${
                  isActive ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {/* Badge */}
                {item.badge && (
                  <span
                    className={`absolute top-0.5 right-1.5 min-w-[14px] h-[14px] px-0.5 ${
                      item.badgeColor || 'bg-emerald-500'
                    } text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm ${
                      item.badge === '●' ? 'animate-pulse' : ''
                    }`}
                  >
                    {item.badge === '●' ? '' : item.badge}
                  </span>
                )}

                <span
                  className={`material-symbols-outlined text-[22px] transition-all duration-200 ${
                    isActive ? 'scale-110' : ''
                  }`}
                  style={{
                    fontVariationSettings: isActive
                      ? "'FILL' 1, 'wght' 600"
                      : "'FILL' 0, 'wght' 400",
                  }}
                >
                  {item.icon}
                </span>

                <span className={`text-[10px] mt-0.5 font-bold transition-colors ${
                  isActive ? 'text-emerald-700' : 'text-slate-400'
                }`}>
                  {item.label}
                </span>

                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
