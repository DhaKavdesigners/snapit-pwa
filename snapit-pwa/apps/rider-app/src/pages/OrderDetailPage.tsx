/**
 * OrderDetailPage.tsx — Active delivery detail with:
 * - Full status stepper
 * - Order items list
 * - Mock route display (Phase 1)
 * - UPI QR modal (paymentMethod === 'UPI_DELIVERY')
 * - 4-digit PIN handshake (OUT_FOR_DELIVERY → DELIVERED)
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import {
  ChevronLeft,
  Phone,
  MapPin,
  Package,
  CheckCircle,
  Navigation,
  QrCode,
  CreditCard,
} from 'lucide-react';

import { StatusStepper } from '../components/StatusStepper';
import { PinInput } from '../components/PinInput';
import { UpiQrModal } from '../components/UpiQrModal';
import { useRiderStore, selectActiveOrder } from '../stores/riderStore';
import { formatCurrency, getStoreMeta, getItemName, MOCK_ACTIVE_ORDER } from '../lib/mockData';
import { playDeliveredChime } from '../lib/audio';
import type { OrderStatus } from '../../../../shared/types/snapit-types';

// ── Mock Route Display ───────────────────────────────────────────────────────

function MockRouteDisplay({ from, to, status }: {
  from: string;
  to: string;
  status: OrderStatus;
}) {
  const isPickup = status === 'RIDER_ASSIGNED';

  return (
    <div className="card overflow-hidden mb-4">
      {/* Map placeholder */}
      <div
        className="relative h-44 flex items-center justify-center"
        style={{
          background: 'linear-gradient(145deg, #ecfdf5 0%, #d1fae5 50%, #ecfdf5 100%)',
        }}
      >
        {/* Road lines */}
        <div className="absolute inset-0 overflow-hidden">
          {[20, 40, 60, 80].map((pos) => (
            <div
              key={pos}
              className="absolute w-full h-px bg-emerald-200 opacity-60"
              style={{ top: `${pos}%` }}
            />
          ))}
          {[20, 40, 60, 80].map((pos) => (
            <div
              key={pos}
              className="absolute h-full w-px bg-emerald-200 opacity-60"
              style={{ left: `${pos}%` }}
            />
          ))}
        </div>

        {/* Route path */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
          <path
            d="M 30,80 Q 80,20 170,30"
            fill="none"
            stroke="#059669"
            strokeWidth="2.5"
            strokeDasharray="6,4"
            opacity="0.7"
          />
        </svg>

        {/* Store pin */}
        <div className="absolute left-[15%] top-[70%] -translate-y-full">
          <div className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border-2 border-emerald-500">
            <span className="text-xs">🏪</span>
          </div>
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-emerald-700 text-[9px] font-bold whitespace-nowrap">
            {from}
          </div>
        </div>

        {/* Rider position (animated) */}
        <motion.div
          className="absolute"
          style={{ left: isPickup ? '25%' : '55%', top: '50%' }}
          animate={{ y: [-3, 3, -3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-9 h-9 brand-gradient rounded-full shadow-lg flex items-center justify-center border-2 border-white">
            <span className="text-base">🛵</span>
          </div>
        </motion.div>

        {/* Customer pin */}
        <div className="absolute right-[8%] top-[25%]">
          <div className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border-2 border-slate-400">
            <span className="text-xs">🏠</span>
          </div>
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-slate-600 text-[9px] font-bold whitespace-nowrap">
            {to}
          </div>
        </div>

        {/* Phase 1 badge */}
        <div className="absolute top-2 right-2 bg-white/80 rounded-lg px-2 py-1 backdrop-blur-sm">
          <p className="text-slate-500 text-[10px] font-medium">📍 Mock Route · GPS in Phase 2</p>
        </div>
      </div>

      {/* Route info bar */}
      <div className="px-4 py-3 flex items-center justify-between bg-white border-t border-slate-100">
        <div className="flex items-center gap-2">
          <Navigation size={15} className="text-emerald-600" />
          <span className="text-slate-700 text-sm font-semibold">
            {isPickup ? 'Head to store for pickup' : 'Head to customer for delivery'}
          </span>
        </div>
        <span className="text-slate-500 text-xs font-medium">~1.8 km</span>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const navigate = useNavigate();

  const activeOrder = useRiderStore(selectActiveOrder);
  const { updateActiveOrderStatus, markOrderDelivered } = useRiderStore();
  const rider = useRiderStore((s) => s.rider);

  // Fallback to mock active order if store is empty (e.g., direct URL navigation in dev)
  const order = activeOrder ?? MOCK_ACTIVE_ORDER;

  const [showQr, setShowQr] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [isDelivered, setIsDelivered] = useState(false);

  const store = getStoreMeta(order.storeId);

  const handlePickedUp = useCallback(() => {
    updateActiveOrderStatus('PICKED_UP');
    setTimeout(() => updateActiveOrderStatus('OUT_FOR_DELIVERY'), 500);
  }, [updateActiveOrderStatus]);

  const handlePinComplete = useCallback(
    (pin: string) => {
      const correct = order.handshakePinHash;
      if (pin === correct) {
        // Valid PIN → fire delivered chime + update DB
        setPinError(false);
        playDeliveredChime();
        setIsDelivered(true);
        markOrderDelivered(order.id);
        // In Phase 2: fire Supabase trigger to set deliveryVerified: true
      } else {
        setPinError(true);
      }
    },
    [order.handshakePinHash, order.id, markOrderDelivered],
  );

  if (isDelivered) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ backgroundColor: '#FAFAF8' }}>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div className="text-8xl mb-6">🎉</div>
          <h2 className="text-slate-900 font-extrabold text-2xl mb-2">Delivered!</h2>
          <p className="text-slate-500 text-sm font-medium mb-2">
            Order {order.id} successfully completed.
          </p>
          <p className="text-emerald-600 font-bold text-lg mb-8">
            +{formatCurrency(Math.floor(order.estimatedTotal * 0.12))} earned
          </p>
          <button
            id="back-to-dashboard-btn"
            onClick={() => navigate('/dashboard')}
            className="btn-primary px-8"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="brand-gradient px-4 pt-12 pb-6">
        <button
          id="order-back-btn"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-white/80 text-sm font-medium mb-4"
        >
          <ChevronLeft size={18} /> Dashboard
        </button>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-200 text-xs font-medium uppercase tracking-wide">Active Order</p>
            <h1 className="text-white font-extrabold text-xl mt-0.5">{order.id}</h1>
          </div>
          <div className="text-right">
            <p className="text-emerald-200 text-xs font-medium">Order Value</p>
            <p className="text-white font-extrabold text-xl">{formatCurrency(order.estimatedTotal)}</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Status stepper */}
        <div className="card p-4">
          <StatusStepper currentStatus={order.status} />
        </div>

        {/* Mock route */}
        <MockRouteDisplay
          from={store.area}
          to={order.deliveryAddress.city}
          status={order.status}
        />

        {/* Customer info */}
        <div className="card p-4">
          <h3 className="text-slate-700 font-bold text-sm mb-3 flex items-center gap-2">
            <MapPin size={15} className="text-emerald-600" /> Delivery Address
          </h3>
          <p className="text-slate-800 font-semibold text-sm">{order.deliveryAddress.line1}</p>
          {order.deliveryAddress.line2 && (
            <p className="text-slate-500 text-sm">{order.deliveryAddress.line2}</p>
          )}
          <p className="text-slate-500 text-sm">
            {order.deliveryAddress.city} — {order.deliveryAddress.pincode}
          </p>
          {order.recipientName && (
            <div className="mt-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              <p className="text-amber-700 text-xs font-semibold">
                👤 Recipient: {order.recipientName}
              </p>
              <a
                href={`tel:${order.recipientPhone}`}
                className="flex items-center gap-1 text-amber-600 text-xs font-medium mt-1"
              >
                <Phone size={11} /> {order.recipientPhone}
              </a>
            </div>
          )}
        </div>

        {/* Order items */}
        <div className="card p-4">
          <h3 className="text-slate-700 font-bold text-sm mb-3 flex items-center gap-2">
            <Package size={15} className="text-emerald-600" /> Order Items
          </h3>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                <span className="text-slate-700 text-sm font-medium flex-1 mr-2">
                  {getItemName(item.productId)}
                </span>
                <span className="text-slate-500 text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded-lg">
                  × {item.quantity}
                </span>
              </div>
            ))}
          </div>
          {order.cookingInstructions && (
            <div className="mt-3 bg-amber-50 rounded-xl px-3 py-2 border border-amber-100">
              <p className="text-amber-700 text-xs font-medium">📝 {order.cookingInstructions}</p>
            </div>
          )}
        </div>

        {/* Payment info */}
        <div className="card p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-emerald-600" />
            <div>
              <p className="text-slate-700 text-sm font-bold">Payment</p>
              <p className="text-slate-500 text-xs">
                {order.paymentMethod === 'UPI_NOW'
                  ? 'Already paid via UPI — nothing to collect'
                  : 'Collect payment at doorstep via UPI QR'
                }
              </p>
            </div>
          </div>
          {order.paymentMethod === 'UPI_DELIVERY' && (
            <button
              id="show-qr-btn"
              onClick={() => setShowQr(true)}
              className="flex items-center gap-1 pill-brand"
            >
              <QrCode size={13} /> Show QR
            </button>
          )}
        </div>

        {/* Action CTAs based on status */}
        <AnimatePresence mode="wait">
          {order.status === 'RIDER_ASSIGNED' && (
            <motion.div key="pickup" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <button
                id="picked-up-btn"
                onClick={handlePickedUp}
                className="btn-primary w-full h-14 flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} /> I've Picked Up the Order
              </button>
            </motion.div>
          )}

          {order.status === 'OUT_FOR_DELIVERY' && !showPinInput && (
            <motion.div key="deliver" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="card p-5 space-y-3">
                <h3 className="text-slate-800 font-bold text-base">Confirm Delivery</h3>
                <p className="text-slate-500 text-sm">
                  Ask the customer for their <strong>4-digit delivery PIN</strong> to complete handshake.
                </p>
                {order.paymentMethod === 'UPI_DELIVERY' && (
                  <button
                    id="collect-payment-btn"
                    onClick={() => setShowQr(true)}
                    className="btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    <QrCode size={16} /> Collect UPI Payment First
                  </button>
                )}
                <button
                  id="enter-pin-btn"
                  onClick={() => setShowPinInput(true)}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  🔐 Enter Delivery PIN
                </button>
              </div>
            </motion.div>
          )}

          {showPinInput && (
            <motion.div key="pin" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="card p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-slate-800 font-bold text-base">🔐 4-Digit PIN</h3>
                  <button
                    onClick={() => { setShowPinInput(false); setPinError(false); }}
                    className="text-slate-400 text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-slate-500 text-sm text-center mb-6">
                  Ask the customer for their OTP
                </p>
                <PinInput
                  onComplete={handlePinComplete}
                  hasError={pinError}
                  onReset={() => setPinError(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* UPI QR Modal */}
      <UpiQrModal
        isOpen={showQr}
        onClose={() => setShowQr(false)}
        amountPaise={order.estimatedTotal}
        upiId={rider?.upiId ?? 'snapit.rider@upi'}
        orderId={order.id}
        recipientName={order.recipientName}
      />
    </div>
  );
}
