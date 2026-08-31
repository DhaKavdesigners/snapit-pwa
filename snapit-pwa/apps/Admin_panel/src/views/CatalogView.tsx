import React, { useState } from "react";
import {
  Package,
  Search,
  Plus,
  Store,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { useAdminStore } from "../store/useAdminStore";
import { AdminProduct } from "../types/admin";
import { Modal } from "../components/common/Modal";

export const CatalogView: React.FC = () => {
  const {
    products,
    stores,
    createProduct,
    updateProduct,
    toggleProductStock,
    deleteProduct,
  } = useAdminStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("ALL");
  const [stockFilter, setStockFilter] = useState<string>("ALL");

  const [addProductModal, setAddProductModal] = useState(false);
  const [editProductModal, setEditProductModal] = useState<AdminProduct | null>(null);

  const [productForm, setProductForm] = useState({
    name: "",
    store_id: "",
    price: 50,
    category: "Grocery",
    sub_category: "Daily Essentials",
    image_url: "/images/products/surf_excel.png",
    in_stock: true,
    stock_count: 50,
    delivery_eta_minutes: 10,
  });

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sub_category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedStoreId !== "ALL" && p.store_id !== selectedStoreId) return false;

    if (stockFilter === "IN_STOCK") return p.in_stock !== false;
    if (stockFilter === "OUT_OF_STOCK") return p.in_stock === false;
    return true;
  });

  const handleOpenAddProduct = () => {
    setProductForm({
      name: "",
      store_id: stores[0]?.id || "store_1",
      price: 50,
      category: "Grocery",
      sub_category: "Daily Essentials",
      image_url: "/images/products/surf_excel.png",
      in_stock: true,
      stock_count: 50,
      delivery_eta_minutes: 10,
    });
    setAddProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.store_id) return;

    if (editProductModal) {
      await updateProduct(editProductModal.id, productForm);
      setEditProductModal(null);
    } else {
      await createProduct(productForm);
      setAddProductModal(false);
    }
  };

  const handleOpenEditProduct = (prod: AdminProduct) => {
    setProductForm({
      name: prod.name,
      store_id: prod.store_id,
      price: prod.price,
      category: prod.category || "Grocery",
      sub_category: prod.sub_category || "",
      image_url: prod.image_url || "",
      in_stock: prod.in_stock !== false,
      stock_count: prod.stock_count || 50,
      delivery_eta_minutes: prod.delivery_eta_minutes || 10,
    });
    setEditProductModal(prod);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await deleteProduct(productId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items by name, subcategory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Store Selector */}
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Stores ({stores.length})</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.category})
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[
              { id: "ALL", label: `All (${products.length})` },
              { id: "IN_STOCK", label: "In Stock" },
              { id: "OUT_OF_STOCK", label: "Out of Stock" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStockFilter(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  stockFilter === tab.id
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleOpenAddProduct}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Product</th>
                <th className="px-4 py-3.5">Store / Counter</th>
                <th className="px-4 py-3.5">Price</th>
                <th className="px-4 py-3.5">Stock Status</th>
                <th className="px-4 py-3.5">Delivery ETA</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.map((p) => {
                const store = stores.find((s) => s.id === p.store_id);
                const inStock = p.in_stock !== false;

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Product Name & Image */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
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
                        <div>
                          <p className="font-bold text-white text-xs leading-tight">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                            {p.sub_category || p.category || "General"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Store */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-300">
                        <Store className="w-3.5 h-3.5 text-purple-400" />
                        <span>{store?.name || p.store_id}</span>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => {
                          const newPrice = prompt(`Enter new price for ${p.name}:`, String(p.price));
                          if (newPrice && !isNaN(Number(newPrice))) {
                            updateProduct(p.id, { price: Number(newPrice) });
                          }
                        }}
                        title="Click to quickly edit price"
                        className="font-mono font-black text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        ₹{p.price}
                      </button>
                    </td>

                    {/* Stock status */}
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => toggleProductStock(p.id, !inStock)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black cursor-pointer transition-all border ${
                          inStock
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                        }`}
                      >
                        {inStock ? "🟢 In Stock" : "🔴 Out of Stock"}
                      </button>
                    </td>

                    {/* Delivery ETA */}
                    <td className="px-4 py-3.5 text-slate-400 font-mono">
                      ⚡ {p.delivery_eta_minutes || 10} mins
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEditProduct(p)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="Edit Item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={addProductModal || !!editProductModal}
        onClose={() => {
          setAddProductModal(false);
          setEditProductModal(null);
        }}
        title={editProductModal ? `Edit ${editProductModal.name}` : "Add Master Catalog Product"}
        subtitle="Configure product details, assigned store counter, and stock"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Product Title *</label>
            <input
              type="text"
              required
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              placeholder="e.g. Nandini Pasteurised Toned Milk 500ml"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Partner Store *</label>
              <select
                required
                value={productForm.store_id}
                onChange={(e) => setProductForm({ ...productForm, store_id: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>

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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
              <input
                type="text"
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                placeholder="Grocery / Food"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Subcategory</label>
              <input
                type="text"
                value={productForm.sub_category}
                onChange={(e) => setProductForm({ ...productForm, sub_category: e.target.value })}
                placeholder="e.g. Dairy, Oils, Rice"
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

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setAddProductModal(false);
                setEditProductModal(null);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              {editProductModal ? "Save Item" : "Create Item"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
