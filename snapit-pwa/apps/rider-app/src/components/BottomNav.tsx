/**
 * BottomNav.tsx — Fixed bottom navigation bar
 *
 * 4 tabs: Dashboard, Active Order, KYC Vault, Profile
 * Active tab indicated by emerald fill + slide pill indicator.
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Package, FileText, User } from 'lucide-react';
import { useRiderStore } from '../stores/riderStore';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  id: string;
  badge?: number;
}

export function BottomNav() {
  const location = useLocation();
  const incomingCount = useRiderStore((s) => s.incomingOrders.length);
  const hasActiveOrder = useRiderStore((s) => Boolean(s.activeOrder));

  const navItems: NavItem[] = [
    {
      to: '/dashboard',
      label: 'Dispatch',
      icon: <LayoutDashboard size={21} />,
      id: 'nav-dashboard',
      badge: incomingCount > 0 ? incomingCount : undefined,
    },
    {
      to: '/order',
      label: 'Active Order',
      icon: <Package size={21} />,
      id: 'nav-order',
      badge: hasActiveOrder ? 1 : undefined,
    },
    {
      to: '/kyc',
      label: 'Documents',
      icon: <FileText size={21} />,
      id: 'nav-kyc',
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: <User size={21} />,
      id: 'nav-profile',
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bottom-nav
                 bg-white border-t border-slate-100"
      style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-stretch h-[68px]">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              id={item.id}
              className="flex-1 flex flex-col items-center justify-center gap-1 relative
                         text-slate-400 hover:text-slate-600 transition-colors duration-200"
            >
              {/* Active fill indicator */}
              {isActive && (
                <motion.div
                  layoutId="nav-active-pill"
                  className="absolute inset-x-2 top-1 h-0.5 bg-emerald-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              {/* Icon with badge */}
              <div className="relative">
                <span className={isActive ? 'text-emerald-600' : 'text-slate-400'}>
                  {item.icon}
                </span>
                {item.badge !== undefined && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-emerald-500
                               rounded-full flex items-center justify-center
                               text-white text-[9px] font-bold px-1"
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </motion.div>
                )}
              </div>

              {/* Label */}
              <span className={`text-[10px] font-semibold leading-none ${
                isActive ? 'text-emerald-600' : 'text-slate-400'
              }`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
