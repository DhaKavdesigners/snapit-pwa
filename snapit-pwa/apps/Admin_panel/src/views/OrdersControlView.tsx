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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order ID, Customer, Phone or Store..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
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
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid / Table */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <Zap className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-900">No Orders Found</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search or status filter.</p>
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
                className={`rounded-3xl bg-white border p-5 transition-all shadow-xs flex flex-col justify-between ${
                  isLive ? "border-slate-300 hover:border-emerald-500/50 hover:shadow-md" : "border-slate-200 opacity-90"
                }`}
              >
                {/* Order Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-emerald-700">
                          #{order.id.slice(0, 10)}
                        </span>
                        <Badge status={order.status} />
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(order.created_at).toLocaleString()}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-slate-900 font-mono">
                        ₹{order.estimated_total}
                      </span>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">
                        {order.payment_method || "UPI"} • {order.payment_status || "PAID"}
                      </p>
                    </div>
                  </div>

                  {/* Merchant & Rider Line */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs">
                    {/* Store info */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Store className="w-4 h-4 text-purple-600 shrink-0" />
                        <div className="truncate">
                          <p className="font-bold text-slate-900 truncate">
                            {store?.name || order.store_id}
                          </p>
                          <p className="text-[10px] text-slate-500">Merchant Counter</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setReassignStoreModal(order);
                          setSelectedNewStoreId(order.store_id);
                        }}
                        title="Reassign Store"
                        className="text-[10px] text-purple-600 hover:text-purple-800 font-bold underline shrink-0 cursor-pointer"
                      >
                        Change
                      </button>
                    </div>

                    {/* Rider info */}
                    <div className="flex items-center justify-between gap-2 sm:border-l sm:border-slate-200 sm:pl-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Bike className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="truncate">
                          <p className="font-bold text-slate-900 truncate">
                            {rider ? rider.name : "Unassigned"}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {rider ? `${rider.vehicle_type || "Bike"} • ${rider.phone}` : "No rider assigned"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setAssignRiderModal(order);
                          setSelectedRiderId(order.rider_id || "");
                        }}
                        className="text-[10px] bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white px-2 py-1 rounded-md font-bold transition-colors shrink-0 cursor-pointer border border-blue-200"
                      >
                        {rider ? "Re-assign" : "Assign Rider"}
                      </button>
                    </div>
                  </div>

                  {/* Customer & Address Details */}
                  <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
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
                            className="text-emerald-700 hover:text-emerald-800 p-1 bg-emerald-50 rounded-lg border border-emerald-200"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`tel:${order.recipient_phone}`}
                            className="text-blue-700 hover:text-blue-800 p-1 bg-blue-50 rounded-lg border border-blue-200"
                            title="Call Customer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-1.5 text-[11px] text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        {typeof order.delivery_address === "string"
                          ? order.delivery_address
                          : order.delivery_address?.address ||
                            `${order.delivery_address?.line1 || ""} ${order.delivery_address?.landmark || ""}`}
                      </span>
                    </div>

                    {order.delivery_pin && (
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-amber-900 font-bold px-2 py-0.5 bg-amber-50 rounded border border-amber-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
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
                          className="flex items-center justify-between text-xs text-slate-700 py-0.5 border-b border-slate-100 last:border-0"
                        >
                          <span className="truncate">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-mono text-slate-600 shrink-0">
                            ₹{(item.price || (item.price_paise ? item.price_paise / 100 : 0)) * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Status Override Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Set Status:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {order.status !== "ACCEPTED" && (
                      <button
                        onClick={() => handleStatusChange(order.id, "ACCEPTED")}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded text-[11px] font-bold transition-all cursor-pointer border border-blue-200"
                      >
                        Accept
                      </button>
                    )}
                    {order.status !== "PREPARING" && (
                      <button
                        onClick={() => handleStatusChange(order.id, "PREPARING")}
                        className="px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-500 hover:text-slate-950 rounded text-[11px] font-bold transition-all cursor-pointer border border-amber-300"
                      >
                        Preparing
                      </button>
                    )}
                    {order.status !== "OUT_FOR_DELIVERY" && (
                      <button
                        onClick={() => handleStatusChange(order.id, "OUT_FOR_DELIVERY")}
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded text-[11px] font-bold transition-all cursor-pointer border border-indigo-200"
                      >
                        Out for Delivery
                      </button>
                    )}
                    {order.status !== "DELIVERED" && (
                      <button
                        onClick={() => handleStatusChange(order.id, "DELIVERED")}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white rounded text-[11px] font-bold transition-all cursor-pointer border border-emerald-300"
                      >
                        Delivered ✓
                      </button>
                    )}
                    {order.status !== "CANCELLED" && (
                      <button
                        onClick={() => handleStatusChange(order.id, "CANCELLED")}
                        className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white rounded text-[11px] font-bold transition-all cursor-pointer border border-rose-200"
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
            <label className="text-xs font-bold text-slate-700">Select Delivery Rider:</label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {riders.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRiderId(r.id)}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedRiderId === r.id
                      ? "bg-emerald-50 border-emerald-500 text-slate-900 shadow-xs"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        r.is_online ? (r.is_busy ? "bg-amber-500" : "bg-emerald-500") : "bg-slate-400"
                      }`}
                    />
                    <div>
                      <p className="font-black text-xs text-slate-900">{r.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {r.phone} • {r.vehicle_type || "Bike"} ({r.vehicle_number || "KA-08"})
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      r.is_online
                        ? r.is_busy
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {r.is_online ? (r.is_busy ? "Busy" : "Ready") : "Offline"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              onClick={() => setAssignRiderModal(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignRiderSubmit}
              disabled={!selectedRiderId}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs"
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
            <label className="text-xs font-bold text-slate-700">Select Fulfillment Merchant:</label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {stores.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedNewStoreId(s.id)}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedNewStoreId === s.id
                      ? "bg-purple-50 border-purple-500 text-slate-900 shadow-xs"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Store className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="font-black text-xs text-slate-900">{s.name}</p>
                      <p className="text-[10px] text-slate-500">{s.category} • {s.address || "KGF"}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      s.is_online
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {s.is_online ? "Open" : "Closed"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              onClick={() => setReassignStoreModal(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleReassignStoreSubmit}
              disabled={!selectedNewStoreId}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Confirm Store Reassignment →
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
