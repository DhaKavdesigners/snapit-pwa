import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { mockShoppingProducts, mockFoodProducts } from '../../api/mockData';
import { useAllProducts } from '../../api/queries';
import { formatCurrency } from '../../utils/currency';
import { Plus, Minus, ArrowRight, ShoppingBag, Receipt, ShieldCheck, MapPin } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { motion } from 'framer-motion';
import { calculateDeliveryFee } from '../../../../../common_logic/deliveryLogic';

export const CartView: React.FC = () => {
  const { items, updateQuantity } = useCartStore();
  const { data: allProducts = [...mockShoppingProducts, ...mockFoodProducts] } = useAllProducts();
  const navigate = useNavigate();

  const cartItemsWithDetails = items
    .map((item) => ({
      ...item,
      product: allProducts.find((p) => p.id === item.productId),
    }))
    .filter((item) => item.product !== undefined);

  const totalQuantity = cartItemsWithDetails.reduce((sum, item) => sum + item.quantity, 0);
  const itemTotal = cartItemsWithDetails.reduce(
    (sum, item) => sum + item.product!.price * item.quantity,
    0
  );
  const deliveryFee = calculateDeliveryFee({ subtotalRupees: itemTotal / 100 }).feePaise;
  const taxesAndFees = 0; // Free / 0
  const total = itemTotal + deliveryFee + taxesAndFees;

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
            className="w-full h-13 py-3.5 bg-gradient-to-r from-emerald-600 to-brand text-white font-black rounded-2xl shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            Explore Stores
          </button>
        </div>
      </div>
    );
  }

  const hasOfflineItems = cartItemsWithDetails.some((item) => item.product?.storeIsOpen === false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative pb-36 max-w-md mx-auto w-full">
      <div className="flex-1 p-4 pt-3 space-y-3.5">
        {/* Header with item count */}
        <div className="flex items-center justify-between">
          <h2 className="font-black text-xl text-gray-900 tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShoppingBag className="h-4.5 w-4.5" />
            </div>
            <span>Your Cart</span>
          </h2>
          <span className="text-xs font-black bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
            {totalQuantity} {totalQuantity === 1 ? 'Item' : 'Items'}
          </span>
        </div>

        {/* Store Offline Alert if any item belongs to a closed store */}
        {hasOfflineItems && (
          <div className="bg-red-50 border border-red-200 text-red-900 rounded-2xl p-3 text-xs font-bold flex items-center gap-2 shadow-xs">
            <span className="text-base shrink-0">⚠️</span>
            <span>Some items belong to a store that is currently closed. Please remove them to proceed.</span>
          </div>
        )}

        {/* 1. Item Cards List with Price & Qty Details */}
        <div className="bg-white rounded-3xl p-3.5 shadow-xs border border-gray-100/90 space-y-2.5">
          <div className="flex items-center justify-between pb-1 border-b border-gray-100">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">Order Items</span>
            <span className="text-[11px] font-bold text-gray-500">{cartItemsWithDetails.length} Products</span>
          </div>

          {cartItemsWithDetails.map((item) => {
            const isItemStoreClosed = item.product?.storeIsOpen === false;
            const stock = item.product!.stockCount !== undefined ? item.product!.stockCount : 99;
            const isMaxReached = item.quantity >= stock;
            const isExceedingStock = item.quantity > stock;
            const unitPrice = item.product!.price;
            const lineTotal = unitPrice * item.quantity;

            return (
              <motion.div
                key={item.productId}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex gap-3 items-center p-2.5 rounded-2xl border transition-all ${
                  isItemStoreClosed
                    ? 'bg-red-50/50 border-red-200 opacity-80'
                    : isExceedingStock
                    ? 'bg-amber-50/60 border-amber-300'
                    : 'bg-slate-50/70 border-slate-100'
                }`}
              >
                {/* Product Thumbnail */}
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white border border-gray-100 shrink-0">
                  <img
                    src={item.product!.imageUrl}
                    alt={item.product!.name}
                    className={`w-full h-full object-cover ${isItemStoreClosed ? 'grayscale-[80%]' : ''}`}
                  />
                  {isItemStoreClosed && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-[7.5px] font-black text-white uppercase tracking-wider">
                      Closed
                    </div>
                  )}
                </div>

                {/* Product Info & Price x Qty */}
                <div className="flex-1 min-w-0">
                  <span className={`text-[9px] font-bold uppercase tracking-wider block truncate ${
                    isItemStoreClosed ? 'text-red-600' : 'text-emerald-700'
                  }`}>
                    {item.product!.storeName || 'SnapIt Store'}
                  </span>
                  <h4 className="font-bold text-xs text-gray-900 truncate leading-tight mt-0.5">
                    {item.product!.name}
                  </h4>

                  {/* Price & Quantity Breakdown */}
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-gray-500">
                    <span className="font-mono">{formatCurrency(unitPrice)}</span>
                    <span>×</span>
                    <span className="font-bold text-gray-900">{item.quantity}</span>
                    <span>=</span>
                    <span className="font-mono font-black text-gray-900 text-xs">
                      {formatCurrency(lineTotal)}
                    </span>
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center bg-white border border-emerald-200/80 rounded-xl h-7.5 overflow-hidden shadow-xs">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1, stock)}
                      className="w-6.5 h-7.5 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-mono font-black text-xs w-4 text-center text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => {
                        if (!isMaxReached && !isItemStoreClosed) {
                          updateQuantity(item.productId, item.quantity + 1, stock);
                        }
                      }}
                      disabled={isItemStoreClosed || isMaxReached}
                      className={`w-6.5 h-7.5 flex items-center justify-center transition-colors cursor-pointer ${
                        isItemStoreClosed || isMaxReached
                          ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                          : 'text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100'
                      }`}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 2. Bill Details Card */}
        <div className="bg-white rounded-3xl p-4 shadow-xs border border-gray-100/90 space-y-2.5">
          <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <h3 className="font-black text-sm text-gray-900">Bill Details</h3>
          </div>

          <div className="space-y-2 text-xs text-gray-600 font-medium">
            <div className="flex justify-between items-center">
              <span>Item Total ({totalQuantity} {totalQuantity === 1 ? 'item' : 'items'})</span>
              <span className="font-mono font-bold text-gray-900">{formatCurrency(itemTotal)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1">
                <span>Delivery Fee</span>
                <span className="text-[10px] text-gray-400">(KGF Drop)</span>
              </span>
              <span className="font-mono font-bold text-gray-900">{formatCurrency(deliveryFee)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span>Taxes & Platform Fee</span>
              <span className="text-emerald-700 font-black text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                ₹0 FREE
              </span>
            </div>

            <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between items-center">
              <span className="font-black text-sm text-gray-900">Total Due</span>
              <span className="font-mono font-black text-base text-emerald-700">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Safe & Secure Order Guarantee */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-semibold text-center pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Local store pickup & OTP delivery verification</span>
        </div>
      </div>

      {/* ── Proceed to Checkout (Fixed Footer) ── */}
      <div className="fixed bottom-14 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-xl px-4 py-3 border-t border-gray-100 shadow-[0_-8px_25px_rgba(0,0,0,0.06)] z-40 rounded-t-3xl">
        <button
          disabled={hasOfflineItems}
          onClick={() => !hasOfflineItems && navigate('/checkout')}
          className={`w-full h-13 font-black text-sm rounded-2xl transition-all flex items-center justify-between px-5 uppercase tracking-wider cursor-pointer ${
            hasOfflineItems
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 active:scale-[0.98]'
          }`}
        >
          <span>{hasOfflineItems ? 'Store is Offline' : 'Proceed to Checkout'}</span>
          <div className="flex items-center gap-2">
            <span className="font-mono">{formatCurrency(total)}</span>
            {!hasOfflineItems && <ArrowRight className="h-4.5 w-4.5" />}
          </div>
        </button>
      </div>
    </div>
  );
};
