import React, { useState, useEffect } from 'react';
import { Package, X, Check, Plus, Tag, Sparkles } from 'lucide-react';
import { useMerchantStore } from '../../store/useMerchantStore';

export const AddEditProductModal: React.FC = () => {
  const {
    editingProduct,
    setEditingProduct,
    isAddProductOpen,
    setIsAddProductOpen,
    addProduct,
    updateProduct,
    activeStore,
    products,
    customCategories,
    addCustomCategory,
  } = useMerchantStore();

  const isOpen = isAddProductOpen || Boolean(editingProduct);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Fried Chicken');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [priceRupees, setPriceRupees] = useState<string>('150');
  const [stockCount, setStockCount] = useState<number>(50);
  const [availability, setAvailability] = useState<'AVAILABLE' | 'OUT OF STOCK' | 'UNLISTED'>('AVAILABLE');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [deliveryEta, setDeliveryEta] = useState<number>(15);

  // Compute all available categories dynamically
  const productCategories = Array.from(new Set(products.map((p) => p.category)));
  const allAvailableCategories = Array.from(
    new Set([...productCategories, ...customCategories])
  ).filter(Boolean);

  // Quick suggestions based on store category
  const storeCategoryPresets =
    activeStore.category === 'food'
      ? ['Fried Chicken', 'Burgers', 'Biryani Specials', 'Starters & Grills', 'Chinese Items', 'Veg Gravies', 'Beverages', 'Combos']
      : activeStore.name.toLowerCase().includes('nandhini')
      ? ['Milk & Curd', 'Butter & Ghee', 'Paneer & Cheese', 'Ice Creams & Sweets', 'Dairy Essentials']
      : ['Noodles & Snacks', 'Edible Oils', 'Rice & Grains', 'Atta & Flours', 'Spices & Masala', 'Tea & Coffee', 'Soaps & Detergents', 'Daily Essentials'];

  const editingProductId = editingProduct?.id;

  useEffect(() => {
    if (!isOpen) return;

    if (editingProduct) {
      setName(editingProduct.name);
      setCategory(editingProduct.category);
      setPriceRupees((editingProduct.price / 100).toString());
      setStockCount(editingProduct.stockCount);
      setAvailability(editingProduct.availability);
      setImageUrl(editingProduct.imageUrl);
      setDescription(editingProduct.description || '');
      setDeliveryEta(editingProduct.deliveryEtaMinutes || 15);
      setIsAddingNewCategory(false);
    } else {
      setName('');
      setCategory(allAvailableCategories[0] || storeCategoryPresets[0] || 'General');
      setPriceRupees('150');
      setStockCount(50);
      setAvailability('AVAILABLE');
      setImageUrl('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80');
      setDescription('');
      setDeliveryEta(15);
      setIsAddingNewCategory(false);
    }
  }, [editingProductId, isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsAddProductOpen(false);
    setEditingProduct(null);
  };

  const handleAddCustomCategorySubmit = () => {
    const trimmed = customCategoryInput.trim();
    if (trimmed) {
      addCustomCategory(trimmed);
      setCategory(trimmed);
      setCustomCategoryInput('');
      setIsAddingNewCategory(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Use custom category if currently typing one
    const finalCategory = isAddingNewCategory && customCategoryInput.trim()
      ? customCategoryInput.trim()
      : category;

    if (finalCategory) {
      addCustomCategory(finalCategory);
    }

    // Convert Rupees input to Integer Paise
    const paise = Math.round((parseFloat(priceRupees) || 0) * 100);

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: name.trim(),
        category: finalCategory,
        price: paise,
        stockCount,
        availability,
        inStock: availability === 'AVAILABLE',
        imageUrl: imageUrl.trim() || editingProduct.imageUrl,
        description: description.trim(),
        deliveryEtaMinutes: deliveryEta,
      });
    } else {
      addProduct({
        name: name.trim(),
        category: finalCategory,
        price: paise,
        stockCount,
        availability,
        inStock: availability === 'AVAILABLE',
        imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
        description: description.trim(),
        deliveryEtaMinutes: deliveryEta,
      });
    }

    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm sm:max-w-md w-full p-4 sm:p-5 relative my-auto max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4 pr-8">
          <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 flex-shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-950 truncate">
              {editingProduct ? 'Edit Menu Product' : 'Add New Product'}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              Category classification for store counter
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* 1. Product Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Product Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Crispy Fried Chicken (1pc) or Sona Masoori Rice"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-sm font-semibold text-slate-900 outline-none transition-all"
              required
            />
          </div>

          {/* 2. Dynamic Flexible Category Section */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                <span>Product Category *</span>
              </label>

              <button
                type="button"
                onClick={() => setIsAddingNewCategory(!isAddingNewCategory)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
                <span>{isAddingNewCategory ? 'Pick Existing' : '+ New Custom Category'}</span>
              </button>
            </div>

            {isAddingNewCategory ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  placeholder="e.g. Chinese Items, Rice Varieties, Soaps..."
                  className="flex-1 px-3 py-2 bg-white border border-emerald-500 rounded-xl text-xs font-bold text-slate-900 outline-none ring-2 ring-emerald-500/20"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddCustomCategorySubmit}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-900 outline-none transition-all"
              >
                {allAvailableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}

            {/* Quick Category Suggestion Chips */}
            <div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Suggested Categories for {activeStore.name}:</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {storeCategoryPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setCategory(preset);
                      setIsAddingNewCategory(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      category === preset
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Price & Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Price (₹ Rupees) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={priceRupees}
                  onChange={(e) => setPriceRupees(e.target.value)}
                  placeholder="150"
                  className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                value={stockCount}
                onChange={(e) => setStockCount(parseInt(e.target.value) || 0)}
                placeholder="50"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none transition-all"
              />
            </div>
          </div>

          {/* 4. Availability Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Availability Status
            </label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value as 'AVAILABLE' | 'OUT OF STOCK' | 'UNLISTED')}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs font-bold text-slate-900 outline-none transition-all"
            >
              <option value="AVAILABLE">AVAILABLE (Customer Can Order When Online)</option>
              <option value="OUT OF STOCK">OUT OF STOCK (Shown as Unavailable)</option>
              <option value="UNLISTED">UNLISTED (Hidden Completely from App)</option>
            </select>
          </div>

          {/* 5. Image URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Image URL (Optional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs font-medium text-slate-900 outline-none transition-all"
            />
          </div>

          {/* 6. Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Item Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Portion size, ingredients, variety details..."
              rows={2}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs font-medium text-slate-900 outline-none transition-all resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 h-12 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-2 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{editingProduct ? 'Save Product Changes' : 'Add to Live Catalog'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
