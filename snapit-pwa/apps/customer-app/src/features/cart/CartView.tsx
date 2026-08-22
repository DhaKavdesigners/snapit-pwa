import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { mockShoppingProducts, mockFoodProducts } from '../../api/mockData';
import { formatCurrency } from '../../utils/currency';
import { Plus, Minus, ArrowRight, ShoppingBag, Sparkles, Clock, Zap, Store } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { motion } from 'framer-motion';

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
      <div className="p-4 h-full flex flex-col pt-16 pb-24 bg-gradient-to-b from-emerald-50/40 via-white to-gray-50 items-center justify-center min-h-[75vh]">
        <EmptyState 
          title="Your Cart is Empty" 
          description="Delicious meals and fresh groceries are waiting for you in KGF."
        />
        <div className="mt-8 px-4 flex justify-center w-full max-w-xs">
           <button 
             onClick={() => navigate('/')} 
             className="w-full h-13 py-3.5 bg-gradient-to-r from-emerald-600 to-brand text-white font-black rounded-2xl shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2"
           >
             <ShoppingBag className="w-4 h-4" />
             Explore Stores
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 flex flex-col relative pb-36">
      <div className="flex-1 p-4 pt-3">
        {/* Header with quick stats */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-2xl text-gray-900 tracking-tight flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-brand text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <ShoppingBag className="h-5 w-5" />
            </div>
            Your Cart
          </h2>
          <span className="text-xs font-black bg-emerald-100/70 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
            {cartItemsWithDetails.length} {cartItemsWithDetails.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>

        {/* ⚡ Lightning Delivery Promise Banner */}
        <div className="bg-gradient-to-r from-emerald-500 via-brand to-teal-600 text-white rounded-2xl p-3.5 shadow-md shadow-emerald-500/20 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <p className="text-xs font-black tracking-wide leading-tight">Instant 10-15 Min Delivery</p>
              <p className="text-[10px] text-emerald-100">Direct from local stores in KGF</p>
            </div>
          </div>
          <span className="text-[10px] font-black bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full uppercase tracking-wider">
            Superfast
          </span>
        </div>

        {/* Item Cards */}
        <div className="bg-white rounded-3xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-emerald-100/60 mb-6 flex flex-col gap-3.5">
          {cartItemsWithDetails.map((item) => (
            <motion.div 
              layout
              key={item.productId} 
              className="flex gap-3.5 p-3 rounded-2xl bg-gray-50/70 border border-gray-100 hover:border-emerald-200 transition-all"
            >
              <div className="w-18 h-18 w-16 h-16 rounded-xl bg-white p-1 border border-gray-100 overflow-hidden flex-shrink-0 shadow-xs">
                <img 
                  src={item.product!.imageUrl} 
                  alt={item.product!.name} 
                  className="w-full h-full object-cover rounded-lg" 
                  onError={(e) => { 
                    if (item.product!.fallbackImageUrl) (e.target as HTMLImageElement).src = item.product!.fallbackImageUrl; 
                  }} 
                />
              </div>
              
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <h4 className="font-bold text-sm text-gray-900 truncate leading-snug">{item.product!.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Store className="w-3 h-3 text-emerald-600" />
                    <span className="text-[11px] font-bold text-emerald-800 truncate">{item.product!.storeName || 'Local Store'}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100">
                  <span className="font-black text-sm text-brand font-mono">{formatCurrency(item.product!.price)}</span>
                  
                  {/* Quantity Stepper */}
                  <div className="flex items-center bg-white border border-emerald-200 rounded-full h-8 px-1 shadow-xs">
                    <button 
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)} 
                      className="w-6 h-6 flex items-center justify-center bg-gray-50 rounded-full text-emerald-800 hover:bg-gray-100 active:scale-95 transition-transform"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-black w-6 text-center text-gray-800">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)} 
                      className="w-6 h-6 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-brand rounded-full text-white shadow-xs active:scale-95 transition-transform"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>

      {/* ── Bill Summary (Fixed Footer) ── */}
      <div className="fixed bottom-14 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-xl px-4 py-3 border-t border-emerald-100/90 shadow-[0_-10px_30px_rgba(5,150,105,0.08)] z-40 rounded-t-3xl pb-4">
        <div className="bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/50 rounded-2xl px-4 py-2.5 border border-emerald-200/80 mb-3 space-y-1.5">
          <div className="flex justify-between text-xs text-gray-600 font-medium">
            <span>Item Subtotal</span>
            <span className="font-bold text-gray-900">{formatCurrency(itemTotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600 font-medium">
            <span>Delivery Fee</span>
            <span className="font-bold text-gray-900">{formatCurrency(deliveryFee)}</span>
          </div>
          <div className="border-t border-dashed border-emerald-200/80 pt-1.5 flex justify-between items-center">
            <span className="font-black text-sm text-gray-900">Total Due</span>
            <span className="font-black text-lg text-brand font-mono">{formatCurrency(total)}</span>
          </div>
        </div>

        <button
          className="w-full h-14 bg-gradient-to-r from-emerald-600 via-brand to-teal-600 text-white font-black text-sm rounded-2xl shadow-[0_10px_25px_rgba(5,150,105,0.4)] hover:shadow-[0_12px_30px_rgba(5,150,105,0.5)] active:scale-[0.98] transition-all flex items-center justify-between px-6 uppercase tracking-wider"
          onClick={() => navigate('/checkout')}
        >
          <span>Proceed to Checkout</span>
          <div className="flex items-center gap-2">
            <span className="font-mono">{formatCurrency(total)}</span>
            <ArrowRight className="h-5 w-5 animate-pulse" />
          </div>
        </button>
      </div>
    </div>
  );
};


