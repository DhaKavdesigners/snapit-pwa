import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  User,
  Check,
  ChefHat,
  Bike,
  AlertCircle,
  CreditCard,
  Banknote,
  MessageSquare,
  Sparkles,
  Timer,
  AlertTriangle,
} from 'lucide-react';
import type { Order } from '../../types/snapit-types';
import { formatCurrency, formatOrderTime } from '../../utils/formatters';
import { useMerchantStore } from '../../store/useMerchantStore';
import { counterAudio } from '../../lib/audio';

interface LiveOrderCardProps {
  order: Order;
}

export const LiveOrderCard: React.FC<LiveOrderCardProps> = ({ order }) => {
  const {
    products,
    setPrepModalOrderId,
    setRejectModalOrderId,
    markOrderPrepared,
    markRiderAssigned,
    markOutForDelivery,
    markDelivered,
    handoverToRider,
    prepTimers,
  } = useMerchantStore();

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [nowMs, setNowMs] = useState(Date.now());

  const toggleItemCheck = (productId: string) => {
    setCheckedItems((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  // Find product details
  const getProductInfo = (productId: string) => {
    return (
      products.find((p) => p.id === productId) || {
        id: productId,
        name: 'Item ' + productId,
        price: 0,
      }
    );
  };

  const isPlaced = order.status === 'PLACED' || order.status === 'PENDING';
  const isPreparing = order.status === 'PREPARING' || order.status === 'ACCEPTED';
  const isReady = order.status === 'READY_FOR_PICKUP' || order.status === 'READY';
  const isRiderAssigned = order.status === 'RIDER_ASSIGNED';
  const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY';

  const prepInfo = prepTimers[order.id];

  // 1-second live countdown interval when in PREPARING
  useEffect(() => {
    if (!isPreparing || !prepInfo) return;

    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [isPreparing, prepInfo]);

  // Compute countdown and thresholds as specified:
  // 5 min -> warning at <= 1:30 min (90s)
  // 10 min -> warning at <= 2:00 min (120s)
  // 15 min -> warning at <= 3:00 min (180s)
  // > 15 min -> warning at <= 4:00 min (240s)
  // 0:00 -> loud overdue alarm (10s sound / 20s gap)!
  let timerDisplay = null;
  if (isPreparing && prepInfo) {
    const prepMinutes = prepInfo.prepMinutes || 10;
    const totalSeconds = prepMinutes * 60;
    const elapsedSeconds = Math.max(0, Math.floor((nowMs - prepInfo.acceptedAt) / 1000));
    const remainingSeconds = totalSeconds - elapsedSeconds;

    let warningThresholdSeconds = 120;
    if (prepMinutes <= 5) warningThresholdSeconds = 90;
    else if (prepMinutes <= 10) warningThresholdSeconds = 120;
    else if (prepMinutes <= 15) warningThresholdSeconds = 180;
    else warningThresholdSeconds = 240;

    const isOverdue = remainingSeconds <= 0;
    const isWarning = !isOverdue && remainingSeconds <= warningThresholdSeconds;

    const absRemaining = Math.abs(remainingSeconds);
    const mins = Math.floor(absRemaining / 60);
    const secs = absRemaining % 60;
    const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    timerDisplay = {
      formattedTime,
      remainingSeconds,
      prepMinutes,
      isWarning,
      isOverdue,
      warningThresholdSeconds,
      progressPercent: Math.min(100, Math.max(0, (elapsedSeconds / totalSeconds) * 100)),
    };
  }

  // Per-order sound triggering effect (never kills other orders' overdue sounds)
  useEffect(() => {
    if (!isPreparing || !prepInfo || !timerDisplay) {
      counterAudio.unregisterOverdueOrder(order.id);
      return;
    }

    if (timerDisplay.isOverdue) {
      counterAudio.registerOverdueOrder(order.id);
    } else {
      counterAudio.unregisterOverdueOrder(order.id);
      if (timerDisplay.isWarning) {
        counterAudio.playSlightWarningSound();
      }
    }
  }, [isPreparing, prepInfo, timerDisplay?.isOverdue, timerDisplay?.isWarning, order.id]);

  // Clean up audio on unmount or status transition
  useEffect(() => {
    return () => {
      counterAudio.unregisterOverdueOrder(order.id);
    };
  }, [order.id]);

  // Helper for status badge
  const getStatusBadge = () => {
    if (isPlaced) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-slate-950 animate-pulse flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-slate-950" />
          NEW ORDER
        </span>
      );
    }
    if (isPreparing) {
      if (timerDisplay?.isOverdue) {
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white animate-pulse flex items-center gap-1.5 shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5" />
            OVERDUE
          </span>
        );
      }
      if (timerDisplay?.isWarning) {
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-slate-950 animate-pulse flex items-center gap-1.5 shadow-sm">
            <Timer className="w-3.5 h-3.5" />
            FINAL MINUTES
          </span>
        );
      }
      return (
        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 flex items-center gap-1.5">
          <ChefHat className="w-3.5 h-3.5" />
          PREPARING
        </span>
      );
    }
    if (isReady) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          READY FOR PICKUP
        </span>
      );
    }
    if (isRiderAssigned || isOutForDelivery) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 flex items-center gap-1.5">
          <Bike className="w-3.5 h-3.5" />
          {isOutForDelivery ? 'OUT FOR DELIVERY' : 'RIDER ASSIGNED'}
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
        {order.status}
      </span>
    );
  };

  return (
    <div
      className={`rounded-2xl bg-white border transition-all duration-200 shadow-sm overflow-hidden ${
        isPlaced
          ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-counter-urgent'
          : isPreparing && timerDisplay?.isOverdue
          ? 'border-rose-500 ring-4 ring-rose-500/40 shadow-lg'
          : isPreparing && timerDisplay?.isWarning
          ? 'border-amber-400 ring-2 ring-amber-400/40'
          : isPreparing
          ? 'border-blue-300 ring-1 ring-blue-300/40'
          : isReady
          ? 'border-emerald-300 ring-1 ring-emerald-300/40'
          : 'border-slate-200'
      }`}
    >
      {/* 1. Card Top Bar: ORDER NUMBER + CUSTOMER NAME + Time & Status */}
      <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-950 font-mono tracking-tight">
              {order.id}
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 bg-slate-200/90 px-3 py-1 rounded-xl flex items-center gap-1.5 border border-slate-300/60 shadow-2xs">
              <User className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
              <span>{order.recipientName || 'Customer'}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{formatOrderTime(order.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge()}
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* 2. Visual Preparation Countdown Timer Banner */}
        {isPreparing && timerDisplay && (
          <div
            className={`p-3.5 rounded-2xl border transition-all ${
              timerDisplay.isOverdue
                ? 'bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-600/30'
                : timerDisplay.isWarning
                ? 'bg-amber-50 border-amber-300 text-amber-950 ring-2 ring-amber-400/40 shadow-xs'
                : 'bg-blue-50/80 border-blue-200 text-blue-950'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Timer className={`w-5 h-5 flex-shrink-0 ${
                  timerDisplay.isOverdue
                    ? 'animate-pulse text-white'
                    : timerDisplay.isWarning
                    ? 'animate-bounce text-amber-600'
                    : 'text-blue-600'
                }`} />
                <div>
                  <span className="font-extrabold text-xs sm:text-sm uppercase tracking-wider block">
                    {timerDisplay.isOverdue
                      ? '🚨 TIME OVERDUE — DISPATCH IMMEDIATELY!'
                      : timerDisplay.isWarning
                      ? '⚠️ PREP DEADLINE APPROACHING — WRAP UP!'
                      : `Kitchen Prep Timer (${timerDisplay.prepMinutes} Min Target)`}
                  </span>
                  <span className={`text-[10px] font-semibold block ${
                    timerDisplay.isOverdue
                      ? 'text-rose-100'
                      : timerDisplay.isWarning
                      ? 'text-amber-800'
                      : 'text-slate-600'
                  }`}>
                    {timerDisplay.isOverdue
                      ? '10s alarm bursts active (20s gap) until marked ready for pickup.'
                      : timerDisplay.isWarning
                      ? 'Less than warning threshold remaining. Finish packing.'
                      : 'Live countdown to dispatch deadline.'}
                  </span>
                </div>
              </div>

              {/* Large Clock Digits */}
              <div className="text-right flex-shrink-0">
                <span className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                  timerDisplay.isOverdue
                    ? 'text-white'
                    : timerDisplay.isWarning
                    ? 'text-amber-950'
                    : 'text-blue-800'
                }`}>
                  {timerDisplay.isOverdue ? `-${timerDisplay.formattedTime}` : timerDisplay.formattedTime}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">
                  {timerDisplay.isOverdue ? 'OVERDUE' : 'REMAINING'}
                </span>
              </div>
            </div>

            {/* Countdown Progress Bar */}
            <div className="w-full bg-black/10 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  timerDisplay.isOverdue
                    ? 'bg-white'
                    : timerDisplay.isWarning
                    ? 'bg-amber-500'
                    : 'bg-blue-600'
                }`}
                style={{ width: `${timerDisplay.progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* 3. Cooking Notes / Customer Instructions Banner */}
        {order.cookingInstructions && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700 block">
                Customer Note:
              </span>
              <span className="font-semibold">{order.cookingInstructions}</span>
            </div>
          </div>
        )}

        {/* 4. High Readability Item List (Readable from 3ft away) */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex justify-between items-center">
            <span>Items to Pack ({order.items.reduce((acc, curr) => acc + curr.quantity, 0)})</span>
            <span className="text-[10px] text-slate-600">Tap item to check off</span>
          </div>

          <div className="divide-y divide-slate-100 bg-slate-50/50 rounded-xl p-2 sm:p-3 border border-slate-100">
            {order.items.map((item, idx) => {
              const prod = getProductInfo(item.productId);
              const isChecked = Boolean(checkedItems[item.productId]);

              return (
                <div
                  key={`${item.productId}-${idx}`}
                  onClick={() => toggleItemCheck(item.productId)}
                  className={`py-2.5 px-2 flex items-center justify-between gap-3 cursor-pointer rounded-lg transition-colors ${
                    isChecked ? 'bg-emerald-50/60 opacity-60' : 'hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${
                        isChecked
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="min-w-0">
                      {/* Bold 3-feet quantity & item name */}
                      <span className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                        <span className="text-emerald-700 font-extrabold mr-1.5">
                          {item.quantity} ×
                        </span>
                        <span className={isChecked ? 'line-through text-slate-500' : ''}>
                          {prod.name}
                        </span>
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-600 font-mono flex-shrink-0">
                    {formatCurrency(prod.price * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Customer & Delivery Info + Billing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100 text-xs">
          {/* Customer & Address */}
          <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <User className="w-3.5 h-3.5 text-slate-600" />
              <span>{order.recipientName || 'Customer'}</span>
              {order.recipientPhone && (
                <span className="text-slate-600 font-mono text-[11px]">
                  ({order.recipientPhone})
                </span>
              )}
            </div>
            <div className="flex items-start gap-1.5 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-0.5" />
              <span className="truncate">{order.deliveryAddress.line1}, KGF</span>
            </div>
          </div>

          {/* Billing & Payment */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 uppercase">Billing Total:</span>
              <span className="text-base font-black text-emerald-700 font-sans">
                {formatCurrency(order.estimatedTotal)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-1">
              {order.paymentMethod === 'UPI_NOW' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <CreditCard className="w-3 h-3" />
                  PAID ONLINE (UPI)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                  <Banknote className="w-3 h-3" />
                  COD / UPI AT DOORSTEP
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 6. Action Buttons (Large 48-56px Touch Targets) */}
        <div className="pt-2">
          {isPlaced && (
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setRejectModalOrderId(order.id)}
                className="col-span-1 h-12 sm:h-14 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>

              <button
                type="button"
                onClick={() => setPrepModalOrderId(order.id)}
                className="col-span-2 h-12 sm:h-14 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm sm:text-base tracking-wide shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ChefHat className="w-5 h-5" />
                <span>Accept Order</span>
              </button>
            </div>
          )}

          {isPreparing && (
            <button
              type="button"
              onClick={() => markOrderPrepared(order.id)}
              className="w-full h-12 sm:h-14 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-sm sm:text-base tracking-wide shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>Mark Ready for Pickup</span>
            </button>
          )}

          {isReady && (
            <div className="flex flex-col gap-2">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-2">
                <Bike className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>Rider Suresh Assigned &bull; At Counter for Pickup</span>
              </div>
              <button
                type="button"
                onClick={() => handoverToRider(order.id)}
                className="w-full h-12 sm:h-14 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-extrabold text-sm sm:text-base tracking-wide shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bike className="w-5 h-5" />
                <span>Handover to Delivery Rider</span>
              </button>
            </div>
          )}

          {isRiderAssigned && (
            <button
              type="button"
              onClick={() => handoverToRider(order.id)}
              className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Bike className="w-4 h-4" />
              <span>Handover Package to Rider</span>
            </button>
          )}

          {isOutForDelivery && (
            <button
              type="button"
              onClick={() => handoverToRider(order.id)}
              className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Complete & Move to History</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
