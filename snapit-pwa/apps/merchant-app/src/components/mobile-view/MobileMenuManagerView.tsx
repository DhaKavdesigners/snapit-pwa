import React, { useState } from 'react';
import {
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Package,
} from 'lucide-react';
import { useMerchantStore } from '../../store/useMerchantStore';
import { formatCurrency } from '../../utils/formatters';
import type { ProductInventoryItem } from '../../lib/mockData';

export const MobileMenuManagerView: React.FC = () => {
  const {
    products,
    selectedCategory,
    setSelectedCategory,
    toggleProductStock,
    updateProductStockCount,
    setEditingProduct,
    setIsAddProductOpen,
    setDeletingProductId,
  } = useMerchantStore();

  const [searchQuery, setSearchQuery] = useState('');

  // Dynamically compute category filters
  const productCategories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);
  const outOfStockCount = products.filter(
    (p) => p.stockCount === 0 || p.availability === 'OUT OF STOCK' || !p.inStock
  ).length;
  const lowStockCount = products.filter(
    (p) => p.stockCount > 0 && p.stockCount <= 3 && p.availability === 'AVAILABLE' && p.inStock !== false
  ).length;

  const filteredProducts = products.filter((prod) => {
    let matchesCategory = false;
    if (selectedCategory === 'ALL') {
      matchesCategory = true;
    } else if (selectedCategory === 'OUT_OF_STOCK') {
      matchesCategory = prod.stockCount === 0 || prod.availability === 'OUT OF STOCK' || !prod.inStock;
    } else if (selectedCategory === 'LOW_STOCK') {
      matchesCategory = prod.stockCount > 0 && prod.stockCount <= 3 && prod.availability === 'AVAILABLE' && prod.inStock !== false;
    } else {
      matchesCategory = prod.category.toLowerCase() === selectedCategory.toLowerCase();
    }

    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.description && prod.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      prod.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getAvailabilityBadge = (item: ProductInventoryItem) => {
    if (item.availability === 'AVAILABLE' && item.stockCount > 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800">
          <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
          AVAILABLE
        </span>
      );
    }
    if (item.availability === 'AVAILABLE' && item.stockCount > 0 && item.stockCount <= 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
          <Package className="w-2.5 h-2.5 text-amber-700" />
          LOW STOCK ({item.stockCount} left)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-100 text-rose-900">
        <XCircle className="w-2.5 h-2.5 text-rose-600" />
        OUT OF STOCK
      </span>
    );
  };

  return (
    <div className="space-y-3.5 pb-8">
      {/* Top Header with Add Product */}
      <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h3 className="text-sm font-black text-slate-950">MENU & STOCK</h3>
          <p className="text-[11px] text-slate-500 font-medium">{products.length} Products listed</p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddProductOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-emerald-600 active:scale-95 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products or categories..."
          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-xs font-medium text-slate-900 outline-none shadow-2xs"
        />
      </div>

      {/* Category Horizontal Slider */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
        {/* ALL Tab */}
        <button
          type="button"
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1 rounded-xl font-bold uppercase text-[10px] transition-all flex-shrink-0 cursor-pointer ${
            selectedCategory === 'ALL'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          ALL ({products.length})
        </button>

        {/* OUT OF STOCK Special Tab */}
        <button
          type="button"
          onClick={() => setSelectedCategory('OUT_OF_STOCK')}
          className={`px-3 py-1 rounded-xl font-bold uppercase text-[10px] transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
            selectedCategory === 'OUT_OF_STOCK'
              ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-600/30'
              : outOfStockCount > 0
              ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>OUT OF STOCK</span>
          {outOfStockCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-extrabold ${
                selectedCategory === 'OUT_OF_STOCK' ? 'bg-white text-rose-700' : 'bg-rose-600 text-white'
              }`}
            >
              {outOfStockCount}
            </span>
          )}
        </button>

        {/* LOW STOCK (≤3) Special Tab */}
        <button
          type="button"
          onClick={() => setSelectedCategory('LOW_STOCK')}
          className={`px-3 py-1 rounded-xl font-bold uppercase text-[10px] transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
            selectedCategory === 'LOW_STOCK'
              ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-500/30'
              : lowStockCount > 0
              ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>LOW STOCK (≤3)</span>
          {lowStockCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-extrabold ${
                selectedCategory === 'LOW_STOCK' ? 'bg-white text-amber-800' : 'bg-amber-500 text-white'
              }`}
            >
              {lowStockCount}
            </span>
          )}
        </button>

        {/* Dynamic Category Tabs */}
        {productCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-xl font-bold uppercase text-[10px] transition-all flex-shrink-0 cursor-pointer ${
              selectedCategory.toLowerCase() === cat.toLowerCase()
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products List (Exact Sketch Layout) */}
      <div className="space-y-3">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const isAvailable = product.availability === 'AVAILABLE' && product.stockCount > 0;

            return (
              <div
                key={product.id}
                className={`p-3 rounded-2xl border transition-all bg-white shadow-2xs ${
                  isAvailable ? 'border-slate-200' : 'border-slate-200 bg-slate-50/80 opacity-90'
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  {/* Left: Thumbnail */}
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-15 h-15 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                  />

                  {/* Middle: Details & Price/Stock Row */}
                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="text-xs font-black text-slate-950 truncate leading-snug">
                      {product.name}
                    </h4>

                    <div className="mt-0.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 uppercase font-mono">
                        {product.category}
                      </span>
                    </div>

                    {product.description && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {product.description}
                      </p>
                    )}

                    {/* Inline Price & Stock input */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-sm font-black text-emerald-700 font-sans">
                        {formatCurrency(product.price)}
                      </span>

                      <div className="flex items-center gap-1">
                        <label className="text-[11px] font-bold text-slate-700">Stock:</label>
                        <input
                          type="number"
                          min="0"
                          value={product.stockCount}
                          onChange={(e) =>
                            updateProductStockCount(product.id, parseInt(e.target.value) || 0)
                          }
                          className="w-14 px-1.5 py-0.5 bg-slate-50 border border-slate-300 focus:border-emerald-600 rounded text-[11px] font-black text-slate-900 outline-none text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Status & Red Block Button */}
                  <div className="flex flex-col items-end justify-between self-stretch flex-shrink-0 min-h-[64px]">
                    <div>{getAvailabilityBadge(product)}</div>

                    <div className="flex items-center gap-1 my-0.5">
                      <button
                        type="button"
                        onClick={() => setEditingProduct(product)}
                        className="p-1 rounded text-slate-400 hover:text-slate-900"
                        title="Edit Details"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingProductId(product.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-700"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Red Block Out of Stock Button */}
                    <button
                      type="button"
                      onClick={() => toggleProductStock(product.id)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition-all active:scale-95 ${
                        product.stockCount > 0
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {product.stockCount > 0 ? 'Mark Out of Stock' : 'Mark In Stock'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-10 text-center flex flex-col items-center justify-center rounded-2xl bg-white border border-dashed border-slate-200">
            <Package className="w-7 h-7 text-slate-400 mb-1.5" />
            <h4 className="text-xs font-bold text-slate-700">No products found</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Try searching a different item</p>
          </div>
        )}
      </div>
    </div>
  );
};
