'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRider } from '@/context/RiderContext';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { activeOrder, alerts } = useRider();

  const unreadAlerts = alerts.filter((a) => !a.read).length;

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
      active: pathname === '/alerts',
      badge: unreadAlerts > 0 ? `${unreadAlerts}` : undefined,
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: 'person',
      active: pathname === '/profile',
    },
  ];

  // Hide nav on onboarding or modal confirmation screens if desired
  if (pathname.includes('/onboarding') || pathname === '/confirm-delivery') {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 transition-all duration-200">
      <div className="w-full max-w-md mx-auto h-20 px-2 pb-safe glass-nav border-t border-surface-variant/40 shadow-[0px_-4px_20px_rgba(15,23,42,0.05)] rounded-t-2xl flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = item.active;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'bg-primary-container/20 text-on-primary-container'
                  : 'text-secondary/75 hover:text-on-surface hover:bg-surface-container/60'
              }`}
            >
              {/* Badge */}
              {item.badge && (
                <span className="absolute top-1 right-2 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
                  {item.badge}
                </span>
              )}

              <span
                className={`material-symbols-outlined text-[24px] mb-0.5 transition-transform ${
                  isActive ? 'scale-110 text-primary' : ''
                }`}
                style={{
                  fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400",
                }}
              >
                {item.icon}
              </span>

              <span
                className={`text-[11px] leading-tight ${
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
