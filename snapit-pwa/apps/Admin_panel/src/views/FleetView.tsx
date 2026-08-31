import React, { useState } from "react";
import {
  Bike,
  Plus,
  Search,
  Phone,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  RotateCcw,
  Zap,
  Star,
  MapPin,
} from "lucide-react";
import { useAdminStore } from "../store/useAdminStore";
import { AdminRider } from "../types/admin";
import { Modal } from "../components/common/Modal";

export const FleetView: React.FC = () => {
  const {
    riders,
    orders,
    createRider,
    updateRider,
    toggleRiderOnline,
    resetRiderBusy,
    deleteRider,
  } = useAdminStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState<string>("ALL");

  const [addRiderModal, setAddRiderModal] = useState(false);
  const [editRiderModal, setEditRiderModal] = useState<AdminRider | null>(null);

  const [riderForm, setRiderForm] = useState({
    name: "",
    phone: "",
    vehicle_type: "Bike",
    vehicle_number: "KA-08-E-1234",
    avatar_url: "/images/riders/rider_avatar.png",
    is_online: true,
  });

  const filteredRiders = riders.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterState === "ALL") return true;
    if (filterState === "ONLINE") return r.is_online;
    if (filterState === "BUSY") return r.is_online && r.is_busy;
    if (filterState === "OFFLINE") return !r.is_online;
    return true;
  });

  const handleOpenAddRider = () => {
    setRiderForm({
      name: "",
      phone: "",
      vehicle_type: "Bike",
      vehicle_number: "KA-08-E-1234",
      avatar_url: "/images/riders/rider_avatar.png",
      is_online: true,
    });
    setAddRiderModal(true);
  };

  const handleSaveRider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riderForm.name || !riderForm.phone) return;

    if (editRiderModal) {
      await updateRider(editRiderModal.id, riderForm);
      setEditRiderModal(null);
    } else {
      await createRider(riderForm);
      setAddRiderModal(false);
    }
  };

  const handleOpenEditRider = (rider: AdminRider) => {
    setRiderForm({
      name: rider.name,
      phone: rider.phone,
      vehicle_type: rider.vehicle_type || "Bike",
      vehicle_number: rider.vehicle_number || "",
      avatar_url: rider.avatar_url || "",
      is_online: rider.is_online !== false,
    });
    setEditRiderModal(rider);
  };

  const handleDeleteRider = async (riderId: string) => {
    if (window.confirm("Are you sure you want to remove this delivery partner?")) {
      await deleteRider(riderId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search riders by name, phone, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[
              { id: "ALL", label: `All (${riders.length})` },
              { id: "ONLINE", label: `Online (${riders.filter((r) => r.is_online).length})` },
              { id: "BUSY", label: "On Delivery" },
              { id: "OFFLINE", label: "Offline" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterState(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filterState === tab.id
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleOpenAddRider}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Rider</span>
          </button>
        </div>
      </div>

      {/* Fleet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredRiders.map((rider) => {
          const isOnline = rider.is_online !== false;
          const isBusy = isOnline && rider.is_busy;
          const assignedOrder = orders.find((o) => o.id === rider.current_order_id);

          return (
            <div
              key={rider.id}
              className="rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
            >
              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                      {rider.avatar_url ? (
                        <img
                          src={rider.avatar_url}
                          alt={rider.name}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        "🛵"
                      )}
                    </div>

                    <div>
                      <h3 className="font-black text-base text-white leading-tight">{rider.name}</h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{rider.phone}</p>
                    </div>
                  </div>

                  {/* Online / Offline switch */}
                  <button
                    onClick={() => toggleRiderOnline(rider.id, !isOnline)}
                    className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer border ${
                      isOnline
                        ? isBusy
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {isOnline ? (isBusy ? "🟡 On Delivery" : "🟢 Online") : "🔴 Offline"}
                  </button>
                </div>

                {/* Details */}
                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Vehicle:</span>
                    <span className="font-bold text-white">
                      {rider.vehicle_type || "Bike"} • {rider.vehicle_number || "KA-08"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total Completed Trips:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {rider.total_trips || 0} deliveries
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Rider Rating:</span>
                    <span className="flex items-center gap-1 font-bold text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{rider.rating || 5.0}</span>
                    </span>
                  </div>

                  {isBusy && (
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-amber-400 font-bold">Active Trip:</span>
                      <span className="font-mono text-xs text-slate-200">
                        #{rider.current_order_id?.slice(0, 8) || "Assigned"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                {isBusy && (
                  <button
                    onClick={() => resetRiderBusy(rider.id)}
                    title="Reset Busy status to Available"
                    className="flex items-center gap-1 px-3 py-2 bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Free Up</span>
                  </button>
                )}

                <a
                  href={`tel:${rider.phone}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Call Rider</span>
                </a>

                <button
                  onClick={() => handleOpenEditRider(rider)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
                  title="Edit Rider"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteRider(rider.id)}
                  className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl transition-all cursor-pointer"
                  title="Remove Rider"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Rider Modal */}
      <Modal
        isOpen={addRiderModal || !!editRiderModal}
        onClose={() => {
          setAddRiderModal(false);
          setEditRiderModal(null);
        }}
        title={editRiderModal ? `Edit ${editRiderModal.name}` : "Onboard New Delivery Partner"}
        subtitle="Register rider details for automated & manual order dispatch in KGF"
        maxWidth="md"
      >
        <form onSubmit={handleSaveRider} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Rider Full Name *</label>
            <input
              type="text"
              required
              value={riderForm.name}
              onChange={(e) => setRiderForm({ ...riderForm, name: e.target.value })}
              placeholder="e.g. Ramesh Kumar, Praveen K"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">10-Digit Mobile Phone *</label>
            <input
              type="tel"
              required
              value={riderForm.phone}
              onChange={(e) => setRiderForm({ ...riderForm, phone: e.target.value })}
              placeholder="e.g. 8217649688"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Vehicle Type</label>
              <select
                value={riderForm.vehicle_type}
                onChange={(e) => setRiderForm({ ...riderForm, vehicle_type: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Bike">Motorcycle / Bike</option>
                <option value="Scooter">Scooter / Activa</option>
                <option value="EV Scooter">Electric EV Scooter</option>
                <option value="Bicycle">Bicycle</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Vehicle Number</label>
              <input
                type="text"
                value={riderForm.vehicle_number}
                onChange={(e) => setRiderForm({ ...riderForm, vehicle_number: e.target.value })}
                placeholder="e.g. KA-08-EF-5678"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Avatar URL</label>
            <input
              type="text"
              value={riderForm.avatar_url}
              onChange={(e) => setRiderForm({ ...riderForm, avatar_url: e.target.value })}
              placeholder="/images/riders/..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setAddRiderModal(false);
                setEditRiderModal(null);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              {editRiderModal ? "Save Changes" : "Register Rider"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
