import React from "react";
import {
  LayoutDashboard,
  Zap,
  Store,
  Bike,
  Package,
  Users,
  Settings,
  Activity,
} from "lucide-react";
import { useAdminStore } from "../../store/useAdminStore";

export type AdminTab =
  | "dashboard"
  | "orders"
  | "merchants"
  | "fleet"
  | "catalog"
  | "customers"
  | "settings";

interface SidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { orders, riders, stores } = useAdminStore();

  const activeOrdersCount = orders.filter(
    (o) => !["DELIVERED", "CANCELLED", "REJECTED"].includes(o.status)
  ).length;

  const onlineRidersCount = riders.filter((r) => r.is_online).length;
  const onlineStoresCount = stores.filter((s) => s.is_online).length;

  const navItems = [
    {
      id: "dashboard" as AdminTab,
      label: "War Room",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "orders" as AdminTab,
      label: "Live Orders",
      icon: Zap,
      badge: activeOrdersCount > 0 ? activeOrdersCount : null,
      badgeColor: "bg-amber-500 text-slate-950 animate-pulse",
    },
    {
      id: "merchants" as AdminTab,
      label: "Merchants & Stores",
      icon: Store,
      badge: `${onlineStoresCount}/${stores.length}`,
      badgeColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    },
    {
      id: "fleet" as AdminTab,
      label: "Rider Fleet",
      icon: Bike,
      badge: `${onlineRidersCount} Online`,
      badgeColor: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    },
    {
      id: "catalog" as AdminTab,
      label: "Master Catalog",
      icon: Package,
      badge: null,
    },
    {
      id: "customers" as AdminTab,
      label: "Customers",
      icon: Users,
      badge: null,
    },
    {
      id: "settings" as AdminTab,
      label: "System & DB",
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-6 border-b border-slate-800 flex items-center gap-3">
          <img
            src="/minnit_logo.jpg"
            alt="Minnit Admin"
            className="w-9 h-9 rounded-xl object-contain bg-white p-1 shadow-md border border-emerald-500/30"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base text-white tracking-tight">Minnit</span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded">
                OPS
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight">KGF Command Room</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer group ${
                  isActive
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? "text-slate-950" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== null && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? "bg-slate-950 text-emerald-400" : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-2 text-xs">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-bold text-[11px]">Realtime Engine Active</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1 font-mono">Postgres CDC • 20 msg/sec</p>
      </div>
    </aside>
  );
};
