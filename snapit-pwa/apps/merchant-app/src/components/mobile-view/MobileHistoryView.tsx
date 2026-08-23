import React, { useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  CreditCard,
  Banknote,
  Receipt,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { useMerchantStore } from '../../store/useMerchantStore';
import { formatCurrency, formatOrderTime } from '../../utils/formatters';
import type { Order } from '../../types/snapit-types';

interface MobileHistoryViewProps {
  onOpenSettlement: () => void;
}

export const MobileHistoryView: React.FC<MobileHistoryViewProps> = ({ onOpenSettlement }) => {
  const { orders, historicalGroups, products } = useMerchantStore();
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({
    'Today (Live Activity)': true,
  });
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const toggleGroup = (key: string) => {
    setExpandedDates((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const getProductInfo = (it: any) => {
    if (it.name) {
      return {
        name: it.name,
        price: it.price || 0,
        quantity: it.quantity || 1,
      };
    }
    const found = products.find((p) => p.id === (it.productId || it.id));
    return {
      name: found ? found.name : `Item ${it.productId || it.id || ''}`,
      price: found ? found.price : it.price || 0,
      quantity: it.quantity || 1,
    };
  };

  const getOrderItemsTotal = (order: Order) => {
    if (!order.items || order.items.length === 0) return order.estimatedTotal || 0;
    const subtotal = order.items.reduce((sum: number, it: any) => {
      const p = getProductInfo(it);
      return sum + p.price * p.quantity;
    }, 0);
    return subtotal > 0 ? subtotal : order.estimatedTotal || 0;
  };

  const todayGroup = historicalGroups[0] || {
    dateKey: 'Today (Live Activity)',
    orderCount: 0,
    collectedPaise: 0,
    rejectedCount: 0,
    lostPaise: 0,
    orders: [],
  };

  const activeOrdersCount = orders.length;
  const completedOrdersCount = todayGroup.orderCount || 0;
  const todayDeliveredOrders = todayGroup.orders.filter((o) => o.status === 'DELIVERED');
  const collectedPaise = todayDeliveredOrders.length > 0
    ? todayDeliveredOrders.reduce((sum, o) => sum + getOrderItemsTotal(o), 0)
    : todayGroup.collectedPaise || 0;
  const lostPaise = todayGroup.lostPaise || 0;
  const totalOrdersCount = activeOrdersCount + completedOrdersCount + (todayGroup.rejectedCount || 0);

  const platformFeePaise = Math.round(collectedPaise * 0.05);
  const netPayoutPaise = collectedPaise - platformFeePaise;

  return (
    <div className="space-y-4 pb-8">
      {/* 1. Top Title */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
          Today's Counter Performance
        </h2>
        <span className="text-[11px] font-bold text-slate-500 font-mono">
          Settlement Ledger
        </span>
      </div>

      {/* 2. 11:00 PM Daily Settlement Payout Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-500/20 text-emerald-400 flex-shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                11:00 PM SETTLEMENT
              </h3>
              <p className="text-[11px] text-slate-300">Estimated Net Bank Payout</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSettlement}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 text-xs font-extrabold shadow-sm flex-shrink-0 cursor-pointer"
          >
            View Ledger
          </button>
        </div>

        {/* Big Net Payout Amount */}
        <div className="pt-1">
          <div className="text-3xl font-black text-white font-sans tracking-tight">
            {formatCurrency(netPayoutPaise)}
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold mt-0.5 block">
            Direct UPI Settlement to Bank at 11:00 PM
          </span>
        </div>

        {/* 2-Col Summary Breakdown */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-center text-xs">
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Orders</span>
            <strong className="text-sm font-black text-white">{completedOrdersCount}</strong>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Gross Sales</span>
            <strong className="text-xs font-black text-emerald-400 truncate block">
              {formatCurrency(collectedPaise)}
            </strong>
          </div>
        </div>
      </div>

      {/* 3. 2x2 Performance Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Active Queue */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              Active Queue
            </span>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5 leading-none">
              {activeOrdersCount}
            </div>
            <span className="text-[10px] font-bold text-emerald-700 block mt-1">
              Live Counter
            </span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 flex-shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>

        {/* Collected Sales */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              Collected Sales
            </span>
            <div className="text-lg font-black text-emerald-700 font-sans mt-0.5 leading-none truncate">
              {formatCurrency(collectedPaise)}
            </div>
            <span className="text-[10px] font-bold text-slate-500 block mt-1">
              Product Sales
            </span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 flex-shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        {/* Delivered Today */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              Delivered
            </span>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5 leading-none">
              {completedOrdersCount}
            </div>
            <span className="text-[10px] font-semibold text-slate-500 block mt-1">
              of {totalOrdersCount} Total
            </span>
          </div>
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 flex-shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Cancelled / Lost */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              Cancelled
            </span>
            <div className="text-lg font-black text-rose-600 font-sans mt-0.5 leading-none truncate">
              {formatCurrency(lostPaise)}
            </div>
            <span className="text-[10px] font-semibold text-slate-500 block mt-1">
              {todayGroup.rejectedCount || 0} Rejected
            </span>
          </div>
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 flex-shrink-0">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 4. Date-Grouped Transaction History */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
            Archived Transaction History
          </h4>
          <span className="text-[10px] text-slate-500 font-medium">Click order to view items</span>
        </div>

        {historicalGroups.map((group) => {
          const isExpanded = Boolean(expandedDates[group.dateKey]);
          const groupDelivered = group.orders.filter((o) => o.status === 'DELIVERED');
          const groupCollected = groupDelivered.length > 0
            ? groupDelivered.reduce((sum, o) => sum + getOrderItemsTotal(o), 0)
            : group.collectedPaise;

          return (
            <div
              key={group.dateKey}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden"
            >
              {/* Header Accordion Button */}
              <button
                type="button"
                onClick={() => toggleGroup(group.dateKey)}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <Calendar className={`w-4 h-4 flex-shrink-0 ${group.dateKey === 'Today (Live Activity)' ? 'text-emerald-600' : 'text-slate-500'}`} />
                  <span className="text-xs font-black text-slate-900 truncate">{group.dateKey}</span>
                  {group.dateKey === 'Today (Live Activity)' ? (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase font-mono flex-shrink-0">
                      LIVE
                    </span>
                  ) : (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase font-mono flex-shrink-0">
                      SETTLED
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono flex-shrink-0">
                    {group.orderCount} {group.orderCount === 1 ? 'order' : 'orders'}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-black text-emerald-700 font-sans">
                    {formatCurrency(groupCollected)}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Orders in Date Group */}
              {isExpanded && (
                <div className="p-3 border-t border-slate-100 divide-y divide-slate-100 bg-slate-50/50 space-y-2">
                  {group.orders.length > 0 ? (
                    group.orders.map((order) => {
                      const isDelivered = order.status === 'DELIVERED';
                      const isOrderExpanded = expandedOrderId === order.id;
                      const orderItemsTotal = getOrderItemsTotal(order);

                      return (
                        <div key={order.id} className="pt-2 first:pt-0">
                          {/* Order Row Trigger Button */}
                          <div
                            onClick={() => toggleOrderDetails(order.id)}
                            className="p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                <span className="font-mono text-emerald-700 font-extrabold">{order.id}</span>
                                <span className="text-slate-600 font-medium">
                                  ({order.recipientName || 'Customer'})
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 font-bold">
                                {isDelivered ? (
                                  <span className="text-emerald-700 flex items-center gap-1 text-xs">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    {formatCurrency(orderItemsTotal)}
                                  </span>
                                ) : (
                                  <span className="text-rose-600 flex items-center gap-1 text-xs">
                                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                    CANCELLED
                                  </span>
                                )}
                                <span className="text-slate-400 ml-0.5">
                                  {isOrderExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center text-[10px] text-slate-400 mt-0.5">
                              <span>{formatOrderTime(order.createdAt)}</span>
                            </div>

                            {/* 📦 Expanded Order Details: ONLY Products, Quantity & Product Price */}
                            {isOrderExpanded && (
                              <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5 text-xs animate-in fade-in duration-150">
                                <div className="divide-y divide-slate-100 rounded-xl bg-slate-50 border border-slate-100 p-2">
                                  {order.items.map((it: any, idx: number) => {
                                    const p = getProductInfo(it);
                                    return (
                                      <div
                                        key={idx}
                                        className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                          <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded text-[11px]">
                                            {p.quantity}×
                                          </span>
                                          <span className="font-semibold text-slate-900 truncate">
                                            {p.name}
                                          </span>
                                        </div>
                                        <span className="font-mono font-bold text-slate-700 flex-shrink-0">
                                          {formatCurrency(p.price * p.quantity)}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-3 text-center text-xs text-slate-400">
                      No orders completed yet today
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MobileHistoryView;
