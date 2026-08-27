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

export const LiveMenuManager: React.FC = () => {
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

  // Dynamically compute category filters based on current store products
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
          <CheckCircle className="w-3 h-3 text-emerald-600" />
          AVAILABLE
        </span>
      );
    }
    if (item.availability === 'AVAILABLE' && item.stockCount > 0 && item.stockCount <= 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
          <Package className="w-3 h-3 text-amber-700" />
          LOW STOCK ({item.stockCount} left)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-900">
        <XCircle className="w-3 h-3 text-rose-600" />
        OUT OF STOCK
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 flex flex-col h-full space-y-3">
      {/* 1. Header & Add Product */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-950 tracking-tight">
              MENU & INVENTORY
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-700 font-mono">
              {products.length} ITEMS
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Direct stock editing & availability
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddProductOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Product</span>
        </button>
      </div>

      {/* 2. Search & Category Filters */}
      <div className="space-y-2.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name, category, or description..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs font-medium text-slate-900 outline-none transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {/* ALL Tab */}
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-xl font-bold uppercase text-[11px] transition-all flex-shrink-0 cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ALL ({products.length})
          </button>

          {/* OUT OF STOCK Tab */}
          <button
            type="button"
            onClick={() => setSelectedCategory('OUT_OF_STOCK')}
            className={`px-3 py-1 rounded-xl font-bold uppercase text-[11px] transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
              selectedCategory === 'OUT_OF_STOCK'
                ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-600/30'
                : outOfStockCount > 0
                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>OUT OF STOCK</span>
            {outOfStockCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold ${
                  selectedCategory === 'OUT_OF_STOCK' ? 'bg-white text-rose-700' : 'bg-rose-600 text-white'
                }`}
              >
                {outOfStockCount}
              </span>
            )}
          </button>

          {/* LOW STOCK (≤3) Tab */}
          <button
            type="button"
            onClick={() => setSelectedCategory('LOW_STOCK')}
            className={`px-3 py-1 rounded-xl font-bold uppercase text-[11px] transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
              selectedCategory === 'LOW_STOCK'
                ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-500/30'
                : lowStockCount > 0
                ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>LOW STOCK (≤3)</span>
            {lowStockCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold ${
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
              className={`px-3 py-1 rounded-xl font-bold uppercase text-[11px] transition-all flex-shrink-0 cursor-pointer ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Products List (Sketch Design with Zero Blocking) */}
      <div className="space-y-3 pt-1 overflow-y-auto max-h-[620px] pr-0.5">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const isAvailable = product.availability === 'AVAILABLE' && product.stockCount > 0;

            return (
              <div
                key={product.id}
                className={`p-3.5 rounded-2xl border transition-all bg-white shadow-2xs ${
                  isAvailable ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200 bg-slate-50/90 opacity-90'
                }`}
              >
                {/* Row 1: Image + Title + Category + Availability Badge + Edit/Delete Icons */}
                <div className="flex items-start gap-3">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200 flex-shrink-0 shadow-2xs"
                  />

                  <div className="min-w-0 flex-1">
                    {/* Title & Status Badge */}
                    <div className="flex items-start justify-between gap-1.5">
                      <h4 className="text-sm font-black text-slate-950 leading-snug">
                        {product.name}
                      </h4>
                      <div className="flex-shrink-0">
                        {getAvailabilityBadge(product)}
                      </div>
                    </div>

                    {/* Category Tag & Edit/Delete Icons */}
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase font-mono">
                        {product.category}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingProduct(product)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingProductId(product.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    {product.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-normal">
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Row 2: Price, Stock Input Box, and Mark Out of Stock Red Block Button (Completely Unblocked!) */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Left: Price */}
                  <span className="text-base font-black text-emerald-700 font-sans">
                    {formatCurrency(product.price)}
                  </span>

                  {/* Middle: Stock Editable Input Box */}
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                    <label className="text-xs font-bold text-slate-700">Stock:</label>
                    <input
                      type="number"
                      min="0"
                      value={product.stockCount}
                      onChange={(e) =>
                        updateProductStockCount(product.id, parseInt(e.target.value) || 0)
                      }
                      className="w-12 text-center text-xs font-black text-slate-900 bg-white border border-slate-300 rounded-md py-0.5 outline-none shadow-2xs"
                      placeholder="0"
                    />
                  </div>

                  {/* Right: Red Block Mark Out of Stock Button */}
                  <button
                    type="button"
                    onClick={() => toggleProductStock(product.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer border shadow-2xs flex-shrink-0 ${
                      product.stockCount > 0
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                    }`}
                  >
                    {product.stockCount > 0 ? 'Mark Out of Stock' : 'Mark Available (+50)'}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-10 text-center flex flex-col items-center justify-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
            <Package className="w-8 h-8 text-slate-400 mb-2" />
            <h4 className="text-xs font-bold text-slate-700">No products found</h4>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Add a new product or modify your search filter
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
