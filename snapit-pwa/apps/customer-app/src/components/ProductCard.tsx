import React, { useState } from 'react';
import { Product } from '../types';
import { formatCurrency } from '../utils/currency';
import { useCartStore } from '../store/cartStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { Plus, Minus, Heart } from 'lucide-react';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
  /** When true the card stretches to fill its container (used in grid layouts) */
  fullWidth?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, fullWidth = false }) => {
  const { items, addItem, updateQuantity } = useCartStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const cartItem = items.find((i) => i.productId === product.id);
  const quantity = cartItem?.quantity || 0;
  const [imgSrc, setImgSrc] = useState(product.imageUrl);

  const stock = product.stockCount !== undefined ? product.stockCount : 99;
  const isStoreClosed = product.storeIsOpen === false;
  const isOutOfStock = !product.inStock || stock <= 0;
  const isAvailable = !isStoreClosed && !isOutOfStock;
  const isLowStock = isAvailable && stock > 0 && stock <= 3;
  const isReachedMax = quantity >= stock;

  const handleImgError = () => {
    if (product.fallbackImageUrl && imgSrc !== product.fallbackImageUrl) {
      setImgSrc(product.fallbackImageUrl);
    }
  };

  return (
    <motion.div
      whileHover={isAvailable ? { scale: 1.02, y: -4, boxShadow: '0px 12px 24px rgba(5, 150, 105, 0.2)' } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`flex flex-col rounded-2xl shadow-sm border overflow-hidden transition-all relative ${
        fullWidth ? 'w-full' : 'min-w-[110px] max-w-[130px] snap-start shrink-0'
      } ${
        !isAvailable 
          ? 'bg-slate-50/95 border-gray-200 opacity-70 grayscale-[70%]' 
          : isLowStock
            ? 'bg-white border-amber-200 ring-1 ring-amber-300/40 shadow-amber-500/5'
            : 'bg-white border-gray-100'
      }`}
    >
      {/* Image area */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <img
          src={imgSrc}
          alt={product.name}
          onError={handleImgError}
          className={`w-full h-full object-cover ${!isAvailable ? 'contrast-90 brightness-95' : ''}`}
        />

        {/* Store Offline / Unavailable / Low-Stock Badge Overlay */}
        {isStoreClosed ? (
          <div className="absolute top-1.5 left-1.5 bg-red-600/95 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm backdrop-blur-xs">
            Store Offline
          </div>
        ) : isOutOfStock ? (
          <div className="absolute top-1.5 left-1.5 bg-gray-800/90 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm backdrop-blur-xs">
            Out of Stock
          </div>
        ) : isLowStock ? (
          <div className="absolute bottom-1.5 left-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider shadow-md flex items-center gap-1 animate-pulse">
            <span>🔥</span>
            <span>Only {stock} Left!</span>
          </div>
        ) : (
          /* ETA Badge */
          <div className="absolute bottom-1.5 left-1.5 bg-white/90 backdrop-blur-sm text-[9px] px-1.5 py-0.5 rounded-full font-bold text-gray-600 shadow-sm">
            {product.deliveryEtaMinutes} min
          </div>
        )}

        {/* Favourite Heart */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          aria-label={isFavorite(product.id) ? `Remove ${product.name} from favourites` : `Add ${product.name} to favourites`}
          className="absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-sm active:scale-90 transition-transform z-10"
        >
          <Heart
            className={`h-3.5 w-3.5 transition-colors ${
              isFavorite(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'
            }`}
          />
        </button>
      </div>

      {/* Info area */}
      <div className="flex flex-col flex-1 p-2 gap-0.5">
        <div className="flex items-center justify-between">
          {product.storeName && (
            <span className={`text-[9px] font-bold uppercase tracking-wide truncate ${isStoreClosed ? 'text-gray-400' : 'text-brand'}`}>
              {product.storeName}
            </span>
          )}
        </div>

        <h4 className={`font-medium text-xs leading-tight line-clamp-2 min-h-[32px] ${!isAvailable ? 'text-gray-600' : 'text-gray-900'}`}>
          {product.name}
        </h4>

        {isLowStock ? (
          <p className="text-[9.5px] font-black text-amber-700 flex items-center gap-0.5 mt-0.5">
            <span>⚡</span>
            <span>Only {stock} left • Order soon</span>
          </p>
        ) : product.description ? (
          <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{product.description}</p>
        ) : null}

        {/* Price + Add/Qty */}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className={`font-bold text-xs ${!isAvailable ? 'text-gray-500' : 'text-gray-900'}`}>
            {formatCurrency(product.price)}
          </span>

          {!isAvailable ? (
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider select-none ${
              isStoreClosed ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-gray-100 text-gray-500 border border-gray-200'
            }`}>
              {isStoreClosed ? 'Offline' : 'Unavailable'}
            </span>
          ) : quantity > 0 ? (
            <div className="flex items-center bg-brand text-white rounded-full h-7 overflow-hidden shadow-[0_4px_12px_rgba(4,107,53,0.3)]">
              <button
                onClick={() => updateQuantity(product.id, quantity - 1, stock)}
                className="w-7 h-7 flex items-center justify-center active:bg-black/10 transition-colors"
                aria-label={`Decrease quantity of ${product.name}`}
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-[11px] font-bold w-3 text-center">{quantity}</span>
              <button
                onClick={() => {
                  if (!isReachedMax) {
                    updateQuantity(product.id, quantity + 1, stock);
                  }
                }}
                disabled={isReachedMax}
                className={`w-7 h-7 flex items-center justify-center transition-colors ${
                  isReachedMax ? 'opacity-40 cursor-not-allowed bg-black/20' : 'active:bg-black/10'
                }`}
                title={isReachedMax ? `Max available stock reached (${stock})` : undefined}
                aria-label={`Increase quantity of ${product.name}`}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => addItem(product.id, stock)}
              aria-label={`Add ${product.name} to cart`}
              className="border-brand text-brand hover:bg-brand hover:text-white w-7 h-7 p-0 rounded-full transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
