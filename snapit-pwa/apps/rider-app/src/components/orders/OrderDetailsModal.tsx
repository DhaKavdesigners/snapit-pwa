'use client';

import React from 'react';
import { OrderHistoryItem } from '@/types';
import { formatOrderNumber } from '@/utils/orderUtils';
import { formatISTDateTime } from '@/services/supabaseOrderService';
import {
  X,
  Store,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  Package,
  RotateCcw,
  ShieldCheck,
  Phone,
  Check,
  CircleAlert
} from 'lucide-react';

interface OrderDetailsModalProps {
  order: OrderHistoryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const isCompleted = order.category === 'completed';
  const displayId = formatOrderNumber(order.orderNumber || order.id);
  const timeFormatted = formatISTDateTime(order.completedAt || order.cancelledAt || order.createdAt);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal / Bottom Sheet Card */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
        
        {/* Top Handle for mobile swipe affordance */}
        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-base font-extrabold text-slate-900 tracking-tight">
              #{displayId}
            </span>
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] font-black uppercase tracking-wide px-2.5 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-[11px] font-black uppercase tracking-wide px-2.5 py-0.5 rounded-full border border-rose-200">
                <AlertCircle className="w-3 h-3" />
                Cancelled
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div className="overflow-y-auto px-5 py-4 space-y-4 text-slate-800">

          {/* Time & Outcome Summary */}
          <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{timeFormatted.fullStr || 'Date & time not recorded'}</span>
            </div>
            {order.distanceKm > 0 && (
              <span className="font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                {order.distanceKm} km
              </span>
            )}
          </div>

          {/* COMPLETED: Individual Earning Banner */}
          {isCompleted && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50/70 border border-emerald-200/90 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
              <div>
                <p className="text-xs font-semibold text-emerald-800">Individual Order Earning</p>
                <p className="text-[11px] text-emerald-600/90 mt-0.5">Credited to your Minnit Wallet</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-emerald-600">
                  ₹{order.earnings}
                </span>
              </div>
            </div>
          )}

          {/* CANCELLED: Specific Reason & Operational Status */}
          {!isCompleted && (
            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-start gap-2">
                <CircleAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-rose-900">
                    {order.cancellationReason || 'Delivery could not be completed'}
                  </h4>
                  {order.cancelledBy && (
                    <p className="text-[11px] text-rose-700 mt-0.5 capitalize">
                      Source: <span className="font-semibold">{order.cancelledBy}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Status Badges for Pickup & Return */}
              <div className="flex flex-wrap gap-2 pt-1 border-t border-rose-100">
                {order.pickupStatus === 'picked_up' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                    Picked up but not delivered
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    Cancelled before pickup
                  </span>
                )}

                {order.pickupStatus === 'picked_up' && (
                  order.returnStatus === 'returned_to_shop' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200">
                      <RotateCcw className="w-3 h-3" />
                      Returned to shop
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                      <RotateCcw className="w-3 h-3" />
                      Return Pending
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {/* ── ROUTE / LOCATIONS ── */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Delivery Route
            </h4>

            {/* Store (Pickup) */}
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Store className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">
                  Store Pickup
                </span>
                <p className="text-xs font-bold text-slate-900 truncate">
                  {order.restaurantName || 'Store Partner'}
                </p>
                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                  {order.restaurantAddress || 'Store Location'}
                </p>
              </div>
            </div>

            {/* Connector */}
            <div className="w-0.5 h-3 bg-slate-200 ml-3.5 -my-1" />

            {/* Customer Dropoff */}
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">
                  Customer Destination
                </span>
                <p className="text-xs font-bold text-slate-900 truncate">
                  {order.customerName || 'Customer'}
                </p>
                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                  {order.deliveryAddress || 'Customer Location'}
                </p>
              </div>
            </div>
          </div>

          {/* ── ITEMS LIST ── */}
          {order.items && order.items.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                  Package Items ({order.items.reduce((s, it) => s + (it.quantity || 1), 0)})
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {order.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1.5 text-xs">
                    <span className="text-slate-800 font-medium">
                      <span className="font-bold text-emerald-700 mr-1.5">{it.quantity || 1}x</span>
                      {it.name}
                    </span>
                    {Boolean(it.price) && (
                      <span className="text-slate-400 font-mono text-[11px]">
                        ₹{Math.round(it.price! / 100) || it.price}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ACTUAL RECORDED TIMELINE ── */}
          {order.timeline && order.timeline.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Delivery Timeline
              </h4>

              <div className="space-y-3 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {order.timeline.map((step, idx) => {
                  const isCurrent = step.current;
                  const isCompletedStep = step.completed;

                  return (
                    <div key={idx} className="relative">
                      {/* Node circle */}
                      <div
                        className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isCompletedStep
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : isCurrent
                            ? 'bg-white border-amber-500 text-amber-500'
                            : 'bg-white border-slate-300 text-transparent'
                        }`}
                      >
                        {isCompletedStep && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900 leading-tight">
                            {step.title}
                          </p>
                          {step.time && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {step.time}
                            </span>
                          )}
                        </div>
                        {step.note && (
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {step.note}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* ── FOOTER ── */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
};
