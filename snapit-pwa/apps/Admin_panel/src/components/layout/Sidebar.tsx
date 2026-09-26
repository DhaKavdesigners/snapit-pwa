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
  Receipt,
  MapPin,
} from "lucide-react";
import { useAdminStore } from "../../store/useAdminStore";

export type AdminTab =
  | "dashboard"
  | "orders"
  | "merchants"
  | "settlements"
  | "fleet"
  | "zones"
  | "catalog"
  | "customers"
  | "settings";

interface SidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { orders, riders, stores, zones } = useAdminStore();

  const activeOrdersCount = orders.filter(
    (o) => !["DELIVERED", "CANCELLED", "REJECTED"].includes(o.status)
  ).length;

  const onlineRidersCount = riders.filter((r) => r.is_online).length;
  const pendingRidersCount = riders.filter(
    (r) => r.verification_status === "PENDING" || (r.is_verified === false && !r.verification_status)
  ).length;
  const onlineStoresCount = stores.filter((s) => s.is_online).length;
  const activeZonesCount = zones.filter((z) => z.is_active).length;

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
      id: "settlements" as AdminTab,
      label: "Ledger & Settlements",
      icon: Receipt,
      badge: "11 PM Due",
      badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    },
    {
      id: "fleet" as AdminTab,
      label: "Rider Fleet",
      icon: Bike,
      badge: pendingRidersCount > 0 ? `${pendingRidersCount} Pending` : `${onlineRidersCount} Online`,
      badgeColor:
        pendingRidersCount > 0
          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
          : "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    },
    {
      id: "zones" as AdminTab,
      label: "Zone Management",
      icon: MapPin,
      badge: `${activeZonesCount} Active`,
      badgeColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
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
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-5 border-b border-slate-800/80 flex items-center gap-3">
          <img
            src="/minnit_logo.jpg"
            alt="Minnit Admin"
            className="w-10 h-10 rounded-xl object-contain bg-white p-1 shadow-md border border-emerald-500/30 shrink-0"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base text-white tracking-tight">Minnit</span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded shadow-xs">
                OPS
              </span>
            </div>
            <p className="text-[10px] text-emerald-400/90 font-mono font-medium tracking-tight">KGF Command Center</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer group ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/30 font-black"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-emerald-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== null && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? "bg-white/20 text-white" : item.badgeColor
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
      <div className="p-4 border-t border-slate-800/80 bg-black/30">
        <div className="flex items-center gap-2 text-xs">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-slate-200 font-bold text-[11px]">Realtime CDC Engine</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1 font-mono">Postgres Channels • 20 msg/s</p>
      </div>
    </aside>
  );
};
