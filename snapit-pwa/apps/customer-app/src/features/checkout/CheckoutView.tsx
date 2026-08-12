import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '../../utils/currency';
import { Button } from '../../components/ui/Button';
import { ChevronLeft, MapPin, CreditCard, Banknote, CheckCircle2 } from 'lucide-react';
import { mockShoppingProducts, mockFoodProducts } from '../../api/mockData';

const allProducts = [...mockShoppingProducts, ...mockFoodProducts];

export const CheckoutView: React.FC = () => {
  const { items, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash'>('upi');

  const cartItemsWithDetails = items.map(item => ({
    ...item,
    product: allProducts.find(p => p.id === item.productId)
  })).filter(item => item.product !== undefined);

  const itemTotal = cartItemsWithDetails.reduce((sum, item) => sum + (item.product!.price * item.quantity), 0);
  const deliveryFee = 3000;
  const total = itemTotal + deliveryFee;

  const handlePlaceOrder = () => {
    // In a real app, this would make an API call to create the order
    // For now, we just clear the cart and go to success
    clearCart();
    navigate('/success');
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="max-w-md mx-auto relative min-h-screen bg-gray-50 flex flex-col pb-24 shadow-2xl overflow-x-hidden">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md px-4 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors">
          <ChevronLeft className="w-6 h-6 text-text-primary" />
        </button>
        <h1 className="font-bold text-lg text-text-primary">Checkout</h1>
      </div>

      <div className="p-4 flex flex-col gap-6 overflow-y-auto">
        
        {/* Delivery Address */}
        <section>
          <h2 className="font-bold text-text-primary mb-3 text-sm uppercase tracking-wider text-gray-500">Delivery Address</h2>
          <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand"></div>
            <div className="flex gap-3">
              <MapPin className="w-5 h-5 text-brand mt-0.5 flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-text-primary">Home</h3>
                  <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Default</span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  123 Main Street, Block B<br />
                  Near Central Park, KGF - 563122
                </p>
                <p className="text-sm font-medium text-text-primary mt-2">
                  +91 98765 43210
                </p>
              </div>
            </div>
            <button className="w-full mt-4 py-2 text-sm font-bold text-brand border border-brand/20 rounded-xl hover:bg-brand/5 transition-colors">
              Change Address
            </button>
          </div>
        </section>

        {/* Order Summary */}
        <section>
          <h2 className="font-bold text-text-primary mb-3 text-sm uppercase tracking-wider text-gray-500">Bill Details</h2>
          <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100">
            <div className="flex justify-between text-sm mb-3 text-text-secondary">
              <span>Item Total</span>
              <span className="font-medium text-text-primary">{formatCurrency(itemTotal)}</span>
            </div>
            <div className="flex justify-between text-sm mb-3 text-text-secondary">
              <span>Delivery Partner Fee</span>
              <span className="font-medium text-text-primary">{formatCurrency(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-sm mb-3 text-text-secondary">
              <span>Online Convenience Fee</span>
              <span className="font-medium text-text-primary">{formatCurrency(0)}</span>
            </div>
            <div className="flex justify-between text-sm mb-3 text-text-secondary">
              <span>Handling Fee</span>
              <span className="font-medium text-text-primary">{formatCurrency(0)}</span>
            </div>
            <div className="flex justify-between text-sm mb-4 text-text-secondary">
              <span>GST & Taxes</span>
              <span className="font-medium text-text-primary">{formatCurrency(0)}</span>
            </div>
            <div className="border-t border-dashed border-gray-200 pt-4 flex justify-between font-bold text-lg text-text-primary">
              <span>To Pay</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </section>

        {/* Payment Method */}
        <section>
          <h2 className="font-bold text-text-primary mb-3 text-sm uppercase tracking-wider text-gray-500">Payment Method</h2>
          <div className="bg-white rounded-2xl p-2 shadow-sm flex flex-col">
            
            <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${paymentMethod === 'upi' ? 'bg-brand/5 border border-brand/20' : 'hover:bg-gray-50 border border-transparent'}`}>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === 'upi' ? 'border-brand' : 'border-gray-300'}`}>
                {paymentMethod === 'upi' && <div className="w-3 h-3 rounded-full bg-brand"></div>}
              </div>
              <CreditCard className={`w-5 h-5 ${paymentMethod === 'upi' ? 'text-brand' : 'text-gray-400'}`} />
              <span className={`font-semibold ${paymentMethod === 'upi' ? 'text-brand' : 'text-text-primary'}`}>UPI / Card Online</span>
            </label>

            <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors mt-1 ${paymentMethod === 'cash' ? 'bg-brand/5 border border-brand/20' : 'hover:bg-gray-50 border border-transparent'}`}>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === 'cash' ? 'border-brand' : 'border-gray-300'}`}>
                {paymentMethod === 'cash' && <div className="w-3 h-3 rounded-full bg-brand"></div>}
              </div>
              <Banknote className={`w-5 h-5 ${paymentMethod === 'cash' ? 'text-brand' : 'text-gray-400'}`} />
              <span className={`font-semibold ${paymentMethod === 'cash' ? 'text-brand' : 'text-text-primary'}`}>Cash on Delivery</span>
            </label>

          </div>
        </section>

      </div>

      {/* Sticky Bottom Footer */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
        <Button 
          className="w-full h-14 text-lg font-bold shadow-[0_8px_16px_rgba(4,107,53,0.3)] hover:scale-[1.01] transition-transform flex items-center justify-center gap-2"
          onClick={handlePlaceOrder}
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Place Order • {formatCurrency(total)}</span>
        </Button>
      </div>
    </div>
  );
};
