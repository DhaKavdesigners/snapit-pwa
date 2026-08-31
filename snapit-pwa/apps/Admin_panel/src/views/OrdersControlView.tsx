import React, { useState } from "react";
import {
  Zap,
  Search,
  Bike,
  Store,
  Phone,
  MessageCircle,
  Clock,
  User,
  MapPin,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useAdminStore } from "../store/useAdminStore";
import { AdminOrder, OrderStatus } from "../types/admin";
import { Badge } from "../components/common/Badge";
import { Modal } from "../components/common/Modal";

export const OrdersControlView: React.FC = () => {
  const {
    orders,
    stores,
    riders,
    assignRiderToOrder,
    updateOrderStatus,
    reassignStore,
  } = useAdminStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [assignRiderModal, setAssignRiderModal] = useState<AdminOrder | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState<string>("");
  const [reassignStoreModal, setReassignStoreModal] = useState<AdminOrder | null>(null);
  const [selectedNewStoreId, setSelectedNewStoreId] = useState<string>("");

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.recipient_phone?.includes(searchQuery) ||
      o.store_id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "ALL") return true;
    if (statusFilter === "ACTIVE")
      return !["DELIVERED", "CANCELLED", "REJECTED"].includes(o.status);
    return o.status === statusFilter;
  });

  const handleAssignRiderSubmit = async () => {
    if (!assignRiderModal || !selectedRiderId) return;
    await assignRiderToOrder(assignRiderModal.id, selectedRiderId);
    setAssignRiderModal(null);
    setSelectedRiderId("");
  };

  const handleReassignStoreSubmit = async () => {
    if (!reassignStoreModal || !selectedNewStoreId) return;
    await reassignStore(reassignStoreModal.id, selectedNewStoreId);
    setReassignStoreModal(null);
    setSelectedNewStoreId("");
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    await updateOrderStatus(orderId, status);
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar: Search & Status Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order ID, Customer, Phone or Store..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: `All (${orders.length})` },
            {
              id: "ACTIVE",
              label: `Active (${orders.filter((o) => !["DELIVERED", "CANCELLED", "REJECTED"].includes(o.status)).length})`,
            },
            { id: "PLACED", label: "Placed" },
            { id: "PREPARING", label: "Preparing" },
            { id: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
            { id: "DELIVERED", label: "Delivered" },
            { id: "CANCELLED", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid / Table */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-12 text-center">
          <Zap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-base font-bold text-white">No Orders Found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search or status filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const store = stores.find((s) => s.id === order.store_id);
            const rider = riders.find((r) => r.id === order.rider_id);
            const isLive = !["DELIVERED", "CANCELLED", "REJECTED"].includes(order.status);

            return (
              <div
                key={order.id}
                className={`rounded-3xl bg-slate-900 border p-5 transition-all shadow-lg flex flex-col justify-between ${
                  isLive ? "border-slate-700/90 hover:border-emerald-500/50" : "border-slate-800/80 opacity-90"
                }`}
              >
                {/* Order Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-emerald-400">
                          #{order.id.slice(0, 10)}
                        </span>
                        <Badge status={order.status} />
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(order.created_at).toLocaleString()}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-white font-mono">
                        ₹{order.estimated_total}
                      </span>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">
                        {order.payment_method || "UPI"} • {order.payment_status || "PAID"}
                      </p>
                    </div>
                  </div>

                  {/* Merchant & Rider Line */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-xs">
                    {/* Store info */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Store className="w-4 h-4 text-purple-400 shrink-0" />
                        <div className="truncate">
                          <p className="font-bold text-slate-200 truncate">
                            {store?.name || order.store_id}
                          </p>
                          <p className="text-[10px] text-slate-400">Merchant Counter</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setReassignStoreModal(order);
                          setSelectedNewStoreId(order.store_id);
                        }}
                        title="Reassign Store"
                        className="text-[10px] text-purple-400 hover:text-purple-300 font-bold underline shrink-0 cursor-pointer"
                      >
                        Change
                      </button>
                    </div>

                    {/* Rider info */}
                    <div className="flex items-center justify-between gap-2 sm:border-l sm:border-slate-800 sm:pl-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Bike className="w-4 h-4 text-blue-400 shrink-0" />
                        <div className="truncate">
                          <p className="font-bold text-slate-200 truncate">
                            {rider ? rider.name : "Unassigned"}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {rider ? `${rider.vehicle_type || "Bike"} • ${rider.phone}` : "No rider assigned"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setAssignRiderModal(order);
                          setSelectedRiderId(order.rider_id || "");
                        }}
                        className="text-[10px] bg-blue-500/20 text-blue-300 hover:bg-blue-500 hover:text-white px-2 py-1 rounded-md font-bold transition-colors shrink-0 cursor-pointer"
                      >
                        {rider ? "Re-assign" : "Assign Rider"}
                      </button>
                    </div>
                  </div>

                  {/* Customer & Address Details */}
                  <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-slate-200">
                        <User className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{order.recipient_name || "Customer"}</span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          ({order.recipient_phone || "No phone"})
                        </span>
                      </div>

                      {order.recipient_phone && (
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://wa.me/91${order.recipient_phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 p-1 bg-emerald-500/10 rounded-lg"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`tel:${order.recipient_phone}`}
                            className="text-blue-400 hover:text-blue-300 p-1 bg-blue-500/10 rounded-lg"
                            title="Call Customer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-1.5 text-[11px] text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        {typeof order.delivery_address === "string"
                          ? order.delivery_address
                          : order.delivery_address?.address ||
                            `${order.delivery_address?.line1 || ""} ${order.delivery_address?.landmark || ""}`}
                      </span>
                    </div>

                    {order.delivery_pin && (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400 font-bold pt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Delivery Handshake PIN: {order.delivery_pin}</span>
                      </div>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Ordered Items ({order.items?.length || 0})
                    </p>
                    <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                      {order.items?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs text-slate-300 py-0.5 border-b border-slate-800/40 last:border-0"
                        >
                          <span className="truncate">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-mono text-slate-400 shrink-0">
                            ₹{(item.price || (item.price_paise ? item.price_paise / 100 : 0)) * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Status Override Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Set Status:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {order.status !== "ACCEPTED" && (
                      <button
                        onClick={() => handleStatusChange(order.id, "ACCEPTED")}
                        className="px-2.5 py-1 bg-blue-500/20 text-blue-300 hover:bg-blue-500 hover:text-white rounded text-[11px] font-bold transition-all cursor-pointer"
                      >
                        Accept
                      </button>
                    )}
                    {order.status !== "PREPARING" && (
                      <button
                        onClick={() => handleStatusChange(order.id, "PREPARING")}
                        className="px-2.5 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 rounded text-[11px] font-bold transition-all cursor-pointer"
                      >
                        Preparing
                      </button>
                    )}
                    {order.status !== "OUT_FOR_DELIVERY" && (
                      <button
                        onClick={() => handleStatusChange(order.id, "OUT_FOR_DELIVERY")}
                        className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white rounded text-[11px] font-bold transition-all cursor-pointer"
                      >
                        Out for Delivery
                      </button>
                    )}
                    {order.status !== "DELIVERED" && (
                      <button
                        onClick={() => handleStatusChange(order.id, "DELIVERED")}
                        className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 rounded text-[11px] font-bold transition-all cursor-pointer"
                      >
                        Delivered ✓
                      </button>
                    )}
                    {order.status !== "CANCELLED" && (
                      <button
                        onClick={() => handleStatusChange(order.id, "CANCELLED")}
                        className="px-2 py-1 bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white rounded text-[11px] font-bold transition-all cursor-pointer"
                      >
                        Cancel ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Direct Assign Rider Modal */}
      <Modal
        isOpen={!!assignRiderModal}
        onClose={() => setAssignRiderModal(null)}
        title="Direct Fleet Rider Dispatch"
        subtitle={`Assign Order #${assignRiderModal?.id.slice(0, 8)} to an active delivery partner`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Select Delivery Rider:</label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {riders.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRiderId(r.id)}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedRiderId === r.id
                      ? "bg-emerald-500/20 border-emerald-500 text-white"
                      : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        r.is_online ? (r.is_busy ? "bg-amber-400" : "bg-emerald-400") : "bg-slate-600"
                      }`}
                    />
                    <div>
                      <p className="font-black text-xs">{r.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {r.phone} • {r.vehicle_type || "Bike"} ({r.vehicle_number || "KA-08"})
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      r.is_online
                        ? r.is_busy
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-emerald-500/20 text-emerald-300"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {r.is_online ? (r.is_busy ? "Busy" : "Ready") : "Offline"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              onClick={() => setAssignRiderModal(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignRiderSubmit}
              disabled={!selectedRiderId}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer"
            >
              Confirm Dispatch →
            </button>
          </div>
        </div>
      </Modal>

      {/* Direct Reassign Store Modal */}
      <Modal
        isOpen={!!reassignStoreModal}
        onClose={() => setReassignStoreModal(null)}
        title="Reassign Partner Store"
        subtitle={`Switch fulfillment counter for Order #${reassignStoreModal?.id.slice(0, 8)}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Select Fulfillment Merchant:</label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {stores.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedNewStoreId(s.id)}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedNewStoreId === s.id
                      ? "bg-purple-500/20 border-purple-500 text-white"
                      : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Store className="w-4 h-4 text-purple-400" />
                    <div>
                      <p className="font-black text-xs">{s.name}</p>
                      <p className="text-[10px] text-slate-400">{s.category} • {s.address || "KGF"}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      s.is_online ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                    }`}
                  >
                    {s.is_online ? "Open" : "Closed"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              onClick={() => setReassignStoreModal(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleReassignStoreSubmit}
              disabled={!selectedNewStoreId}
              className="px-5 py-2 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all cursor-pointer"
            >
              Confirm Store Reassignment →
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
