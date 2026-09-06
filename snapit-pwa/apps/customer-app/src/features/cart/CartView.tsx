import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { mockShoppingProducts, mockFoodProducts } from '../../api/mockData';
import { useAllProducts } from '../../api/queries';
import { formatCurrency } from '../../utils/currency';
import { Plus, Minus, ArrowRight, ShoppingBag, Sparkles, Clock, Zap, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateDeliveryFee } from '../../../../../common_logic/deliveryLogic';

export const CartView: React.FC = () => {
  const { items, updateQuantity } = useCartStore();
  const { data: allProducts = [...mockShoppingProducts, ...mockFoodProducts] } = useAllProducts();
  const navigate = useNavigate();

  const cartItemsWithDetails = items.map(item => ({
    ...item,
    product: allProducts.find(p => p.id === item.productId)
  })).filter(item => item.product !== undefined);

  const itemTotal   = cartItemsWithDetails.reduce((sum, item) => sum + (item.product!.price * item.quantity), 0);
  const deliveryFee = calculateDeliveryFee({ subtotalRupees: itemTotal / 100 }).feePaise;
  const total       = itemTotal + deliveryFee;

  // ── Empty Cart — Baby Mascot Hero ─────────────────────────
  if (items.length === 0) {
    return (
      <div className="flex flex-col min-h-[80vh] bg-gradient-to-b from-emerald-50/60 via-white to-gray-50 items-center justify-center px-6 pb-28 pt-10">
        {/* Baby waiting illustration */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.1 }}
          className="relative w-52 h-52 mb-6"
        >
          <img
            src="/baby/empty_wating.jpg"
            alt="Baby waiting with empty basket"
            className="w-full h-full object-contain drop-shadow-xl"
          />
          {/* Floating speech bubble */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 380 }}
            className="absolute -top-2 -right-4 bg-white rounded-2xl rounded-br-sm px-3 py-1.5 shadow-lg border border-emerald-100"
          >
            <p className="text-[11px] font-black text-emerald-700 whitespace-nowrap">Let's shop, Mama! 🛒</p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-center"
        >
          <h2 className="font-black text-2xl text-gray-900 tracking-tight mb-2">Your basket is empty</h2>
          <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-[240px] mx-auto">
            She's patiently waiting to carry your groceries 💚
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/')}
          className="mt-8 flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-brand text-white font-black text-sm px-7 py-4 rounded-2xl shadow-lg shadow-emerald-500/30 uppercase tracking-wider"
        >
          <ShoppingBag className="w-4 h-4" />
          Explore Stores
        </motion.button>
      </div>
    );
  }

  const hasOfflineItems = cartItemsWithDetails.some(item => item.product?.storeIsOpen === false);
  const isReadyForCheckout = cartItemsWithDetails.length >= 3;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 flex flex-col relative pb-36">
      <div className="flex-1 p-4 pt-3">
        {/* ── Ready-to-checkout baby banner — appears when cart has 3+ items */}
        <AnimatePresence>
          {isReadyForCheckout && (
            <motion.div
              key="ready-banner"
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 340, damping: 24 }}
              className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl px-4 py-3 mb-4 shadow-sm overflow-hidden relative"
            >
              <img
                src="/baby/ready_to_checkout.jpg"
                alt="Ready to checkout"
                className="w-14 h-14 object-contain object-bottom shrink-0 -mb-3"
              />
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-emerald-900">All set! She's ready 🎉</p>
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Basket is packed — checkout when you are!</p>
              </div>
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>

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

        {/* ⚠️ Store Offline Alert if any item is from a closed store */}
        {hasOfflineItems && (
          <div className="bg-red-50 border border-red-200/90 text-red-900 rounded-2xl p-3.5 mb-4 text-xs font-bold flex items-center gap-2.5 shadow-xs">
            <span className="text-base shrink-0">⚠️</span>
            <span>Some items belong to a store that is currently closed. Please remove them to proceed.</span>
          </div>
        )}

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
          {cartItemsWithDetails.map((item) => {
            const isItemStoreClosed = item.product?.storeIsOpen === false;
            const stock = item.product!.stockCount !== undefined ? item.product!.stockCount : 99;
            const isLowStock = stock > 0 && stock <= 5;
            const isMaxReached = item.quantity >= stock;
            const isExceedingStock = item.quantity > stock;

            return (
              <motion.div 
                key={item.productId}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex gap-3.5 items-center p-2.5 rounded-2xl border transition-all ${
                  isItemStoreClosed 
                    ? 'bg-red-50/50 border-red-200 opacity-80' 
                    : isExceedingStock
                      ? 'bg-amber-50/60 border-amber-300'
                      : 'bg-gray-50/50 border-gray-100/80'
                }`}
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-100 shrink-0">
                  <img 
                    src={item.product!.imageUrl} 
                    alt={item.product!.name} 
                    className={`w-full h-full object-cover ${isItemStoreClosed ? 'grayscale-[80%]' : ''}`} 
                  />
                  {isItemStoreClosed && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[8px] font-black text-white uppercase tracking-wider">
                      Closed
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${isItemStoreClosed ? 'text-red-600' : 'text-emerald-700'}`}>
                      {item.product!.storeName || 'Minnit Store'}
                    </span>
                    {isItemStoreClosed ? (
                      <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase">Offline</span>
                    ) : isLowStock ? (
                      <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase">Only {stock} left!</span>
                    ) : null}
                  </div>
                  <h4 className="font-bold text-xs text-gray-900 truncate">{item.product!.name}</h4>
                  
                  {isExceedingStock && (
                    <p className="text-[9.5px] font-bold text-amber-700 mt-0.5">
                      ⚠️ Max stock is {stock} items
                    </p>
                  )}

                  <div className="font-mono font-black text-xs text-gray-900 mt-1">
                    {formatCurrency(item.product!.price * item.quantity)}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center bg-white border border-emerald-200/80 rounded-xl h-8 overflow-hidden shadow-xs">
                    <button 
                      onClick={() => updateQuantity(item.productId, item.quantity - 1, stock)}
                      className="w-7 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-mono font-black text-xs w-4 text-center text-gray-900">{item.quantity}</span>
                    <button 
                      onClick={() => {
                        if (!isMaxReached && !isItemStoreClosed) {
                          updateQuantity(item.productId, item.quantity + 1, stock);
                        }
                      }}
                      disabled={isItemStoreClosed || isMaxReached}
                      className={`w-7 h-8 flex items-center justify-center transition-colors ${
                        isItemStoreClosed || isMaxReached 
                          ? 'text-gray-300 cursor-not-allowed bg-gray-50' 
                          : 'text-brand hover:bg-emerald-50 active:bg-emerald-100'
                      }`}
                      title={isMaxReached ? `Only ${stock} available in stock` : undefined}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
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
          disabled={hasOfflineItems}
          className={`w-full h-14 font-black text-sm rounded-2xl transition-all flex items-center justify-between px-6 uppercase tracking-wider ${
            hasOfflineItems 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-emerald-600 via-brand to-teal-600 text-white shadow-[0_10px_25px_rgba(5,150,105,0.4)] hover:shadow-[0_12px_30px_rgba(5,150,105,0.5)] active:scale-[0.98]'
          }`}
          onClick={() => !hasOfflineItems && navigate('/checkout')}
        >
          <span>{hasOfflineItems ? 'Store is Offline' : 'Proceed to Checkout'}</span>
          <div className="flex items-center gap-2">
            <span className="font-mono">{formatCurrency(total)}</span>
            {!hasOfflineItems && <ArrowRight className="h-5 w-5 animate-pulse" />}
          </div>
        </button>
      </div>
    </div>
  );
};
