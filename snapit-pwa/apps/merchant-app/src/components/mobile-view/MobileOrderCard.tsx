import React, { useState, useEffect } from 'react';
import {
  Check,
  ChefHat,
  Bike,
  AlertCircle,
  MessageSquare,
  Timer,
  ShoppingBag,
  User,
  Clock,
} from 'lucide-react';
import type { Order } from '../../types/snapit-types';
import { formatCurrency, formatOrderTime } from '../../utils/formatters';
import { useMerchantStore } from '../../store/useMerchantStore';
import { counterAudio } from '../../lib/audio';

interface MobileOrderCardProps {
  order: Order;
}

export const MobileOrderCard: React.FC<MobileOrderCardProps> = ({ order }) => {
  const {
    products,
    setPrepModalOrderId,
    setRejectModalOrderId,
    markOrderPrepared,
    handoverToRider,
    prepTimers,
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

  const prepInfo = prepTimers[order.id];

  // 1-second live countdown timer
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

  return (
    <div
      className={`rounded-2xl bg-white border transition-all shadow-xs overflow-hidden ${
        isPlaced
          ? 'border-amber-400 ring-2 ring-amber-400/30'
          : isPreparing && timerDisplay?.isOverdue
          ? 'border-rose-500 ring-2 ring-rose-500/40'
          : isPreparing && timerDisplay?.isWarning
          ? 'border-amber-400 ring-2 ring-amber-400/40'
          : isPreparing
          ? 'border-blue-300 ring-1 ring-blue-300/40'
          : isReady
          ? 'border-emerald-300 ring-1 ring-emerald-300/40'
          : 'border-slate-200'
      }`}
    >
      {/* 1. Header: Order ID & Customer Name & Time & Status Badge */}
      <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="text-base font-black text-slate-950 font-mono tracking-tight">
            {order.id}
          </span>
          <span className="text-xs font-bold text-slate-900 bg-slate-200/90 px-2.5 py-0.5 rounded-md truncate max-w-[130px] flex items-center gap-1 border border-slate-300/60">
            <User className="w-3 h-3 text-emerald-700 stroke-[2.5]" />
            <span className="truncate">{order.recipientName || 'Customer'}</span>
          </span>
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{formatOrderTime(order.createdAt)}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isPlaced && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500 text-slate-950 animate-pulse">
              NEW ORDER
            </span>
          )}
          {isPreparing && (
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
              timerDisplay?.isOverdue
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {timerDisplay?.isOverdue ? 'OVERDUE' : 'PACKING'}
            </span>
          )}
          {isReady && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800">
              READY
            </span>
          )}
        </div>
      </div>

      <div className="p-3.5 space-y-3">
        {/* 2. Visual Packing Countdown Timer Banner */}
        {isPreparing && timerDisplay && (
          <div
            className={`p-2.5 rounded-xl border ${
              timerDisplay.isOverdue
                ? 'bg-rose-600 text-white border-rose-700'
                : timerDisplay.isWarning
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-blue-50/80 border-blue-200 text-blue-950'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <Timer className={`w-4 h-4 ${
                  timerDisplay.isOverdue ? 'animate-pulse' : 'text-blue-600'
                }`} />
                <span className="font-extrabold text-[11px] uppercase tracking-wider">
                  {timerDisplay.isOverdue ? 'Packing Overdue!' : `Packing Target: ${timerDisplay.prepMinutes}m`}
                </span>
              </div>

              <span className={`text-base font-black font-mono ${
                timerDisplay.isOverdue ? 'text-white' : timerDisplay.isWarning ? 'text-amber-950' : 'text-blue-800'
              }`}>
                {timerDisplay.isOverdue ? `-${timerDisplay.formattedTime}` : timerDisplay.formattedTime}
              </span>
            </div>

            <div className="w-full bg-black/10 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  timerDisplay.isOverdue ? 'bg-white' : timerDisplay.isWarning ? 'bg-amber-500' : 'bg-blue-600'
                }`}
                style={{ width: `${timerDisplay.progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* 3. Customer Order Instructions Note if available */}
        {order.cookingInstructions && (
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <span className="font-semibold">{order.cookingInstructions}</span>
          </div>
        )}

        {/* 4. Items Packing Checklist */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex justify-between">
            <span>Items to Pack ({totalQuantity})</span>
            <span>Tap to check</span>
          </div>

          <div className="divide-y divide-slate-100 bg-slate-50 rounded-xl p-2 border border-slate-100">
            {Array.isArray(order.items) && order.items.map((rawItem, idx) => {
              const item = resolveItem(rawItem, idx);
              const isChecked = Boolean(checkedItems[item.key]);

              return (
                <div
                  key={`${item.key}-${idx}`}
                  onClick={() => toggleItemCheck(item.key)}
                  className={`py-2 px-1.5 flex items-center justify-between gap-2 cursor-pointer rounded-lg transition-colors ${
                    isChecked ? 'bg-emerald-50/60 opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        isChecked
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    <span className="text-sm font-bold text-slate-900 truncate">
                      <span className="text-emerald-700 font-extrabold mr-1.5">
                        {item.quantity}×
                      </span>
                      <span className={isChecked ? 'line-through text-slate-400' : ''}>
                        {item.name}
                      </span>
                    </span>
                  </div>

                  <span className="text-xs font-bold text-slate-600 font-mono flex-shrink-0">
                    {formatCurrency(item.totalPricePaise)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Store Counter Action Buttons */}
        <div className="pt-1">
          {isPlaced && (
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRejectModalOrderId(order.id)}
                className="col-span-1 h-12 rounded-xl border border-rose-200 bg-rose-50 active:scale-95 text-rose-700 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>

              <button
                type="button"
                onClick={() => setPrepModalOrderId(order.id)}
                className="col-span-2 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Accept & Pack</span>
              </button>
            </div>
          )}

          {isPreparing && (
            <button
              type="button"
              onClick={() => markOrderPrepared(order.id)}
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Mark Packed & Ready</span>
            </button>
          )}

          {isReady && (
            <div className="space-y-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                <Bike className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>Rider Suresh Approaching Counter</span>
              </div>
              <button
                type="button"
                onClick={() => handoverToRider(order.id)}
                className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-extrabold text-sm shadow-md shadow-purple-600/25 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Bike className="w-4 h-4" />
                <span>Handover to Delivery Rider</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileOrderCard;
