import React, { useState } from 'react';
import { SearchBar } from '../home/SearchBar';
import { StoreCard } from '../../components/StoreCard';
import { ProductCard } from '../../components/ProductCard';
import { useContextStore } from '../../store/contextStore';
import { mockShoppingStores, mockFoodStores, mockShoppingProducts, mockFoodProducts } from '../../api/mockData';
import { ShoppingBag, Utensils } from 'lucide-react';

const shoppingCategories = [
  { id: 'c1', name: 'Groceries',     emoji: '🛒', imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80' },
  { id: 'c2', name: 'Dairy',         emoji: '🥛', imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80' },
  { id: 'c3', name: 'Snacks',        emoji: '🍿', imageUrl: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=400&q=80' },
  { id: 'c4', name: 'Household',     emoji: '🧹', imageUrl: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=400&q=80' },
  { id: 'c5', name: 'Personal Care', emoji: '🧴', imageUrl: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=400&q=80' },
  { id: 'c6', name: 'Spices',        emoji: '🌶️', imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80' },
];

const foodCategories = [
  { id: 'f1', name: 'Biryani',       emoji: '🍚', imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80' },
  { id: 'f2', name: 'Burgers',       emoji: '🍔', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80' },
  { id: 'f3', name: 'Shawarma',      emoji: '🌯', imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80' },
  { id: 'f4', name: 'Bakery',        emoji: '🥐', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80' },
  { id: 'f5', name: 'Fried Chicken', emoji: '🍗', imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400&q=80' },
  { id: 'f6', name: 'Kebabs',        emoji: '🥙', imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80' },
];

type ExploreTab = 'categories' | 'stores';

export const ExploreView: React.FC = () => {
  const { activeContext, setContext } = useContextStore();
  const [activeTab, setActiveTab] = useState<ExploreTab>('categories');

  const isShopping = activeContext === 'shopping';
  const categories = isShopping ? shoppingCategories : foodCategories;
  const stores     = isShopping ? mockShoppingStores  : mockFoodStores;

  return (
    <div className="flex flex-col h-full bg-slate-50">

      {/* ── Sticky header ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 pt-2 pb-0 sticky top-0 z-10">
        <SearchBar />

        {/* ── Shopping / Food toggle — Explore-specific vivid style ── */}
        <div className="flex gap-2 mb-3 bg-emerald-50 p-1 rounded-2xl border border-emerald-100">
          <button
            onClick={() => setContext('shopping')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              isShopping
                ? 'bg-brand text-white shadow-md shadow-brand/30'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Shopping
          </button>
          <button
            onClick={() => setContext('food')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              !isShopping
                ? 'bg-brand text-white shadow-md shadow-brand/30'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Utensils className="w-4 h-4" />
            Food
          </button>
        </div>

        {/* ── Categories / Stores sub-tabs (underline style) ── */}
        <div className="flex gap-0 -mb-px">
          {(['categories', 'stores'] as ExploreTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm capitalize border-b-2 font-bold transition-colors duration-150 ${
                activeTab === tab
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab === 'categories' ? '📦 Categories' : '🏪 Stores'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto p-4 pb-28">

        {/* CATEGORIES tab */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                {/* Image */}
                <div className="w-full aspect-[4/3] overflow-hidden">
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* gradient + label */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center gap-1.5">
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="font-bold text-sm text-white drop-shadow">{cat.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STORES tab */}
        {activeTab === 'stores' && (
          <div className="grid grid-cols-2 gap-4">
            {stores.map((store) => (
              <div
                key={store.id}
                className="flex flex-col items-center bg-white rounded-2xl p-4 shadow-sm hover:shadow-md border border-gray-100 active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden mb-3 bg-gray-100 shadow-inner">
                  <img
                    src={store.logoUrl}
                    alt={store.name}
                    onError={(e) => { if (store.fallbackLogoUrl) (e.target as HTMLImageElement).src = store.fallbackLogoUrl; }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="font-bold text-sm text-gray-900 text-center line-clamp-2 leading-tight mb-1">{store.name}</h4>
                <div className="flex items-center gap-1 text-xs text-gray-500 font-semibold mb-2">
                  <span className="text-yellow-400">★</span>
                  {store.rating.toFixed(1)}
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${store.isOpen ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                  {store.isOpen ? 'OPEN NOW' : 'CLOSED'}
                </span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
