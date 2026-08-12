import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { ContextToggle } from './ContextToggle';
import { BannerCarousel } from './BannerCarousel';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProductCard } from '../../components/ProductCard';
import { StoreCard } from '../../components/StoreCard';
import { useProducts, useStores, useTrending } from '../../api/queries';
import { useContextStore } from '../../store/contextStore';

export const HomeView: React.FC = () => {
  const { activeContext } = useContextStore();

  const { data: stores, isLoading: storesLoading, error: storesError, refetch: refetchStores } = useStores(activeContext);
  const { data: products, isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useProducts(activeContext);
  const { data: trending, isLoading: trendingLoading, error: trendingError, refetch: refetchTrending } = useTrending(activeContext);

  const handleRefresh = async () => {
    await Promise.all([refetchStores(), refetchProducts(), refetchTrending()]);
  };

  const isLoading = storesLoading || productsLoading || trendingLoading;
  const isError = storesError || productsError || trendingError;
  const isEmpty = !isLoading && !isError && (!stores?.length && !products?.length);

  // Quick category chips — context-aware
  const categories = activeContext === 'shopping'
    ? [
        { id: 'c1', name: 'Grocery',  emoji: '🛒', imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80' },
        { id: 'c2', name: 'Dairy',    emoji: '🥛', imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=200&q=80' },
        { id: 'c3', name: 'Snacks',   emoji: '🍿', imageUrl: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=200&q=80' },
        { id: 'c4', name: 'Spices',   emoji: '🌶️', imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=200&q=80' },
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
        <SearchBar />
        <ContextToggle />

        {isError && <ErrorState onRetry={handleRefresh} />}
        {isEmpty && <EmptyState title="Nothing here yet" description="Check back later or try switching context." />}

        {(!isError && !isEmpty) && (
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
                  <span className="text-xs font-semibold text-gray-700 mt-2">More</span>
                </div>
              </div>
            </div>

            {/* ── Trending Near You ── */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg text-gray-900">Trending Near You 🔥</h3>
              </div>
              <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 hide-scrollbar -mx-4 px-4">
                {isLoading
                  ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="min-w-[148px] h-52 shrink-0 snap-start rounded-2xl" />)
                  : trending?.map(product => <ProductCard key={product.id} product={product} />)
                }
              </div>
            </div>

            {/* ── Popular Stores ── */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg text-gray-900">Popular Stores</h3>
                <Link to="/explore" className="text-sm font-bold text-brand">See all</Link>
              </div>
              <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 hide-scrollbar -mx-4 px-4">
                {isLoading
                  ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="min-w-[100px] h-28 shrink-0 snap-start rounded-2xl" />)
                  : stores?.map(store => <StoreCard key={store.id} store={store} />)
                }
              </div>
            </div>

            {/* ── All Products Feed (2-col grid, scrolls naturally) ── */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg text-gray-900">
                  {activeContext === 'shopping' ? '🛒 All Essentials' : '🍽️ All Menu Items'}
                </h3>
              </div>
              {isLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {products?.map(product => (
                    <ProductCard key={product.id} product={product} fullWidth />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PullToRefresh>
  );
};
