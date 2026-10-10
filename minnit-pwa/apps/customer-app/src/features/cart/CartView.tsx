import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useContextStore } from '../../store/contextStore';
import { useAuthStore } from '../../store/authStore';
import { mockShoppingProducts, mockFoodProducts } from '../../api/mockData';
import { useAllProducts } from '../../api/queries';
import { formatCurrency } from '../../utils/currency';
import { Plus, Minus, ArrowRight, ShoppingBag, Sparkles, Clock, Store, UtensilsCrossed, Lock, MapPin, Zap, Tag, ChevronUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateDeliveryFee } from '../../../../../common_logic/deliveryLogic';

export const CartView: React.FC = () => {
  const { items, updateQuantity } = useCartStore();
  const { activeContext, setContext } = useContextStore();
  const { isLoggedIn, userProfile } = useAuthStore();
  const { data: allProducts = [...mockShoppingProducts, ...mockFoodProducts] } = useAllProducts();
  const navigate = useNavigate();

  // Modal and Coupon states
  const [isBillModalOpen, setIsBillModalOpen] = React.useState(false);
  const [isCouponInputOpen, setIsCouponInputOpen] = React.useState(false);
  const [couponCode, setCouponCode] = React.useState('');
  const [couponError, setCouponError] = React.useState('');

  const isRegistered = isLoggedIn && !!userProfile;

  const cartItemsWithDetails = items.map(item => ({
    ...item,
    product: allProducts.find(p => p.id === item.productId)
  })).filter(item => item.product !== undefined);

  const itemTotal   = cartItemsWithDetails.reduce((sum, item) => sum + (item.product!.price * item.quantity), 0);
  const deliveryFee = calculateDeliveryFee({ subtotalRupees: itemTotal / 100 }).feePaise;
  const total       = itemTotal + deliveryFee;

  // Detect food mode: context is food OR any item in cart belongs to a food store (storeId starts with 'f')
  const isFoodMode = activeContext === 'food' ||
    cartItemsWithDetails.some(item => (item.product?.storeId || '').startsWith('f'));

  // ── Empty Cart — Clean Context-Aware Mascot Hero ──────────────────────────
  if (items.length === 0) {
    return (
      <div className="flex-1 w-full min-h-[70vh] flex flex-col justify-center items-center px-4 py-8 bg-gradient-to-b from-emerald-50/50 via-white to-gray-50 select-none">
        <div className="flex flex-col items-center justify-center w-full max-w-sm py-4">
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="relative h-[210px] max-h-[210px] aspect-[159/250] mb-4 flex items-center justify-center"
          >
            <img
              src={isFoodMode ? '/baby/boy_waiting_for_food.jpg' : '/baby/empty_wating.jpg'}
              alt={isFoodMode ? 'Momo waiting for food order' : 'Catie waiting with empty basket'}
              className="h-full w-auto object-contain drop-shadow-sm"
            />
            {/* Floating speech bubble */}
            <div className="absolute -top-1.5 -right-3 bg-white rounded-xl px-2.5 py-1 shadow-2xs border border-emerald-100 z-10">
              <p className="text-[10.5px] font-black text-emerald-700 whitespace-nowrap">
                {isFoodMode ? 'What shall we eat? 🍔' : "Let's go shopping! 🛒"}
              </p>
            </div>
          </motion.div>

          <div className="text-center mb-5">
            <h2 className="font-black text-xl text-gray-900 tracking-tight leading-tight">
              {isFoodMode ? 'No food ordered yet' : 'Your basket is empty'}
            </h2>
            <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[260px] mx-auto mt-1">
              {isFoodMode
                ? 'Momo is hungry and waiting for your order! 🍽️'
                : 'Catie is patiently waiting to fill the basket 💚'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isFoodMode) setContext('food');
              else setContext('shopping');
              navigate('/');
            }}
            className="flex items-center gap-2 bg-[#059669] hover:bg-emerald-700 text-white font-black text-xs px-8 py-3 rounded-xl shadow-sm uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
          >
            {isFoodMode ? <UtensilsCrossed className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
            {isFoodMode ? 'Browse Food' : 'Explore Stores'}
          </button>
        </div>
      </div>
    );
  }

  const hasOfflineItems = cartItemsWithDetails.some(item => item.product?.storeIsOpen === false);
  const isReadyForCheckout = cartItemsWithDetails.length >= 3;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 flex flex-col relative pb-44">
      <div className="flex-1 p-4 pt-3">
        {/* ── Ready-to-checkout banner — Catie or Momo based on context */}
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
                src={isFoodMode ? '/baby/boy_ready_to_checkout.jpg' : '/baby/ready_to_checkout.jpg'}
                alt="Ready to checkout"
                className="w-14 h-14 object-contain object-bottom shrink-0 -mb-3"
              />
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-emerald-900">
                  {isFoodMode ? 'All set! Momo says order up! 🎉' : 'All set! Basket is packed! 🎉'}
                </p>
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  {isFoodMode ? 'Your feast is ready — checkout now!' : 'Ready to go — checkout when you are!'}
                </p>
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

        {/* 🛍️ Direct Local Store Delivery Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-3.5 shadow-md shadow-emerald-600/15 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Store className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <p className="text-xs font-black tracking-wide leading-tight">Direct Local Store Delivery</p>
              <p className="text-[10px] text-emerald-100 font-medium">Freshly picked & delivered from verified KGF stores</p>
            </div>
          </div>
          <span className="text-[10px] font-black bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full uppercase tracking-wider">
            Local Drop
          </span>
        </div>

        {/* Item Cards (Appropriately compact sizing) */}
        <div className="bg-white rounded-3xl p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-emerald-100/60 mb-3.5 flex flex-col gap-2.5">
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
                className={`flex gap-3 items-center p-2 rounded-2xl border transition-all ${
                  isItemStoreClosed 
                    ? 'bg-red-50/50 border-red-200 opacity-80' 
                    : isExceedingStock
                      ? 'bg-amber-50/60 border-amber-300'
                      : 'bg-gray-50/50 border-gray-100/80'
                }`}
              >
                <div className="relative w-16 h-16 min-w-[64px] max-w-[64px] h-[64px] rounded-2xl overflow-hidden bg-white border border-gray-100 shrink-0 flex items-center justify-center">
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

                <div className="flex-1 min-w-0 pr-1">
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
                  <h4 className="font-bold text-xs text-gray-900 truncate leading-snug">{item.product!.name}</h4>
                  
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
                  <div className="flex items-center bg-white border border-emerald-200/80 rounded-xl h-8 overflow-hidden shadow-2xs">
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

        {/* ── Interactive Coupon Code Card ── */}
        {!isCouponInputOpen ? (
          <div 
            onClick={() => setIsCouponInputOpen(true)}
            className="bg-white rounded-2xl p-3 border border-emerald-100 shadow-2xs flex items-center justify-between cursor-pointer hover:border-emerald-300 transition-all mb-4 select-none"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Tag className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-gray-800 truncate">Have a coupon code?</span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsCouponInputOpen(true); }}
              className="text-xs font-black text-brand uppercase tracking-wider bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-xl cursor-pointer transition-colors shrink-0"
            >
              Apply
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-3 border border-emerald-200 shadow-sm mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-brand" />
                Enter Coupon Code
              </span>
              <button 
                type="button" 
                onClick={() => { setIsCouponInputOpen(false); setCouponError(''); }}
                className="text-[11px] font-bold text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                Cancel
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  if (couponError) setCouponError('');
                }}
                placeholder="e.g. MINNIT50"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-900 focus:outline-none focus:border-brand focus:bg-white"
              />
              <button
                type="button"
                onClick={() => {
                  const clean = couponCode.trim();
                  if (!clean) {
                    setCouponError('Please enter a coupon code.');
                    return;
                  }
                  setCouponError(`Coupon code "${clean}" is invalid or expired.`);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer uppercase tracking-wider shrink-0"
              >
                Apply
              </button>
            </div>
            {couponError && (
              <p className="text-[10.5px] font-bold text-red-600 leading-tight">
                {couponError}
              </p>
            )}
          </div>
        )}

      </div>

      {/* ── Sticky Bottom Checkout Bar (With Stuck Bill Summary & View Bill CTA) ── */}
      <div className="fixed bottom-14 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-xl px-4 py-3 border-t border-emerald-100/90 shadow-[0_-10px_30px_rgba(5,150,105,0.08)] z-40 rounded-t-3xl pb-4">
        
        {/* Stuck Bill Summary Header Line */}
        <div className="flex items-center justify-between px-1 py-1 mb-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">To Pay</span>
            <span className="font-mono font-black text-base text-gray-900 leading-tight">{formatCurrency(total)}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsBillModalOpen(true)}
            className="text-[11px] font-black text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/90 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer shadow-2xs"
          >
            <span>View Detailed Bill</span>
            <ChevronUp className="w-3.5 h-3.5 text-emerald-600" />
          </button>
        </div>

        {/* Where should we deliver prompt with direct Sign Up option */}
        {!isRegistered && (
          <div 
            onClick={() => navigate('/profile?redirect=/cart')}
            className="flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-50 via-white to-teal-50 border border-emerald-200/90 rounded-2xl px-4 py-2.5 mb-2.5 shadow-2xs cursor-pointer hover:border-emerald-300 transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-emerald-950 leading-tight">Where should we deliver?</p>
                <p className="text-[10px] text-emerald-700 font-medium leading-tight mt-0.5">Quick address setup to receive your order</p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); navigate('/profile?redirect=/cart'); }}
              className="bg-emerald-600 text-white text-[11px] font-black px-3.5 py-1.5 rounded-xl uppercase tracking-wider shrink-0 shadow-2xs hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              Sign Up
            </button>
          </div>
        )}

        <button
          disabled={hasOfflineItems}
          className={`w-full h-14 font-black text-sm rounded-2xl transition-all flex items-center justify-between px-6 uppercase tracking-wider ${
            hasOfflineItems 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-emerald-600 via-brand to-teal-600 text-white shadow-[0_10px_25px_rgba(5,150,105,0.4)] hover:shadow-[0_12px_30px_rgba(5,150,105,0.5)] active:scale-[0.98] cursor-pointer'
          }`}
          onClick={() => {
            if (hasOfflineItems) return;
            if (!isRegistered) {
              navigate('/profile?redirect=/cart');
            } else {
              navigate('/checkout');
            }
          }}
        >
          <span>
            {hasOfflineItems 
              ? 'Store is Offline' 
              : !isRegistered 
                ? 'Add Delivery Address & Order' 
                : 'Proceed to Checkout'}
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono">{formatCurrency(total)}</span>
            {!hasOfflineItems && <ArrowRight className="h-5 w-5 animate-pulse" />}
          </div>
        </button>
      </div>

      {/* ── Bill Details Popup Sheet ── */}
      <AnimatePresence>
        {isBillModalOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ y: "100%", opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="bg-white w-full max-w-md mx-auto rounded-t-3xl overflow-hidden shadow-2xl flex flex-col p-5 border-t border-emerald-100"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Zap className="w-4 h-4 fill-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-gray-900 leading-tight">Bill Details</h3>
                    <span className="text-[10px] font-bold text-emerald-700">Instant Delivery</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBillModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 active:scale-95 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-xs text-gray-600 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Item Total ({cartItemsWithDetails.length} {cartItemsWithDetails.length === 1 ? 'item' : 'items'})
                  </span>
                  <span className="font-bold text-gray-900">{formatCurrency(itemTotal)}</span>
                </div>

                <div className="flex justify-between text-xs text-gray-600 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Delivery Fee (KGF Fast Drop)
                  </span>
                  <span className="font-bold text-gray-900">{formatCurrency(deliveryFee)}</span>
                </div>

                <div className="flex justify-between text-xs text-gray-600 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Taxes &amp; Platform Fee
                  </span>
                  <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] border border-emerald-100">
                    ₹0 FREE
                  </span>
                </div>

                <div className="border-t-2 border-dashed border-gray-100 pt-3 flex items-center justify-between">
                  <div>
                    <span className="font-black text-base text-gray-900 block leading-tight">To Pay</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Inclusive of all taxes</span>
                  </div>
                  <span className="font-black text-xl text-brand font-mono tracking-tight bg-emerald-50 px-3.5 py-1 rounded-2xl border border-emerald-200">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBillModalOpen(false)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-black text-xs rounded-xl uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
