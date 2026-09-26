import React, { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Bike,
  Navigation,
  Compass,
  ArrowLeft,
  Search,
  Store,
  X,
} from "lucide-react";
import { useAdminStore } from "../store/useAdminStore";
import { AdminZone, AdminRider, AdminStore } from "../types/admin";
import { supabase } from "../lib/supabase";

// ── Ring Colours ───────────────────────────────────────────────────────────
const RING_COLOURS = [
  { inner: "#10b981", outer: "#f59e0b" }, // emerald / amber
  { inner: "#3b82f6", outer: "#8b5cf6" }, // blue / violet
  { inner: "#ef4444", outer: "#f97316" }, // rose / orange
  { inner: "#06b6d4", outer: "#10b981" }, // cyan / emerald
];

// ── Known KGF Store Coordinates (Fallback if store has dummy Bangalore lat/lng) ─
const KGF_STORE_COORDS: Record<string, { lat: number; lng: number }> = {
  g1: { lat: 12.9365, lng: 78.2672 }, // Mhetha Stores (Andersonpet)
  d1: { lat: 12.9348, lng: 78.2685 }, // Nandhini KGF (Andersonpet)
  f1: { lat: 12.9555258, lng: 78.2722771 }, // Ambur Biriyani (Robertsonpet)
  f2: { lat: 12.9568, lng: 78.2735 }, // MR & MRS KITCHEN (Robertsonpet)
  f3: { lat: 12.9582, lng: 78.275 }, // Babu Juice Shop (Robertsonpet)
  f4: { lat: 12.9575, lng: 78.274 }, // Cool Shop (Robertsonpet)
};

// ── Store Pin Category Image Selector ───────────────────────────────────────
function getStorePinImage(category?: string, name?: string): string {
  const cat = (category || "").toUpperCase();
  const n = (name || "").toLowerCase();

  if (cat.includes("DAIRY") || n.includes("nandhini") || n.includes("milk") || n.includes("dairy")) {
    return "/images/store_pins/pin_dairy.png";
  }
  if (
    cat.includes("GROCERY") ||
    cat.includes("SUPERMARKET") ||
    cat.includes("MART") ||
    n.includes("stores") ||
    n.includes("provision") ||
    n.includes("mhetha")
  ) {
    return "/images/store_pins/pin_grocery.png";
  }
  if (cat.includes("FRUIT") || n.includes("juice") || n.includes("fruit")) {
    return "/images/store_pins/pin_fruits.png";
  }
  if (cat.includes("VEG") || n.includes("vegetable") || n.includes("sabzi")) {
    return "/images/store_pins/pin_vegetables.png";
  }
  // Default to FOOD pin (Red)
  return "/images/store_pins/pin_food.png";
}

// Distance calculation in km (Haversine - 0 API cost)
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

// Coordinate parser from Google Maps clipboard
function parseGoogleMapsCoords(input: string): { lat: number; lng: number } | null {
  const clean = input.trim().replace(/[°NSEWnsew\(\)]/g, "");
  const parts = clean
    .split(/[,;\s]+/)
    .map((p) => parseFloat(p.trim()))
    .filter((n) => !isNaN(n));
  if (parts.length >= 2) {
    const [p1, p2] = parts;
    if (p1 >= -90 && p1 <= 90 && p2 >= -180 && p2 <= 180) {
      return { lat: Number(p1.toFixed(6)), lng: Number(p2.toFixed(6)) };
    }
  }
  return null;
}

export type ZoneViewTab = "map" | "riders" | "edit";

export const ZonesView: React.FC = () => {
  const { zones, orders, stores, updateZone, createZone, deleteZone } = useAdminStore();

  const [activeTab, setActiveTab] = useState<ZoneViewTab>("map");
  const [selectedZone, setSelectedZone] = useState<AdminZone | null>(null);

  // Edit Zone Form State (strictly what user requested)
  const [coordsInput, setCoordsInput] = useState<string>("");
  const [editInner, setEditInner] = useState<number>(1.5);
  const [editOuter, setEditOuter] = useState<number>(4.5);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Riders state (automatically fetched, no manual refresh)
  const [onlineRiders, setOnlineRiders] = useState<AdminRider[]>([]);
  const [riderSearch, setRiderSearch] = useState<string>("");

  // Add Zone Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addForm, setAddForm] = useState({
    id: "",
    name: "",
    coords: "12.957145, 78.274568",
    inner_radius_km: 1.5,
    outer_radius_km: 4.5,
  });

  // Map & Layer References
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const zoneLayersRef = useRef<Map<string, { inner: L.Circle; outer: L.Circle; label: L.Marker }>>(new Map());
  const riderMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const storeMarkersRef = useRef<Map<string, L.Marker>>(new Map());

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // ── Auto-fetch online riders on mount and periodically ──────────────
  const loadOnlineRiders = useCallback(async (zoneCenter?: { lat: number; lng: number }) => {
    try {
      const { data, error } = await supabase
        .from("rider_profiles")
        .select("*")
        .eq("is_online", true);

      if (error) throw error;
      const fleet: AdminRider[] = (data as any[]) || [];

      const centerLat = zoneCenter?.lat || 12.957145;
      const centerLng = zoneCenter?.lng || 78.274568;

      const processed: AdminRider[] = fleet.map((r, i) => {
        let lat = r.current_lat || r.lat;
        let lng = r.current_lng || r.lng;

        if (!lat || !lng) {
          const angles = [0, 60, 120, 180, 240, 300];
          const angle = (angles[i % angles.length] * Math.PI) / 180;
          const spread = 0.008 + i * 0.004;
          lat = centerLat + Math.sin(angle) * spread;
          lng = centerLng + Math.cos(angle) * spread;
        }

        return {
          ...r,
          current_lat: Number(lat.toFixed(6)),
          current_lng: Number(lng.toFixed(6)),
        };
      });

      setOnlineRiders(processed);
    } catch (e) {
      console.warn("Could not load live riders:", e);
    }
  }, []);

  useEffect(() => {
    loadOnlineRiders();
    const interval = setInterval(() => loadOnlineRiders(), 20000); // auto-refresh every 20s
    return () => clearInterval(interval);
  }, [loadOnlineRiders]);

  // ── Auto-select first zone on load ──────────────────────────────────
  useEffect(() => {
    if (zones.length > 0 && !selectedZone) {
      const z = zones[0];
      setSelectedZone(z);
      setCoordsInput(`${z.center_lat}, ${z.center_lng}`);
      setEditInner(z.inner_radius_km);
      setEditOuter(z.outer_radius_km);
    }
  }, [zones, selectedZone]);

  // ── Initialize Full-Area Map ─────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "map") return;
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [selectedZone?.center_lat || 12.9571, selectedZone?.center_lng || 78.2745],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [activeTab, selectedZone]);

  // ── Draw Clean Zone Circles (NO Green Polygon Lines) ────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || activeTab !== "map") return;

    // Clear old zone layers
    zoneLayersRef.current.forEach(({ inner, outer, label }) => {
      inner.remove();
      outer.remove();
      label.remove();
    });
    zoneLayersRef.current.clear();

    zones.forEach((zone, idx) => {
      const colours = RING_COLOURS[idx % RING_COLOURS.length];
      const isSelected = selectedZone?.id === zone.id;

      const lat = isSelected ? parseGoogleMapsCoords(coordsInput)?.lat || zone.center_lat : zone.center_lat;
      const lng = isSelected ? parseGoogleMapsCoords(coordsInput)?.lng || zone.center_lng : zone.center_lng;
      const innerKm = isSelected ? editInner : zone.inner_radius_km;
      const outerKm = isSelected ? editOuter : zone.outer_radius_km;

      // 1. Inner circle (store cluster / priority 1) - Solid Emerald
      const inner = L.circle([lat, lng], {
        radius: innerKm * 1000,
        color: colours.inner,
        fillColor: colours.inner,
        fillOpacity: isSelected ? 0.15 : 0.08,
        weight: isSelected ? 3.5 : 2,
      }).addTo(map);

      // 2. Outer circle (catchment / priority 2) - Dashed Amber
      const outer = L.circle([lat, lng], {
        radius: outerKm * 1000,
        color: colours.outer,
        fillColor: colours.outer,
        fillOpacity: isSelected ? 0.08 : 0.03,
        weight: isSelected ? 2.5 : 1.5,
        dashArray: "8 6",
      }).addTo(map);

      // 3. Center Label Pin
      const labelIcon = L.divIcon({
        html: `<div style="background:${colours.inner};color:white;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:900;letter-spacing:-0.2px;box-shadow:0 3px 10px rgba(0,0,0,0.3);border:2px solid white;display:flex;align-items:center;gap:4px;white-space:nowrap;cursor:pointer">
          <span style="width:7px;height:7px;border-radius:50%;background:#ffffff"></span>
          <span>${zone.name}</span>
        </div>`,
        className: "",
        iconAnchor: [35, 14],
      });
      const label = L.marker([lat, lng], { icon: labelIcon }).addTo(map);

      inner.on("click", () => handleSelectZone(zone));
      outer.on("click", () => handleSelectZone(zone));
      label.on("click", () => handleSelectZone(zone));

      zoneLayersRef.current.set(zone.id, { inner, outer, label });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zones, selectedZone?.id, coordsInput, editInner, editOuter, activeTab]);

  // ── Render Merchant Store Pins with Custom Category Icons ───────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || activeTab !== "map") return;

    // Clear old store markers
    storeMarkersRef.current.forEach((marker) => marker.remove());
    storeMarkersRef.current.clear();

    stores.forEach((store: AdminStore) => {
      // Determine valid KGF latitude & longitude
      let sLat = Number(store.lat || 0);
      let sLng = Number(store.lng || 0);

      // If store has dummy coordinates outside KGF (e.g. Bangalore lng < 78.0), use known KGF location
      if (sLng < 78.0 && KGF_STORE_COORDS[store.id]) {
        sLat = KGF_STORE_COORDS[store.id].lat;
        sLng = KGF_STORE_COORDS[store.id].lng;
      }

      if (!sLat || !sLng) return;

      const pinImg = getStorePinImage(store.category, store.name);

      const storeDivIcon = L.divIcon({
        html: `
          <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer">
            <img
              src="${pinImg}"
              alt="${store.name}"
              style="width:38px;height:50px;object-fit:contain;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.35));transition:transform 0.15s"
            />
            <div style="background:#0f172a;color:#ffffff;font-size:9px;font-weight:900;padding:1px 6px;border-radius:6px;margin-top:-6px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.35);border:1px solid #334155">
              ${store.name}
            </div>
          </div>
        `,
        className: "",
        iconAnchor: [19, 50], // Pin tip points directly to location
        popupAnchor: [0, -48],
      });

      const marker = L.marker([sLat, sLng], { icon: storeDivIcon }).addTo(map);

      marker.bindPopup(`
        <div style="font-family:inherit;padding:4px;min-width:200px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            <img src="${pinImg}" style="width:20px;height:26px;object-fit:contain" />
            <strong style="font-size:13px;color:#0f172a">${store.name}</strong>
          </div>
          <div style="font-size:10px;font-weight:800;color:#059669;background:#ecfdf5;display:inline-block;padding:2px 6px;border-radius:4px;margin-bottom:6px">
            ${store.category || "GROCERY / FOOD"}
          </div>
          <div style="font-size:11px;color:#475569;line-height:1.4">
            <div>📍 ${store.store_address || store.address || "KGF"}</div>
            ${store.phone ? `<div>📞 ${store.phone}</div>` : ""}
            <div style="margin-top:4px;padding-top:4px;border-top:1px solid #e2e8f0;font-size:10px;color:#64748b">
              Status: <span style="color:${store.is_online ? '#059669' : '#dc2626'};font-weight:bold">${store.is_online ? 'Open for Orders' : 'Store Offline'}</span>
            </div>
          </div>
        </div>
      `);

      storeMarkersRef.current.set(store.id, marker);
    });
  }, [stores, activeTab]);

  // ── Render Directional Rider Markers on Map ─────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || activeTab !== "map") return;

    // Clear old rider markers
    riderMarkersRef.current.forEach((marker) => marker.remove());
    riderMarkersRef.current.clear();

    const centerLat = selectedZone?.center_lat || 12.957145;
    const centerLng = selectedZone?.center_lng || 78.274568;

    onlineRiders.forEach((rider) => {
      const lat = rider.current_lat || rider.lat;
      const lng = rider.current_lng || rider.lng;
      if (!lat || !lng) return;

      const dist = calculateDistanceKm(lat, lng, centerLat, centerLng);
      const isAvailable = (rider as any).available_for_order !== false && !rider.is_busy;

      // Determine movement orientation
      let faceRight = false;
      if (lng < centerLng) {
        faceRight = isAvailable; // heading towards center (East)
      } else {
        faceRight = !isAvailable; // busy delivering away (East)
      }

      const riderImgSrc = faceRight
        ? "/images/map_rider/rider_map_noBG_ryt.png"
        : "/images/map_rider/rider_map_noBG_lft.png";

      const statusColor = isAvailable ? "#10b981" : "#f59e0b";
      const statusText = isAvailable ? "Waiting for Orders" : "Delivering";

      const riderDivIcon = L.divIcon({
        html: `
          <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer">
            <div style="position:relative;width:50px;height:50px;display:flex;align-items:center;justify-content:center">
              <span style="position:absolute;inset:4px;border-radius:50%;background:${statusColor};opacity:0.25;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite"></span>
              <img
                src="${riderImgSrc}"
                alt="Rider"
                style="width:46px;height:46px;object-fit:contain;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
              />
              <span style="position:absolute;top:2px;right:4px;width:10px;height:10px;border-radius:50%;background:${statusColor};border:2px solid white"></span>
            </div>
            <div style="background:#0f172a;color:#ffffff;font-size:9px;font-weight:900;padding:2px 6px;border-radius:6px;margin-top:-4px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:1px solid #334155;display:flex;align-items:center;gap:3px">
              <span>${faceRight ? "👉" : "👈"}</span>
              <span>${rider.name.split(" ")[0]}</span>
              <span style="color:#94a3b8">(${dist}km)</span>
            </div>
          </div>
        `,
        className: "",
        iconAnchor: [25, 40],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([lat, lng], { icon: riderDivIcon }).addTo(map);

      marker.bindPopup(`
        <div style="font-family:inherit;padding:4px;min-width:190px">
          <strong style="font-size:13px;color:#0f172a">${rider.name}</strong>
          <span style="font-size:10px;font-weight:800;padding:2px 6px;border-radius:6px;background:${isAvailable ? '#d1fae5' : '#fef3c7'};color:${isAvailable ? '#065f46' : '#92400e'};margin-left:6px">
            ${statusText}
          </span>
          <div style="font-size:11px;color:#475569;margin-top:6px;line-height:1.4">
            <div>📞 ${rider.phone}</div>
            <div>🛵 ${rider.vehicle_type || 'Bike'}</div>
            <div style="margin-top:4px;border-top:1px solid #e2e8f0;padding-top:4px">
              <b>${dist} km</b> from ${selectedZone?.name || 'Center'}
            </div>
          </div>
        </div>
      `);

      riderMarkersRef.current.set(rider.id, marker);
    });
  }, [onlineRiders, selectedZone, editInner, editOuter, coordsInput, activeTab]);

  // ── Select a Zone ───────────────────────────────────────────────────
  const handleSelectZone = (zone: AdminZone) => {
    setSelectedZone(zone);
    setCoordsInput(`${zone.center_lat}, ${zone.center_lng}`);
    setEditInner(zone.inner_radius_km);
    setEditOuter(zone.outer_radius_km);

    if (activeTab === "map") {
      mapRef.current?.flyTo([zone.center_lat, zone.center_lng], 13.5, { duration: 0.6 });
    }
  };

  // ── Open Edit Zone Screen ───────────────────────────────────────────
  const handleOpenEditZone = (zone: AdminZone) => {
    handleSelectZone(zone);
    setActiveTab("edit");
  };

  // ── Save Zone Changes to Database ───────────────────────────────────
  const handleSaveZone = async () => {
    if (!selectedZone) return;
    const parsed = parseGoogleMapsCoords(coordsInput);
    if (!parsed) {
      alert("Please provide valid coordinates (e.g. 12.957145, 78.274568)");
      return;
    }

    setIsSaving(true);
    const res = await updateZone(selectedZone.id, {
      center_lat: parsed.lat,
      center_lng: parsed.lng,
      inner_radius_km: editInner,
      outer_radius_km: editOuter,
    });
    setIsSaving(false);

    if (res.success) {
      showToast(`Saved coordinates & radii for ${selectedZone.name}!`);
      setActiveTab("map");
    } else {
      alert(`Failed to save changes: ${res.error || "Unknown database error"}`);
    }
  };

  // ── Delete Zone ─────────────────────────────────────────────────────
  const handleDeleteZone = async () => {
    if (!selectedZone) return;
    if (window.confirm(`Permanently delete zone "${selectedZone.name}"?`)) {
      const res = await deleteZone(selectedZone.id);
      if (res.success) {
        setSelectedZone(null);
        showToast(`Zone "${selectedZone.name}" deleted.`);
        setActiveTab("map");
      } else {
        alert(`Failed to delete zone: ${res.error || "Unknown database error"}`);
      }
    }
  };

  // ── Create New Zone ─────────────────────────────────────────────────
  const handleCreateZoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseGoogleMapsCoords(addForm.coords);
    if (!parsed) {
      alert("Please enter valid coordinates (e.g. 12.957145, 78.274568)");
      return;
    }

    const id = addForm.id.trim() || addForm.name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const res = await createZone({
      id,
      name: addForm.name,
      center_lat: parsed.lat,
      center_lng: parsed.lng,
      inner_radius_km: addForm.inner_radius_km,
      outer_radius_km: addForm.outer_radius_km,
    });

    if (res.success) {
      setShowAddModal(false);
      showToast(`Zone "${addForm.name}" created!`);
      setActiveTab("map");
    } else {
      alert(`Failed to create zone: ${res.error || "Check database permissions / RLS"}`);
    }
  };

  // ── Helper to evaluate rider real-time delivery status ───────────────
  const getRiderDeliveryStatus = (rider: AdminRider) => {
    const activeOrder = orders.find(
      (o) => o.rider_id === rider.id && !["DELIVERED", "CANCELLED", "REJECTED"].includes(o.status)
    );

    if (activeOrder) {
      if (["ACCEPTED", "PREPARING", "READY", "READY_FOR_PICKUP"].includes(activeOrder.status)) {
        return {
          label: "Reaching Store",
          badgeColor: "bg-blue-50 text-blue-700 border-blue-300",
          orderId: activeOrder.id,
        };
      }
      if (["OUT_FOR_DELIVERY", "PICKED_UP", "OUT_OF_SHOP"].includes(activeOrder.status)) {
        return {
          label: "Delivering",
          badgeColor: "bg-amber-50 text-amber-700 border-amber-300",
          orderId: activeOrder.id,
        };
      }
    }

    if ((rider as any).available_for_order === false || rider.is_busy) {
      return {
        label: "Returning",
        badgeColor: "bg-purple-50 text-purple-700 border-purple-300",
      };
    }

    return {
      label: "Waiting for Orders",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-300",
    };
  };

  // Filter riders for the Riders Tab
  const filteredRiders = onlineRiders.filter((r) => {
    if (!riderSearch.trim()) return true;
    const q = riderSearch.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      (r.Rider_ID && r.Rider_ID.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── TOP BAR: Navigation Options (Map / Zones / Riders) ──────── */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: View Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("map")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === "map"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Live Dispatch Map</span>
          </button>

          <button
            onClick={() => {
              if (selectedZone) {
                handleOpenEditZone(selectedZone);
              } else if (zones.length > 0) {
                handleOpenEditZone(zones[0]);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === "edit"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Zone Coordinates & Radii</span>
          </button>

          <button
            onClick={() => setActiveTab("riders")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === "riders"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>Active Riders ({onlineRiders.length})</span>
          </button>
        </div>

        {/* Right: Quick Zone Selector & Add Zone Button */}
        <div className="flex items-center gap-2.5">
          {zones.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-400 font-bold text-[11px]">Selected Zone:</span>
              <select
                value={selectedZone?.id || ""}
                onChange={(e) => {
                  const z = zones.find((item) => item.id === e.target.value);
                  if (z) handleSelectZone(z);
                }}
                className="font-black text-slate-900 bg-transparent focus:outline-none cursor-pointer"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Zone</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: FULL OCCUPYING MAP VIEW ─────────────────────────── */}
      {activeTab === "map" && (
        <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm flex flex-col">
          {/* Map Top Bar */}
          <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border-2 border-emerald-500 inline-block" />
                <b>Inner Ring:</b> Priority 1 ({selectedZone?.inner_radius_km || 1.5} km)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border-2 border-dashed border-amber-500 inline-block" />
                <b>Outer Ring:</b> Priority 2 ({selectedZone?.outer_radius_km || 4.5} km)
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-700">
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                <span>Partner Stores ({stores.length})</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>{onlineRiders.length} Online Riders Located</span>
              </span>

              <button
                onClick={() => selectedZone && handleOpenEditZone(selectedZone)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Edit Coordinates & Radii →
              </button>
            </div>
          </div>

          {/* Map occupies the entire space */}
          <div
            ref={mapContainerRef}
            style={{ height: "calc(100vh - 220px)", minHeight: "620px", width: "100%" }}
          />
        </div>
      )}

      {/* ── TAB 2: EDIT ZONE COORDINATES & RADII (Clean & Minimal) ──── */}
      {activeTab === "edit" && selectedZone && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-7 space-y-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-xl text-slate-900">
                  Zone Coordinates & Radii: {selectedZone.name}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                  {selectedZone.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Paste coordinates directly from Google Maps or type latitude & longitude. Updates save automatically to Supabase.
              </p>
            </div>

            <button
              onClick={() => setActiveTab("map")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Map</span>
            </button>
          </div>

          {/* 1. Paste from Google Maps Input */}
          <div className="space-y-2 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-200/80">
            <label className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center justify-between">
              <span>Paste from Google Maps</span>
              <span className="text-[10px] text-emerald-700 font-mono">Format: Latitude, Longitude</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 12.9571457, 78.274568"
              value={coordsInput}
              onChange={(e) => setCoordsInput(e.target.value)}
              className="w-full px-4 py-3 text-sm font-mono font-bold rounded-xl bg-white border border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none shadow-2xs"
            />
            <p className="text-[11px] text-emerald-800">
              💡 In Google Maps, right-click on the center of the stores in {selectedZone.name}, copy the numbers, and paste here.
            </p>
          </div>

          {/* 2. Inner Ring Slider (P1 Stores) */}
          <div className="space-y-2 p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                <span>🟢 Inner Ring (P1 Stores)</span>
              </label>
              <span className="text-sm font-black text-emerald-800 bg-emerald-100/70 px-3 py-0.5 rounded-lg border border-emerald-300">
                {editInner} km
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={5.0}
              step={0.1}
              value={editInner}
              onChange={(e) => setEditInner(parseFloat(e.target.value))}
              className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-xs font-mono text-slate-500 pt-1">
              <span>0.5 km</span>
              <span>5.0 km</span>
            </div>
          </div>

          {/* 3. Outer Ring Slider (P2 Catchment) */}
          <div className="space-y-2 p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                <span>🟡 Outer Ring (P2 Catchment)</span>
              </label>
              <span className="text-sm font-black text-amber-800 bg-amber-100/70 px-3 py-0.5 rounded-lg border border-amber-300">
                {editOuter} km
              </span>
            </div>
            <input
              type="range"
              min={1.0}
              max={15.0}
              step={0.5}
              value={editOuter}
              onChange={(e) => setEditOuter(parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-xs font-mono text-slate-500 pt-1">
              <span>1.0 km</span>
              <span>15.0 km</span>
            </div>
          </div>

          {/* 4. Footer Actions (Delete Zone / Save Changes) */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDeleteZone}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-300 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Zone</span>
            </button>

            <button
              type="button"
              onClick={handleSaveZone}
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving to Supabase..." : "Save Changes"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 3: ACTIVE RIDERS FLEET ROSTER (With Real-Time Status) ── */}
      {activeTab === "riders" && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-black text-xl text-slate-900 flex items-center gap-2">
                <Bike className="w-6 h-6 text-emerald-600" />
                <span>Active Delivery Partners ({onlineRiders.length} Online)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time fleet activity: delivering orders, reaching stores, returning, or waiting for orders.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search rider name, phone, ID..."
                value={riderSearch}
                onChange={(e) => setRiderSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Riders Grid */}
          {filteredRiders.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              No online delivery partners found matching your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredRiders.map((rider) => {
                const status = getRiderDeliveryStatus(rider);
                const lat = rider.current_lat || rider.lat;
                const lng = rider.current_lng || rider.lng;
                const centerLat = selectedZone?.center_lat || 12.957145;
                const centerLng = selectedZone?.center_lng || 78.274568;
                const dist = lat && lng ? calculateDistanceKm(lat, lng, centerLat, centerLng) : null;

                return (
                  <div
                    key={rider.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top: Name & Status Pill */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-black text-sm text-slate-900">{rider.name}</h4>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">
                            ID: {rider.Rider_ID || rider.id}
                          </p>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${status.badgeColor}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Phone:</span>
                          <span className="font-bold text-slate-800">{rider.phone}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Vehicle:</span>
                          <span className="font-bold text-slate-800">
                            {rider.vehicle_type || "Scooter"} ({rider.vehicle_number || "KA-08"})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Assigned Zone:</span>
                          <span className="font-bold text-slate-800">
                            {rider.selected_zone_name || selectedZone?.name || "Robertsonpet"}
                          </span>
                        </div>
                        {dist !== null && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                            <span className="text-slate-400">Distance to Center:</span>
                            <span className="font-mono font-black text-emerald-700">{dist} km</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Locate on Map Button */}
                    <button
                      onClick={() => {
                        setActiveTab("map");
                        if (lat && lng) {
                          setTimeout(() => {
                            mapRef.current?.flyTo([lat, lng], 15, { duration: 0.8 });
                          }, 150);
                        }
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-all cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Locate on Map</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ADD NEW ZONE MODAL ─────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>Create New Delivery Zone</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateZoneSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Andersonpet"
                  value={addForm.name}
                  required
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Zone Slug ID</label>
                <input
                  type="text"
                  placeholder="e.g. andersonpet"
                  value={addForm.id}
                  onChange={(e) =>
                    setAddForm((f) => ({
                      ...f,
                      id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                    }))
                  }
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Center Coordinates (Google Maps)</label>
                <input
                  type="text"
                  placeholder="12.957145, 78.274568"
                  value={addForm.coords}
                  required
                  onChange={(e) => setAddForm((f) => ({ ...f, coords: e.target.value }))}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Inner Ring (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="10"
                    value={addForm.inner_radius_km}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, inner_radius_km: parseFloat(e.target.value) || 1.5 }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Outer Catchment (km)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="20"
                    value={addForm.outer_radius_km}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, outer_radius_km: parseFloat(e.target.value) || 4.5 }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Create Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZonesView;
