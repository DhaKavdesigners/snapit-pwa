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

  const toggleItemCheck = (productId: string) => {
    setCheckedItems((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

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
      {/* 1. Header: Order ID, Customer Name, Status Badge */}
      <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg font-black text-slate-950 font-mono tracking-tight">
            {order.id}
          </span>
          <span className="text-xs font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded-md truncate max-w-[130px] flex items-center gap-1">
            <User className="w-3 h-3 text-emerald-700" />
            <span className="truncate">{order.recipientName || 'Customer'}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isPlaced && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500 text-slate-950 animate-pulse">
              NEW
            </span>
          )}
          {isPreparing && (
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
              timerDisplay?.isOverdue
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {timerDisplay?.isOverdue ? 'OVERDUE' : 'PREPARING'}
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
        {/* 2. Visual Preparation Countdown Timer Banner */}
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
                  {timerDisplay.isOverdue ? 'Overdue!' : `${timerDisplay.prepMinutes}m Target`}
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

        {/* 3. Customer Note if available */}
        {order.cookingInstructions && (
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <span className="font-semibold">{order.cookingInstructions}</span>
          </div>
        )}

        {/* 4. Items Checklist */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex justify-between">
            <span>Items to Pack ({order.items.reduce((acc, curr) => acc + curr.quantity, 0)})</span>
            <span>Tap to check</span>
          </div>

          <div className="divide-y divide-slate-100 bg-slate-50 rounded-xl p-2 border border-slate-100">
            {order.items.map((item, idx) => {
              const prod = getProductInfo(item.productId);
              const isChecked = Boolean(checkedItems[item.productId]);

              return (
                <div
                  key={`${item.productId}-${idx}`}
                  onClick={() => toggleItemCheck(item.productId)}
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
                      <span className="text-emerald-700 font-extrabold mr-1">
                        {item.quantity}×
                      </span>
                      <span className={isChecked ? 'line-through text-slate-400' : ''}>
                        {prod.name}
                      </span>
                    </span>
                  </div>

                  <span className="text-xs font-bold text-slate-600 font-mono flex-shrink-0">
                    {formatCurrency(prod.price * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Address & Total */}
        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
          <div className="flex items-center gap-1 text-slate-600 truncate max-w-[55%]">
            <MapPin className="w-3 h-3 flex-shrink-0 text-slate-500" />
            <span className="truncate">{order.deliveryAddress.line1}</span>
          </div>

          <div className="text-right flex items-center gap-1.5 flex-shrink-0">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800">
              UPI PAID
            </span>
            <span className="font-black text-sm text-emerald-700 font-sans">
              {formatCurrency(order.estimatedTotal)}
            </span>
          </div>
        </div>

        {/* 6. Action Buttons (52px Touch Targets) */}
        <div className="pt-1">
          {isPlaced && (
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRejectModalOrderId(order.id)}
                className="col-span-1 h-12 rounded-xl border border-rose-200 bg-rose-50 active:scale-95 text-rose-700 font-bold text-xs flex items-center justify-center gap-1"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>

              <button
                type="button"
                onClick={() => setPrepModalOrderId(order.id)}
                className="col-span-2 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5"
              >
                <ChefHat className="w-4 h-4" />
                <span>Accept Order</span>
              </button>
            </div>
          )}

          {isPreparing && (
            <button
              type="button"
              onClick={() => markOrderPrepared(order.id)}
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Mark Ready for Pickup</span>
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
