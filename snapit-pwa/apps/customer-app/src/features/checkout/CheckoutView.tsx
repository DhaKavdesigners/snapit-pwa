import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils/currency';
import { Button } from '../../components/ui/Button';
import { mockShoppingProducts, mockFoodProducts } from '../../api/mockData';
import { useAllProducts } from '../../api/queries';
import {
  ChevronLeft, MapPin, CreditCard, Banknote,
  CheckCircle2, ArrowRight, X, User, Plus, ShieldCheck,
  Zap, Sparkles, Lock, Gift, Check, Phone, LocateFixed,
  UserCheck, Compass, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { calculateDeliveryFee, generateDeliveryPin } from '../../../../../common_logic/deliveryLogic';
import { LocationPickerModal } from '../../components/checkout/LocationPickerModal';

// ── KGF Known Address Coordinates ───────────────────────────────────────────
// Static lookup for addresses we know; avoids geocoding API calls for common addresses.
const KGF_KNOWN_COORDS: Array<{ keywords: string[]; lat: number; lng: number }> = [
  { keywords: ['dttit', 'dtte', 'oorgaum', '563120'], lat: 12.9275, lng: 78.2589 },
  { keywords: ['andersonpet', 'anderson', 'main road', '563113'], lat: 12.9365, lng: 78.2672 },
  { keywords: ['mariyamman', 'maariyaman', 'temple street', '563122'], lat: 12.9340, lng: 78.2680 },
  { keywords: ['robertsonpet', 'robertson', '563119'], lat: 12.9310, lng: 78.2745 },
  { keywords: ['bangarpet', '563114'], lat: 12.9949, lng: 78.1725 },
  { keywords: ['marikuppam', '563116'], lat: 12.8840, lng: 78.3115 },
  { keywords: ['kgf', 'kolar gold', '563115'], lat: 12.9592, lng: 78.2713 },
];

/** Resolve lat/lng for a delivery address string.
 *  First checks known KGF landmarks; falls back to Nominatim geocoding API. */
async function geocodeDeliveryAddress(
  addressText: string,
  pincode: string,
  landmark: string
): Promise<{ lat: number; lng: number }> {
  const combined = `${addressText} ${landmark} ${pincode}`.toLowerCase();

  // 1. Try static KGF lookup first (instant, no network)
  for (const entry of KGF_KNOWN_COORDS) {
    if (entry.keywords.some((kw) => combined.includes(kw))) {
      return { lat: entry.lat, lng: entry.lng };
    }
  }

  // 2. Fallback: Nominatim (OpenStreetMap) geocoding — free, no API key
  try {
    const query = encodeURIComponent(
      `${addressText}${landmark ? ', ' + landmark : ''}, KGF, Karnataka, India`
    );
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=in`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'MinnitApp/1.0' } }
    );
    if (res.ok) {
      const results = await res.json();
      if (results.length > 0) {
        return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
      }
    }
  } catch {
    // Network failure — fall through to KGF town center default
  }

  // 3. Ultimate fallback: KGF town center (Andersonpet)
  return { lat: 12.9365, lng: 78.2672 };
}

type PayMethod = 'online' | 'upiDelivery';

export const CheckoutView: React.FC = () => {
  const { items, clearCart, saveLastOrder } = useCartStore();
  const { data: allProducts = [...mockShoppingProducts, ...mockFoodProducts] } = useAllProducts();
  const { isLoggedIn, userProfile } = useAuthStore();
  const navigate = useNavigate();

  // ── AUTH GUARD: Unregistered users cannot checkout or place orders ──
  React.useEffect(() => {
    if (!isLoggedIn || !userProfile) {
      navigate('/profile?redirect=/checkout', { replace: true });
    }
  }, [isLoggedIn, userProfile, navigate]);
  
  const [paymentMethod, setPaymentMethod] = useState<PayMethod>('online');
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<'registered' | 'college' | 'new'>('registered');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal & Address States
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSomeoneElse, setIsSomeoneElse] = useState(false);
  
  // Alternate Phone & Doorstep GPS Pinning
  const [alternatePhone, setAlternatePhone] = useState('');
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [pinnedCoords, setPinnedCoords] = useState<{ lat: number; lng: number; addressHint?: string } | null>(null);

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
  const total       = itemTotal + deliveryFee;

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

  const handlePlaceOrder = async () => {
    if (isSubmitting) return;
    if (!isLoggedIn || !userProfile) {
      alert('Please register and verify your profile before placing an order.');
      navigate('/profile?redirect=/checkout');
      return;
    }
    setIsSubmitting(true);
    orderPlacedRef.current = true;
    
    const displayId = `ORD-${Date.now().toString().slice(-6)}`;
    const storeId = cartItemsWithDetails[0]?.product?.storeId || 'g1';

    // ── Geocode or resolve delivery coordinates ──
    // Doorstep map pin takes highest priority; falls back to address geocoding
    const resolvedCoords = pinnedCoords
      ? { lat: pinnedCoords.lat, lng: pinnedCoords.lng }
      : await geocodeDeliveryAddress(
          displayAddressLine,
          displayPin,
          displayLandmark
        );

    const activeAddressObject = {
      title: displayTitle,
      line1: displayAddressLine,
      landmark: displayLandmark,
      pincode: displayPin,
      // ✅ Rider map drop pin coordinates — exact doorstep or geocoded address
      lat: resolvedCoords.lat,
      lng: resolvedCoords.lng,
      is_doorstep_pinned: !!pinnedCoords,
      address_hint: pinnedCoords?.addressHint || undefined,
      alternate_phone: alternatePhone.trim() || undefined,
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

      // 1. Insert with direct lat & lng columns + delivery_pin and delivery_fee
      const { data: insertedOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          ...basePayload,
          lat: resolvedCoords.lat,
          lng: resolvedCoords.lng,
          delivery_pin: pinNumber,
          delivery_fee: feeRupees,
        })
        .select();

      if (orderError) {
        console.warn("Direct lat/lng or extended columns not present in Supabase table yet, falling back to base payload:", orderError.message);
        // Resilient fallback insert with base columns
        const { data: fallbackOrder, error: fallbackError } = await supabase
          .from('orders')
          .insert(basePayload)
          .select();

        if (fallbackError) {
          console.error("Supabase Order Base Insert Error:", fallbackError);
        } else {
          console.info("Order successfully placed in Supabase (base columns):", fallbackOrder);
        }
      } else {
        console.info("Order successfully placed in Supabase with lat/lng:", insertedOrder);
      }
    } catch (err) {
      console.error("Order sync exception:", err);
    } finally {
      // 2. Persist last order details for the celebratory success screen
      const isFoodOrder = cartItemsWithDetails.some(i => (i.product?.storeId || '').startsWith('f'));
      saveLastOrder({
        orderId: displayId,
        total,
        itemNames: cartItemsWithDetails.map(i => i.product!.name),
        paymentMethod: 'upi',
        isFood: isFoodOrder,
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

  if (!isLoggedIn || !userProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-4 border border-emerald-100">
          <Lock className="w-8 h-8 text-emerald-600 animate-pulse" />
        </div>
        <h2 className="font-black text-xl text-gray-900 mb-1">Registration Required</h2>
        <p className="text-xs text-gray-500 max-w-xs mb-6 font-medium">
          Please register your profile & delivery address before placing an order.
        </p>
        <button
          onClick={() => navigate('/profile?redirect=/checkout')}
          className="bg-emerald-600 text-white font-black text-xs px-6 py-3 rounded-xl shadow-md uppercase tracking-wider cursor-pointer hover:bg-emerald-700 active:scale-95 transition-all"
        >
          Go to Registration ➔
        </button>
      </div>
    );
  }

  if (items.length === 0 && !orderPlacedRef.current) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto relative min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 flex flex-col pb-32 shadow-2xl overflow-x-hidden">

      {/* ── Header ── */}
      <div className="bg-white/90 backdrop-blur-xl px-4 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-sm border-b border-emerald-100/80">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-full bg-gray-100/80 flex items-center justify-center hover:bg-emerald-50 active:scale-95 transition-all text-gray-700"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="font-black text-xl text-text-primary tracking-tight">Checkout</h1>
            <p className="text-[10px] text-text-secondary font-bold flex items-center gap-1 text-emerald-700">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              Direct Local Delivery
            </p>
          </div>
        </div>

        <div className="bg-emerald-50 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
          <Lock className="w-3 h-3 text-emerald-600" />
          256-Bit Safe
        </div>
      </div>

      <div className="p-4 flex flex-col gap-5 overflow-y-auto">

        {/* ── 1. Signed In User Card ── */}
        <section className="bg-white rounded-3xl p-4 border border-emerald-100 shadow-[0_4px_20px_rgba(5,150,105,0.04)] relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-[11px] uppercase tracking-widest text-emerald-800 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-brand" />
              Signed In User
            </h2>
            <span className="text-[10px] font-black bg-emerald-100/70 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Verified
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-brand text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20 font-black text-base">
              {(userProfile?.name || 'V')[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-sm text-gray-900 truncate">
                {userProfile?.name || 'Vishva D'}
              </h3>
              <p className="text-xs text-gray-600 font-medium flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Primary Phone: <strong className="text-gray-900 font-mono">+91 {userProfile?.phone || ''}</strong></span>
              </p>
            </div>
          </div>
        </section>

        {/* ── 2. Alternate Phone Number (Optional) ── */}
        <section className="bg-white rounded-3xl p-4 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-black text-[11px] uppercase tracking-widest text-gray-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              Alternate Phone Number <span className="text-[10px] text-gray-400 font-normal lowercase">(optional)</span>
            </label>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600 font-black text-xs font-mono">
              +91
            </div>
            <input
              type="tel"
              value={alternatePhone}
              onChange={(e) => setAlternatePhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
              placeholder="e.g. 98765 43210 (Rider calls if primary unreachable)"
              maxLength={10}
              className="w-full bg-gray-50/80 border-2 border-gray-200 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10 rounded-2xl pl-12 pr-4 py-2.5 text-xs font-semibold text-gray-900 placeholder-gray-400 transition-all outline-none"
            />
          </div>
          <p className="text-[10px] text-gray-500 font-medium px-1">
            Rider will call this backup number if primary number is unreachable at your doorstep.
          </p>
        </section>

        {/* ── 3. Select Delivery Address & Doorstep Pinning ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-black text-xs uppercase tracking-widest text-emerald-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand" />
              Select Delivery Address
            </h2>
            <span className="text-[10px] font-bold bg-brand/10 text-brand px-2 py-0.5 rounded-full uppercase tracking-wider">
              {pinnedCoords ? 'Doorstep Pinned' : 'Doorstep Drop'}
            </span>
          </div>

          {/* Active Address Card */}
          {hasProfile || isUsingNewAddress ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 rounded-3xl p-4 shadow-[0_8px_30px_rgba(5,150,105,0.07)] border-2 transition-all relative overflow-hidden ${
                pinnedCoords ? 'border-brand ring-4 ring-brand/10' : 'border-emerald-200/90'
              }`}
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-emerald-400 to-brand" />
              
              <div className="flex gap-3 pl-1">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-brand text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                  <MapPin className="w-5 h-5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="bg-brand text-white text-[9px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                      {displayTitle}
                    </span>
                    
                    {pinnedCoords && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                        Exact Pin Set
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed font-medium mt-1">
                    {displayAddressLine}
                    {displayLandmark && <span className="block text-gray-500 font-normal mt-0.5">Near: {displayLandmark}</span>}
                    {displayPin && <span className="inline-block mt-1 font-mono font-bold text-gray-800 bg-emerald-100/60 px-1.5 py-0.5 rounded text-[11px]">PIN: {displayPin}</span>}
                  </p>

                  {/* Pinned Coordinates Indicator (Hiding raw coordinates from consumer) */}
                  {pinnedCoords && (
                    <div className="mt-2.5 p-2.5 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-emerald-950 font-bold min-w-0">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-700 shrink-0">
                          <LocateFixed className="w-3.5 h-3.5 text-brand shrink-0" />
                        </div>
                        <div className="truncate">
                          <span className="block font-black text-xs text-emerald-950">
                            Exact Doorstep Location Pinned ✓
                          </span>
                          <span className="block text-[10px] text-emerald-700 font-medium truncate">
                            {pinnedCoords.addressHint ? `Near: ${pinnedCoords.addressHint}` : 'Rider will deliver directly to this pinned spot'}
                          </span>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setIsMapModalOpen(true)}
                        className="text-brand font-black text-xs bg-white border border-emerald-300 px-3 py-1.5 rounded-xl hover:bg-emerald-50 active:scale-95 transition-all shadow-2xs shrink-0 ml-2"
                      >
                        Relocate Pin
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white rounded-3xl p-6 border-2 border-dashed border-emerald-200 text-center shadow-sm">
              <MapPin className="w-9 h-9 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-gray-700 text-sm">No delivery address selected</p>
              <button
                onClick={() => setIsAddressModalOpen(true)}
                className="mt-3 text-white bg-brand font-black text-xs px-4 py-2 rounded-xl shadow-md uppercase tracking-wider"
              >
                + Add Address
              </button>
            </div>
          )}

          {/* Ordering for someone else toggle */}
          <div className="bg-white rounded-2xl p-3.5 border border-emerald-100/80 shadow-xs">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-brand" />
                <span className="font-bold text-xs text-gray-800">Ordering for someone else?</span>
              </div>
              <input 
                type="checkbox" 
                className="w-4 h-4 text-brand rounded border-gray-300 focus:ring-brand accent-emerald-600 cursor-pointer"
                checked={isSomeoneElse}
                onChange={(e) => setIsSomeoneElse(e.target.checked)}
              />
            </label>

            <AnimatePresence>
              {isSomeoneElse && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2.5 pt-3 mt-3 border-t border-emerald-50 overflow-hidden"
                >
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                      Recipient Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-brand focus:bg-white"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                      Recipient Phone Number *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 font-mono text-xs">
                        +91
                      </div>
                      <input
                        type="tel"
                        placeholder="98765 43210"
                        maxLength={10}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-3.5 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-brand focus:bg-white"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value.replace(/[^0-9]/g, ''))}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons: Pin on Map & Add Address */}
          <div className="grid grid-cols-2 gap-2.5">
            <button 
              type="button"
              onClick={() => setIsMapModalOpen(true)}
              className="bg-gradient-to-r from-emerald-600 to-brand text-white font-black py-3 px-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all hover:brightness-105"
            >
              <Compass className="w-4 h-4 animate-spin [animation-duration:8s]" />
              <span>{pinnedCoords ? 'Relocate Pin on Map' : '🗺️ Pin on Map'}</span>
            </button>
            
            <button 
              type="button"
              onClick={() => setIsAddressModalOpen(true)}
              className="bg-white border-2 border-emerald-200 text-emerald-800 font-black py-3 px-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs hover:bg-emerald-50 active:scale-95 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4 text-brand" />
              <span>+ Add Address</span>
            </button>
          </div>

          {/* Destination Status Pill (Consumer-friendly: coordinates hidden) */}
          <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-2xl px-3.5 py-2.5 flex items-center gap-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0" />
            <span className="text-[11px] font-bold text-emerald-900 truncate">
              {pinnedCoords 
                ? `📍 Delivering to: ${displayTitle} • Exact Doorstep Pinned ✓`
                : `📍 Delivering to: ${displayTitle} (${displayPin})`
              }
            </span>
          </div>
        </section>

        {/* ── 2. Bill & Savings Details Card ── */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="font-black text-xs uppercase tracking-widest text-emerald-800 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              Bill Details
            </h2>
            <span className="text-[10px] font-bold text-emerald-700">Instant Delivery</span>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 space-y-3">
            {/* Item total */}
            <div className="flex justify-between text-xs text-gray-600 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Item Total ({cartItemsWithDetails.length} items)
              </span>
              <span className="font-bold text-gray-900">{formatCurrency(itemTotal)}</span>
            </div>

            {/* Delivery */}
            <div className="flex justify-between text-xs text-gray-600 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Delivery Fee (KGF Fast Drop)
              </span>
              <span className="font-bold text-gray-900">{formatCurrency(deliveryFee)}</span>
            </div>

            {/* Platform & Taxes */}
            <div className="flex justify-between text-xs text-gray-600 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Taxes &amp; Platform Fee
              </span>
              <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] border border-emerald-100">
                ₹0 FREE
              </span>
            </div>

            {/* Minnit Guarantee banner */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 rounded-2xl p-3 border border-emerald-100 flex items-center gap-2.5">
              <Gift className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-[11px] font-bold text-emerald-900 leading-tight">
                Minnit Promise: 100% Fresh &amp; Quality Guaranteed on delivery!
              </p>
            </div>

            {/* Grand Total Pill */}
            <div className="border-t-2 border-dashed border-gray-100 pt-3 flex items-center justify-between">
              <div>
                <span className="font-black text-base text-gray-900 block leading-tight">To Pay</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Inclusive of all taxes</span>
              </div>
              <span className="font-black text-2xl text-brand font-mono tracking-tight bg-emerald-50 px-3.5 py-1 rounded-2xl border border-emerald-200">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </section>

        {/* ── 3. Payment Method Section ── */}
        <section>
          <h2 className="font-black text-xs uppercase tracking-widest text-emerald-800 mb-2 px-1 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-brand" />
            Payment Method
          </h2>
          
          <div className="flex flex-col gap-3.5">
            {/* 1. Online Payment Card */}
            <motion.div 
              whileTap={{ scale: 0.99 }}
              onClick={() => setPaymentMethod('online')}
              className={`rounded-3xl p-4.5 p-4 border-2 transition-all cursor-pointer shadow-sm relative overflow-hidden ${
                paymentMethod === 'online'
                  ? 'border-emerald-500 bg-gradient-to-r from-emerald-50/90 via-white to-teal-50/40 ring-4 ring-emerald-500/10'
                  : 'border-gray-200 bg-white hover:border-emerald-200'
              }`}
            >
              <div className="flex items-center gap-3.5">
                {/* Radio Circle */}
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  paymentMethod === 'online' ? 'border-brand bg-brand' : 'border-gray-300'
                }`}>
                  {paymentMethod === 'online' && <Check className="w-3.5 h-3.5 text-white" />}
                </div>

                {/* Icon badge */}
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-brand text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/25">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-black text-sm text-gray-900">
                      Pay Online (UPI / Card)
                    </p>
                    <span className="text-[9px] font-black text-white bg-gradient-to-r from-emerald-500 to-brand px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                      Instant
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium">GPay • PhonePe • Paytm • Cards</p>
                </div>
              </div>
            </motion.div>

            {/* 2. Cash on Delivery (Disabled) */}
            <div 
              onClick={() => alert("Cash on Delivery will be enabled soon in KGF!")}
              className="rounded-3xl p-4 border border-gray-200 bg-gray-50/80 opacity-60 cursor-pointer select-none flex items-center gap-3.5"
            >
              <div className="w-6 h-6 rounded-full border-2 border-gray-300 shrink-0" />
              <div className="w-11 h-11 rounded-2xl bg-gray-200 text-gray-500 flex items-center justify-center shrink-0">
                <Banknote className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-sm text-gray-700">Cash on Delivery</p>
                  <span className="text-[9px] font-black text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full uppercase">
                    Coming Soon
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">Available in upcoming update</p>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* ── Sticky Bottom CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-xl border-t border-emerald-100/80 p-4 shadow-[0_-10px_30px_rgba(5,150,105,0.08)] z-30">
        <button
          onClick={handlePlaceOrder}
          disabled={isSubmitting}
          className="w-full h-15 h-14 bg-gradient-to-r from-emerald-600 via-brand to-teal-600 text-white font-black text-base rounded-2xl shadow-[0_10px_25px_rgba(5,150,105,0.4)] hover:shadow-[0_12px_30px_rgba(5,150,105,0.5)] active:scale-[0.98] transition-all flex items-center justify-between px-6 uppercase tracking-wider"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-200" />
            <span>Pay {formatCurrency(total)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-100 lowercase">place order</span>
            <ArrowRight className="w-5 h-5 animate-pulse" />
          </div>
        </button>
      </div>

      {/* ── Address Selector Modal ── */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-50 w-full max-w-md mx-auto rounded-t-3xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-10">
              <h2 className="font-black text-lg text-text-primary">Delivery Address</h2>
              <button 
                onClick={() => setIsAddressModalOpen(false)}
                className="p-2 -mr-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              {!isAddingNew ? (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Saved Addresses</h3>
                  
                  {/* Registered Address */}
                  <label 
                    className={`flex items-start gap-3 bg-white p-4 rounded-2xl border shadow-sm cursor-pointer relative overflow-hidden ${selectedAddressId === 'registered' ? 'border-brand ring-2 ring-brand/20' : 'border-gray-200'}`}
                    onClick={() => setSelectedAddressId('registered')}
                  >
                    {selectedAddressId === 'registered' && <div className="absolute top-0 left-0 w-1.5 h-full bg-brand" />}
                    <input type="radio" name="address" className="mt-1" checked={selectedAddressId === 'registered'} readOnly />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-sm text-text-primary">REGISTERED ADDRESS</span>
                      </div>
                      <p className="text-xs text-text-secondary leading-snug">
                        {userProfile?.addressLine1 || '#450, Maariyaman temple street'}
                        <br/>PIN: {userProfile?.pincode || '563122'}
                      </p>
                    </div>
                  </label>

                  {/* College Address */}
                  <label 
                    className={`flex items-start gap-3 bg-white p-4 rounded-2xl border cursor-pointer relative overflow-hidden ${selectedAddressId === 'college' ? 'border-brand ring-2 ring-brand/20' : 'border-gray-200'}`}
                    onClick={() => setSelectedAddressId('college')}
                  >
                    {selectedAddressId === 'college' && <div className="absolute top-0 left-0 w-1.5 h-full bg-brand" />}
                    <input type="radio" name="address" className="mt-1" checked={selectedAddressId === 'college'} readOnly />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-sm text-text-primary">COLLEGE</span>
                      </div>
                      <p className="text-xs text-text-secondary leading-snug">
                        Dttit kgf<br/>Landmark: oorgaum post<br/>PIN: 563120
                      </p>
                    </div>
                  </label>
                  
                  {newLine1.trim().length > 0 && (
                    <label 
                      className={`flex items-start gap-3 bg-white p-4 rounded-2xl border cursor-pointer relative overflow-hidden ${selectedAddressId === 'new' ? 'border-brand ring-2 ring-brand/20' : 'border-gray-200'}`}
                      onClick={() => setSelectedAddressId('new')}
                    >
                      {selectedAddressId === 'new' && <div className="absolute top-0 left-0 w-1.5 h-full bg-brand" />}
                      <input type="radio" name="address" className="mt-1" checked={selectedAddressId === 'new'} readOnly />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-sm text-text-primary">{newTitle || 'NEW ADDRESS'}</span>
                        </div>
                        <p className="text-xs text-text-secondary leading-snug">
                          {newLine1}<br/>PIN: {newPin}
                        </p>
                      </div>
                    </label>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button 
                      type="button"
                      onClick={() => setIsAddingNew(true)}
                      className="border-2 border-dashed border-emerald-300 bg-emerald-50/60 text-emerald-800 font-black py-3.5 px-2 rounded-2xl flex items-center justify-center gap-1.5 hover:bg-emerald-50 active:scale-95 transition-all text-xs uppercase tracking-wider"
                    >
                      <Plus className="w-4 h-4 text-brand shrink-0" />
                      <span>Add Address</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsMapModalOpen(true)}
                      className="bg-gradient-to-r from-emerald-600 to-brand text-white font-black py-3.5 px-2 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all text-xs uppercase tracking-wider"
                    >
                      <MapPin className="w-4 h-4 text-white shrink-0" />
                      <span>{pinnedCoords ? 'Relocate Pin' : 'Pin on Map'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-black text-text-primary uppercase tracking-wide">New Address</h3>
                    <button onClick={() => setIsAddingNew(false)} className="text-brand text-xs font-bold">Cancel</button>
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Title (e.g. Home, Office)"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="House No, Building Name *"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    value={newLine1}
                    onChange={(e) => setNewLine1(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Landmark"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    value={newLandmark}
                    onChange={(e) => setNewLandmark(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="PIN Code *"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                  />

                  {/* Pin Location on Map Option inside Add Address Form */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setIsMapModalOpen(true)}
                      className={`w-full py-3 px-3.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                        pinnedCoords
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-emerald-50/50 hover:border-emerald-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className={`w-4 h-4 shrink-0 ${pinnedCoords ? 'text-brand' : 'text-gray-500'}`} />
                        <span className="truncate">
                          {pinnedCoords ? 'Exact Doorstep Location Pinned ✓' : 'Pin Doorstep Location on Map'}
                        </span>
                      </div>
                      <span className="text-[11px] text-brand font-black shrink-0 underline ml-2">
                        {pinnedCoords ? 'Relocate' : 'Set Pin'}
                      </span>
                    </button>
                    {pinnedCoords?.addressHint && (
                      <p className="text-[10px] text-emerald-700 font-medium px-1 mt-1 truncate">
                        📍 Pinned near: {pinnedCoords.addressHint}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <label className="flex items-center gap-3 cursor-pointer mb-4">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-brand rounded border-gray-300 focus:ring-brand"
                        checked={isSomeoneElse}
                        onChange={(e) => setIsSomeoneElse(e.target.checked)}
                      />
                      <span className="font-semibold text-sm text-text-primary">Ordering for someone else?</span>
                    </label>

                    {isSomeoneElse && (
                      <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-brand/20">
                        <input
                          type="text"
                          placeholder="Recipient Name *"
                          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                        />
                        <input
                          type="tel"
                          placeholder="Recipient Phone Number *"
                          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand"
                          value={recipientPhone}
                          onChange={(e) => setRecipientPhone(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <Button 
                    className="w-full mt-4 bg-brand text-white font-black" 
                    onClick={handleSaveNewAddress}
                  >
                    Save Address
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Doorstep Location Pin Map Modal ── */}
      <LocationPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialCoords={pinnedCoords || { lat: 12.9340, lng: 78.2680 }}
        onConfirm={(coords) => {
          setPinnedCoords(coords);
          if (coords.addressHint && !newLandmark) {
            setNewLandmark(coords.addressHint);
          }
          setIsMapModalOpen(false);
        }}
      />
    </div>
  );
};


