import React from "react";
import { LayoutDashboard, Zap, Bike, MapPin, Settings } from "lucide-react";
import { AdminTab } from "./Sidebar";

interface BottomNavProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  pendingRidersCount: number;
  activeOrdersCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  pendingRidersCount,
  activeOrdersCount,
}) => {
  const navItems = [
    { id: "dashboard" as AdminTab, label: "Dashboard", icon: LayoutDashboard },
    { id: "orders" as AdminTab, label: "Orders", icon: Zap, showBadge: activeOrdersCount > 0, badgeClass: "bg-amber-500 animate-pulse" },
    { id: "fleet" as AdminTab, label: "Fleet", icon: Bike, showBadge: pendingRidersCount > 0, badgeClass: "bg-red-500" },
    { id: "zones" as AdminTab, label: "Zones", icon: MapPin },
    { id: "settings" as AdminTab, label: "Settings", icon: Settings },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-950 border-t border-slate-800"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center gap-0.5 py-2 px-3 text-[10px] font-bold flex-1 ${
                isActive ? "text-emerald-500" : "text-slate-400"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5 mb-0.5" />
                {item.showBadge && (
                  <span 
                    className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-slate-950 ${item.badgeClass}`} 
                  />
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
