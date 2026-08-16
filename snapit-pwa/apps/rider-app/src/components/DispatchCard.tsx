/**
 * DispatchCard.tsx — Incoming order card with store info and earnings estimate
 *
 * Displayed in the dashboard's incoming orders stream.
 * Leads into SlideToAccept at the bottom of the card.
 * AnimatePresence handles enter/exit with slide-up physics.
 */

import { motion } from 'framer-motion';

import { MapPin, Package, Clock, CreditCard } from 'lucide-react';
import type { Order } from '../../../../shared/types/snapit-types';
import { formatCurrency, estimatedEarning, timeAgo, getStoreMeta } from '../lib/mockData';
import { SlideToAccept } from './SlideToAccept';

interface DispatchCardProps {
  order: Order;
  onAccept: (order: Order) => void;
  index?: number;
}

const PAYMENT_LABELS: Record<string, { label: string; color: string }> = {
  UPI_NOW:      { label: 'Paid via UPI', color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
  UPI_DELIVERY: { label: 'Collect via UPI', color: 'text-amber-700 bg-amber-50 border-amber-100' },
  CASH:         { label: 'Cash (N/A)', color: 'text-slate-500 bg-slate-50 border-slate-100' },
};

export function DispatchCard({ order, onAccept, index = 0 }: DispatchCardProps) {
  const store = getStoreMeta(order.storeId);
  const earning = estimatedEarning(order.estimatedTotal);
  const orderAge = timeAgo(order.createdAt);
  const itemCount = order.items.reduce((acc, i) => acc + i.quantity, 0);
  const isForRecipient = Boolean(order.recipientName);
  const paymentInfo = PAYMENT_LABELS[order.paymentMethod ?? 'UPI_NOW'];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{
        delay: index * 0.08,
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="card overflow-hidden border border-slate-100"
    >
      {/* Urgency bar — pulsing emerald top border */}
      <div className="h-1 bg-emerald-500 animate-pulse-soft" />

      <div className="p-4">
        {/* Header row: Store info + earning estimate */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-xl border border-emerald-100">
              {store.emoji}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm leading-tight">{store.name}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={11} className="text-slate-400" />
                <span className="text-slate-500 text-xs font-medium">{store.area}</span>
              </div>
            </div>
          </div>

          {/* Earning estimate */}
          <div className="text-right">
            <p className="text-emerald-600 font-extrabold text-lg leading-none">{earning}</p>
            <p className="text-slate-400 text-xs font-medium mt-0.5">your cut</p>
          </div>
        </div>

        {/* Delivery destination */}
        <div className="bg-slate-50 rounded-xl p-3 mb-3 border border-slate-100">
          <div className="flex items-start gap-2">
            <MapPin size={13} className="text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-slate-800 text-xs font-semibold leading-tight truncate">
                {order.deliveryAddress.line1}
              </p>
              {order.deliveryAddress.line2 && (
                <p className="text-slate-500 text-xs truncate">{order.deliveryAddress.line2}</p>
              )}
              <p className="text-slate-500 text-xs">
                {order.deliveryAddress.city}, {order.deliveryAddress.pincode}
              </p>
              {isForRecipient && (
                <p className="text-amber-600 text-xs font-semibold mt-1">
                  👤 For: {order.recipientName} · {order.recipientPhone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Meta chips row */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {/* Item count */}
          <div className="flex items-center gap-1 pill-slate">
            <Package size={11} />
            <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
          </div>

          {/* Order value */}
          <div className="pill-slate">
            {formatCurrency(order.estimatedTotal)}
          </div>

          {/* Payment type */}
          <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border ${paymentInfo.color}`}>
            <CreditCard size={11} />
            <span>{paymentInfo.label}</span>
          </div>

          {/* Age */}
          <div className="flex items-center gap-1 pill-slate ml-auto">
            <Clock size={11} />
            <span>{orderAge}</span>
          </div>
        </div>

        {/* Cooking instructions */}
        {order.cookingInstructions && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-4">
            <p className="text-amber-700 text-xs font-medium">
              📝 {order.cookingInstructions}
            </p>
          </div>
        )}

        {/* Slide to Accept */}
        <SlideToAccept
          onAccept={() => onAccept(order)}
          sublabel={`Order ${order.id}`}
        />
      </div>
    </motion.div>
  );
}
