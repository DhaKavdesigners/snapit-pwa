import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils/currency';
import { Button } from '../../components/ui/Button';
import { mockShoppingProducts, mockFoodProducts } from '../../api/mockData';
import {
  ChevronLeft, MapPin, CreditCard, Banknote, Smartphone,
  CheckCircle2, AlertCircle, ArrowRight, X, User, Plus
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const allProducts = [...mockShoppingProducts, ...mockFoodProducts];

type PayMethod = 'online' | 'upiDelivery';

export const CheckoutView: React.FC = () => {
  const { items, clearCart, saveLastOrder } = useCartStore();
  const { userProfile } = useAuthStore();
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState<PayMethod>('online');
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<'registered' | 'college' | 'new'>('registered');
  
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

  // ── Silent trust controls ──────────────────────────────────────────────────
  const deliveryVerified = userProfile?.deliveryVerified ?? false;
  const maxCodLimit      = userProfile?.maxCodLimit ?? 30000;

  const cartItemsWithDetails = items.map(item => ({
    ...item,
    product: allProducts.find(p => p.id === item.productId),
  })).filter(item => item.product !== undefined);

  const itemTotal   = cartItemsWithDetails.reduce((sum, item) => sum + (item.product!.price * item.quantity), 0);
  const deliveryFee = 3000;
  const total       = itemTotal + deliveryFee;

  // ── Address Logic ────────────────────────────────────────
  const hasProfile = !!userProfile;
  
  const isUsingNewAddress = selectedAddressId === 'new' && newLine1.trim().length > 0;
  const isCollegeAddress = selectedAddressId === 'college';
  
  const displayAddressLine = isUsingNewAddress 
    ? newLine1 
    : isCollegeAddress ? 'Dttit kgf'
    : hasProfile ? `${userProfile!.addressLine1}${userProfile!.addressLine2 ? `, ${userProfile!.addressLine2}` : ''}` : '';
    
  const displayLandmark = isUsingNewAddress ? newLandmark : isCollegeAddress ? 'oorgaum post' : userProfile?.landmark;
  const displayPin = isUsingNewAddress ? newPin : isCollegeAddress ? '563120' : userProfile?.pincode;
  const displayTitle = isUsingNewAddress ? (newTitle || 'NEW ADDRESS') : isCollegeAddress ? 'COLLEGE' : 'REGISTERED ADDRESS';
  
  const finalRecipientName = isSomeoneElse && recipientName.trim() ? recipientName : (userProfile?.name || 'Guest');
  const finalRecipientPhone = isSomeoneElse && recipientPhone.trim() ? recipientPhone : (userProfile?.phone || '');

  const handlePlaceOrder = async () => {
    try {
      const displayId = `#${Math.floor(1000 + Math.random() * 9000)}`;
      
      const activeAddressObject = {
        title: displayTitle,
        line1: displayAddressLine,
        landmark: displayLandmark,
        pincode: displayPin,
        recipientName: finalRecipientName,
        recipientPhone: finalRecipientPhone
      };

      const mappedPaymentMethod = paymentMethod === 'online' ? 'UPI_ONLINE' : 'UPI_ON_DELIVERY';

      // 1. Insert Order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          merchant_id: 'd4444444-4444-4444-4444-444444444444',
          customer_id: 'a1111111-1111-1111-1111-111111111111',
          display_id: displayId,
          status: 'PLACED',
          subtotal_paise: itemTotal, // Already in paise
          delivery_fee_paise: deliveryFee, // Already in paise
          grand_total_paise: total, // Already in paise
          payment_method: mappedPaymentMethod,
          delivery_address_snapshot: activeAddressObject
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Insert Order Items
      const orderItems = cartItemsWithDetails.map(item => ({
        order_id: orderData.id,
        // Using mock string IDs will fail if DB enforces UUID. Assuming DB uses UUID, 
        // we omit product_id if mock data isn't matching, or simply provide it if mock data is updated.
        // For now, we will omit product_id to avoid UUID casting errors, relying on the snapshot.
        product_name_snapshot: item.product!.name,
        quantity: item.quantity,
        unit_price_paise: item.product!.price
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      saveLastOrder({
        orderId: displayId,
        total,
        itemNames: cartItemsWithDetails.map(i => i.product!.name),
        paymentMethod: paymentMethod === 'online' ? 'upi' : 'upiDelivery',
      });
      clearCart();
      navigate('/success');
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order. Please check the console.");
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

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  // ── CTA label depends on payment method ────────────────────────────────────
  const ctaLabel = paymentMethod === 'online'
    ? `Pay ${formatCurrency(total)}`
    : `Place Order • ${formatCurrency(total)} Due`;

  return (
    <div className="max-w-md mx-auto relative min-h-screen bg-gray-50 flex flex-col pb-28 shadow-2xl overflow-x-hidden">

      {/* ── Header ── */}
      <div className="bg-white/80 backdrop-blur-md px-4 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors">
          <ChevronLeft className="w-6 h-6 text-text-primary" />
        </button>
        <h1 className="font-bold text-lg text-text-primary">Checkout</h1>
      </div>

      <div className="p-4 flex flex-col gap-5 overflow-y-auto">

        {/* ── Delivery Address ── */}
        <section>
          <div className="mb-2">
            <h2 className="font-bold text-text-primary text-xs uppercase tracking-wider text-gray-400">Delivery Address</h2>
          </div>
          
          {hasProfile || isUsingNewAddress ? (
            <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-brand/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand rounded-l-2xl" />
              <div className="flex gap-3 pl-1">
                <MapPin className="w-5 h-5 text-brand mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-text-primary truncate">{finalRecipientName}</h3>
                      <span className="bg-brand/10 text-brand text-[9px] font-bold px-2 py-0.5 rounded uppercase">{displayTitle}</span>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {displayAddressLine}
                    {displayLandmark && <><br />{displayLandmark}</>}
                    {displayPin && <><br />PIN: {displayPin}</>}
                  </p>
                  {finalRecipientPhone && (
                    <p className="text-sm font-medium text-text-primary mt-2 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      +91 {finalRecipientPhone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-5 border border-dashed border-gray-300 text-center">
              <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="font-semibold text-gray-500 text-sm">No delivery address</p>
              <button
                onClick={() => setIsAddressModalOpen(true)}
                className="mt-3 text-brand font-bold text-sm underline"
              >
                Add Address →
              </button>
            </div>
          )}

          {/* New address buttons below the card */}
          <div className="flex gap-3 mt-4">
            <button 
              onClick={() => setUseCurrentLocation(!useCurrentLocation)}
              className={`flex-1 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors border ${
                useCurrentLocation 
                  ? 'bg-brand/10 text-brand border-brand/30' 
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <MapPin className="w-4 h-4" /> {useCurrentLocation ? 'Using Live Location' : 'Use Live Location'}
            </button>
            
            <button 
              onClick={() => {
                setIsAddressModalOpen(true);
                setUseCurrentLocation(false);
              }}
              className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs hover:bg-gray-50 transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
            >
              <Plus className="w-4 h-4 text-brand" /> Add New Address
            </button>
          </div>
        </section>

        {/* ── Bill Details ── */}
        <section>
          <h2 className="font-bold text-text-primary mb-2 text-xs uppercase tracking-wider text-gray-400">Bill Details</h2>
          <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100">
            <div className="flex justify-between text-sm mb-3 text-text-secondary">
              <span>Item Total</span>
              <span className="font-medium text-text-primary">{formatCurrency(itemTotal)}</span>
            </div>
            <div className="flex justify-between text-sm mb-4 text-text-secondary">
              <span>Delivery</span>
              <span className="font-medium text-text-primary">{formatCurrency(deliveryFee)}</span>
            </div>
            <div className="border-t border-dashed border-gray-200 pt-4 flex justify-between font-bold text-lg text-text-primary">
              <span>To Pay</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </section>

        {/* ── Payment Method ── */}
        <section>
          <h2 className="font-bold text-text-primary mb-2 text-xs uppercase tracking-wider text-gray-400">Payment Method</h2>
          
          <div className="flex flex-col gap-4">
            {/* 1. Online Payment Group */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center">1</span>
                <span className="font-black text-base text-brand">Online Payment</span>
              </div>
              
              {/* Option 1a: Pay Now via UPI / Card */}
              <label
                className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-gray-50 ${
                  paymentMethod === 'online' ? 'bg-brand/5' : 'hover:bg-gray-50'
                }`}
                onClick={() => setPaymentMethod('online')}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  paymentMethod === 'online' ? 'border-brand' : 'border-gray-300'
                }`}>
                  {paymentMethod === 'online' && <div className="w-2.5 h-2.5 rounded-full bg-brand" />}
                </div>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  paymentMethod === 'online' ? 'bg-brand' : 'bg-gray-100'
                }`}>
                  <CreditCard className={`w-5 h-5 ${paymentMethod === 'online' ? 'text-white' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <p className={`font-bold text-sm ${paymentMethod === 'online' ? 'text-brand' : 'text-text-primary'}`}>
                    Pay Now via UPI / Card
                  </p>
                  <p className="text-[11px] text-text-secondary">Fast and secure online payment</p>
                </div>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Recommended</span>
              </label>

              {/* Option 1b: Pay on Delivery via UPI */}
              <label
                className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${
                  paymentMethod === 'upiDelivery' ? 'bg-brand/5' : 'hover:bg-gray-50'
                }`}
                onClick={() => setPaymentMethod('upiDelivery')}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  paymentMethod === 'upiDelivery' ? 'border-brand' : 'border-gray-300'
                }`}>
                  {paymentMethod === 'upiDelivery' && <div className="w-2.5 h-2.5 rounded-full bg-brand" />}
                </div>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  paymentMethod === 'upiDelivery' ? 'bg-brand' : 'bg-gray-100'
                }`}>
                  <Smartphone className={`w-5 h-5 ${paymentMethod === 'upiDelivery' ? 'text-white' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <p className={`font-bold text-sm ${paymentMethod === 'upiDelivery' ? 'text-brand' : 'text-text-primary'}`}>
                    Pay on Delivery via UPI
                  </p>
                  <p className="text-[11px] text-text-secondary">Strictly NO CASH accepted. Scan QR at doorstep.</p>
                </div>
              </label>
            </div>

            {/* 2. Cash Payment Group */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 text-xs font-bold flex items-center justify-center">2</span>
                <span className="font-black text-base text-gray-800">Cash Payment</span>
              </div>

              {/* Option 3: Cash on Delivery — disabled */}
              <div className="flex items-center gap-3 p-4 opacity-50 cursor-not-allowed select-none grayscale">
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                <div className="w-9 h-9 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
                  <Banknote className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-gray-600">Cash on Delivery</p>
                    <span className="text-[9px] font-black text-white bg-red-400/90 px-2 py-0.5 rounded-full uppercase">Unavailable</span>
                  </div>
                  <p className="text-[11px] text-gray-500">Coming soon in future updates</p>
                </div>
              </div>

              {/* COD guardrail (silent, for unverified users over limit) */}
            </div>
          </div>
        </section>

      </div>

      {/* ── Sticky CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-md border-t border-gray-100 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
        <Button
          className="w-full h-14 text-base font-bold shadow-[0_8px_16px_rgba(4,107,53,0.3)] hover:scale-[1.01] transition-transform flex items-center justify-center gap-2"
          onClick={handlePlaceOrder}
          disabled={!hasProfile && !isUsingNewAddress}
        >
          {paymentMethod === 'online'
            ? <><CreditCard className="w-5 h-5" /><span>{ctaLabel}</span><ArrowRight className="w-4 h-4" /></>
            : <><CheckCircle2 className="w-5 h-5" /><span>{ctaLabel}</span></>
          }
        </Button>
        {(!hasProfile && !isUsingNewAddress) && (
          <p className="text-center text-xs text-red-500 mt-2 font-semibold">Please add a delivery address first.</p>
        )}
      </div>

      {/* ── Address Selector Modal ── */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm">
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
              {/* Modal Content begins */}

              {!isAddingNew ? (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Saved Addresses</h3>
                  
                  {/* Mock Saved Addresses */}
                  <label 
                    className={`flex items-start gap-3 bg-white p-4 rounded-xl border shadow-sm cursor-pointer relative overflow-hidden ${selectedAddressId === 'registered' ? 'border-brand/40' : 'border-gray-200'}`}
                    onClick={() => setSelectedAddressId('registered')}
                  >
                    {selectedAddressId === 'registered' && <div className="absolute top-0 left-0 w-1 h-full bg-brand" />}
                    <input type="radio" name="address" className="mt-1" checked={selectedAddressId === 'registered'} readOnly />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-text-primary">REGISTERED ADDRESS</span>
                      </div>
                      <p className="text-sm text-text-secondary leading-snug">
                        {userProfile?.addressLine1 || '#450, Maariyaman temple street'}
                        <br/>PIN: {userProfile?.pincode || '563122'}
                      </p>
                    </div>
                  </label>

                  <label 
                    className={`flex items-start gap-3 bg-white p-4 rounded-xl border cursor-pointer relative overflow-hidden ${selectedAddressId === 'college' ? 'border-brand/40' : 'border-gray-200'}`}
                    onClick={() => setSelectedAddressId('college')}
                  >
                    {selectedAddressId === 'college' && <div className="absolute top-0 left-0 w-1 h-full bg-brand" />}
                    <input type="radio" name="address" className="mt-1" checked={selectedAddressId === 'college'} readOnly />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-text-primary">COLLEGE</span>
                      </div>
                      <p className="text-sm text-text-secondary leading-snug">
                        Dttit kgf<br/>Landmark: oorgaum post<br/>PIN: 563120
                      </p>
                    </div>
                  </label>
                  
                  {newLine1.trim().length > 0 && (
                    <label 
                      className={`flex items-start gap-3 bg-white p-4 rounded-xl border cursor-pointer relative overflow-hidden ${selectedAddressId === 'new' ? 'border-brand/40' : 'border-gray-200'}`}
                      onClick={() => setSelectedAddressId('new')}
                    >
                      {selectedAddressId === 'new' && <div className="absolute top-0 left-0 w-1 h-full bg-brand" />}
                      <input type="radio" name="address" className="mt-1" checked={selectedAddressId === 'new'} readOnly />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-text-primary">{newTitle || 'NEW ADDRESS'}</span>
                        </div>
                        <p className="text-sm text-text-secondary leading-snug">
                          {newLine1}<br/>PIN: {newPin}
                        </p>
                      </div>
                    </label>
                  )}

                  <button 
                    onClick={() => setIsAddingNew(true)}
                    className="w-full border-2 border-dashed border-gray-300 text-gray-600 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white hover:border-gray-400 transition-colors mt-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add New Address
                  </button>
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

                  {/* Ordering for someone else Toggle */}
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
                        <p className="text-[10px] text-gray-500 leading-tight">
                          The rider will contact this person directly for delivery.
                        </p>
                      </div>
                    )}
                  </div>

                  <Button 
                    className="w-full mt-4" 
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
    </div>
  );
};
