/**
 * DashboardPage.tsx — Main rider dispatch hub
 *
 * Features:
 * - Glassmorphic GamificationHeader
 * - Online/Offline toggle with audio chime
 * - Live incoming order stream (mock realtime via useOrderStream)
 * - DispatchCard + SlideToAccept for each incoming order
 * - Active order summary card (if rider has an active delivery)
 */

import { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, Bell, BellOff, Package, Zap } from 'lucide-react';
import { GamificationHeader } from '../components/GamificationHeader';
import { DispatchCard } from '../components/DispatchCard';
import { StatusStepper } from '../components/StatusStepper';
import {
  useRiderStore,
  selectIsOnline,
  selectIncomingOrders,
  selectActiveOrder,
} from '../stores/riderStore';
import { useOrderStream } from '../hooks/useOrderStream';
import { playOnlineChime } from '../lib/audio';
import { formatCurrency, getStoreMeta } from '../lib/mockData';
import type { Order } from '../../../../shared/types/snapit-types';

// ── Online toggle ────────────────────────────────────────────────────────────

function OnlineToggle() {
  const isOnline = useRiderStore(selectIsOnline);
  const { setOnline, setChimeEnabled, isDispatchChimeEnabled } = useRiderStore();

  const handleToggle = () => {
    const next = !isOnline;
    setOnline(next);
    if (next) playOnlineChime();
  };

  return (
    <div className="card p-4 flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={`
          w-11 h-11 rounded-xl flex items-center justify-center
          ${isOnline ? 'bg-emerald-100' : 'bg-slate-100'}
          transition-colors duration-300
        `}>
          <Power size={20} className={isOnline ? 'text-emerald-600' : 'text-slate-400'} />
        </div>
        <div>
          <p className="font-bold text-slate-800 text-sm">
            {isOnline ? 'You are Online' : 'You are Offline'}
          </p>
          <p className="text-slate-500 text-xs font-medium">
            {isOnline ? 'Receiving dispatch orders' : 'No orders will be assigned'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Chime toggle */}
        <button
          id="chime-toggle-btn"
          onClick={() => setChimeEnabled(!isDispatchChimeEnabled)}
          className={`
            w-8 h-8 rounded-lg flex items-center justify-center transition-colors
            ${isDispatchChimeEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}
          `}
          title={isDispatchChimeEnabled ? 'Mute chimes' : 'Enable chimes'}
        >
          {isDispatchChimeEnabled ? <Bell size={15} /> : <BellOff size={15} />}
        </button>

        {/* Online toggle pill */}
        <motion.button
          id="online-toggle-btn"
          onClick={handleToggle}
          animate={{
            backgroundColor: isOnline ? '#059669' : '#E2E8F0',
          }}
          transition={{ duration: 0.3 }}
          className="relative w-14 h-7 rounded-full flex-shrink-0"
        >
          <motion.div
            animate={{ x: isOnline ? 28 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
          />
        </motion.button>
      </div>
    </div>
  );
}

// ── Active Order Summary ─────────────────────────────────────────────────────

function ActiveOrderCard({ order }: { order: Order }) {
  const navigate = useNavigate();
  const store = getStoreMeta(order.storeId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card border-2 border-emerald-200 overflow-hidden mb-4"
    >
      {/* Active pulse header */}
      <div className="bg-emerald-500 px-4 py-2 flex items-center gap-2">
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          className="w-2 h-2 rounded-full bg-white"
        />
        <span className="text-white text-xs font-bold uppercase tracking-wider">
          Active Delivery
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{store.emoji}</span>
            <div>
              <p className="font-bold text-slate-800 text-sm">{store.name}</p>
              <p className="text-slate-500 text-xs">{order.id}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-800">{formatCurrency(order.estimatedTotal)}</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              order.paymentMethod === 'UPI_DELIVERY'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {order.paymentMethod === 'UPI_DELIVERY' ? 'Collect UPI' : 'Pre-paid'}
            </span>
          </div>
        </div>

        <StatusStepper currentStatus={order.status} className="mb-4" />

        <button
          id="view-active-order-btn"
          onClick={() => navigate(`/order/${order.id}`)}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Zap size={16} />
          Continue Delivery
        </button>
      </div>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const isOnline = useRiderStore(selectIsOnline);
  const incomingOrders = useRiderStore(selectIncomingOrders);
  const activeOrder = useRiderStore(selectActiveOrder);
  const { setActiveOrder, removeIncomingOrder } = useRiderStore();
  const navigate = useNavigate();

  const handleAcceptOrder = useCallback(
    (order: Order) => {
      // Transition: READY_FOR_PICKUP → RIDER_ASSIGNED
      const acceptedOrder: Order = {
        ...order,
        status: 'RIDER_ASSIGNED',
        riderId: 'rider-suresh-001',
        updatedAt: new Date().toISOString(),
      };
      setActiveOrder(acceptedOrder);
      removeIncomingOrder(order.id);
      // Navigate to order detail
      setTimeout(() => navigate(`/order/${order.id}`), 350);
    },
    [setActiveOrder, removeIncomingOrder, navigate],
  );

  useOrderStream();

  return (
    <div className="page-container">
      <div className="px-4 pt-6 space-y-0">
        {/* Gamification header */}
        <GamificationHeader className="mb-4" />

        {/* Online toggle */}
        <OnlineToggle />

        {/* Active delivery */}
        <AnimatePresence>
          {activeOrder && <ActiveOrderCard key="active" order={activeOrder} />}
        </AnimatePresence>

        {/* Incoming dispatch stream */}
        {isOnline ? (
          <div>
            <div className="flex items-center justify-between mb-3 mt-2">
              <h2 className="text-slate-800 font-bold text-base">
                Incoming Orders
              </h2>
              <AnimatePresence>
                {incomingOrders.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="pill-brand"
                  >
                    {incomingOrders.length} new
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence mode="popLayout">
              {incomingOrders.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="card py-12 flex flex-col items-center gap-3"
                >
                  <Package size={36} className="text-slate-200" />
                  <p className="text-slate-400 font-semibold text-sm">Waiting for orders…</p>
                  <p className="text-slate-300 text-xs">New orders will appear here automatically</p>
                </motion.div>
              ) : (
                incomingOrders.map((order, i) => (
                  <div key={order.id} className="mb-3">
                    <DispatchCard
                      order={order}
                      onAccept={handleAcceptOrder}
                      index={i}
                    />
                  </div>
                ))
              )}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card py-14 flex flex-col items-center gap-4 mt-2"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Power size={28} className="text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-slate-500 font-semibold text-sm">You're currently offline</p>
              <p className="text-slate-400 text-xs mt-1">
                Toggle online above to start receiving orders
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
