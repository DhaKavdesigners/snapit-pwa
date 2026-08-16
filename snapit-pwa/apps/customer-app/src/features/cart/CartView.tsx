import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { mockShoppingProducts, mockFoodProducts } from '../../api/mockData';
import { formatCurrency } from '../../utils/currency';
import { Button } from '../../components/ui/Button';
import { Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';

const allProducts = [...mockShoppingProducts, ...mockFoodProducts];

export const CartView: React.FC = () => {
  const { items, updateQuantity } = useCartStore();
  const navigate = useNavigate();

  const cartItemsWithDetails = items.map(item => ({
    ...item,
    product: allProducts.find(p => p.id === item.productId)
  })).filter(item => item.product !== undefined);

  const itemTotal   = cartItemsWithDetails.reduce((sum, item) => sum + (item.product!.price * item.quantity), 0);
  const deliveryFee = 3000; // ₹30
  const total       = itemTotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="p-4 h-full flex flex-col pt-12 pb-24 bg-gray-50">
        <EmptyState 
          title="Your cart is empty" 
          description="Looks like you haven't added anything yet."
        />
        <div className="mt-8 px-4 flex justify-center">
           <Button onClick={() => navigate('/')} className="px-8 shadow-md">Browse Products</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pt-4 pb-32 h-full overflow-y-auto bg-gray-50 flex flex-col">
      <h2 className="font-bold text-2xl text-text-primary mb-6 flex items-center gap-2">
        <ShoppingBag className="h-6 w-6 text-brand" />
        Your Cart
      </h2>

      <div className="bg-white rounded-3xl p-4 shadow-sm mb-6 flex flex-col gap-4">
        {cartItemsWithDetails.map((item) => (
          <div key={item.productId} className="flex gap-4 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
            <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
              <img src={item.product!.imageUrl} alt={item.product!.name} className="w-full h-full object-cover" onError={(e) => { if (item.product!.fallbackImageUrl) (e.target as HTMLImageElement).src = item.product!.fallbackImageUrl; }} />
            </div>
            
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-semibold text-sm text-text-primary line-clamp-1">{item.product!.name}</h4>
                <p className="text-[11px] text-text-secondary">{item.product!.storeName || 'Store'}</p>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-sm">{formatCurrency(item.product!.price)}</span>
                
                <div className="flex items-center bg-gray-100 rounded-full h-8 px-1">
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-full shadow-sm text-brand active:scale-95 transition-transform">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center bg-brand rounded-full shadow-sm text-white active:scale-95 transition-transform">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bill Summary (transparent, no zero rows) ── */}
      <div className="mt-auto">
        <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-3">Bill Summary</h3>
          <div className="flex justify-between text-sm mb-2.5">
            <span className="text-text-secondary">Subtotal</span>
            <span className="font-semibold text-text-primary">{formatCurrency(itemTotal)}</span>
          </div>
          <div className="flex justify-between text-sm mb-3">
            <span className="text-text-secondary">Delivery</span>
            <span className="font-semibold text-text-primary">{formatCurrency(deliveryFee)}</span>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span className="text-text-secondary">Taxes & fees</span>
            <span className="font-semibold text-text-primary">{formatCurrency(0)}</span>
          </div>
          <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between">
            <span className="font-black text-base text-text-primary">To Pay</span>
            <span className="font-black text-base text-text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        <Button
          className="w-full h-14 text-base font-bold shadow-[0_8px_16px_rgba(4,107,53,0.3)] hover:scale-[1.01] transition-transform flex items-center justify-between px-6 bg-brand"
          onClick={() => navigate('/checkout')}
        >
          <span>Proceed to Checkout</span>
          <div className="flex items-center gap-2">
            <span>{formatCurrency(total)}</span>
            <ArrowRight className="h-5 w-5" />
          </div>
        </Button>
      </div>
    </div>
  );
};


