import React from 'react';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProductCard } from '../../components/ProductCard';
import { useFavoritesStore } from '../../store/favoritesStore';
import { mockShoppingProducts, mockFoodProducts } from '../../api/mockData';
import { Heart } from 'lucide-react';

const allProducts = [...mockShoppingProducts, ...mockFoodProducts];

export const FavoritesView: React.FC = () => {
  const { favoriteIds } = useFavoritesStore();
  const favoritedProducts = allProducts.filter((p) => favoriteIds.includes(p.id));

  return (
    <div className="p-4 pt-6 pb-28 h-full overflow-y-auto bg-gray-50">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="h-6 w-6 text-red-500 fill-red-500" />
        <h2 className="font-bold text-2xl text-gray-900">Your Favourites</h2>
      </div>

      {favoritedProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-16 text-center px-6">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-5">
            <Heart className="h-10 w-10 text-red-300" />
          </div>
          <h3 className="font-bold text-xl text-gray-900 mb-2">No Favourites Yet</h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            Tap the <span className="text-red-500">♥</span> icon on any product to save it here for quick access.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {favoritedProducts.map((product) => (
            <ProductCard key={product.id} product={product} fullWidth />
          ))}
        </div>
      )}
    </div>
  );
};
