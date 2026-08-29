import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils/currency';
import { mockShoppingProducts, mockFoodProducts } from '../../api/mockData';
import { useAllProducts } from '../../api/queries';
import {
  ChevronLeft, MapPin, CreditCard, Banknote,
  CheckCircle2, ArrowRight, X, User, Plus, ShieldCheck,
  Lock, Gift, Check, Tag, Ticket, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { calculateDeliveryFee, generateDeliveryPin } from '../../../../../common_logic/deliveryLogic';

type PayMethod = 'online' | 'upiDelivery';

export const CheckoutView: React.FC = () => {
  const { items, clearCart, saveLastOrder } = useCartStore();
  const { data: allProducts = [...mockShoppingProducts, ...mockFoodProducts] } = useAllProducts();
  const { userProfile } = useAuthStore();
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState<PayMethod>('online');
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<'registered' | 'college' | 'new'>('registered');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountRupees: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  // Modal & Address States
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSomeoneElse, setIsSomeoneElse] = useState(false);
  
  // Recipient States
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  
  // New Address States
  const [newTitle, setNewTitle] = useState('');
  const [newLine1, setNewLine1] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [newPin, setNewPin] = useState('');

  const cartItemsWithDetails = items.map(item => ({
    ...item,
    product: allProducts.find(p => p.id === item.productId),
  })).filter(item => item.product !== undefined);

  const itemTotal   = cartItemsWithDetails.reduce((sum, item) => sum + (item.product!.price * item.quantity), 0);
  const deliveryFee = calculateDeliveryFee({ subtotalRupees: itemTotal / 100 }).feePaise;
  const discountPaise = appliedCoupon ? appliedCoupon.discountRupees * 100 : 0;
  const total       = Math.max(0, itemTotal + deliveryFee - discountPaise);

  // ── Address Logic ────────────────────────────────────────
  const hasProfile = !!userProfile;
  
  const isUsingNewAddress = selectedAddressId === 'new' && newLine1.trim().length > 0;
  const isCollegeAddress = selectedAddressId === 'college';
  
  const displayAddressLine = isUsingNewAddress 
    ? newLine1 
    : isCollegeAddress ? 'Dttit kgf'
    : hasProfile ? `${userProfile!.addressLine1}${userProfile!.addressLine2 ? `, ${userProfile!.addressLine2}` : ''}` : 'KGF Main Road';
    
  const displayLandmark = isUsingNewAddress ? newLandmark : isCollegeAddress ? 'oorgaum post' : userProfile?.landmark || 'Near Town Hall';
  const displayPin = isUsingNewAddress ? newPin : isCollegeAddress ? '563120' : userProfile?.pincode || '563122';
  const displayTitle = isUsingNewAddress ? (newTitle || 'NEW ADDRESS') : isCollegeAddress ? 'COLLEGE' : 'REGISTERED ADDRESS';
  
  const finalRecipientName = isSomeoneElse && recipientName.trim() ? recipientName : (userProfile?.name || 'Customer');
  const finalRecipientPhone = isSomeoneElse && recipientPhone.trim() ? recipientPhone : (userProfile?.phone || '+91 98450 12345');

  const orderPlacedRef = React.useRef(false);

  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'WELCOME50' || code === 'SNAPIT50') {
      setAppliedCoupon({ code, discountRupees: 50 });
      setCouponCode('');
    } else if (code === 'KGF30' || code === 'FREEDROP') {
      setAppliedCoupon({ code, discountRupees: 30 });
      setCouponCode('');
    } else {
      setCouponError('Invalid code. Try WELCOME50 or KGF30');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  const handlePlaceOrder = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    orderPlacedRef.current = true;
    
    const displayId = `ORD-${Date.now().toString().slice(-6)}`;
    const storeId = cartItemsWithDetails[0]?.product?.storeId || 'g1';
    
    const activeAddressObject = {
      title: displayTitle,
      line1: displayAddressLine,
      landmark: displayLandmark,
      pincode: displayPin
    };

    const itemsJson = cartItemsWithDetails.map(item => ({
      productId: item.productId,
      product_id: item.productId,
      name: item.product?.name || 'Product Item',
      quantity: item.quantity,
      price: item.product?.price || 0,
      price_paise: item.product?.price || 0,
    }));

    try {
      const basePayload: any = {
        id: displayId,
        customer_id: userProfile?.phone || 'guest_user',
        store_id: storeId,
        status: 'PLACED',
        items: itemsJson,
        estimated_total: total,
        delivery_address: activeAddressObject,
        payment_method: 'UPI_NOW',
        payment_status: 'PAID',
        recipient_name: finalRecipientName,
        recipient_phone: finalRecipientPhone,
      };

      const { pinNumber } = generateDeliveryPin(displayId);
      const feeRupees = calculateDeliveryFee({ subtotalRupees: itemTotal / 100 }).feeRupees;

      // 1. Insert with extended columns (delivery_pin as numeric, delivery_fee as int2)
      const { data: insertedOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          ...basePayload,
          delivery_pin: pinNumber,
          delivery_fee: feeRupees,
        })
        .select();

      if (orderError) {
        console.warn("Extended columns not present in Supabase, inserting with base columns:", orderError.message);
        // Fallback insert with base columns
        const { data: fallbackOrder, error: fallbackError } = await supabase
          .from('orders')
          .insert(basePayload)
          .select();

        if (fallbackError) {
          console.error("Supabase Order Base Insert Error:", fallbackError);
        } else {
          console.info("Order successfully placed in Supabase:", fallbackOrder);
        }
      } else {
        console.info("Order successfully placed in Supabase:", insertedOrder);
      }
    } catch (err) {
      console.error("Order sync exception:", err);
    } finally {
      // 2. Persist last order details for the celebratory success screen
      saveLastOrder({
        orderId: displayId,
        total,
        itemNames: cartItemsWithDetails.map(i => i.product!.name),
        paymentMethod: 'upi',
      });
      
      clearCart();
      setIsSubmitting(false);
      navigate('/success', { replace: true });
    }
  };

  const handleSaveNewAddress = () => {
    if (!newLine1 || !newPin || (isSomeoneElse && (!recipientName || !recipientPhone))) {
      alert("Please fill all mandatory fields.");
      return;
    }
    setSelectedAddressId('new');
    setIsAddingNew(false);
    setIsAddressModalOpen(false);
  };

  React.useEffect(() => {
    if (items.length === 0 && !orderPlacedRef.current) {
      navigate('/cart', { replace: true });
    }
  }, [items.length, navigate]);

  if (items.length === 0 && !orderPlacedRef.current) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto relative min-h-screen bg-slate-50 flex flex-col pb-32 overflow-x-hidden">

      {/* ── Header ── */}
      <div className="bg-white/95 backdrop-blur-xl px-4 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-emerald-50 active:scale-95 transition-all text-gray-700 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-black text-lg text-gray-900 tracking-tight">Checkout</h1>
            <p className="text-[10px] text-gray-500 font-semibold">
              KGF Doorstep Delivery
            </p>
          </div>
        </div>

        <div className="bg-emerald-50 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
          <Lock className="w-3 h-3 text-emerald-600" />
          <span>Secure Order</span>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4 overflow-y-auto">

        {/* ── 1. Delivery Address Card ── */}
        <section>
          <div className="flex items-center justify-between mb-1.5 px-1">
            <h2 className="font-black text-xs uppercase tracking-widest text-emerald-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Delivery Address</span>
            </h2>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full">
              KGF Location
            </span>
          </div>
          
          <motion.div 
            whileTap={{ scale: 0.99 }}
            onClick={() => setIsAddressModalOpen(true)}
            className="rounded-3xl p-4 bg-white border border-emerald-100 shadow-xs transition-all cursor-pointer relative group hover:border-emerald-300"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                <MapPin className="w-4.5 h-4.5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.2 rounded-md">
                    {displayTitle}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 underline">Change</span>
                </div>
                
                <h4 className="font-bold text-xs text-gray-900 truncate mt-1">{displayAddressLine}</h4>
                <p className="text-[11px] text-gray-500 truncate">{displayLandmark} • KGF {displayPin}</p>

                {isSomeoneElse && recipientPhone && (
                  <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Recipient:</span>
                    <span className="text-xs font-mono font-bold text-gray-800">+91 {finalRecipientPhone}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── 2. Coupons & Offers Section ── */}
        <section>
          <div className="flex items-center justify-between mb-1.5 px-1">
            <h2 className="font-black text-xs uppercase tracking-widest text-emerald-800 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Coupons &amp; Offers</span>
            </h2>
            {appliedCoupon && (
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
                Applied
              </span>
            )}
          </div>

          <div className="bg-white rounded-3xl p-3.5 border border-gray-100 shadow-xs space-y-2">
            {appliedCoupon ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-black text-xs text-emerald-900 uppercase tracking-wider">{appliedCoupon.code}</span>
                    <p className="text-[10.5px] font-bold text-emerald-700">₹{appliedCoupon.discountRupees} discount applied!</p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-xs font-bold text-red-600 hover:text-red-700 underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter Coupon Code (e.g. WELCOME50)"
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 uppercase"
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim()}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      couponCode.trim()
                        ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-500 active:scale-95'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Apply
                  </button>
                </div>

                {couponError && (
                  <p className="text-[10.5px] font-bold text-red-600 mt-1.5 px-1">{couponError}</p>
                )}

                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 text-[10.5px] text-gray-500">
                  <span>Available:</span>
                  <button
                    onClick={() => setCouponCode('WELCOME50')}
                    className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                  >
                    WELCOME50
                  </button>
                  <button
                    onClick={() => setCouponCode('KGF30')}
                    className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                  >
                    KGF30
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── 3. Payment Method Section ── */}
        <section>
          <h2 className="font-black text-xs uppercase tracking-widest text-emerald-800 mb-1.5 px-1 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>Payment Method</span>
          </h2>
          
          <div className="flex flex-col gap-2.5">
            {/* 1. Online Payment Card */}
            <motion.div 
              whileTap={{ scale: 0.99 }}
              onClick={() => setPaymentMethod('online')}
              className={`rounded-3xl p-3.5 border-2 transition-all cursor-pointer shadow-xs ${
                paymentMethod === 'online'
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  paymentMethod === 'online' ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'
                }`}>
                  {paymentMethod === 'online' && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </div>

                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4.5 h-4.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-xs text-gray-900">
                      Pay Online via UPI
                    </p>
                    <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                      Instant
                    </span>
                  </div>
                  <p className="text-[10.5px] text-gray-500 font-medium">GPay • PhonePe • Paytm • Cards</p>
                </div>
              </div>
            </motion.div>

            {/* 2. Cash on Delivery */}
            <div 
              onClick={() => alert("Cash on Delivery will be enabled in next update!")}
              className="rounded-3xl p-3.5 border border-gray-200 bg-gray-50/80 opacity-60 cursor-pointer select-none flex items-center gap-3"
            >
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
              <div className="w-9 h-9 rounded-xl bg-gray-200 text-gray-500 flex items-center justify-center shrink-0">
                <Banknote className="w-4.5 h-4.5 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-xs text-gray-700">Cash on Delivery</p>
                  <span className="text-[8.5px] font-black text-gray-500 bg-gray-200 px-1.5 py-0.2 rounded-md">
                    Soon
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">Available in upcoming release</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. Order Summary Overview ── */}
        <section className="bg-white rounded-3xl p-3.5 border border-gray-100 shadow-xs space-y-1.5">
          <div className="flex justify-between text-xs text-gray-600 font-medium">
            <span>Items Total</span>
            <span className="font-mono font-bold text-gray-900">{formatCurrency(itemTotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600 font-medium">
            <span>Delivery Fee</span>
            <span className="font-mono font-bold text-gray-900">{formatCurrency(deliveryFee)}</span>
          </div>
          {appliedCoupon && (
            <div className="flex justify-between text-xs text-emerald-700 font-bold">
              <span>Coupon Discount ({appliedCoupon.code})</span>
              <span className="font-mono">-₹{appliedCoupon.discountRupees}</span>
            </div>
          )}
          <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between items-center">
            <span className="font-black text-sm text-gray-900">Total to Pay</span>
            <span className="font-mono font-black text-base text-emerald-700">{formatCurrency(total)}</span>
          </div>
        </section>

      </div>

      {/* ── Sticky Bottom CTA: Pay Button ── */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-xl border-t border-gray-100 p-4 shadow-[0_-8px_25px_rgba(0,0,0,0.06)] z-30">
        <button
          onClick={handlePlaceOrder}
          disabled={isSubmitting}
          className="w-full h-13 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-md shadow-emerald-600/25 active:scale-[0.98] transition-all flex items-center justify-between px-5 uppercase tracking-wider cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-200" />
            <span>Pay {formatCurrency(total)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-emerald-100">Confirm Order</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* ── Address Selector Modal ── */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-50 w-full max-w-md mx-auto rounded-t-3xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-black text-base text-gray-900">Select Delivery Location</h3>
              <button 
                onClick={() => setIsAddressModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 pb-8">
              {/* Option 1: Registered Address */}
              <div 
                onClick={() => {
                  setSelectedAddressId('registered');
                  setIsAddingNew(false);
                  setIsAddressModalOpen(false);
                }}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer bg-white ${
                  selectedAddressId === 'registered' ? 'border-emerald-500 bg-emerald-50/20' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-gray-900 uppercase">Registered Address</span>
                  {selectedAddressId === 'registered' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-xs text-gray-700">{hasProfile ? `${userProfile!.addressLine1}` : 'KGF Main Road'}</p>
                <p className="text-[11px] text-gray-400">{hasProfile ? userProfile?.landmark : 'Robertsonpet'} • KGF {hasProfile ? userProfile?.pincode : '563122'}</p>
              </div>

              {/* Option 2: College */}
              <div 
                onClick={() => {
                  setSelectedAddressId('college');
                  setIsAddingNew(false);
                  setIsAddressModalOpen(false);
                }}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer bg-white ${
                  selectedAddressId === 'college' ? 'border-emerald-500 bg-emerald-50/20' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-gray-900 uppercase">DTTIT College</span>
                  {selectedAddressId === 'college' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-xs text-gray-700">Dttit kgf, oorgaum post</p>
                <p className="text-[11px] text-gray-400">KGF 563120</p>
              </div>

              {/* Option 3: Add New Address */}
              {!isAddingNew ? (
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="w-full py-3 bg-white border-2 border-dashed border-emerald-300 rounded-2xl text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-50 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add New Address
                </button>
              ) : (
                <div className="bg-white rounded-2xl p-4 border border-emerald-200 space-y-3">
                  <h4 className="text-xs font-black text-gray-900 uppercase">New Address Details</h4>
                  
                  <input
                    type="text"
                    placeholder="Address Title (e.g. Home, Office)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="House / Street Address *"
                    value={newLine1}
                    onChange={(e) => setNewLine1(e.target.value)}
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Landmark (e.g. Near Bus Stand)"
                    value={newLandmark}
                    onChange={(e) => setNewLandmark(e.target.value)}
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Pincode (e.g. 563122) *"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => setIsAddingNew(false)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNewAddress}
                      className="flex-1 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500"
                    >
                      Use Address
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
