import React, { useState } from "react";
import { Sidebar, AdminTab } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { DashboardView } from "../../views/DashboardView";
import { OrdersControlView } from "../../views/OrdersControlView";
import { MerchantsView } from "../../views/MerchantsView";
import { FleetView } from "../../views/FleetView";
import { CatalogView } from "../../views/CatalogView";
import { CustomersView } from "../../views/CustomersView";
import { SettingsView } from "../../views/SettingsView";

export const AdminLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  const titles: Record<AdminTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: "Operations War Room",
      subtitle: "Live hyperlocal metrics & real-time system pulse for Kolar Gold Fields",
    },
    orders: {
      title: "Live Orders Control & Manual Dispatch",
      subtitle: "Monitor counter preparation, assign riders, and manually override order statuses",
    },
    merchants: {
      title: "Merchants & Store Partners",
      subtitle: "Manage partner grocery stores and restaurants, toggle active status & store catalogs",
    },
    fleet: {
      title: "Delivery Fleet & Riders",
      subtitle: "Live fleet roster, online availability, current assigned orders, and new rider onboarding",
    },
    catalog: {
      title: "Master Product Catalog & Inventory",
      subtitle: "Instant price, stock count, and in-stock management across all partner stores",
    },
    customers: {
      title: "Customer Directory & Profiles",
      subtitle: "Registered users, saved delivery addresses, PIN codes, and trust verification",
    },
    settings: {
      title: "System Diagnostics & Supabase DB",
      subtitle: "Realtime WebSocket status, latency diagnostics, and database control",
    },
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader title={titles[activeTab].title} subtitle={titles[activeTab].subtitle} />

        <main className="flex-1 overflow-y-auto p-6 bg-slate-950/60">
          {activeTab === "dashboard" && <DashboardView setActiveTab={setActiveTab} />}
          {activeTab === "orders" && <OrdersControlView />}
          {activeTab === "merchants" && <MerchantsView />}
          {activeTab === "fleet" && <FleetView />}
          {activeTab === "catalog" && <CatalogView />}
          {activeTab === "customers" && <CustomersView />}
          {activeTab === "settings" && <SettingsView />}
        </main>
      </div>
    </div>
  );
};
