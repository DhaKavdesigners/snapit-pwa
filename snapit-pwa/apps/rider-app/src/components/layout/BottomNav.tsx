'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRider } from '@/context/RiderContext';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { activeOrder, activeSlot, riderBreak, alerts, nonAcceptanceCount, adminConfig } = useRider();

  const isBreakActive = riderBreak && !riderBreak?.endedAt;
  const hasSlotWarning = nonAcceptanceCount >= adminConfig.orderAcceptance.warning1Threshold;
  const unreadAlertsCount = alerts?.filter((a) => !a.read).length || 0;

  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: 'home',
      active: pathname === '/',
    },
    {
      label: 'Slots',
      href: '/slots',
      icon: 'schedule',
      active: pathname.startsWith('/slots'),
      badge: isBreakActive ? '⏸' : activeSlot ? '●' : hasSlotWarning ? '!' : undefined,
      badgeColor: isBreakActive
        ? 'bg-amber-500'
        : hasSlotWarning
        ? 'bg-red-500'
        : activeSlot
        ? 'bg-primary'
        : 'bg-primary',
    },
    {
      label: 'Orders',
      href: '/orders',
      icon: 'local_mall',
      active: pathname.startsWith('/orders'),
      badge: activeOrder ? '1' : undefined,
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
      badge: unreadAlertsCount > 0 ? (unreadAlertsCount > 9 ? '9+' : `${unreadAlertsCount}`) : undefined,
      badgeColor: 'bg-red-500',
    },
  ];

  // Hide nav on onboarding or modal confirmation screens
  if (pathname.includes('/onboarding') || pathname === '/confirm-delivery') {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 transition-all duration-200 flex justify-center">
      <div className="w-full max-w-md h-20 px-2 pb-safe glass-nav border-t border-slate-200/80 shadow-[0px_-4px_20px_rgba(15,23,42,0.05)] rounded-t-2xl flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = item.active;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'bg-primary-container/20 text-on-primary-container'
                  : 'text-secondary/75 hover:text-on-surface hover:bg-surface-container/60'
              }`}
            >
              {/* Badge */}
              {item.badge && (
                <span
                  className={`absolute top-1 right-1.5 min-w-[14px] h-[14px] px-0.5 ${
                    item.badgeColor || 'bg-primary'
                  } text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm ${
                    item.badge === '●' ? 'animate-pulse' : ''
                  }`}
                >
                  {item.badge === '●' ? '' : item.badge}
                </span>
              )}

              <span
                className={`material-symbols-outlined text-[22px] mb-0.5 transition-transform ${
                  isActive ? 'scale-110 text-primary' : ''
                }`}
                style={{
                  fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400",
                }}
              >
                {item.icon}
              </span>

              <span
                className={`text-[10px] leading-tight ${
                  isActive ? 'font-bold text-primary' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
