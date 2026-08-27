import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  X, MapPin, Store as StoreIcon, Package, Check, 
  Bike, Home, Sparkles, Clock, AlertCircle, Phone, 
  ChefHat, HelpCircle, ArrowRight, CheckCircle2, ShieldCheck, Box, MessageSquare, Star
} from 'lucide-react';
import { useOrderStore, LiveOrder, getActiveOrders } from '../../store/orderStore';
import { formatCurrency } from '../../utils/currency';

// Imported milestone images
import packingImg from '../../assets/packing_icon.png';
import packedImg from '../../assets/packed.png';
import outForDeliveryImg from '../../assets/out_for_delivery.jpg';
import deliveredImg from '../../assets/delivered.png';
import riderIconImg from '../../assets/rider_icon.jpg';

interface StepDetail {
  id: number;
  label: string;
  sublabel: string;
  x: number;
  y: number;
  imgSrc?: string;
  iconFallback?: any;
  statusKey: string;
}

export const LiveOrderTrackerModal: React.FC = () => {
  const navigate = useNavigate();
  const { isTrackerOpen, setTrackerOpen, orders, storesMap, selectedOrderId } = useOrderStore();
  const [rating, setRating] = useState<number>(5);

  const activeOrders = getActiveOrders(orders);
  
  // Find order to display: selectedOrderId, or first active order, or latest order
  const currentOrder: LiveOrder | undefined = selectedOrderId
    ? orders.find(o => o.id === selectedOrderId)
    : activeOrders[0] || orders[0];

  const status = currentOrder?.status || 'PLACED';

  // Trigger celebratory party pop confetti when order is DELIVERED
  useEffect(() => {
    if (status === 'DELIVERED' && isTrackerOpen) {
      try {
        const confettiFn = (window as any).confetti;
        if (typeof confettiFn === 'function') {
          confettiFn({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.55 },
            colors: ['#00E676', '#10B981', '#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7']
          });
          const timer = setTimeout(() => {
            confettiFn({
              particleCount: 60,
              angle: 60,
              spread: 60,
              origin: { x: 0.1, y: 0.6 },
              colors: ['#00E676', '#FFD700', '#FF9F43']
            });
            confettiFn({
              particleCount: 60,
              angle: 120,
              spread: 60,
              origin: { x: 0.9, y: 0.6 },
              colors: ['#00E676', '#10B981', '#54A0FF']
            });
          }, 350);
          return () => clearTimeout(timer);
        }
      } catch (e) {
        // Safe fallback
      }
    }
  }, [status, isTrackerOpen]);

  if (!isTrackerOpen || !currentOrder) return null;

  const storeName = storesMap[currentOrder.store_id] || 'SnapIt Partner Store';

  // Check if store is Food or Grocery
  const isFood = (currentOrder.store_id || '').toLowerCase().startsWith('f') || 
    ['bakio', 'mayura', 'biriyani', 'biryani', 'al baik', 'al naz', 'restaurant', 'cafe', 'kitchen']
      .some(k => storeName.toLowerCase().includes(k));

  // Determine the 5 specific steps with their respective illustration images
  const preparingLabel = isFood ? 'Chef Preparing' : 'Store Packing';
  const preparingSublabel = isFood ? 'Cooking fresh dishes' : 'Packing fresh items';

  // 5 Step Milestones in SVG coordinates (viewBox 380 x 200 with 30px right margin)
  // Top Row Y = 45 (Nodes at X = 45, 170, 295)
  // Bottom Row Y = 145 (Nodes at X = 170, 45)
  const ROADMAP_STEPS: StepDetail[] = [
    {
      id: 1,
      label: 'Order Placed',
      sublabel: 'Counter confirmed',
      x: 45,
      y: 45,
      iconFallback: Package,
      statusKey: 'PLACED',
    },
    {
      id: 2,
      label: preparingLabel,
      sublabel: preparingSublabel,
      x: 170,
      y: 45,
      imgSrc: packingImg,
      iconFallback: ChefHat,
      statusKey: 'PREPARING',
    },
    {
      id: 3,
      label: 'Ready for Pickup',
      sublabel: 'Package sealed',
      x: 295,
      y: 45,
      imgSrc: packedImg,
      iconFallback: Box,
      statusKey: 'READY_FOR_PICKUP',
    },
    {
      id: 4,
      label: 'Out for Delivery',
      sublabel: 'Rider on the road',
      x: 170,
      y: 145,
      imgSrc: outForDeliveryImg,
      iconFallback: Bike,
      statusKey: 'OUT_FOR_DELIVERY',
    },
    {
      id: 5,
      label: 'Delivered',
      sublabel: 'Doorstep handover',
      x: 45,
      y: 145,
      imgSrc: deliveredImg,
      iconFallback: Home,
      statusKey: 'DELIVERED',
    },
  ];

  // Exact Granular Path Length Math (657.08px total in 380x200 canvas):
  const getProgressState = (st: string) => {
    switch (st) {
      case 'PLACED':
      case 'PENDING':
        return {
          step: 1,
          pathRatio: 0.01,
          title: 'Order Placed at Counter 📥',
          subtitle: 'Store counter confirmed your order and will start assembling shortly.',
          badge: 'PLACED',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          eta: '~12-15 mins',
          isOutForDelivery: false,
        };
      case 'ACCEPTED':
        return {
          step: 1.5,
          pathRatio: 0.095,
          title: isFood ? 'Order Accepted by Kitchen 🍳' : 'Order Accepted by Store 📦',
          subtitle: 'Store accepted your order and is fetching items for packaging.',
          badge: 'ACCEPTED',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
          eta: `~${(currentOrder.prep_time_minutes || 10) + 2} mins`,
          isOutForDelivery: false,
        };
      case 'PREPARING':
      case 'PACKING':
        return {
          step: 2,
          pathRatio: 0.190,
          title: isFood ? 'Chef is Cooking & Preparing 🍳' : 'Store is Packing Fresh Items 📦',
          subtitle: `Store is assembling fresh items (ETA: ~${currentOrder.prep_time_minutes || 10}m)`,
          badge: isFood ? 'PREPARING' : 'PACKING',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
          eta: `~${currentOrder.prep_time_minutes || 10} mins`,
          isOutForDelivery: false,
        };
      case 'READY':
        return {
          step: 2.5,
          pathRatio: 0.285,
          title: 'Packing Finalized 📦',
          subtitle: 'Store completed packing items. Sealing package for pickup.',
          badge: 'READY',
          badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
          eta: '~8-10 mins',
          isOutForDelivery: false,
        };
      case 'READY_FOR_PICKUP':
        return {
          step: 3,
          pathRatio: 0.380,
          title: 'Package Sealed & Ready for Pickup 📦',
          subtitle: 'Store completed packing. Delivery rider is arriving at the counter.',
          badge: 'READY FOR PICKUP',
          badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
          eta: '~7-9 mins',
          isOutForDelivery: false,
        };
      case 'OUT_OF_SHOP':
      case 'HANDED_OVER':
      case 'PICKED_UP':
        return {
          step: 3.5,
          pathRatio: 0.500,
          title: 'Rider Picked Up & Out of Shop 🛵',
          subtitle: 'Package handed over to Suresh. Rider is starting the trip to your address.',
          badge: 'OUT OF SHOP',
          badgeColor: 'bg-emerald-500 text-white border-emerald-600',
          eta: '~4-6 mins',
          isOutForDelivery: true,
        };
      case 'OUT_FOR_DELIVERY':
        return {
          step: 4,
          pathRatio: 0.810,
          title: 'Rider Suresh is Rushing to Your Door! 🛵',
          subtitle: 'Package is on the way! Rider is approaching your registered address.',
          badge: 'OUT FOR DELIVERY',
          badgeColor: 'bg-emerald-500 text-white border-emerald-600',
          eta: '~2-4 mins',
          isOutForDelivery: true,
        };
      case 'DELIVERED':
        return {
          step: 5,
          pathRatio: 1.0,
          title: 'Order Delivered to Doorstep 🎉',
          subtitle: 'Handover complete with PIN handshake. Enjoy your order!',
          badge: 'DELIVERED',
          badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          eta: 'Delivered',
          isOutForDelivery: false,
        };
      case 'REJECTED':
      case 'CANCELLED':
        return {
          step: 0,
          pathRatio: 0,
          title: 'Order Cancelled ❌',
          subtitle: currentOrder.rejection_reason || 'Store was unable to fulfill this order.',
          badge: 'CANCELLED',
          badgeColor: 'bg-red-100 text-red-900 border-red-300',
          eta: 'Cancelled',
          isOutForDelivery: false,
        };
      default:
        return {
          step: 1,
          pathRatio: 0.05,
          title: 'Order in Progress ⚡',
          subtitle: 'Connecting with live merchant counter...',
          badge: st,
          badgeColor: 'bg-gray-100 text-gray-800 border-gray-300',
          eta: '~10 mins',
          isOutForDelivery: false,
        };
    }
  };

  const progressState = getProgressState(status);

  // Deterministic 4-digit Delivery Handshake PIN
  const getDeliveryPin = () => {
    if (currentOrder.delivery_pin && currentOrder.delivery_pin.length === 4) {
      return currentOrder.delivery_pin;
    }
    const digits = (currentOrder.id || '').replace(/\D/g, '');
    if (digits.length >= 4) return digits.slice(-4);
    return '4821';
  };

  const deliveryPin = getDeliveryPin();

  // SVG S-Curve Path definition (viewBox 380 x 200 with plenty of right margin)
  const sPathD = "M 45 45 L 295 45 A 50 50 0 0 1 295 145 L 45 145";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setTrackerOpen(false)}
          className="absolute inset-0 bg-black/65 backdrop-blur-xs"
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          className="relative bg-white rounded-t-[2.5rem] shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden z-10"
        >
          {/* Top Grab Handle */}
          <div className="pt-3 pb-1 flex justify-center bg-white sticky top-0 z-10">
            <div className="w-12 h-1.5 rounded-full bg-gray-200" />
          </div>

          {/* Modal Header */}
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between sticky top-4 bg-white z-10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shadow-2xs shrink-0">
                <StoreIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-gray-900 truncate">{storeName}</h3>
                  <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full border shadow-2xs shrink-0 ${progressState.badgeColor}`}>
                    {progressState.badge}
                  </span>
                </div>
                <p className="text-[11px] font-mono font-bold text-gray-400">{currentOrder.id}</p>
              </div>
            </div>

            <button
              onClick={() => setTrackerOpen(false)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Scrollable Content */}
          <div className="p-5 overflow-y-auto space-y-4">
            {/* ── 1. MATHEMATICALLY PERFECT S-CURVE DELIVERY ROADMAP & ILLUSTRATED MILESTONES ── */}
            <div className="bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-white rounded-3xl p-4.5 border border-emerald-200/80 shadow-xs relative overflow-hidden">
              {/* ETA Headline */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[11px] font-black text-emerald-900 uppercase tracking-wider">
                    Live Delivery Roadmap
                  </span>
                </div>
                <div className="bg-white/90 border border-emerald-200 text-emerald-900 text-xs font-black px-2.5 py-1 rounded-full shadow-2xs flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ETA: {progressState.eta}</span>
                </div>
              </div>

              {/* S-Curve SVG Roadmap Representation (viewBox 380x200 with ample right margin) */}
              <div className="relative w-full aspect-[380/200] my-2">
                <svg className="w-full h-full" viewBox="0 0 380 200" fill="none">
                  {/* Background Base Road */}
                  <path
                    d={sPathD}
                    stroke="#E2E8F0"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Road Center Dashed Line */}
                  <path
                    d={sPathD}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Increasing Glowing Green Progress Stroke (Smooth Flow) */}
                  <motion.path
                    d={sPathD}
                    stroke="url(#emeraldGrad)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: progressState.pathRatio }}
                    transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
                    style={{ filter: 'drop-shadow(0 0 8px rgba(0, 230, 118, 0.6))' }}
                  />

                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="50%" stopColor="#059669" />
                      <stop offset="100%" stopColor="#00E676" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Milestone Step Nodes placed dead-center along the S-Curve */}
                {ROADMAP_STEPS.map((st) => {
                  const isPassed = progressState.step >= st.id;
                  const isCurrent = Math.floor(progressState.step) === st.id || progressState.step === st.id - 0.5;
                  const isDelivered = progressState.step === 5;
                  const FallbackIcon = st.iconFallback || Package;

                  return (
                    <div
                      key={st.id}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
                      style={{
                        left: `${(st.x / 380) * 100}%`,
                        top: `${(st.y / 200) * 100}%`,
                      }}
                    >
                      {/* Node Card with Custom Image & Glowing Status Ring */}
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: isCurrent ? [1, 1.12, 1] : 1 }}
                        transition={{ repeat: isCurrent ? Infinity : 0, duration: 2 }}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 p-1.5 shadow-md bg-white transition-all relative ${
                          isCurrent
                            ? 'border-[#00E676] ring-4 ring-[#00E676]/50 shadow-lg shadow-emerald-500/50 z-20 scale-110'
                            : isPassed || (isCurrent && isDelivered)
                            ? 'border-emerald-500 shadow-emerald-500/30 opacity-95'
                            : 'border-gray-300 opacity-65'
                        }`}
                      >
                        {st.imgSrc ? (
                          <img
                            src={st.imgSrc}
                            alt={st.label}
                            className={`w-full h-full object-contain ${
                              st.id === 4 ? '-scale-x-100' : ''
                            }`}
                          />
                        ) : (
                          <div className={`w-full h-full rounded-xl flex items-center justify-center ${
                            isPassed || isCurrent ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'
                          }`}>
                            <FallbackIcon className="w-5 h-5" />
                          </div>
                        )}

                        {/* Completed Checkmark Corner Badge */}
                        {(isPassed || (isCurrent && isDelivered)) && (
                          <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-emerald-600 text-white border-2 border-white flex items-center justify-center text-[10px] font-black shadow-xs">
                            ✓
                          </span>
                        )}

                        {/* Active Glowing Beacon */}
                        {isCurrent && !isDelivered && (
                          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#00E676] border-2 border-white" />
                          </span>
                        )}
                      </motion.div>

                      {/* Step Text Label Badge (Properly Spaced with Zero Overlap) */}
                      <div className={`mt-2 px-2 py-0.5 rounded-md border shadow-2xs flex flex-col items-center whitespace-nowrap z-10 ${
                        isCurrent
                          ? 'bg-emerald-900 border-emerald-950 text-white font-black'
                          : isPassed
                          ? 'bg-white/95 border-emerald-200 text-emerald-900 font-bold'
                          : 'bg-white/90 border-gray-200 text-gray-400'
                      }`}>
                        <span className="text-[9px] font-black leading-tight text-center">
                          {st.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Description Box */}
              <div className="bg-white/95 rounded-2xl p-3.5 border border-emerald-100 shadow-2xs mt-2 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-xs text-gray-900 leading-tight">
                    {progressState.title}
                  </h4>
                  <p className="text-[11px] font-medium text-gray-600 leading-snug mt-0.5">
                    {progressState.subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* ── 2. CELEBRATORY PARTY POP TAB (SHOWN WHEN DELIVERED) ── */}
            {status === 'DELIVERED' && (
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-950 text-white rounded-3xl p-5 shadow-2xl shadow-emerald-950/40 text-center space-y-4 relative overflow-hidden border-2 border-emerald-400"
              >
                {/* Top Celebration Icons */}
                <div className="flex items-center justify-center gap-2 text-3xl">
                  <span className="animate-bounce [animation-delay:0ms]">🎉</span>
                  <span className="animate-pulse text-2xl">✨</span>
                  <span className="animate-bounce [animation-delay:150ms]">🎊</span>
                </div>
                
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">
                    Hooray! Order Delivered 🎉
                  </h3>
                  <p className="text-xs text-emerald-100/90 font-medium mt-1 leading-snug">
                    Your package from <strong className="text-white">{storeName}</strong> has been safely handed over at your doorstep.
                  </p>
                </div>

                {/* 5-Star Rating Feedback Section */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
                  <span className="text-[10.5px] font-black text-emerald-200 uppercase tracking-widest block mb-2">
                    Rate Your Experience
                  </span>
                  <div className="flex justify-center items-center gap-2.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`text-2xl transition-transform hover:scale-125 active:scale-95 ${
                          rating >= star ? 'text-amber-300 drop-shadow-[0_2px_8px_rgba(251,191,36,0.6)]' : 'text-white/30'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-emerald-200 mt-2 block">
                    {rating === 5 ? '⭐ 5/5 — Excellent delivery! 💖' : 'Thank you for your rating! 🙏'}
                  </span>
                </div>

                {/* Push to Order History Action Button */}
                <button
                  onClick={() => {
                    setTrackerOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full py-3.5 bg-white hover:bg-emerald-50 text-emerald-950 font-black text-sm rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Done & View in Order History</span>
                  <ArrowRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            )}

            {/* ── 3. RIDER INFORMATION & DELIVERY OTP PIN CARD (ONLY SHOWN WHEN OUT FOR DELIVERY) ── */}
            {progressState.isOutForDelivery && status !== 'DELIVERED' && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="bg-gradient-to-br from-emerald-950 via-gray-950 to-gray-900 text-white rounded-3xl p-5 border-2 border-emerald-400 shadow-xl shadow-emerald-950/40 space-y-4"
              >
                {/* Rider Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[10.5px] font-black tracking-widest text-emerald-400 uppercase">
                      Delivery Rider Assigned
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-gray-300">⚡ Arriving in ~4m</span>
                </div>

                {/* Rider Profile Card */}
                <div className="flex items-center justify-between gap-3 bg-white/10 rounded-2xl p-3.5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={riderIconImg}
                        alt="Rider Suresh"
                        className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400 bg-white"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                        🛵
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-black text-sm text-white">Suresh Kumar</h4>
                        <span className="bg-emerald-500/30 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                          ⭐ 4.9
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-300 font-medium mt-0.5">
                        SnapIt Fleet Hero • TVS iQube (KA-08)
                      </p>
                    </div>
                  </div>

                  {/* Call and WhatsApp Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href="tel:+918217649688"
                      className="w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-emerald-600/30"
                      aria-label="Call Rider"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <a
                      href={`https://wa.me/918217649688?text=Hi%20Suresh,%20checking%20on%20my%20SnapIt%20order%20${currentOrder.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-teal-600/30"
                      aria-label="WhatsApp Rider"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* 4-Digit Delivery Verification Handshake PIN */}
                <div className="bg-emerald-500/15 border border-emerald-400/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Delivery Handshake PIN
                  </span>
                  <div className="flex items-center gap-2.5 my-1">
                    {deliveryPin.split('').map((digit, i) => (
                      <div
                        key={i}
                        className="w-11 h-13 rounded-xl bg-white text-gray-950 font-mono font-black text-2xl flex items-center justify-center shadow-lg border-2 border-emerald-400"
                      >
                        {digit}
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-emerald-100/90 font-medium">
                    Share this 4-digit PIN with Suresh upon delivery to complete verification.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── 4. ITEMS IN PACKAGE ── */}
            <div className="bg-gray-50/80 rounded-3xl p-4 border border-gray-100 space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200/60">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                  Items in Package ({currentOrder.items?.length || 0})
                </span>
                <span className="text-xs font-black text-gray-900">
                  {formatCurrency(currentOrder.estimated_total || 0)}
                </span>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {currentOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                    <span className="font-bold text-gray-800">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-mono font-bold text-gray-700">
                      {item.price_paise ? formatCurrency(item.price_paise * item.quantity) : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 5. DELIVERY ADDRESS ── */}
            {currentOrder.delivery_address && (
              <div className="flex items-start gap-2.5 p-3.5 bg-white rounded-2xl border border-gray-100 shadow-2xs">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-black text-gray-900 block">
                    {currentOrder.delivery_address.label || currentOrder.delivery_address.title || 'Delivery Address'}
                  </span>
                  <span className="text-gray-600 font-medium leading-tight block mt-0.5">
                    {currentOrder.delivery_address.line1 || currentOrder.delivery_address.addressLine1}
                    {currentOrder.delivery_address.addressLine2 ? `, ${currentOrder.delivery_address.addressLine2}` : ''}
                    {currentOrder.delivery_address.landmark ? `, Near ${currentOrder.delivery_address.landmark}` : ''}
                    {currentOrder.delivery_address.city ? `, ${currentOrder.delivery_address.city}` : ''}
                    {currentOrder.delivery_address.pincode ? ` - ${currentOrder.delivery_address.pincode}` : ''}
                  </span>
                </div>
              </div>
            )}

            {/* ── 6. NEED HELP / SUPPORT BUTTON ── */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  window.open(`https://wa.me/918217649688?text=Hi%20SnapIt,%20need%20help%20with%20live%20order%20${currentOrder.id}`, '_blank');
                }}
                className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-black text-xs rounded-2xl border border-emerald-200 transition-colors flex items-center justify-center gap-1.5 active:scale-95"
              >
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>Need Help with this Order? (WhatsApp Support)</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
