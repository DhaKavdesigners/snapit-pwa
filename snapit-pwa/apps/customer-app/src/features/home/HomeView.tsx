import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, RotateCcw, Zap, Tag } from 'lucide-react';
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

  // Generate unique search suggestions based on current query
  const rawSuggestions = [
    ...(products?.map(p => ({ type: 'Product', text: p.name })) || []),
    ...(stores?.map(s => ({ type: 'Store', text: s.name })) || []),
    ...(products?.map(p => ({ type: 'Category', text: p.subCategory || p.category })) || []),
  ];
  
  // Filter and deduplicate suggestions
  const suggestions = Array.from(new Map(
    rawSuggestions
      .filter(s => s.text?.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(s => [s.text, s])
  ).values()).slice(0, 5);
  const isSearching = searchQuery.trim().length > 0;

  // Quick category chips — context-aware
  const categories = activeContext === 'shopping'
    ? [
        { id: 'c1', name: 'Grocery',  emoji: '🛒', imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80' },
        { id: 'c2', name: 'Dairy',    emoji: '🥛', imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=200&q=80' },
        { id: 'c3', name: 'Snacks',   emoji: '🍿', imageUrl: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=200&q=80' },
        { id: 'c4', name: 'Home Care',emoji: '🧴', imageUrl: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=200&q=80' },
      ]
    : [
        { id: 'f1', name: 'Biryani',  emoji: '🍚', imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=200&q=80' },
        { id: 'f2', name: 'Burgers',  emoji: '🍔', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&q=80' },
        { id: 'f3', name: 'Shawarma', emoji: '🌯', imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=200&q=80' },
        { id: 'f4', name: 'Bakery',   emoji: '🥐', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=200&q=80' },
      ];

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
              // Search Results View
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
              // Regular Home View
              <>
                <BannerCarousel />

                {/* ── Quick Category Chips ── */}
                <div className="mb-6">
                  <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 hide-scrollbar">
                    {categories.map(c => (
                      <div key={c.id} className="flex flex-col items-center snap-start shrink-0 cursor-pointer group">
                        <div className="w-16 h-16 rounded-full overflow-hidden shadow-sm bg-white border border-gray-100 group-active:scale-95 transition-transform">
                          <img src={c.imageUrl} alt={c.name} className="object-cover w-full h-full" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 mt-2">{c.name}</span>
                      </div>
                    ))}
                    <div className="flex flex-col items-center snap-start shrink-0">
                      <Link
                        to="/explore"
                        className="w-16 h-16 rounded-full bg-white border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 active:scale-95 transition-transform shadow-sm"
                        aria-label="View all categories"
                      >
                        <Plus className="h-6 w-6" />
                      </Link>
                      <span className="text-xs font-semibold text-gray-700 mt-2">Explore</span>
                    </div>
                  </div>
                </div>


                {/* ── 🔥 Popular in Robertsonpet ── */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg text-gray-900">
                      🔥 Popular in Robertsonpet
                    </h3>
                  </div>
                  <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 hide-scrollbar -mx-4 px-4">
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
                    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 hide-scrollbar -mx-4 px-4">
                      {todaysLoading
                        ? Array(3).fill(0).map((_, i) => <Skeleton key={`skeleton-tp-${i}`} className="min-w-[150px] h-52 shrink-0 snap-start rounded-xl" />)
                        : todaysPicks?.map(product => <ProductCard key={product.id} product={product} />)
                      }
                    </div>
                  </div>
                )}

                {/* ── All Products Feed (Grid) ── */}
                <div className="mb-4">
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
                      {products?.map(product => (
                        <ProductCard key={product.id} product={product} fullWidth />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </PullToRefresh>
  );
};
