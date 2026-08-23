import React, { useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { SearchBar } from '../home/SearchBar';
import { StoreCard } from '../../components/StoreCard';
import { ProductCard } from '../../components/ProductCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { useContextStore } from '../../store/contextStore';
import { exploreShoppingCategories, exploreFoodCategories, mockShoppingStores, mockFoodStores } from '../../api/mockData';
import { useAllProducts, useStores } from '../../api/queries';

type ExploreTab = 'categories' | 'stores';
type ExploreState = 'main' | 'category' | 'store';

export const ExploreView: React.FC = () => {
  const { activeContext } = useContextStore();
  const isShopping = activeContext === 'shopping';
  
  // Navigation State
  const [exploreState, setExploreState] = useState<ExploreState>('main');
  const [activeTab, setActiveTab] = useState<ExploreTab>('categories');
  const [exploreSearchQuery, setExploreSearchQuery] = useState('');

  // Drill-down selections
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  const { data: allProducts, isLoading } = useAllProducts();
  const { data: shoppingStores = mockShoppingStores } = useStores('shopping');
  const { data: foodStores = mockFoodStores } = useStores('food');

  const categories = isShopping ? exploreShoppingCategories : exploreFoodCategories;

  // --- HANDLERS ---
  const handleCategoryClick = (category: any) => {
    setSelectedCategory(category);
    setActiveSubCategory(category.subCategories[0]?.name || null);
    setExploreState('category');
  };

  const handleStoreClick = (storeId: string) => {
    setSelectedStore(storeId);
    setExploreState('store');
  };

  const goBack = () => {
    setExploreState('main');
    setSelectedCategory(null);
    setSelectedStore(null);
  };

  // --- RENDER VIEWS ---

  if (exploreState === 'category' && selectedCategory) {
    const filteredProducts = allProducts?.filter(p => {
      if (!activeSubCategory) return true;
      if (p.subCategory === activeSubCategory) return true;
      if (p.subCategory?.toLowerCase().includes(activeSubCategory.toLowerCase())) return true;
      if (activeSubCategory === 'Fresh Vegetables' && (p.name.includes('Tomato') || p.name.includes('Onion') || p.name.includes('Palak') || p.name.includes('Capsicum') || p.subCategory?.includes('Veg'))) return true;
      if (activeSubCategory === 'Fresh Fruits' && (p.name.includes('Apple') || p.name.includes('Banana') || p.name.includes('Orange') || p.name.includes('Grapes') || p.subCategory?.includes('Fruit'))) return true;
      if (activeSubCategory === 'Fresh Fruit Juices' && (p.name.includes('Juice') || p.name.includes('Frooti') || p.subCategory?.includes('Juice'))) return true;
      return false;
    }) || [];
    
    return (
      <div className="flex flex-col h-full bg-slate-50 min-h-screen">
        <div className="bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm sticky top-0 z-20">
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={goBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95 shrink-0">
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div className="min-w-0">
                <h2 className="font-black text-lg text-gray-900 leading-tight flex items-center gap-1.5 truncate">
                  <span>{selectedCategory.emoji}</span>
                  <span>{selectedCategory.title}</span>
                </h2>
                {selectedCategory.subtitle && (
                  <p className="text-[11px] text-gray-500 font-medium truncate">{selectedCategory.subtitle}</p>
                )}
              </div>
            </div>
            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
              {filteredProducts.length} Items
            </span>
          </div>

          {/* Subcategory Pills */}
          <div className="flex overflow-x-auto hide-scrollbar gap-2 px-4 pb-3">
            {selectedCategory.subCategories.map((sub: any) => (
              <button
                key={sub.id}
                onClick={() => setActiveSubCategory(sub.name)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-black transition-all border ${
                  activeSubCategory === sub.name
                    ? 'bg-gradient-to-r from-emerald-600 to-brand text-white border-transparent shadow-md shadow-emerald-500/20'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 active:scale-95'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-4 pb-28">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-2">
              {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-bottom-2">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => <ProductCard key={product.id} product={product} fullWidth />)
              ) : (
                <div className="col-span-3 text-center py-12 px-6 bg-white rounded-3xl border border-gray-100 shadow-xs">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mb-3 shadow-xs">
                    {selectedCategory.emoji || '📦'}
                  </div>
                  <h3 className="font-black text-gray-900 text-base mb-1">{activeSubCategory}</h3>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                    Fresh stock arriving soon directly from local KGF vendors &amp; farms. Check back daily at 7:00 AM!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (exploreState === 'store' && selectedStore) {
    const store = [...shoppingStores, ...foodStores].find(s => s.id === selectedStore);
    const isStoreOpen = store !== undefined ? store.isOpen : true;
    const storeProducts = (allProducts?.filter(p => p.storeId === selectedStore) || []).map(p => ({
      ...p,
      storeIsOpen: isStoreOpen
    }));

    return (
      <div className="flex flex-col h-full bg-slate-50 min-h-screen">
        <div className="bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm sticky top-0 z-20 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={goBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95 shrink-0">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <img src={store?.logoUrl} alt={store?.name} className="w-9 h-9 rounded-full border border-gray-100 object-cover shrink-0" />
            <div className="min-w-0">
              <h2 className="font-bold text-base text-gray-900 leading-tight truncate">{store?.name}</h2>
              <div className="text-xs text-gray-500 font-semibold flex items-center gap-1.5">
                <span className="text-yellow-500">★</span> {store?.rating} • {store?.category === 'food' ? 'Food' : 'Grocery'}
              </div>
            </div>
          </div>
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
            isStoreOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            {isStoreOpen ? 'Open' : 'Closed'}
          </span>
        </div>
        
        <div className="p-4 pb-28">
          {/* Store Offline Notice */}
          {!isStoreOpen && (
            <div className="bg-red-50 border border-red-200/90 rounded-2xl p-3.5 mb-4 flex items-center gap-3 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <span className="text-sm">🔴</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-xs text-red-900 leading-tight">Store is Currently Offline</h4>
                  <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase">Closed</span>
                </div>
                <p className="text-[11px] text-red-700 font-medium leading-tight mt-0.5">
                  This store is not accepting orders right now. Products are displayed for viewing only.
                </p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-3 gap-2">
              {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-bottom-2">
              {storeProducts.length > 0 ? (
                storeProducts.map(product => <ProductCard key={product.id} product={product} fullWidth />)
              ) : (
                <div className="col-span-3 text-center py-10 text-gray-500">
                  <div className="text-4xl mb-2">🤷‍♂️</div>
                  <h3 className="font-bold text-gray-900 mb-1">No products found</h3>
                  <p className="text-sm">This store has not listed any items yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- MAIN VIEW ---
  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen">
      {/* Sticky header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm px-4 pt-2 pb-0 sticky top-0 z-10">
        <SearchBar value={exploreSearchQuery} onChange={setExploreSearchQuery} />

        <div className="flex gap-1 mb-3 bg-gray-100 p-1 rounded-full border border-gray-200/50 w-[260px] mx-auto">
          {(['categories', 'stores'] as ExploreTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-base">{tab === 'categories' ? '📦' : '🏪'}</span>
              <span className="capitalize">{tab}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 pb-28">
        
        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 gap-3.5">
            {categories.map((category) => (
              <motion.div 
                key={category.id} 
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={() => handleCategoryClick(category)}
                className="relative h-36 md:h-40 rounded-3xl overflow-hidden shadow-sm border border-gray-100/90 cursor-pointer group active:scale-[0.98] transition-all bg-white"
              >
                {/* 100% Original, Clean & Natural Image */}
                <img 
                  src={category.imageUrl} 
                  alt={category.title}
                  onError={(e) => { 
                    const target = e.target as HTMLImageElement;
                    if (target.src !== category.fallbackImageUrl) {
                      target.src = category.fallbackImageUrl;
                    }
                  }}
                  className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500"
                />

                {/* Gentle bottom-only gradient for high text legibility without hiding photo */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 via-black/35 to-transparent flex items-end justify-between p-4 z-10">
                  <h3 className="font-black text-white text-lg tracking-tight drop-shadow-md">
                    {category.title}
                  </h3>

                  <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white group-hover:bg-white group-hover:text-gray-900 group-hover:scale-110 transition-all shadow-sm shrink-0">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* STORES TAB */}
        {activeTab === 'stores' && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2">
            
            {/* GROCERY SECTION */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-xl text-gray-900 tracking-tight flex items-center gap-2">
                  <span>🛒</span> Grocery & Essentials
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {shoppingStores.map((store) => (
                  <div key={store.id} onClick={() => handleStoreClick(store.id)}>
                    <StoreCard store={store} />
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px bg-gray-200/50 w-full" />

            {/* FOOD SECTION */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-xl text-gray-900 tracking-tight flex items-center gap-2">
                  <span>🍽️</span> Food & Restaurants
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {foodStores.map((store) => (
                  <div key={store.id} onClick={() => handleStoreClick(store.id)}>
                    <StoreCard store={store} />
                  </div>
                ))}
              </div>
            </section>
            
          </div>
        )}

      </div>
    </div>
  );
};
