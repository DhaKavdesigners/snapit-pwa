import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { SearchBar } from '../home/SearchBar';
import { StoreCard } from '../../components/StoreCard';
import { ProductCard } from '../../components/ProductCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { useContextStore } from '../../store/contextStore';
import { exploreCategories, mockShoppingStores, mockFoodStores } from '../../api/mockData';
import { useAllProducts } from '../../api/queries';

type ExploreTab = 'categories' | 'stores';

export const ExploreView: React.FC = () => {
  const { activeContext } = useContextStore();
  const [activeTab, setActiveTab] = useState<ExploreTab>('categories');

  // We can track the expanded main category (e.g. cat_groceries)
  const [expandedCategory, setExpandedCategory] = useState<string | null>('cat_groceries');
  
  // If a subcategory is clicked, we show its products in a full view over the categories
  const [selectedSubCategory, setSelectedSubCategory] = useState<{catId: string, subId: string} | null>(null);

  const { data: allProducts, isLoading } = useAllProducts();

  const isShopping = activeContext === 'shopping';
  const stores = isShopping ? mockShoppingStores : mockFoodStores;

  // Filter products by selected subCategory name
  const getSubCategoryName = (catId: string, subId: string) => {
    const cat = exploreCategories.find(c => c.id === catId);
    if (!cat) return null;
    const sub = cat.subCategories.find(s => s.id === subId);
    return sub ? sub.name : null;
  };

  const handleAccordionClick = (catId: string) => {
    setExpandedCategory(expandedCategory === catId ? null : catId);
  };

  // If a subcategory is selected, we render ONLY the products for that subcategory 
  // (like a drill-down view)
  if (selectedSubCategory) {
    const subName = getSubCategoryName(selectedSubCategory.catId, selectedSubCategory.subId);
    const filteredProducts = subName && allProducts
      ? allProducts.filter(p => p.subCategory === subName)
      : [];

    return (
      <div className="flex flex-col h-full bg-slate-50 min-h-screen">
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm p-4 sticky top-0 z-10 flex items-center gap-3">
          <button 
            onClick={() => setSelectedSubCategory(null)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="font-bold text-lg text-gray-900">{subName}</h2>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-2">
              {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
            </div>
          ) : (
            <>
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-bottom-2">
                  {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} fullWidth />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="text-4xl mb-2">🤷‍♂️</div>
                  <h3 className="font-bold text-gray-900 mb-1">No products found</h3>
                  <p className="text-sm">We are adding items to {subName} soon!</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  const [exploreSearchQuery, setExploreSearchQuery] = useState('');

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen">
      {/* ── Sticky header ── */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm px-4 pt-2 pb-0 sticky top-0 z-10">
        <SearchBar value={exploreSearchQuery} onChange={setExploreSearchQuery} />

        {/* ── Categories / Stores Pill Toggle ── */}
        <div className="flex gap-1 mb-3 bg-gray-100 p-1 rounded-full border border-gray-200/50 w-[260px] mx-auto">
          {(['categories', 'stores'] as ExploreTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-brand text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-base">{tab === 'categories' ? '📦' : '🏪'}</span>
              <span className="capitalize">{tab}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto p-4 pb-28">

        {/* CATEGORIES tab */}
        {activeTab === 'categories' && (
          <div className="flex flex-col gap-4">
            {exploreCategories.map((category) => {
              const isExpanded = expandedCategory === category.id;

              return (
                <motion.div 
                  key={category.id} 
                  whileHover={{ scale: 1.02, y: -2, boxShadow: '0px 10px 20px rgba(5, 150, 105, 0.15)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <button
                    onClick={() => handleAccordionClick(category.id)}
                    className="w-full flex items-center justify-between p-4 bg-white active:bg-gray-50 transition-colors"
                  >
                    <h3 className="font-bold text-gray-900 text-lg">{category.title}</h3>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {category.subCategories.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => setSelectedSubCategory({ catId: category.id, subId: sub.id })}
                            className="text-left px-4 py-3 bg-slate-50 hover:bg-brand-50 border border-gray-100 hover:border-brand-200 rounded-xl transition-all active:scale-95 flex items-center justify-between group"
                          >
                            <span className="text-sm font-semibold text-gray-700 group-hover:text-brand-700 leading-tight">
                              {sub.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* STORES tab */}
        {activeTab === 'stores' && (
          <div className="grid grid-cols-2 gap-4">
            {stores.map((store) => (
              <motion.div
                key={store.id}
                whileHover={{ scale: 1.02, y: -4, boxShadow: '0px 12px 24px rgba(5, 150, 105, 0.2)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="flex flex-col items-center bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] cursor-pointer"
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
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
