import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Tag } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { ContextToggle } from './ContextToggle';
import { BannerCarousel } from './BannerCarousel';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProductCard } from '../../components/ProductCard';
import { useProducts, useTrending, useTodaysPicks, useStores } from '../../api/queries';
import { useContextStore } from '../../store/contextStore';

export const HomeView: React.FC = () => {
  const { activeContext } = useContextStore();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: products, isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useProducts(activeContext);
  const { data: trending, isLoading: trendingLoading, error: trendingError, refetch: refetchTrending } = useTrending(activeContext);
  const { data: stores } = useStores(activeContext);
  const { data: todaysPicks, isLoading: todaysLoading, refetch: refetchTodays } = useTodaysPicks();

  const handleRefresh = async () => {
    await Promise.all([
      refetchProducts(), 
      refetchTrending(),
      refetchTodays()
    ]);
  };

  const isLoading = productsLoading || trendingLoading || todaysLoading;
  const isError = productsError || trendingError;
  const isEmpty = !isLoading && !isError && (!products?.length);

  // Global Search logic
  const searchedProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.subCategory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const rawSuggestions = [
    ...(products?.map(p => ({ type: 'Product', text: p.name })) || []),
    ...(stores?.map(s => ({ type: 'Store', text: s.name })) || []),
    ...(products?.map(p => ({ type: 'Category', text: p.subCategory || p.category })) || []),
  ];
  
  const suggestions = Array.from(new Map(
    rawSuggestions
      .filter(s => s.text?.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(s => [s.text, s])
  ).values()).slice(0, 5);
  const isSearching = searchQuery.trim().length > 0;

  // Shopping Categories
  const snacks = products?.filter(p => p.subCategory === 'Snacks & Beverages') || [];
  const dairy = products?.filter(p => ['Milk & Curd', 'Butter, Ghee & Cream', 'Ice Cream'].includes(p.subCategory || '')) || [];
  const masalas = products?.filter(p => p.subCategory === 'Cooking Essentials') || [];
  const homecare = products?.filter(p => ['Home Essentials', 'Personal Care'].includes(p.subCategory || '')) || [];

  // Food Categories
  const biryani = products?.filter(p => p.subCategory === 'Biryani Specialties') || [];
  const fastfood = products?.filter(p => p.subCategory === 'Fast Food & Rolls') || [];
  const bakery = products?.filter(p => ['Breads & Cakes', 'Puffs & Savories'].includes(p.subCategory || '')) || [];

  // Deduplication Logic
  const featuredIds = activeContext === 'shopping' 
    ? new Set([...snacks, ...dairy, ...masalas, ...homecare].map(p => p.id))
    : new Set([...biryani, ...fastfood, ...bakery].map(p => p.id));
    
  const nonFeaturedProducts = products?.filter(p => !featuredIds.has(p.id)) || [];
  const featuredProductsList = products?.filter(p => featuredIds.has(p.id)) || [];
  const deduplicatedAllEssentials = [...nonFeaturedProducts, ...featuredProductsList];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const shoppingAnchors = [
    { id: 'section-grocery', name: 'Grocery', emoji: '🛒' },
    { id: 'section-dairy', name: 'Dairy', emoji: '🥛' },
    { id: 'section-snacks', name: 'Snacks', emoji: '🍿' },
    { id: 'section-homecare', name: 'Home Care', emoji: '🧼' },
  ];

  const foodAnchors = [
    { id: 'section-biryani', name: 'Biryani', emoji: '🍚' },
    { id: 'section-fastfood', name: 'Fast Food', emoji: '🍔' },
    { id: 'section-bakery', name: 'Bakery', emoji: '🥐' },
  ];

  const anchors = activeContext === 'shopping' ? shoppingAnchors : foodAnchors;

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="p-4 pt-2 bg-slate-50 min-h-screen">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <ContextToggle />

        {isError && <ErrorState onRetry={handleRefresh} />}
        {isEmpty && <EmptyState title="Nothing here yet" description="Check back later or try switching context." />}

        {(!isError && !isEmpty) && (
          <>
            {isSearching ? (
              <div className="mb-4">
                <h3 className="font-bold text-lg text-gray-900 mb-3">Search Results</h3>
                {searchedProducts.length > 0 ? (
                  <>
                    {searchQuery && suggestions.length > 0 && (
                      <div className="mb-4 bg-white rounded-xl shadow-sm border border-gray-100 p-2">
                        {suggestions.map((s, i) => (
                          <div 
                            key={i} 
                            onClick={() => setSearchQuery(s.text || '')}
                            className="px-3 py-2 hover:bg-emerald-50 rounded-lg cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <span className="text-sm font-medium text-gray-800">{s.text}</span>
                            <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">{s.type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                    {searchedProducts.map(product => (
                      <ProductCard key={product.id} product={product} fullWidth />
                    ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm mt-4">
                    <span className="text-4xl mb-3 block">🔍</span>
                    <h4 className="font-bold text-gray-900 mb-1">No items found</h4>
                    <p className="text-sm text-gray-500">No items found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <BannerCarousel />

                {/* ── Category Anchor Jump Chips ── */}
                <div className="mb-6 sticky top-[132px] z-30 bg-slate-50/90 backdrop-blur-md py-2 -mx-4 px-4 shadow-[0_4px_10px_-4px_rgba(0,0,0,0.05)] border-b border-gray-100">
                  <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-none hide-scrollbar">
                    {anchors.map(a => (
                      <button
                        key={a.id}
                        onClick={() => scrollToSection(a.id)}
                        className="flex items-center gap-1.5 snap-start shrink-0 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm hover:border-emerald-500 hover:text-emerald-700 active:scale-95 transition-all text-sm font-semibold text-gray-700 whitespace-nowrap"
                      >
                        <span>{a.emoji}</span>
                        {a.name}
                      </button>
                    ))}
                    <Link
                      to="/explore"
                      className="flex items-center gap-1.5 snap-start shrink-0 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm hover:border-emerald-500 hover:text-emerald-700 active:scale-95 transition-all text-sm font-semibold text-gray-500 whitespace-nowrap"
                    >
                      <Plus className="h-4 w-4" />
                      Explore
                    </Link>
                  </div>
                </div>

                {/* ── 🔥 Popular in Robertsonpet ── */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg text-gray-900">
                      🔥 Popular in Robertsonpet
                    </h3>
                  </div>
                  <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 hide-scrollbar scrollbar-none py-2 -mx-4 px-4">
                    {trendingLoading
                      ? Array(4).fill(0).map((_, i) => <Skeleton key={`skeleton-trend-${i}`} className="min-w-[130px] h-52 shrink-0 snap-start rounded-xl" />)
                      : trending?.map(product => <ProductCard key={product.id} product={product} />)
                    }
                  </div>
                </div>

                {/* ── 🏷️ Today's Picks ── */}
                {activeContext === 'shopping' && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Tag className="w-5 h-5 text-emerald-500" fill="currentColor" />
                        <h3 className="font-bold text-lg text-gray-900">Today's Picks</h3>
                      </div>
                    </div>
                    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 hide-scrollbar scrollbar-none py-2 -mx-4 px-4">
                      {todaysLoading
                        ? Array(3).fill(0).map((_, i) => <Skeleton key={`skeleton-tp-${i}`} className="min-w-[150px] h-52 shrink-0 snap-start rounded-xl" />)
                        : todaysPicks?.map(product => <ProductCard key={product.id} product={product} />)
                      }
                    </div>
                  </div>
                )}

                {/* ── CATEGORIZED HORIZONTAL ROWS ── */}
                {activeContext === 'shopping' ? (
                  <>
                    <section id="section-grocery" className="mb-6 scroll-mt-32">
                      <h3 className="font-bold text-lg text-gray-900 mb-3">🛒 Everyday Groceries</h3>
                      <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none hide-scrollbar gap-3 py-2 -mx-4 px-4">
                        {productsLoading ? (
                          Array(4).fill(0).map((_, i) => <Skeleton key={`skeleton-groc-${i}`} className="min-w-[130px] h-52 shrink-0 snap-start rounded-xl" />)
                        ) : (
                          masalas.map(product => <ProductCard key={product.id} product={product} />)
                        )}
                      </div>
                    </section>

                    <section id="section-dairy" className="mb-6 scroll-mt-32">
                      <h3 className="font-bold text-lg text-gray-900 mb-3">🥛 Dairy Items</h3>
                      <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none hide-scrollbar gap-3 py-2 -mx-4 px-4">
                        {dairy.map(product => <ProductCard key={product.id} product={product} />)}
                      </div>
                    </section>

                    <section id="section-snacks" className="mb-6 scroll-mt-32">
                      <h3 className="font-bold text-lg text-gray-900 mb-3">🍿 Snacks & Juices</h3>
                      <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none hide-scrollbar gap-3 py-2 -mx-4 px-4">
                        {snacks.map(product => <ProductCard key={product.id} product={product} />)}
                      </div>
                    </section>

                    <section id="section-homecare" className="mb-6 scroll-mt-32">
                      <h3 className="font-bold text-lg text-gray-900 mb-3">🧼 Home Care & Cleaning</h3>
                      <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none hide-scrollbar gap-3 py-2 -mx-4 px-4">
                        {homecare.map(product => <ProductCard key={product.id} product={product} />)}
                      </div>
                    </section>
                  </>
                ) : (
                  <>
                    <section id="section-biryani" className="mb-6 scroll-mt-32">
                      <h3 className="font-bold text-lg text-gray-900 mb-3">🍚 Biryani Specialties</h3>
                      <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none hide-scrollbar gap-3 py-2 -mx-4 px-4">
                        {productsLoading ? (
                          Array(4).fill(0).map((_, i) => <Skeleton key={`skeleton-biry-${i}`} className="min-w-[130px] h-52 shrink-0 snap-start rounded-xl" />)
                        ) : (
                          biryani.map(product => <ProductCard key={product.id} product={product} />)
                        )}
                      </div>
                    </section>

                    <section id="section-fastfood" className="mb-6 scroll-mt-32">
                      <h3 className="font-bold text-lg text-gray-900 mb-3">🍔 Fast Food & Rolls</h3>
                      <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none hide-scrollbar gap-3 py-2 -mx-4 px-4">
                        {fastfood.map(product => <ProductCard key={product.id} product={product} />)}
                      </div>
                    </section>

                    <section id="section-bakery" className="mb-6 scroll-mt-32">
                      <h3 className="font-bold text-lg text-gray-900 mb-3">🥐 Bakery & Sweets</h3>
                      <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none hide-scrollbar gap-3 py-2 -mx-4 px-4">
                        {bakery.map(product => <ProductCard key={product.id} product={product} />)}
                      </div>
                    </section>
                  </>
                )}

                {/* ── All Products Feed (Grid) ── */}
                <section id="section-all-essentials" className="mb-4 scroll-mt-32">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg text-gray-900">
                      {activeContext === 'shopping' ? '🛒 All Essentials' : '🍽️ All Menu Items'}
                    </h3>
                  </div>
                  {productsLoading ? (
                    <div className="grid grid-cols-3 gap-2">
                      {Array(6).fill(0).map((_, i) => <Skeleton key={`skeleton-grid-${i}`} className="h-56 rounded-2xl" />)}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {deduplicatedAllEssentials.map(product => (
                        <ProductCard key={product.id} product={product} fullWidth />
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </div>
    </PullToRefresh>
  );
};
