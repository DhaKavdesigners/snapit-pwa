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
    await Promise.all([
      refetchStores(),
      refetchProducts(),
      refetchTrending()
    ]);
  };

  const isLoading = storesLoading || productsLoading || trendingLoading;
  const isError = storesError || productsError || trendingError;
  const isEmpty = !isLoading && !isError && (!stores?.length && !products?.length);

  // Define categories based on context (mock)
  const categories = activeContext === 'shopping' 
    ? [
        { id: 'c1', name: 'Grocery', imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80' }, 
        { id: 'c2', name: 'Bakery', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=200&q=80' }, 
        { id: 'c3', name: 'Meat', imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=200&q=80' }, 
        { id: 'c4', name: 'Snacks', imageUrl: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=200&q=80' }
      ]
    : [
        { id: 'f1', name: 'Pizza', imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=200&q=80' }, 
        { id: 'f2', name: 'Burger', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&q=80' }, 
        { id: 'f3', name: 'Biryani', imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=200&q=80' }, 
        { id: 'f4', name: 'Healthy', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=200&q=80' }
      ];

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="p-4 pt-2">
        <SearchBar />
        <ContextToggle />
        
        {isError && <ErrorState onRetry={handleRefresh} />}
        {isEmpty && <EmptyState title="Nothing here yet" description="Check back later or try switching context." />}
        
        {(!isError && !isEmpty) && (
          <>
            <BannerCarousel />
            
            {/* Quick Categories */}
            <div className="mb-6">
              <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 hide-scrollbar">
                {categories.map(c => (
                  <div key={c.id} className="flex flex-col items-center snap-start shrink-0">
                    <div className="w-16 h-16 rounded-full overflow-hidden shadow-sm bg-surface">
                      <img src={c.imageUrl} alt={c.name} className="object-cover w-full h-full" />
                    </div>
                    <span className="text-xs font-medium text-text-primary mt-2">{c.name}</span>
                  </div>
                ))}
                <div className="flex flex-col items-center snap-start shrink-0">
                  <Link 
                    to="/explore" 
                    className="w-16 h-16 rounded-full bg-surface border-2 border-dashed border-gray-300 flex items-center justify-center text-text-secondary active:scale-95 transition-transform shadow-sm"
                    aria-label="View all categories"
                  >
                    <Plus className="h-6 w-6" />
                  </Link>
                  <span className="text-xs font-medium text-text-primary mt-2">More</span>
                </div>
              </div>
            </div>

            {/* Trending Section */}
            <div className="mb-6">
              <h3 className="font-bold text-lg text-text-primary mb-3">Trending Near You</h3>
              <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 hide-scrollbar -mx-4 px-4">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => <Skeleton key={i} className="min-w-[140px] h-48 shrink-0 snap-start" />)
                ) : (
                  trending?.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))
                )}
              </div>
            </div>

            {/* Popular Stores */}
            <div className="mb-6">
              <h3 className="font-bold text-lg text-text-primary mb-3">Popular Stores</h3>
              <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 hide-scrollbar -mx-4 px-4">
                {isLoading ? (
                  Array(4).fill(0).map((_, i) => <Skeleton key={i} className="min-w-[100px] h-24 shrink-0 snap-start" />)
                ) : (
                  stores?.map(store => (
                    <StoreCard key={store.id} store={store} />
                  ))
                )}
              </div>
            </div>

            {/* Daily Essentials (Reusing products) */}
            <div className="mb-4">
              <h3 className="font-bold text-lg text-text-primary mb-3">Daily Essentials</h3>
              <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 hide-scrollbar -mx-4 px-4">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => <Skeleton key={i} className="min-w-[140px] h-48 shrink-0 snap-start" />)
                ) : (
                  products?.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </PullToRefresh>
  );
};
