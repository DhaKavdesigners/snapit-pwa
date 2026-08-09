import React from 'react';
import { Product } from '../types';
import { formatCurrency } from '../utils/currency';
import { useCartStore } from '../store/cartStore';
import { Plus, Minus } from 'lucide-react';
import { Button } from './ui/Button';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { items, addItem, updateQuantity } = useCartStore();
  const cartItem = items.find((i) => i.productId === product.id);
  const quantity = cartItem?.quantity || 0;

  return (
    <div className="flex flex-col bg-surface rounded-2xl p-3 shadow-md hover:scale-[1.02] transition-all duration-300 min-w-[140px] max-w-[160px] snap-start shrink-0">
      <div className="relative aspect-square mb-3 bg-white rounded-xl overflow-hidden">

        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-1 left-1 bg-white/90 backdrop-blur-sm text-[10px] px-1.5 py-0.5 rounded font-medium text-text-secondary">
          {product.deliveryEtaMinutes} min
        </div>
      </div>
      
      <h4 className="font-medium text-sm text-text-primary line-clamp-2 mb-1 min-h-[40px]">
        {product.name}
      </h4>
      
      <div className="mt-auto flex items-center justify-between">
        <span className="font-bold text-sm text-text-primary">
          {formatCurrency(product.price)}
        </span>
        
        {quantity > 0 ? (
          <div className="flex items-center bg-brand text-white rounded-full h-8 overflow-hidden">
            <button 
              onClick={() => updateQuantity(product.id, quantity - 1)}
              className="w-8 h-8 flex items-center justify-center active:bg-black/10 transition-colors"
              aria-label={`Decrease quantity of ${product.name}`}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium w-4 text-center">{quantity}</span>
            <button 
              onClick={() => updateQuantity(product.id, quantity + 1)}
              className="w-8 h-8 flex items-center justify-center active:bg-black/10 transition-colors"
              aria-label={`Increase quantity of ${product.name}`}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => addItem(product.id)}
            aria-label={`Add ${product.name} to cart`}
            className="border-brand text-brand hover:bg-brand/10 w-8 h-8 p-0 rounded-full"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
