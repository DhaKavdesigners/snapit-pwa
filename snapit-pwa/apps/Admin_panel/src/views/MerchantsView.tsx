import React, { useState, useMemo } from "react";
import {
  Store,
  Plus,
  Search,
  Phone,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Package,
  Star,
  ExternalLink,
  Eye,
  EyeOff,
  Copy,
  Check,
  Zap,
  Receipt,
  MapPin,
  AlertTriangle,
  KeyRound,
  TrendingUp,
  LayoutGrid,
  List,
  X,
  SlidersHorizontal,
  ShoppingBag,
} from "lucide-react";
import { useAdminStore } from "../store/useAdminStore";
import { AdminStore, AdminMerchant, AdminProduct } from "../types/admin";
import { Modal } from "../components/common/Modal";

interface MerchantsViewProps {
  onNavigateToSettlements?: (storeId?: string) => void;
}

export const MerchantsView: React.FC<MerchantsViewProps> = ({ onNavigateToSettlements }) => {
  const {
    stores,
    merchants,
    products,
    orders,
    createStoreWithMerchant,
    updateStore,
    toggleStoreOnline,
    toggleStoreRushMode,
    deleteStore,
    updateMerchantCredentials,
    createMerchantForStore,
    createProduct,
    updateProduct,
    toggleProductStock,
    deleteProduct,
  } = useAdminStore();

  // View presentation mode: "grid" cards or "table" list
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals state
  const [addStoreModal, setAddStoreModal] = useState(false);
  const [editStoreModal, setEditStoreModal] = useState<AdminStore | null>(null);
  const [editMerchantModal, setEditMerchantModal] = useState<{ store: AdminStore; merchant?: AdminMerchant } | null>(null);
  const [inventoryModal, setInventoryModal] = useState<AdminStore | null>(null);
  const [addProductModal, setAddProductModal] = useState(false);

  // Catalog modal internal filter states
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState("ALL");

  // Copied toast state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Password visibility map (key: merchantId or storeId)
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Store + Merchant Form State
  const [storeForm, setStoreForm] = useState({
    id: "",
    name: "",
    category: "FOOD",
    logo_url: "",
    rating: 4.8,
    is_online: true,
    rush_mode: false,
    store_address: "Robertsonpet, KGF",
    store_location: "",
    phone: "8217649688",
    landmark: "",
    merchant_uid: "",
    merchant_password: "",
    merchant_name: "",
    merchant_phone: "",
  });

  // Merchant Credentials Standalone Edit Form State
  const [merchantForm, setMerchantForm] = useState({
    uid: "",
    password: "",
    name: "",
    phone: "",
  });

  // Product Form State (Prices entered in Rupees ₹, converted to paise in store)
  const [productForm, setProductForm] = useState({
    name: "",
    price: 50,
    category: "Food",
    sub_category: "Specials",
    description: "",
    image_url: "",
    in_stock: true,
    stock_count: 50,
  });

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Helper to compute pure goods total for an order (in paise)
  const getOrderItemsTotalPaise = (order: any) => {
    if (!order.items || order.items.length === 0) return order.estimated_total || 0;
    const subtotal = order.items.reduce((sum: number, it: any) => {
      const pricePaise = it.price_paise || it.price || 0;
      return sum + pricePaise * (it.quantity || 1);
    }, 0);
    return subtotal > 0 ? subtotal : order.estimated_total || 0;
  };

  // Filtered stores
  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      const linkedMerchant = merchants.find((m) => m.store_id === s.id);
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        (linkedMerchant?.uid && linkedMerchant.uid.toLowerCase().includes(q)) ||
        (linkedMerchant?.name && linkedMerchant.name.toLowerCase().includes(q)) ||
        (s.store_address && s.store_address.toLowerCase().includes(q)) ||
        (s.landmark && s.landmark.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (categoryFilter !== "ALL") {
        if (s.category?.toUpperCase() !== categoryFilter.toUpperCase()) return false;
      }

      if (statusFilter === "OPEN") return s.is_online !== false;
      if (statusFilter === "CLOSED") return s.is_online === false;
      if (statusFilter === "RUSH") return s.rush_mode === true;

      return true;
    });
  }, [stores, merchants, searchQuery, categoryFilter, statusFilter]);

  // KPI Metrics
  const totalStores = stores.length;
  const openStores = stores.filter((s) => s.is_online !== false).length;
  const rushStores = stores.filter((s) => s.rush_mode === true).length;
  const totalProducts = products.length;
  const activeOrdersCount = orders.filter(
    (o) => !["DELIVERED", "CANCELLED", "REJECTED"].includes(o.status)
  ).length;

  const handleOpenAddStore = () => {
    const autoId = `f${stores.length + 1}`;
    setStoreForm({
      id: autoId,
      name: "",
      category: "FOOD",
      logo_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&auto=format&fit=crop&q=80",
      rating: 4.8,
      is_online: true,
      rush_mode: false,
      store_address: "Robertsonpet, KGF",
      store_location: "",
      phone: "8217649688",
      landmark: "",
      merchant_uid: `m_${autoId}`,
      merchant_password: "store123",
      merchant_name: "",
      merchant_phone: "8217649688",
    });
    setAddStoreModal(true);
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeForm.name.trim()) return;

    if (editStoreModal) {
      // Update Store
      await updateStore(editStoreModal.id, {
        name: storeForm.name.trim(),
        category: storeForm.category.toUpperCase(),
        logo_url: storeForm.logo_url.trim(),
        store_address: storeForm.store_address.trim(),
        phone: storeForm.phone.trim(),
        landmark: storeForm.landmark.trim(),
        store_location: storeForm.store_location.trim(),
        rating: storeForm.rating,
      });

      // Update or create linked merchant
      const linkedMerchant = merchants.find((m) => m.store_id === editStoreModal.id);
      if (linkedMerchant) {
        await updateMerchantCredentials(linkedMerchant.id, {
          uid: storeForm.merchant_uid.trim(),
          password: storeForm.merchant_password.trim(),
          name: storeForm.merchant_name.trim() || `${storeForm.name} Admin`,
          phone: storeForm.merchant_phone.trim() || storeForm.phone.trim(),
        });
      } else if (storeForm.merchant_uid.trim()) {
        await createMerchantForStore(editStoreModal.id, {
          uid: storeForm.merchant_uid.trim(),
          password: storeForm.merchant_password.trim() || "store123",
          name: storeForm.merchant_name.trim() || `${storeForm.name} Admin`,
          phone: storeForm.merchant_phone.trim() || storeForm.phone.trim(),
        });
      }

      setEditStoreModal(null);
    } else {
      // Create Store + Merchant Account
      await createStoreWithMerchant(
        {
          id: storeForm.id.trim() || `store_${Date.now()}`,
          name: storeForm.name.trim(),
          category: storeForm.category.toUpperCase(),
          logo_url: storeForm.logo_url.trim(),
          rating: storeForm.rating,
          is_online: storeForm.is_online,
          rush_mode: storeForm.rush_mode,
          store_address: storeForm.store_address.trim(),
          store_location: storeForm.store_location.trim(),
          phone: storeForm.phone.trim(),
          landmark: storeForm.landmark.trim(),
        },
        {
          uid: storeForm.merchant_uid.trim() || `m_${storeForm.id.trim()}`,
          password: storeForm.merchant_password.trim() || "store123",
          name: storeForm.merchant_name.trim() || `${storeForm.name.trim()} Admin`,
          phone: storeForm.merchant_phone.trim() || storeForm.phone.trim(),
        }
      );
      setAddStoreModal(false);
    }
  };

  const handleOpenEditStore = (store: AdminStore) => {
    const linkedMerchant = merchants.find((m) => m.store_id === store.id);
    setStoreForm({
      id: store.id,
      name: store.name,
      category: store.category?.toUpperCase() || "FOOD",
      logo_url: store.logo_url || "",
      rating: store.rating || 4.8,
      is_online: store.is_online !== false,
      rush_mode: store.rush_mode === true,
      store_address: store.store_address || store.address || "",
      store_location: store.store_location || "",
      phone: store.phone || "",
      landmark: store.landmark || "",
      merchant_uid: linkedMerchant?.uid || `m_${store.id}`,
      merchant_password: linkedMerchant?.password || "",
      merchant_name: linkedMerchant?.name || `${store.name} Admin`,
      merchant_phone: linkedMerchant?.phone || store.phone || "",
    });
    setEditStoreModal(store);
  };

  const handleOpenEditMerchant = (store: AdminStore) => {
    const linkedMerchant = merchants.find((m) => m.store_id === store.id);
    setMerchantForm({
      uid: linkedMerchant?.uid || `m_${store.id}`,
      password: linkedMerchant?.password || "store123",
      name: linkedMerchant?.name || `${store.name} Admin`,
      phone: linkedMerchant?.phone || store.phone || "8217649688",
    });
    setEditMerchantModal({ store, merchant: linkedMerchant });
  };

  const handleSaveMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMerchantModal) return;

    if (editMerchantModal.merchant) {
      await updateMerchantCredentials(editMerchantModal.merchant.id, {
        uid: merchantForm.uid.trim(),
        password: merchantForm.password.trim(),
        name: merchantForm.name.trim(),
        phone: merchantForm.phone.trim(),
      });
    } else {
      await createMerchantForStore(editMerchantModal.store.id, {
        uid: merchantForm.uid.trim(),
        password: merchantForm.password.trim(),
        name: merchantForm.name.trim(),
        phone: merchantForm.phone.trim(),
      });
    }
    setEditMerchantModal(null);
  };

  const handleDeleteStore = async (store: AdminStore) => {
    if (
      window.confirm(
        `Are you sure you want to completely remove "${store.name}" (${store.id})?\n\nThis will remove the store, its merchant login account, and all associated catalog products.`
      )
    ) {
      await deleteStore(store.id);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryModal || !productForm.name.trim()) return;

    await createProduct({
      store_id: inventoryModal.id,
      name: productForm.name.trim(),
      price: productForm.price, // in Rupees ₹ (store handles conversion to paise)
      category: productForm.category.trim(),
      sub_category: productForm.sub_category.trim(),
      description: productForm.description.trim(),
      image_url: productForm.image_url.trim(),
      in_stock: productForm.in_stock,
      stock_count: productForm.stock_count,
    });

    setAddProductModal(false);
    setProductForm({
      name: "",
      price: 50,
      category: inventoryModal.category?.toUpperCase() === "FOOD" ? "Food" : "Grocery",
      sub_category: "Specials",
      description: "",
      image_url: "",
      in_stock: true,
      stock_count: 50,
    });
  };

  // Products belonging to currently viewed store in the catalog modal
  const storeProducts = useMemo(() => {
    if (!inventoryModal) return [];
    return products.filter((p) => p.store_id === inventoryModal.id);
  }, [products, inventoryModal]);

  // Filtered products inside catalog modal
  const filteredCatalogProducts = useMemo(() => {
    return storeProducts.filter((p) => {
      const q = catalogSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.sub_category?.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (catalogCategoryFilter !== "ALL") {
        if (p.category?.toUpperCase() !== catalogCategoryFilter.toUpperCase()) return false;
      }
      return true;
    });
  }, [storeProducts, catalogSearch, catalogCategoryFilter]);

  // Unique categories in the current store's catalog
  const catalogCategories = useMemo(() => {
    const cats = new Set<string>();
    storeProducts.forEach((p) => {
      if (p.category) cats.add(p.category.toUpperCase());
    });
    return Array.from(cats);
  }, [storeProducts]);

  const getCategoryBadgeClass = (category: string) => {
    const cat = category?.toUpperCase() || "FOOD";
    if (cat === "FOOD") return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    if (cat === "GROCERY") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    if (cat === "DAIRY") return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
    return "bg-purple-500/15 text-purple-300 border-purple-500/30";
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Metrics KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Stores</p>
            <Store className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-white mt-1.5">{totalStores}</p>
          <span className="text-[10px] text-slate-500 font-medium">Hyperlocal partners</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Open / Online</p>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-1.5">{openStores}</p>
          <span className="text-[10px] text-slate-500 font-medium">Accepting live orders</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Rush Mode</p>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-1.5">{rushStores}</p>
          <span className="text-[10px] text-slate-500 font-medium">Surge / high-load</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Menu Items</p>
            <Package className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-400 mt-1.5">{totalProducts}</p>
          <span className="text-[10px] text-slate-500 font-medium">Live in database</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm backdrop-blur-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Active Pipeline</p>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-400 mt-1.5">{activeOrdersCount}</p>
          <span className="text-[10px] text-slate-500 font-medium">In preparation / transit</span>
        </div>
      </div>

      {/* 2. Controls, Search, Filter & View Mode Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search stores, ID, merchant login UID, phone, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters and View Mode Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Pills */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            {["ALL", "FOOD", "GROCERY", "DAIRY"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="OPEN">🟢 Open Only</option>
            <option value="CLOSED">🔴 Closed Only</option>
            <option value="RUSH">⚡ Rush Mode Only</option>
          </select>

          {/* View Mode Toggle: Grid vs Table */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-slate-800 text-emerald-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-slate-800 text-emerald-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Compact Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Add Store Button */}
          <button
            onClick={handleOpenAddStore}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Store & Merchant</span>
          </button>
        </div>
      </div>

      {/* 3. Empty State if no stores found */}
      {filteredStores.length === 0 && (
        <div className="p-12 text-center bg-slate-900/50 rounded-3xl border border-slate-800 space-y-3">
          <Store className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No partner stores match your filters</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search keywords or switching category/status filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setCategoryFilter("ALL");
              setStatusFilter("ALL");
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* 4A. CARD GRID VIEW */}
      {viewMode === "grid" && filteredStores.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredStores.map((store) => {
            const storeProds = products.filter((p) => p.store_id === store.id);
            const isOnline = store.is_online !== false;
            const isRush = store.rush_mode === true;
            const linkedMerchant = merchants.find((m) => m.store_id === store.id);

            // Store Sales & Orders stats
            const storeOrders = orders.filter((o) => o.store_id === store.id);
            const activeStoreOrders = storeOrders.filter(
              (o) => !["DELIVERED", "CANCELLED", "REJECTED"].includes(o.status)
            ).length;
            const fulfilledStoreOrders = storeOrders.filter((o) => o.status === "DELIVERED");
            const totalSalesPaise = fulfilledStoreOrders.reduce(
              (sum, o) => sum + getOrderItemsTotalPaise(o),
              0
            );
            const totalSalesRupees = (totalSalesPaise / 100).toFixed(0);

            const isPasswordVisible = !!(linkedMerchant && showPasswordMap[linkedMerchant.id]);

            return (
              <div
                key={store.id}
                className={`rounded-3xl bg-slate-900 border p-5 shadow-lg flex flex-col justify-between space-y-4 transition-all hover:border-slate-700 ${
                  isRush
                    ? "border-amber-500/50 ring-1 ring-amber-500/20"
                    : isOnline
                    ? "border-slate-800"
                    : "border-slate-800/60 opacity-90"
                }`}
              >
                {/* Store Top Header & Badges */}
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-2xl bg-white p-1 border border-slate-700 overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
                        <img
                          src={store.logo_url || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200"}
                          alt={store.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200";
                          }}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-base text-white truncate leading-snug">
                          {store.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                            {store.id}
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${getCategoryBadgeClass(
                              store.category || "FOOD"
                            )}`}
                          >
                            {store.category || "FOOD"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Operational Toggles */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <button
                        onClick={() => toggleStoreOnline(store.id, !isOnline)}
                        className={`px-3 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer border shadow-sm ${
                          isOnline
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                            : "bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30"
                        }`}
                        title={isOnline ? "Click to set store offline" : "Click to set store online"}
                      >
                        {isOnline ? "🟢 Open" : "🔴 Closed"}
                      </button>

                      <button
                        onClick={() => toggleStoreRushMode(store.id, !isRush)}
                        className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black transition-all cursor-pointer border ${
                          isRush
                            ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm animate-pulse"
                            : "bg-slate-800 text-slate-400 border-slate-700 hover:text-amber-300"
                        }`}
                        title={isRush ? "Disable Rush Mode" : "Activate Rush Mode"}
                      >
                        <Zap className="w-3 h-3" />
                        <span>{isRush ? "Rush Active" : "Rush Off"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Merchant Login Credentials Box */}
                  <div className="bg-slate-950/90 p-3 rounded-2xl border border-slate-800/90 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                      <div className="flex items-center gap-1.5 text-slate-300 text-xs font-bold">
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        <span>Merchant Login</span>
                      </div>
                      <button
                        onClick={() => handleOpenEditMerchant(store)}
                        className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                      >
                        {linkedMerchant ? "Edit Credentials" : "+ Link Login"}
                      </button>
                    </div>

                    {linkedMerchant ? (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">User ID (Login):</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="font-mono font-bold text-white text-xs truncate">
                              {linkedMerchant.uid}
                            </span>
                            <button
                              onClick={() => handleCopy(linkedMerchant.uid, `uid_${store.id}`)}
                              className="text-slate-400 hover:text-white cursor-pointer p-0.5"
                              title="Copy User ID"
                            >
                              {copiedKey === `uid_${store.id}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 block">Password:</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="font-mono font-bold text-amber-300 text-xs truncate">
                              {isPasswordVisible ? linkedMerchant.password : "••••••••"}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(linkedMerchant.id)}
                              className="text-slate-400 hover:text-white cursor-pointer p-0.5"
                              title={isPasswordVisible ? "Hide password" : "Show password"}
                            >
                              {isPasswordVisible ? (
                                <EyeOff className="w-3 h-3" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                            </button>
                            <button
                              onClick={() => handleCopy(linkedMerchant.password, `pass_${store.id}`)}
                              className="text-slate-400 hover:text-white cursor-pointer p-0.5"
                              title="Copy Password"
                            >
                              {copiedKey === `pass_${store.id}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="col-span-2 pt-1.5 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                          <span>
                            Partner: <strong className="text-slate-200">{linkedMerchant.name || store.name}</strong>
                          </span>
                          {linkedMerchant.phone && (
                            <a
                              href={`tel:${linkedMerchant.phone}`}
                              className="flex items-center gap-1 text-emerald-400 hover:underline"
                            >
                              <Phone className="w-2.5 h-2.5" />
                              <span>{linkedMerchant.phone}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="py-1 flex items-center justify-between">
                        <span className="text-xs text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          No login credentials linked
                        </span>
                        <button
                          onClick={() => handleOpenEditMerchant(store)}
                          className="text-xs px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded font-bold cursor-pointer"
                        >
                          Create Login
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Financial & Order Performance Metrics */}
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Catalog Items</span>
                      <span className="font-bold text-white text-sm">{storeProds.length}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Gross Sales</span>
                      <span className="font-bold text-emerald-400 text-sm">₹{totalSalesRupees}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Active Orders</span>
                      <span className="font-bold text-amber-400 text-sm">{activeStoreOrders}</span>
                    </div>
                  </div>

                  {/* Location & Landmark */}
                  <div className="space-y-1 text-xs text-slate-400 px-1">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="text-slate-300 line-clamp-1">
                        {store.store_address || store.address || "KGF"}
                        {store.landmark ? ` (${store.landmark})` : ""}
                      </span>
                    </div>

                    {store.store_location && (
                      <a
                        href={store.store_location}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline pl-5"
                      >
                        <span>Google Maps</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons Toolbar */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setCatalogSearch("");
                      setCatalogCategoryFilter("ALL");
                      setInventoryModal(store);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-purple-500/20 hover:bg-purple-500 hover:text-white text-purple-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Catalog ({storeProds.length})</span>
                  </button>

                  {onNavigateToSettlements && (
                    <button
                      onClick={() => onNavigateToSettlements(store.id)}
                      className="flex items-center justify-center gap-1 py-2 px-3 bg-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      title="View Ledger & Store Settlements"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Ledger</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenEditStore(store)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
                    title="Edit Store & Credentials"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteStore(store)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl transition-all cursor-pointer"
                    title="Delete Store Partner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4B. COMPACT TABLE VIEW */}
      {viewMode === "table" && filteredStores.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Store Partner</th>
                  <th className="py-3.5 px-3">Merchant Login</th>
                  <th className="py-3.5 px-3">Contact & Address</th>
                  <th className="py-3.5 px-3">Store Status</th>
                  <th className="py-3.5 px-3">Rush Mode</th>
                  <th className="py-3.5 px-3">Catalog & Sales</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStores.map((store) => {
                  const storeProds = products.filter((p) => p.store_id === store.id);
                  const isOnline = store.is_online !== false;
                  const isRush = store.rush_mode === true;
                  const linkedMerchant = merchants.find((m) => m.store_id === store.id);

                  const storeOrders = orders.filter((o) => o.store_id === store.id);
                  const fulfilledOrders = storeOrders.filter((o) => o.status === "DELIVERED");
                  const salesPaise = fulfilledOrders.reduce(
                    (sum, o) => sum + getOrderItemsTotalPaise(o),
                    0
                  );
                  const salesRupees = (salesPaise / 100).toFixed(0);

                  const isPasswordVisible = !!(linkedMerchant && showPasswordMap[linkedMerchant.id]);

                  return (
                    <tr key={store.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Store Partner */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white p-0.5 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                            <img
                              src={store.logo_url || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100"}
                              alt={store.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100";
                              }}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                          <div>
                            <span className="font-extrabold text-white text-sm block">
                              {store.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                                {store.id}
                              </span>
                              <span
                                className={`text-[8px] font-bold uppercase px-1.5 py-0.2 rounded-full border ${getCategoryBadgeClass(
                                  store.category || "FOOD"
                                )}`}
                              >
                                {store.category || "FOOD"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Merchant Login */}
                      <td className="py-3 px-3">
                        {linkedMerchant ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400">UID:</span>
                              <span className="font-mono font-bold text-white text-xs">
                                {linkedMerchant.uid}
                              </span>
                              <button
                                onClick={() => handleCopy(linkedMerchant.uid, `tbl_uid_${store.id}`)}
                                className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                                title="Copy UID"
                              >
                                {copiedKey === `tbl_uid_${store.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400">Pass:</span>
                              <span className="font-mono font-bold text-amber-300 text-xs">
                                {isPasswordVisible ? linkedMerchant.password : "••••••••"}
                              </span>
                              <button
                                onClick={() => togglePasswordVisibility(linkedMerchant.id)}
                                className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                                title={isPasswordVisible ? "Hide" : "Show"}
                              >
                                {isPasswordVisible ? (
                                  <EyeOff className="w-3 h-3" />
                                ) : (
                                  <Eye className="w-3 h-3" />
                                )}
                              </button>
                              <button
                                onClick={() => handleCopy(linkedMerchant.password, `tbl_pass_${store.id}`)}
                                className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                                title="Copy Password"
                              >
                                {copiedKey === `tbl_pass_${store.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenEditMerchant(store)}
                            className="text-[10px] text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            <span>Link Credentials</span>
                          </button>
                        )}
                      </td>

                      {/* Contact & Address */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          {store.phone ? (
                            <a
                              href={`tel:${store.phone}`}
                              className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{store.phone}</span>
                            </a>
                          ) : (
                            <span className="text-slate-500 text-[10px]">No phone</span>
                          )}
                          <p className="text-[11px] text-slate-400 max-w-[200px] truncate">
                            {store.store_address || store.address || "KGF"}
                          </p>
                        </div>
                      </td>

                      {/* Operational Status */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => toggleStoreOnline(store.id, !isOnline)}
                          className={`px-3 py-1 rounded-full text-[11px] font-black cursor-pointer border transition-all ${
                            isOnline
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                              : "bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30"
                          }`}
                        >
                          {isOnline ? "🟢 Open" : "🔴 Closed"}
                        </button>
                      </td>

                      {/* Rush Mode */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => toggleStoreRushMode(store.id, !isRush)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer border transition-all ${
                            isRush
                              ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm animate-pulse"
                              : "bg-slate-800 text-slate-400 border-slate-700 hover:text-amber-300"
                          }`}
                        >
                          <Zap className="w-3 h-3" />
                          <span>{isRush ? "Rush Active" : "Normal"}</span>
                        </button>
                      </td>

                      {/* Catalog & Sales */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-white block">
                            {storeProds.length} items
                          </span>
                          <span className="text-[11px] font-bold text-emerald-400">
                            ₹{salesRupees} gross
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setCatalogSearch("");
                              setCatalogCategoryFilter("ALL");
                              setInventoryModal(store);
                            }}
                            className="px-2.5 py-1.5 bg-purple-500/20 hover:bg-purple-500 hover:text-white text-purple-300 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                            title="Manage Catalog"
                          >
                            Catalog
                          </button>

                          {onNavigateToSettlements && (
                            <button
                              onClick={() => onNavigateToSettlements(store.id)}
                              className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                              title="Ledger / Payouts"
                            >
                              Ledger
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEditStore(store)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Edit Store"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteStore(store)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Delete Store"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Add Store & Provision Merchant */}
      <Modal
        isOpen={addStoreModal}
        onClose={() => setAddStoreModal(false)}
        title="Add New Store & Merchant Partner"
        subtitle="Onboard a new local store/restaurant and automatically provision merchant login credentials"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveStore} className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3.5">
            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" />
              <span>1. Store Profile</span>
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">Store Name *</label>
                <input
                  type="text"
                  required
                  value={storeForm.name}
                  onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  placeholder="e.g. MR & MRS KITCHEN, Cool Shop"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Store ID *</label>
                <input
                  type="text"
                  required
                  value={storeForm.id}
                  onChange={(e) => setStoreForm({ ...storeForm, id: e.target.value })}
                  placeholder="e.g. f5, g2"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Category *</label>
                <select
                  value={storeForm.category}
                  onChange={(e) => setStoreForm({ ...storeForm, category: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="FOOD">FOOD (Restaurant, Cafe, Snacks)</option>
                  <option value="GROCERY">GROCERY (Daily Essentials, Mart)</option>
                  <option value="DAIRY">DAIRY (Milk, Paneer, Butter)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Store Phone *</label>
                <input
                  type="text"
                  required
                  value={storeForm.phone}
                  onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                  placeholder="e.g. 8217649688"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Store Address</label>
                <input
                  type="text"
                  value={storeForm.store_address}
                  onChange={(e) => setStoreForm({ ...storeForm, store_address: e.target.value })}
                  placeholder="e.g. Robertsonpet Main Road, KGF"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Landmark</label>
                <input
                  type="text"
                  value={storeForm.landmark}
                  onChange={(e) => setStoreForm({ ...storeForm, landmark: e.target.value })}
                  placeholder="e.g. Near Geetha Theater"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Logo / Banner URL</label>
                <input
                  type="text"
                  value={storeForm.logo_url}
                  onChange={(e) => setStoreForm({ ...storeForm, logo_url: e.target.value })}
                  placeholder="https://... or /images/stores/..."
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Google Maps Link</label>
                <input
                  type="text"
                  value={storeForm.store_location}
                  onChange={(e) => setStoreForm({ ...storeForm, store_location: e.target.value })}
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3.5">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              <span>2. Merchant Login Credentials (For Merchant App)</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Login User ID *</label>
                <input
                  type="text"
                  required
                  value={storeForm.merchant_uid}
                  onChange={(e) => setStoreForm({ ...storeForm, merchant_uid: e.target.value })}
                  placeholder={`m_${storeForm.id || "store"}`}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Store Password *</label>
                <input
                  type="text"
                  required
                  value={storeForm.merchant_password}
                  onChange={(e) => setStoreForm({ ...storeForm, merchant_password: e.target.value })}
                  placeholder="e.g. store123"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Owner / Manager Name</label>
                <input
                  type="text"
                  value={storeForm.merchant_name}
                  onChange={(e) => setStoreForm({ ...storeForm, merchant_name: e.target.value })}
                  placeholder="e.g. Suresh Kumar"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={storeForm.merchant_phone}
                  onChange={(e) => setStoreForm({ ...storeForm, merchant_phone: e.target.value })}
                  placeholder="e.g. 8217649688"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setAddStoreModal(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Create Store & Merchant Account →
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Edit Store & Credentials */}
      <Modal
        isOpen={!!editStoreModal}
        onClose={() => setEditStoreModal(null)}
        title={`Edit ${editStoreModal?.name || "Store"}`}
        subtitle="Update store operational profile and linked merchant login credentials"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveStore} className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3.5">
            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" />
              <span>Store Information</span>
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Store Name *</label>
              <input
                type="text"
                required
                value={storeForm.name}
                onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Category *</label>
                <select
                  value={storeForm.category}
                  onChange={(e) => setStoreForm({ ...storeForm, category: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="FOOD">FOOD (Restaurant, Cafe, Snacks)</option>
                  <option value="GROCERY">GROCERY (Daily Essentials, Mart)</option>
                  <option value="DAIRY">DAIRY (Milk, Paneer, Butter)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={storeForm.phone}
                  onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  value={storeForm.store_address}
                  onChange={(e) => setStoreForm({ ...storeForm, store_address: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Landmark</label>
                <input
                  type="text"
                  value={storeForm.landmark}
                  onChange={(e) => setStoreForm({ ...storeForm, landmark: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Logo / Banner URL</label>
              <input
                type="text"
                value={storeForm.logo_url}
                onChange={(e) => setStoreForm({ ...storeForm, logo_url: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Google Maps Location Link</label>
              <input
                type="text"
                value={storeForm.store_location}
                onChange={(e) => setStoreForm({ ...storeForm, store_location: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3.5">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Merchant Login Credentials</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Login UID *</label>
                <input
                  type="text"
                  required
                  value={storeForm.merchant_uid}
                  onChange={(e) => setStoreForm({ ...storeForm, merchant_uid: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Store Password *</label>
                <input
                  type="text"
                  required
                  value={storeForm.merchant_password}
                  onChange={(e) => setStoreForm({ ...storeForm, merchant_password: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Owner / Manager Name</label>
                <input
                  type="text"
                  value={storeForm.merchant_name}
                  onChange={(e) => setStoreForm({ ...storeForm, merchant_name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={storeForm.merchant_phone}
                  onChange={(e) => setStoreForm({ ...storeForm, merchant_phone: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditStoreModal(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Quick Edit Merchant Credentials */}
      <Modal
        isOpen={!!editMerchantModal}
        onClose={() => setEditMerchantModal(null)}
        title={`Merchant Credentials — ${editMerchantModal?.store.name}`}
        subtitle="Manage login username (UID) and store password for the Merchant PWA app"
        maxWidth="md"
      >
        <form onSubmit={handleSaveMerchant} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Merchant User ID (UID) *</label>
            <input
              type="text"
              required
              value={merchantForm.uid}
              onChange={(e) => setMerchantForm({ ...merchantForm, uid: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Store Password *</label>
            <input
              type="text"
              required
              value={merchantForm.password}
              onChange={(e) => setMerchantForm({ ...merchantForm, password: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Partner / Manager Name</label>
              <input
                type="text"
                value={merchantForm.name}
                onChange={(e) => setMerchantForm({ ...merchantForm, name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={merchantForm.phone}
                onChange={(e) => setMerchantForm({ ...merchantForm, phone: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditMerchantModal(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Update Credentials
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 4: Store Catalog & Inventory Management */}
      <Modal
        isOpen={!!inventoryModal}
        onClose={() => setInventoryModal(null)}
        title={`${inventoryModal?.name} — Catalog & Live Inventory`}
        subtitle="Manage live pricing in Rupees (₹), stock toggles, and add new catalog items"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {/* Catalog Top Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search items in this store..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              {catalogCategories.length > 0 && (
                <select
                  value={catalogCategoryFilter}
                  onChange={(e) => setCatalogCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="ALL">All Groups ({storeProducts.length})</option>
                  {catalogCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={() => {
                  setProductForm({
                    name: "",
                    price: 50,
                    category: inventoryModal?.category?.toUpperCase() === "FOOD" ? "Food" : "Grocery",
                    sub_category: "Specials",
                    description: "",
                    image_url: "",
                    in_stock: true,
                    stock_count: 50,
                  });
                  setAddProductModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* Product Items List */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredCatalogProducts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                <ShoppingBag className="w-8 h-8 mx-auto text-slate-600" />
                <p>No products match your search in this store.</p>
                <button
                  onClick={() => {
                    setCatalogSearch("");
                    setCatalogCategoryFilter("ALL");
                  }}
                  className="text-emerald-400 hover:underline font-bold text-xs"
                >
                  Clear catalog search
                </button>
              </div>
            ) : (
              filteredCatalogProducts.map((p) => {
                const inStock = p.in_stock !== false;
                const priceRupees = (p.price / 100).toFixed(0);

                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs hover:border-slate-700 transition-all gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-white p-0.5 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                        <img
                          src={p.image_url || "/images/products/surf_excel.png"}
                          alt={p.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/images/products/surf_excel.png";
                          }}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-white truncate text-xs">{p.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {p.category} {p.sub_category ? `• ${p.sub_category}` : ""} •{" "}
                          <span className="font-black text-emerald-400">₹{priceRupees}</span>
                          <span className="text-slate-500 text-[9px] font-mono ml-1">
                            ({p.price} paise)
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Stock Switch */}
                      <button
                        onClick={() => toggleProductStock(p.id, !inStock)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black cursor-pointer border transition-all ${
                          inStock
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30"
                            : "bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30"
                        }`}
                      >
                        {inStock ? "In Stock" : "Out of Stock"}
                      </button>

                      {/* Quick Price Adjuster */}
                      <button
                        onClick={() => {
                          const newRupees = prompt(
                            `Enter new price in Rupees (₹) for ${p.name}:`,
                            String(priceRupees)
                          );
                          if (newRupees && !isNaN(Number(newRupees))) {
                            updateProduct(p.id, { price: Number(newRupees) });
                          }
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-[10px] cursor-pointer"
                        title="Edit price in Rupees"
                      >
                        ₹ Edit Price
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${p.name}" from catalog?`)) {
                            deleteProduct(p.id);
                          }
                        }}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      {/* Modal 5: Add Product Modal */}
      <Modal
        isOpen={addProductModal}
        onClose={() => setAddProductModal(false)}
        title="Add Product to Store"
        subtitle={`Add a new catalog item to ${inventoryModal?.name}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveProduct} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              placeholder="e.g. Special Kool, Chicken Dum Biryani"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Price in Rupees (₹) *</label>
              <input
                type="number"
                required
                min="1"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                placeholder="e.g. 40 for ₹40"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Saved as {productForm.price * 100} paise in database
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Category / Group</label>
              <input
                type="text"
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                placeholder="e.g. Starters, Rolls, Beverages"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
            <input
              type="text"
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              placeholder="e.g. Authentic recipe served fresh"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Image URL</label>
            <input
              type="text"
              value={productForm.image_url}
              onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
              placeholder="https://... or /images/products/..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setAddProductModal(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Add Item →
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
