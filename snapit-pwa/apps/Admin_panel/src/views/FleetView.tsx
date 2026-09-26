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
  Star,
  ShieldCheck,
  Clock,
  Eye,
  ExternalLink,
  FileCheck,
  AlertTriangle,
  UserCheck,
  Calendar,
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
    approveRider,
    rejectRider,
    toggleRiderOnline,
    resetRiderBusy,
    deleteRider,
  } = useAdminStore();

  // Top sub-tab: Active Fleet vs Pending Approvals vs Rejected
  const [mainTab, setMainTab] = useState<"ACTIVE" | "PENDING" | "REJECTED">("ACTIVE");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState<string>("ALL");

  const [addRiderModal, setAddRiderModal] = useState(false);
  const [editRiderModal, setEditRiderModal] = useState<AdminRider | null>(null);

  // Review & Verification Modal states
  const [reviewRider, setReviewRider] = useState<AdminRider | null>(null);
  const [rejectingRider, setRejectingRider] = useState<AdminRider | null>(null);
  const [rejectionReason, setRejectionReason] = useState("Documents or details could not be verified.");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [riderForm, setRiderForm] = useState({
    name: "",
    phone: "",
    vehicle_type: "Bike",
    vehicle_number: "KA-08-E-1234",
    avatar_url: "/images/riders/rider_avatar.png",
    is_online: true,
  });

  // Categorize riders based on verification status
  const pendingRiders = riders.filter((r) => {
    const isPendingStatus = r.verification_status === "PENDING";
    const isLegacyUnverified = r.is_verified === false && !r.verification_status;
    return isPendingStatus || isLegacyUnverified;
  });

  const activeRiders = riders.filter((r) => {
    const isApprovedStatus = r.verification_status === "APPROVED";
    const isLegacyApproved = r.is_verified === true && r.verification_status !== "PENDING" && r.verification_status !== "REJECTED";
    return isApprovedStatus || isLegacyApproved;
  });

  const rejectedRiders = riders.filter((r) => r.verification_status === "REJECTED");

  // Determine current working list based on selected mainTab
  const currentList =
    mainTab === "PENDING"
      ? pendingRiders
      : mainTab === "REJECTED"
      ? rejectedRiders
      : activeRiders;

  const filteredRiders = currentList.filter((r) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      r.name.toLowerCase().includes(query) ||
      r.phone.includes(query) ||
      r.id.toLowerCase().includes(query) ||
      (r.Rider_ID && r.Rider_ID.toLowerCase().includes(query)) ||
      (r.selected_zone_name && r.selected_zone_name.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    if (mainTab === "ACTIVE") {
      if (filterState === "ALL") return true;
      if (filterState === "ONLINE") return r.is_online;
      if (filterState === "BUSY") return r.is_online && r.is_busy;
      if (filterState === "OFFLINE") return !r.is_online;
    }
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
      showToast("Rider updated successfully.");
    } else {
      await createRider(riderForm);
      setAddRiderModal(false);
      showToast("New rider onboarded successfully.");
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
    const rider = riders.find((r) => r.id === riderId);
    const label = rider?.name || rider?.Rider_ID || riderId;
    if (
      window.confirm(
        `Permanently delete "${label}" from the database?\n\nThis cannot be undone. The rider's application and all KYC data will be removed.`
      )
    ) {
      const success = await deleteRider(riderId);
      if (success) {
        showToast(`Rider "${label}" permanently deleted.`);
      } else {
        alert("Delete failed — the database may have blocked this action. Check Supabase RLS policies.");
      }
    }
  };

  // Admin Approval Action
  const handleApproveRiderAction = async (rider: AdminRider) => {
    setIsProcessing(true);
    const success = await approveRider(rider.id, "Master Admin");
    setIsProcessing(false);

    if (success) {
      setReviewRider(null);
      showToast(`Rider ${rider.Rider_ID || rider.name} approved successfully!`);
    } else {
      alert("Failed to approve rider. Please try again.");
    }
  };

  // Admin Reject Action
  const handleRejectRiderAction = async () => {
    if (!rejectingRider) return;
    setIsProcessing(true);
    const success = await rejectRider(rejectingRider.id, rejectionReason, "Master Admin");
    setIsProcessing(false);

    if (success) {
      const rejectedId = rejectingRider.Rider_ID || rejectingRider.name;
      setRejectingRider(null);
      setReviewRider(null);
      showToast(`Rider ${rejectedId} marked as rejected.`);
    } else {
      alert("Failed to reject rider. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-xl border border-emerald-400 flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── TOP LEVEL SECTION NAVIGATION ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2">
          {/* Active Fleet Tab */}
          <button
            onClick={() => {
              setMainTab("ACTIVE");
              setFilterState("ALL");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mainTab === "ACTIVE"
                ? "bg-emerald-600 text-white shadow-xs font-black"
                : "bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>Active Fleet</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              mainTab === "ACTIVE" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
            }`}>
              {activeRiders.length}
            </span>
          </button>

          {/* Pending Verification Tab (with live pulse if pending riders exist) */}
          <button
            onClick={() => {
              setMainTab("PENDING");
              setFilterState("ALL");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
              mainTab === "PENDING"
                ? "bg-amber-500 text-white shadow-xs font-black"
                : "bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pending Verification</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 ${
                pendingRiders.length > 0
                  ? mainTab === "PENDING"
                    ? "bg-amber-700 text-white"
                    : "bg-amber-50 text-amber-700 border border-amber-300"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {pendingRiders.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              )}
              <span>{pendingRiders.length}</span>
            </span>
          </button>

          {/* Rejected Tab (optional view) */}
          {rejectedRiders.length > 0 && (
            <button
              onClick={() => {
                setMainTab("REJECTED");
                setFilterState("ALL");
              }}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mainTab === "REJECTED"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>Rejected ({rejectedRiders.length})</span>
            </button>
          )}
        </div>

        {/* Right Action: Onboard Rider */}
        {mainTab === "ACTIVE" && (
          <button
            onClick={handleOpenAddRider}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Rider Manually</span>
          </button>
        )}
      </div>

      {/* ── SEARCH & FILTER CONTROLS BAR ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              mainTab === "PENDING"
                ? "Search pending applicants by name, phone, or Rider ID..."
                : "Search active riders by name, phone, or ID..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
          />
        </div>

        {/* Status Filters (Only for Active Fleet) */}
        {mainTab === "ACTIVE" && (
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { id: "ALL", label: `All (${activeRiders.length})` },
              { id: "ONLINE", label: `Online (${activeRiders.filter((r) => r.is_online).length})` },
              { id: "BUSY", label: "On Delivery" },
              { id: "OFFLINE", label: "Offline" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterState(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filterState === tab.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {mainTab === "PENDING" && (
          <div className="flex items-center gap-2 text-xs text-amber-800 font-bold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-300">
            <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>{pendingRiders.length} Applications Awaiting Review</span>
          </div>
        )}
      </div>

      {/* ── EMPTY STATE ── */}
      {filteredRiders.length === 0 && (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 mx-auto flex items-center justify-center text-slate-500 text-2xl">
            {mainTab === "PENDING" ? "📋" : "🛵"}
          </div>
          <h3 className="font-bold text-base text-slate-900">
            {mainTab === "PENDING"
              ? "No Pending Verifications"
              : searchQuery
              ? "No riders found matching your search"
              : "No riders in this section"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {mainTab === "PENDING"
              ? "All registered riders have been reviewed and approved. When a new rider registers in the Rider App, their application will appear here in real time."
              : "Try adjusting your search terms or filter selection above."}
          </p>
        </div>
      )}

      {/* ── SECTION A: PENDING VERIFICATION LIST ── */}
      {mainTab === "PENDING" && filteredRiders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredRiders.map((rider) => {
            const hasSelfie = Boolean(rider.selfie_url || rider.avatar_url);
            const hasAadhaar = Boolean(rider.aadhaar_number || rider.aadhaar_doc_url);
            const hasPan = Boolean(rider.pan_number || rider.pan_doc_url);
            const hasDl = Boolean(rider.dl_number || rider.dl_doc_url);
            const docsCount = [hasSelfie, hasAadhaar, hasPan, hasDl].filter(Boolean).length;

            return (
              <div
                key={rider.id}
                className="rounded-3xl bg-white border-2 border-amber-300/90 hover:border-amber-500 p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all"
              >
                {/* Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-amber-400 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                        {rider.selfie_url || rider.avatar_url ? (
                          <img
                            src={rider.selfie_url || rider.avatar_url}
                            alt={rider.name}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">👤</span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-black text-base text-slate-900 leading-tight">{rider.name}</h3>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{rider.phone}</p>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-300 text-amber-800 rounded-md text-[10px] font-mono font-bold mt-1">
                          <span>ID: {rider.Rider_ID || rider.id}</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 bg-amber-50 border border-amber-300 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                      <span>Pending</span>
                    </span>
                  </div>

                  {/* Details Card */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Zone:</span>
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <span>{rider.selected_zone_name || "Robertsonpet"}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Vehicle:</span>
                      <span className="font-bold text-slate-800">
                        {rider.vehicle_type || "Bike"} • {rider.vehicle_number || "Unspecified"}
                      </span>
                    </div>

                    {rider.dob && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">DOB:</span>
                        <span className="font-mono text-slate-700">{rider.dob}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-500">KYC Completed:</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{docsCount} / 4 items submitted</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
                  <button
                    onClick={() => setReviewRider(rider)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Review Application</span>
                  </button>

                  <button
                    onClick={() => handleApproveRiderAction(rider)}
                    title="Quick Approve"
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  <button
                    onClick={() => setRejectingRider(rider)}
                    title="Reject Application"
                    className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl transition-all border border-amber-300 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteRider(rider.id)}
                    title="Permanently Delete Application"
                    className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all border border-rose-300 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── SECTION B: ACTIVE FLEET ROSTER GRID ── */}
      {mainTab === "ACTIVE" && filteredRiders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredRiders.map((rider) => {
            const isOnline = rider.is_online !== false;
            const isBusy = isOnline && rider.is_busy;
            const assignedOrder = orders.find((o) => o.id === rider.current_order_id);

            return (
              <div
                key={rider.id}
                className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
              >
                {/* Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                        {rider.avatar_url || rider.selfie_url ? (
                          <img
                            src={rider.avatar_url || rider.selfie_url}
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
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-black text-base text-slate-900 leading-tight">{rider.name}</h3>
                          <span title="Verified Rider">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-500 font-mono">{rider.phone}</span>
                          {rider.Rider_ID && (
                            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-300">
                              {rider.Rider_ID}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Online / Offline switch */}
                    <button
                      onClick={() => toggleRiderOnline(rider.id, !isOnline)}
                      className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer border ${
                        isOnline
                          ? isBusy
                            ? "bg-amber-50 text-amber-700 border-amber-300"
                            : "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {isOnline ? (isBusy ? "🟡 On Delivery" : "🟢 Online") : "🔴 Offline"}
                    </button>
                  </div>

                  {/* Details */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5 text-xs text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Vehicle:</span>
                      <span className="font-bold text-slate-900">
                        {rider.vehicle_type || "Bike"} • {rider.vehicle_number || "KA-08"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Total Completed Trips:</span>
                      <span className="font-mono font-bold text-emerald-600">
                        {rider.total_trips || 0} deliveries
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Rider Rating:</span>
                      <span className="flex items-center gap-1 font-bold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{rider.rating || 5.0}</span>
                      </span>
                    </div>

                    {isBusy && (
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-amber-700 font-bold">Active Trip:</span>
                        <span className="font-mono text-xs text-slate-800">
                          #{rider.current_order_id?.slice(0, 8) || "Assigned"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                  {isBusy && (
                    <button
                      onClick={() => resetRiderBusy(rider.id)}
                      title="Reset Busy status to Available"
                      className="flex items-center gap-1 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl transition-all cursor-pointer border border-amber-300"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Free Up</span>
                    </button>
                  )}

                  <a
                    href={`tel:${rider.phone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-200"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Call Rider</span>
                  </a>

                  <button
                    onClick={() => setReviewRider(rider)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all cursor-pointer border border-slate-200"
                    title="View Registration Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleOpenEditRider(rider)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all cursor-pointer border border-slate-200"
                    title="Edit Rider"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteRider(rider.id)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer border border-rose-200"
                    title="Remove Rider"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── SECTION C: REJECTED RIDERS VIEW ── */}
      {mainTab === "REJECTED" && filteredRiders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredRiders.map((rider) => (
            <div
              key={rider.id}
              className="rounded-3xl bg-white border border-rose-300 p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{rider.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">{rider.phone}</p>
                    <span className="text-[10px] font-mono text-slate-400">ID: {rider.Rider_ID || rider.id}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-300">
                    Rejected
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Rejection Reason:</p>
                  <p className="text-rose-700 font-medium">{rider.rejection_reason || "Documents could not be verified."}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
                <button
                  onClick={() => handleApproveRiderAction(rider)}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Re-Approve Rider
                </button>
                <button
                  onClick={() => handleDeleteRider(rider.id)}
                  className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-all border border-rose-200 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          COMPREHENSIVE ADMIN REVIEW & VERIFICATION MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {reviewRider && (
        <Modal
          isOpen={true}
          onClose={() => setReviewRider(null)}
          title="Rider Registration Review"
          subtitle={`Rider ID: ${reviewRider.Rider_ID || reviewRider.id} • ${reviewRider.name}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs text-slate-700">
            {/* Top Identity Banner */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              {/* Live Selfie Box */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-white border-2 border-emerald-500 overflow-hidden shadow-xs">
                  {reviewRider.selfie_url || reviewRider.avatar_url ? (
                    <img
                      src={reviewRider.selfie_url || reviewRider.avatar_url}
                      alt={reviewRider.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                  )}
                </div>
                {(reviewRider.selfie_url || reviewRider.avatar_url) && (
                  <a
                    href={reviewRider.selfie_url || reviewRider.avatar_url}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-0 bg-slate-950/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-[10px] transition-opacity"
                  >
                    View Full
                  </a>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h2 className="text-xl font-black text-slate-900">{reviewRider.name}</h2>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block border ${
                      reviewRider.verification_status === "APPROVED" || reviewRider.is_verified
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : reviewRider.verification_status === "REJECTED"
                        ? "bg-rose-50 text-rose-700 border-rose-300"
                        : "bg-amber-50 text-amber-700 border-amber-300"
                    }`}
                  >
                    Status: {reviewRider.verification_status || (reviewRider.is_verified ? "APPROVED" : "PENDING")}
                  </span>
                </div>

                <p className="font-mono text-slate-600">{reviewRider.phone}</p>
                {reviewRider.email && <p className="text-slate-500">{reviewRider.email}</p>}

                <div className="pt-1 flex flex-wrap gap-2">
                  <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-700 rounded-lg text-[10px] font-mono font-bold">
                    Rider ID: {reviewRider.Rider_ID || reviewRider.id}
                  </span>
                  <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold">
                    Zone: {reviewRider.selected_zone_name || "Robertsonpet"}
                  </span>
                </div>
              </div>
            </div>

            {/* 2-Column Specs: Personal & Vehicle Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Personal Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-200">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Personal Details</span>
                </h4>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date of Birth (DOB):</span>
                    <span className="font-semibold text-slate-900 font-mono">{reviewRider.dob || "Not provided"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Alternate Contact:</span>
                    <span className="font-semibold text-slate-900 font-mono">{reviewRider.alt_phone || "None"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Registered Address:</span>
                    <span className="font-semibold text-slate-900 text-right max-w-[200px] leading-tight">
                      {reviewRider.address || "Not provided"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vehicle & Payout Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-200">
                  <Bike className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Vehicle & Financials</span>
                </h4>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vehicle Type:</span>
                    <span className="font-semibold text-slate-900">{reviewRider.vehicle_type || "Motorcycle"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vehicle Number:</span>
                    <span className="font-bold text-emerald-600 font-mono">{reviewRider.vehicle_number || "KA-08"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payout UPI ID:</span>
                    <span className="font-mono font-bold text-slate-900">{reviewRider.upi_id || `${reviewRider.phone}@upi`}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── KYC IDENTITY DOCUMENTS ── */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Submitted KYC Documents</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Aadhaar Card */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-[11px]">Aadhaar Card</span>
                    {reviewRider.aadhaar_number ? (
                      <span className="text-[10px] text-emerald-600 font-bold">Entered</span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Missing</span>
                    )}
                  </div>

                  <p className="font-mono text-xs text-slate-800 font-bold">
                    {reviewRider.aadhaar_number || "•••• •••• ••••"}
                  </p>

                  {reviewRider.aadhaar_doc_url ? (
                    <a
                      href={reviewRider.aadhaar_doc_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline pt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View Attached Scan</span>
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400 block pt-1">No file attached</span>
                  )}
                </div>

                {/* 2. PAN Card */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-[11px]">PAN Card</span>
                    {reviewRider.pan_number ? (
                      <span className="text-[10px] text-emerald-600 font-bold">Entered</span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Missing</span>
                    )}
                  </div>

                  <p className="font-mono text-xs text-slate-800 font-bold">
                    {reviewRider.pan_number || "••••••••••"}
                  </p>

                  {reviewRider.pan_doc_url ? (
                    <a
                      href={reviewRider.pan_doc_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline pt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View Attached Scan</span>
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400 block pt-1">No file attached</span>
                  )}
                </div>

                {/* 3. Driving License */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-[11px]">Driving License (DL)</span>
                    {reviewRider.dl_number ? (
                      <span className="text-[10px] text-emerald-600 font-bold">Entered</span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Missing</span>
                    )}
                  </div>

                  <p className="font-mono text-xs text-slate-800 font-bold">
                    {reviewRider.dl_number || "••••••••••••••"}
                  </p>

                  {reviewRider.dl_doc_url ? (
                    <a
                      href={reviewRider.dl_doc_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline pt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View Attached Scan</span>
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400 block pt-1">No file attached</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setReviewRider(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingRider(reviewRider)}
                  disabled={isProcessing}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-all border border-rose-300 cursor-pointer disabled:opacity-50"
                >
                  Reject Application
                </button>

                <button
                  type="button"
                  onClick={() => handleApproveRiderAction(reviewRider)}
                  disabled={isProcessing}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isProcessing ? "Approving..." : "Approve Rider"}</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── REJECTION REASON PROMPT MODAL ── */}
      {rejectingRider && (
        <Modal
          isOpen={true}
          onClose={() => setRejectingRider(null)}
          title="Reject Rider Application"
          subtitle={`Provide a notice for ${rejectingRider.name} (${rejectingRider.Rider_ID || rejectingRider.phone})`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Please specify the reason for rejecting this application. The rider will be informed on their app waiting screen.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Rejection Reason</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingRider(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectRiderAction}
                disabled={isProcessing}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── ADD / EDIT RIDER MODAL (EXISTING FEATURE PRESERVED) ── */}
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
            <label className="block text-xs font-bold text-slate-700 mb-1">Rider Full Name *</label>
            <input
              type="text"
              required
              value={riderForm.name}
              onChange={(e) => setRiderForm({ ...riderForm, name: e.target.value })}
              placeholder="e.g. Ramesh Kumar, Praveen K"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">10-Digit Mobile Phone *</label>
            <input
              type="tel"
              required
              value={riderForm.phone}
              onChange={(e) => setRiderForm({ ...riderForm, phone: e.target.value })}
              placeholder="e.g. 8217649688"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Type</label>
              <select
                value={riderForm.vehicle_type}
                onChange={(e) => setRiderForm({ ...riderForm, vehicle_type: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="Bike">Motorcycle / Bike</option>
                <option value="Scooter">Scooter / Activa</option>
                <option value="EV Scooter">Electric EV Scooter</option>
                <option value="Bicycle">Bicycle</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Number</label>
              <input
                type="text"
                value={riderForm.vehicle_number}
                onChange={(e) => setRiderForm({ ...riderForm, vehicle_number: e.target.value })}
                placeholder="e.g. KA-08-EF-5678"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Avatar URL</label>
            <input
              type="text"
              value={riderForm.avatar_url}
              onChange={(e) => setRiderForm({ ...riderForm, avatar_url: e.target.value })}
              placeholder="/images/riders/..."
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setAddRiderModal(false);
                setEditRiderModal(null);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {editRiderModal ? "Save Changes" : "Register Rider"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
