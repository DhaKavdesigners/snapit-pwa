import React, { useState } from "react";
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
} from "lucide-react";
import { useAdminStore } from "../store/useAdminStore";
import { AdminStore, AdminProduct } from "../types/admin";
import { Modal } from "../components/common/Modal";

export const MerchantsView: React.FC = () => {
  const {
    stores,
    products,
    createStore,
    updateStore,
    toggleStoreOnline,
    deleteStore,
    createProduct,
    updateProduct,
    toggleProductStock,
    deleteProduct,
  } = useAdminStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Modals state
  const [addStoreModal, setAddStoreModal] = useState(false);
  const [editStoreModal, setEditStoreModal] = useState<AdminStore | null>(null);
  const [inventoryModal, setInventoryModal] = useState<AdminStore | null>(null);
  const [addProductModal, setAddProductModal] = useState(false);

  // Store Form State
  const [storeForm, setStoreForm] = useState({
    id: "",
    name: "",
    category: "grocery",
    logo_url: "",
    rating: 4.8,
    is_online: true,
    address: "",
    phone: "",
    upi_id: "",
  });

  // Product Form State
  const [productForm, setProductForm] = useState({
    name: "",
    price: 50,
    category: "Grocery",
    sub_category: "Daily Essentials",
    image_url: "",
    in_stock: true,
    stock_count: 50,
  });

  const filteredStores = stores.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery);

    if (!matchesSearch) return false;
    if (categoryFilter === "ALL") return true;
    return s.category?.toLowerCase() === categoryFilter.toLowerCase();
  });

  const handleOpenAddStore = () => {
    setStoreForm({
      id: `store_${Date.now()}`,
      name: "",
      category: "grocery",
      logo_url: "/images/stores/mhetha-stores/metha-stores.avif",
      rating: 4.8,
      is_online: true,
      address: "KGF Main Road, Robertsonpet",
      phone: "8217649688",
      upi_id: "minnit@upi",
    });
    setAddStoreModal(true);
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeForm.name) return;

    if (editStoreModal) {
      await updateStore(editStoreModal.id, storeForm);
      setEditStoreModal(null);
    } else {
      await createStore(storeForm);
      setAddStoreModal(false);
    }
  };

  const handleOpenEditStore = (store: AdminStore) => {
    setStoreForm({
      id: store.id,
      name: store.name,
      category: store.category || "grocery",
      logo_url: store.logo_url || "",
      rating: store.rating || 4.8,
      is_online: store.is_online !== false,
      address: store.address || "",
      phone: store.phone || "",
      upi_id: store.upi_id || "",
    });
    setEditStoreModal(store);
  };

  const handleDeleteStore = async (storeId: string) => {
    if (window.confirm("Are you sure you want to remove this merchant partner?")) {
      await deleteStore(storeId);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryModal || !productForm.name) return;

    await createProduct({
      ...productForm,
      store_id: inventoryModal.id,
    });

    setAddProductModal(false);
    setProductForm({
      name: "",
      price: 50,
      category: inventoryModal.category === "food" ? "Food" : "Grocery",
      sub_category: "Daily Essentials",
      image_url: "",
      in_stock: true,
      stock_count: 50,
    });
  };

  // Products belonging to the selected store in the inventory modal
  const storeProducts = products.filter((p) => p.store_id === inventoryModal?.id);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search stores by name, ID, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Category Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            {["ALL", "grocery", "food"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={handleOpenAddStore}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Merchant</span>
          </button>
        </div>
      </div>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredStores.map((store) => {
          const storeProds = products.filter((p) => p.store_id === store.id);
          const isOnline = store.is_online !== false;

          return (
            <div
              key={store.id}
              className="rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
            >
              {/* Store Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white p-1 border border-slate-700 overflow-hidden shrink-0 shadow-sm">
                      <img
                        src={store.logo_url || "/images/stores/mhetha-stores/metha-stores.avif"}
                        alt={store.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/images/stores/mhetha-stores/metha-stores.avif";
                        }}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-white leading-tight">{store.name}</h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {store.id}</p>
                    </div>
                  </div>

                  {/* Online / Offline switch */}
                  <button
                    onClick={() => toggleStoreOnline(store.id, !isOnline)}
                    className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer border ${
                      isOnline
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    }`}
                  >
                    {isOnline ? "🟢 Open" : "🔴 Closed"}
                  </button>
                </div>

                {/* Details */}
                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Category:</span>
                    <span className="font-bold uppercase tracking-wider text-emerald-400">
                      {store.category || "Grocery"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-mono font-bold text-white">{store.phone || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Rating:</span>
                    <span className="flex items-center gap-1 font-bold text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{store.rating || 4.8}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Catalog Size:</span>
                    <span className="font-bold text-purple-400">{storeProds.length} Products</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setInventoryModal(store)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-purple-500/20 hover:bg-purple-500 hover:text-white text-purple-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Catalog ({storeProds.length})</span>
                </button>

                <button
                  onClick={() => handleOpenEditStore(store)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
                  title="Edit Merchant"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteStore(store.id)}
                  className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl transition-all cursor-pointer"
                  title="Delete Merchant"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Store Modal */}
      <Modal
        isOpen={addStoreModal || !!editStoreModal}
        onClose={() => {
          setAddStoreModal(false);
          setEditStoreModal(null);
        }}
        title={editStoreModal ? `Edit ${editStoreModal.name}` : "Add New Merchant Partner"}
        subtitle="Onboard a new local store or restaurant to Minnit KGF"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveStore} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Store Name *</label>
            <input
              type="text"
              required
              value={storeForm.name}
              onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
              placeholder="e.g. Metha Stores, Venus Biriyani"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Category *</label>
              <select
                value={storeForm.category}
                onChange={(e) => setStoreForm({ ...storeForm, category: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="grocery">Grocery & Essentials</option>
                <option value="food">Restaurant & Food</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={storeForm.phone}
                onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                placeholder="e.g. 8217649688"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Address / Location</label>
            <input
              type="text"
              value={storeForm.address}
              onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
              placeholder="e.g. Robertsonpet, KGF Main Road"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Logo / Banner URL</label>
              <input
                type="text"
                value={storeForm.logo_url}
                onChange={(e) => setStoreForm({ ...storeForm, logo_url: e.target.value })}
                placeholder="/images/stores/..."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">UPI ID for Payouts</label>
              <input
                type="text"
                value={storeForm.upi_id}
                onChange={(e) => setStoreForm({ ...storeForm, upi_id: e.target.value })}
                placeholder="e.g. merchant@okhdfcbank"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setAddStoreModal(false);
                setEditStoreModal(null);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              {editStoreModal ? "Save Changes" : "Create Merchant"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Store Catalog / Inventory Management Modal */}
      <Modal
        isOpen={!!inventoryModal}
        onClose={() => setInventoryModal(null)}
        title={`${inventoryModal?.name} — Catalog & Inventory`}
        subtitle="Manage product prices, in-stock availability, and add new items"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 font-medium">
              Showing {storeProducts.length} items for this store
            </p>
            <button
              onClick={() => setAddProductModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          {/* Product Items Table */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {storeProducts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No products found for this store. Click "Add Item" to add the first product!
              </div>
            ) : (
              storeProducts.map((p) => {
                const inStock = p.in_stock !== false;

                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs hover:border-slate-700 transition-all gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-white p-0.5 border border-slate-700 overflow-hidden shrink-0">
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
                        <p className="font-bold text-white truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {p.sub_category || p.category} • ₹{p.price}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Stock Switch */}
                      <button
                        onClick={() => toggleProductStock(p.id, !inStock)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer ${
                          inStock
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {inStock ? "In Stock" : "Out of Stock"}
                      </button>

                      {/* Quick Price Adjuster */}
                      <button
                        onClick={() => {
                          const newPrice = prompt("Enter new price (₹):", String(p.price));
                          if (newPrice && !isNaN(Number(newPrice))) {
                            updateProduct(p.id, { price: Number(newPrice) });
                          }
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-[10px] cursor-pointer"
                      >
                        ₹ Price
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Delete ${p.name}?`)) {
                            deleteProduct(p.id);
                          }
                        }}
                        className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
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

      {/* Add Product Modal */}
      <Modal
        isOpen={addProductModal}
        onClose={() => setAddProductModal(false)}
        title="Add Product to Store"
        subtitle={`Add a new item to ${inventoryModal?.name}`}
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
              placeholder="e.g. Fortune Sunflower Oil 1L"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Price (₹) *</label>
              <input
                type="number"
                required
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Subcategory</label>
              <input
                type="text"
                value={productForm.sub_category}
                onChange={(e) => setProductForm({ ...productForm, sub_category: e.target.value })}
                placeholder="e.g. Cooking Oil"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Image URL</label>
            <input
              type="text"
              value={productForm.image_url}
              onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
              placeholder="/images/products/..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setAddProductModal(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
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
