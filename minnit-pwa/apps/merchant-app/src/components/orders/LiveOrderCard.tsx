import React, { useState, useEffect } from 'react';
import {
  Clock,
  Check,
  Bike,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Timer,
  AlertTriangle,
  ShoppingBag,
  User,
  Phone,
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
    handoverToRider,
    prepTimers,
    ridersMap,
  } = useMerchantStore();

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [nowMs, setNowMs] = useState(Date.now());

  const toggleItemCheck = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper to reliably resolve item name, quantity, and price
  const resolveItem = (rawItem: any, idx: number) => {
    const prodId = rawItem.productId || rawItem.product_id || rawItem.id || '';
    const match = products.find((p) => p.id === prodId);

    const name =
      rawItem.name ||
      rawItem.product_name ||
      rawItem.title ||
      match?.name ||
      (prodId ? `Product #${prodId}` : `Pack Item ${idx + 1}`);

    const quantity = Number(rawItem.quantity || rawItem.qty || rawItem.count || 1);
    const pricePaise = Number(rawItem.price_paise ?? rawItem.price ?? rawItem.unitPricePaise ?? match?.price ?? 0);

    return {
      key: prodId || `item-${idx}`,
      name,
      quantity,
      unitPricePaise: pricePaise,
      totalPricePaise: pricePaise * quantity,
    };
  };

  const isPlaced = order.status === 'PLACED' || order.status === 'PENDING';
  const isPreparing = order.status === 'PREPARING' || order.status === 'ACCEPTED';
  const isReady = order.status === 'READY_FOR_PICKUP' || order.status === 'READY';
  const isOutOfShop = order.status === 'OUT_OF_SHOP';
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

  // Per-order sound triggering effect
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

  useEffect(() => {
    return () => {
      counterAudio.unregisterOverdueOrder(order.id);
    };
  }, [order.id]);

  const totalQuantity = Array.isArray(order.items)
    ? order.items.reduce((acc, curr: any) => acc + Number(curr.quantity || curr.qty || 1), 0)
    : 0;

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
          <ShoppingBag className="w-3.5 h-3.5" />
          PACKING
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
    if (isOutOfShop) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse flex items-center gap-1.5 shadow-2xs whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
          Handed Over (Awaiting Rider Confirmation)
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
          : isOutOfShop
          ? 'border-amber-400 ring-2 ring-amber-400/40 bg-amber-50/10'
          : 'border-slate-200'
      }`}
    >
      {/* 1. Card Top Bar: ORDER NUMBER & CUSTOMER NAME & Status Badge */}
      <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-950 font-mono tracking-tight">
              {order.id}
            </span>
            <span className="text-xs font-bold text-slate-900 bg-slate-200/90 px-2.5 py-1 rounded-xl flex items-center gap-1 border border-slate-300/60 shadow-2xs">
              <User className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" />
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
                      ? '⚠️ PACKING DEADLINE APPROACHING — WRAP UP!'
                      : `Order Packing Timer (${timerDisplay.prepMinutes} Min Target)`}
                  </span>
                  {(timerDisplay.isOverdue || timerDisplay.isWarning) && (
                    <span className={`text-[10px] font-semibold block ${
                      timerDisplay.isOverdue ? 'text-rose-100' : 'text-amber-800'
                    }`}>
                      {timerDisplay.isOverdue
                        ? 'Alarm active until marked ready for pickup.'
                        : 'Less than warning threshold remaining. Finish packing.'}
                    </span>
                  )}
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
                Customer Preparation Note:
              </span>
              <span className="font-semibold">{order.cookingInstructions}</span>
            </div>
          </div>
        )}

        {/* 4. High Readability Item Packing List */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex justify-between items-center">
            <span>Items to Pack ({totalQuantity})</span>
            <span className="text-[10px] text-slate-500">Tap item to check off</span>
          </div>

          <div className="divide-y divide-slate-100 bg-slate-50/50 rounded-xl p-2 sm:p-3 border border-slate-100">
            {Array.isArray(order.items) && order.items.map((rawItem, idx) => {
              const item = resolveItem(rawItem, idx);
              const isChecked = Boolean(checkedItems[item.key]);

              return (
                <div
                  key={`${item.key}-${idx}`}
                  onClick={() => toggleItemCheck(item.key)}
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
                      <span className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                        <span className="text-emerald-700 font-extrabold mr-1.5">
                          {item.quantity} ×
                        </span>
                        <span className={isChecked ? 'line-through text-slate-500' : ''}>
                          {item.name}
                        </span>
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-600 font-mono flex-shrink-0">
                    {formatCurrency(item.totalPricePaise)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Kitchen Action Buttons */}
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
                <ShoppingBag className="w-5 h-5" />
                <span>Accept & Pack</span>
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
              <span>Mark Packed & Ready</span>
            </button>
          )}

          {isReady && (() => {
            const cleanRiderId = order.riderId ? String(order.riderId).replace(/[^0-9]/g, '').slice(-10) : '';
            const rider = cleanRiderId ? (ridersMap[cleanRiderId] || ridersMap[order.riderId || '']) : null;
            const isAssigned = Boolean(order.riderId || order.riderAssignment === 'ASSIGNED' || rider);
            const riderPhone = rider?.phone || cleanRiderId;
            const photoUrl = rider?.avatar_url || rider?.selfie_url;

            return (
              <div className="space-y-3">
                {isAssigned ? (
                  <div className="px-4 py-3 bg-purple-50/90 border border-purple-200/90 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                    {/* Left: Prominent Rider Photo & Larger Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={rider?.name || 'Rider'}
                          className="w-12 h-12 rounded-full object-cover border-2 border-purple-300 shrink-0 bg-white shadow-xs"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center text-xl font-black shrink-0 shadow-xs">
                          🛵
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-black text-slate-900 text-base sm:text-lg truncate block leading-tight">
                          {rider?.name || 'Delivery Partner'}
                        </span>
                      </div>
                    </div>

                    {/* Right: Larger Phone Number pushed before Call Icon */}
                    <div className="flex items-center gap-3 shrink-0">
                      {riderPhone && (
                        <span className="text-slate-800 font-extrabold font-mono text-sm sm:text-base tracking-tight">
                          +91 {riderPhone}
                        </span>
                      )}
                      {riderPhone && (
                        <a
                          href={`tel:+91${riderPhone}`}
                          className="w-9 h-9 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-90 text-white flex items-center justify-center shrink-0 shadow-sm transition-transform cursor-pointer"
                          aria-label="Call Rider"
                          title={`Call ${rider?.name || 'Rider'}`}
                        >
                          <Phone className="w-4 h-4 fill-current" />
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-2xl text-center text-xs font-bold text-amber-900 flex items-center justify-center gap-2 shadow-2xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    <span className="font-extrabold uppercase tracking-wider text-amber-950">
                      WAITING FOR RIDER ASSIGNMENT...
                    </span>
                  </div>
                )}

                {/* Handover Button: Dimmed purple & non-functional until Rider is Assigned */}
                <button
                  type="button"
                  disabled={!isAssigned}
                  onClick={() => isAssigned && handoverToRider(order.id)}
                  className={`w-full h-12 sm:h-14 rounded-xl font-black text-sm sm:text-base tracking-wide transition-all flex items-center justify-center gap-2 ${
                    isAssigned
                      ? 'bg-purple-600 hover:bg-purple-700 active:scale-95 text-white shadow-lg shadow-purple-600/25 cursor-pointer'
                      : 'bg-purple-600/50 text-white/80 cursor-not-allowed opacity-75 shadow-none select-none'
                  }`}
                >
                  <Bike className={`w-5 h-5 ${isAssigned ? '' : 'opacity-80'}`} />
                  <span>Handover to Delivery Rider</span>
                </button>
              </div>
            );
          })()}

          {isOutOfShop && (() => {
            const cleanRiderId = order.riderId ? String(order.riderId).replace(/[^0-9]/g, '').slice(-10) : '';
            const rider = cleanRiderId ? (ridersMap[cleanRiderId] || ridersMap[order.riderId || '']) : null;
            const riderPhone = rider?.phone || cleanRiderId;
            const photoUrl = rider?.avatar_url || rider?.selfie_url;

            return (
              <div className="space-y-3">
                {rider && (
                  <div className="px-4 py-3 bg-purple-50/90 border border-purple-200/90 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                    {/* Left: Prominent Rider Photo & Larger Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={rider?.name || 'Rider'}
                          className="w-12 h-12 rounded-full object-cover border-2 border-purple-300 shrink-0 bg-white shadow-xs"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center text-xl font-black shrink-0 shadow-xs">
                          🛵
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-black text-slate-900 text-base sm:text-lg truncate block leading-tight">
                          {rider.name || 'Delivery Partner'}
                        </span>
                      </div>
                    </div>

                    {/* Right: Larger Phone Number pushed before Call Icon */}
                    <div className="flex items-center gap-3 shrink-0">
                      {riderPhone && (
                        <span className="text-slate-800 font-extrabold font-mono text-sm sm:text-base tracking-tight">
                          +91 {riderPhone}
                        </span>
                      )}
                      {riderPhone && (
                        <a
                          href={`tel:+91${riderPhone}`}
                          className="w-9 h-9 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-90 text-white flex items-center justify-center shrink-0 shadow-sm transition-transform cursor-pointer"
                          aria-label="Call Rider"
                          title={`Call ${rider?.name || 'Rider'}`}
                        >
                          <Phone className="w-4 h-4 fill-current" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-center text-xs font-bold text-amber-900 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
                  <span>Handed Over &bull; Awaiting Rider Confirmation to Start Delivery</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default LiveOrderCard;
