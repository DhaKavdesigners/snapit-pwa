import React from 'react';
import {
  BellRing,
  UtensilsCrossed,
  Receipt,
  Store as StoreIcon,
} from 'lucide-react';
import { useMerchantStore } from '../../store/useMerchantStore';

export type MobileTab = 'orders' | 'menu' | 'settlement' | 'store';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  setActiveTab: (tab: MobileTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const { orders } = useMerchantStore();
  const pendingOrdersCount = orders.filter((o) => o.status === 'PLACED').length;

  const navItems: { id: MobileTab; label: string; icon: React.ElementType; badge?: number }[] = [
    {
      id: 'orders',
      label: 'Live Orders',
      icon: BellRing,
      badge: orders.length,
    },
    {
      id: 'menu',
      label: 'Menu & Stock',
      icon: UtensilsCrossed,
    },
    {
      id: 'settlement',
      label: 'Settlement',
      icon: Receipt,
    },
    {
      id: 'store',
      label: 'Store',
      icon: StoreIcon,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1.5 max-w-lg mx-auto">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
                isActive
                  ? 'text-emerald-700 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'stroke-2'
                  }`}
                />

                {/* Live Placed Badge (Pulsing) */}
                {item.id === 'orders' && pendingOrdersCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-amber-500 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-xs font-mono">
                    {pendingOrdersCount}
                  </span>
                )}

                {/* Total Active Badge */}
                {item.id === 'orders' && pendingOrdersCount === 0 && orders.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center font-mono">
                    {orders.length}
                  </span>
                )}
              </div>

              <span className="text-[10px] tracking-tight mt-0.5">
                {item.label}
              </span>

              {isActive && (
                <span className="w-1 h-1 rounded-full bg-emerald-600 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
