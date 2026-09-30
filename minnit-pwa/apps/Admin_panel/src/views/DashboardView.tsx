import React from "react";
import {
  Zap,
  TrendingUp,
  Store,
  Bike,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  MapPin,
} from "lucide-react";
import { useAdminStore } from "../store/useAdminStore";
import { MetricCard } from "../components/common/MetricCard";
import { Badge } from "../components/common/Badge";
import { AdminTab } from "../components/layout/Sidebar";

interface DashboardViewProps {
  setActiveTab: (tab: AdminTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab }) => {
  const { orders, stores, riders, customers } = useAdminStore();

  const activeOrders = orders.filter(
    (o) => !["DELIVERED", "CANCELLED", "REJECTED"].includes(o.status)
  );
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");
  const cancelledOrders = orders.filter((o) => ["CANCELLED", "REJECTED"].includes(o.status));

  // Compute GMV (Gross Merchandise Value)
  const totalGMV = orders
    .filter((o) => o.status === "DELIVERED")
    .reduce((acc, o) => acc + (o.estimated_total || 0), 0);

  const onlineRiders = riders.filter((r) => r.is_online);
  const busyRiders = riders.filter((r) => r.is_online && r.is_busy);
  const onlineStores = stores.filter((s) => s.is_online);

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Live Orders"
          value={activeOrders.length}
          subtitle={`${orders.filter((o) => ["PLACED", "PENDING"].includes(o.status)).length} awaiting store confirm`}
          icon={Zap}
          color="amber"
          trend="LIVE"
          trendPositive={true}
        />

        <MetricCard
          title="Total GMV (Delivered)"
          value={`₹${totalGMV.toLocaleString()}`}
          subtitle={`${deliveredOrders.length} successful orders`}
          icon={TrendingUp}
          color="emerald"
          trend="+18% avg"
        />

        <MetricCard
          title="Active Fleet Riders"
          value={`${onlineRiders.length} Online`}
          subtitle={`${busyRiders.length} currently on delivery`}
          icon={Bike}
          color="blue"
        />

        <MetricCard
          title="Partner Stores"
          value={`${onlineStores.length} Open`}
          subtitle={`Total ${stores.length} onboarded`}
          icon={Store}
          color="purple"
        />
      </div>

      {/* Main War Room Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Action Orders Feed (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Live Active Orders ({activeOrders.length})</span>
              </h2>
              <p className="text-xs text-slate-500">Real-time status updates across all KGF merchant counters</p>
            </div>

            <button
              onClick={() => setActiveTab("orders")}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View Control Room</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeOrders.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-90" />
              <p className="text-sm font-bold text-slate-900">All Clear! No Pending Orders</p>
              <p className="text-xs text-slate-500 mt-1">All incoming orders have been fulfilled or delivered.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrders.slice(0, 5).map((order) => {
                const store = stores.find((s) => s.id === order.store_id);
                const rider = riders.find((r) => r.id === order.rider_id);

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl bg-white border border-slate-200 p-4 hover:border-emerald-500/50 hover:shadow-md transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black text-emerald-700">
                          #{order.id.slice(0, 8)}
                        </span>
                        <Badge status={order.status} />
                        <span className="text-xs text-slate-400 font-medium">
                          {new Date(order.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                          <Store className="w-3.5 h-3.5 text-purple-600" />
                          <span className="truncate">{store?.name || order.store_id}</span>
                        </div>

                        <div className="flex items-center gap-1 text-slate-600">
                          <Bike className="w-3.5 h-3.5 text-blue-600" />
                          <span>{rider?.name || "Unassigned"}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 truncate">
                        {order.items?.map((i) => `${i.name} (x${i.quantity})`).join(", ")}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0 shrink-0">
                      <span className="text-base font-black text-slate-900 font-mono">
                        ₹{order.estimated_total}
                      </span>
                      <button
                        onClick={() => setActiveTab("orders")}
                        className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer"
                      >
                        Dispatch / View →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Fleet Status & Quick Actions */}
        <div className="space-y-6">
          {/* Active Fleet Preview */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Bike className="w-4 h-4 text-blue-600" />
                <span>Live Fleet Roster</span>
              </h3>
              <button
                onClick={() => setActiveTab("fleet")}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
              >
                Manage ({riders.length}) →
              </button>
            </div>

            <div className="space-y-2.5">
              {riders.slice(0, 4).map((rider) => (
                <div
                  key={rider.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        rider.is_online ? (rider.is_busy ? "bg-amber-500" : "bg-emerald-500") : "bg-slate-400"
                      }`}
                    />
                    <div>
                      <p className="font-bold text-slate-900">{rider.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{rider.phone}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      rider.is_online
                        ? rider.is_busy
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {rider.is_online ? (rider.is_busy ? "On Delivery" : "Available") : "Offline"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Partner Summary */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3 shadow-xs">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-purple-600" />
              <span>Merchant Counters</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-500 font-medium">Grocery Stores</p>
                <p className="text-lg font-black text-emerald-600">
                  {stores.filter((s) => s.category?.toLowerCase() === "grocery").length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-500 font-medium">Restaurants</p>
                <p className="text-lg font-black text-amber-600">
                  {stores.filter((s) => s.category?.toLowerCase() === "food").length}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab("merchants")}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              Open Merchant Directory →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
