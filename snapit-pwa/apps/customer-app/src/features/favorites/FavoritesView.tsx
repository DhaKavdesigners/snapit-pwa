import React from 'react';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProductCard } from '../../components/ProductCard';
import { mockShoppingProducts } from '../../api/mockData';

export const FavoritesView: React.FC = () => {
  // Simulating saved items being present or not
  // For the prompt, we are asked to show 2 mock ProductCards if items exist.
  // We'll just display them directly to fulfill the requirement, but also have the EmptyState ready.
  const hasFavorites = true; 
  const mockFavorites = [mockShoppingProducts[0], mockShoppingProducts[1]];

  return (
    <div className="p-4 pt-4 pb-24 h-full overflow-y-auto">
      <h2 className="font-bold text-2xl text-text-primary mb-6">Your Favorites</h2>
      
      {!hasFavorites ? (
        <EmptyState 
          title="No Favorites" 
          description="You haven't saved any items yet."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {mockFavorites.map(product => (
            <div key={product.id} className="w-full max-w-full [&>div]:w-full [&>div]:max-w-full">
              {/* Wrapping ProductCard to force it to stretch in the grid rather than keeping its min-w/max-w limits */}
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
