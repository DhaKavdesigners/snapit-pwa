import React, { useState } from 'react';
import {
  History,
  Calendar,
  CheckCircle2,
  XCircle,
  CreditCard,
  User,
  MapPin,
  ChevronDown,
  ChevronUp,
  Check,
  Bike,
} from 'lucide-react';
import { useMerchantStore } from '../../store/useMerchantStore';
import { formatCurrency, formatOrderTime } from '../../utils/formatters';
import type { Order } from '../../types/snapit-types';

export const OrderHistory: React.FC = () => {
  const { historicalGroups, products, markDelivered } = useMerchantStore();
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({
    'Today (Live Activity)': true,
  });
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const toggleGroup = (key: string) => {
    setExpandedDates((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleOrder = (orderId: string) => {
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 mt-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" />
              <span>ARCHIVED TRANSACTION HISTORY</span>
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Past completed and settled orders &bull; Click any day or order to expand full item breakdown
          </p>
        </div>
      </div>

      {/* Date Groups */}
      <div className="space-y-6">
        {historicalGroups.map((group, groupIdx) => {
          const isGroupExpanded = Boolean(expandedDates[group.dateKey]);
          const groupDelivered = group.orders.filter((o) => o.status === 'DELIVERED');
          const groupCollected = groupDelivered.length > 0
            ? groupDelivered.reduce((sum, o) => sum + getOrderItemsTotal(o), 0)
            : group.collectedPaise;

          return (
            <div
              key={`${group.dateKey}-${groupIdx}`}
              className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/50"
            >
              {/* Group Summary Header (Clickable Accordion) */}
              <div
                onClick={() => toggleGroup(group.dateKey)}
                className="p-3.5 sm:p-4 bg-slate-100/80 hover:bg-slate-200/60 transition-colors border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className={`w-4 h-4 ${group.dateKey === 'Today (Live Activity)' ? 'text-emerald-600' : 'text-slate-500'}`} />
                  <span className="font-extrabold text-slate-900 text-sm">{group.dateKey}</span>
                  {group.dateKey === 'Today (Live Activity)' ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase font-mono">
                      LIVE
                    </span>
                  ) : (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 uppercase font-mono">
                      SETTLED
                    </span>
                  )}
                </div>

                {/* Group Metrics Pills & Chevron */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-700">
                    Orders: <strong className="text-slate-900">{group.orderCount}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 border border-emerald-200 font-bold text-emerald-900">
                    Collected: <strong className="text-emerald-700">{formatCurrency(groupCollected)}</strong>
                  </span>
                  <span className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600">
                    {isGroupExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </div>
              </div>

              {/* Individual Orders in Group */}
              {isGroupExpanded && (
                <div className="divide-y divide-slate-200/80 p-2 sm:p-3 space-y-2">
                {group.orders.length > 0 ? (
                  group.orders.map((order) => {
                    const isCancelled = order.status === 'CANCELLED' || (order.status as any) === 'REJECTED';
                    const isDelivered = order.status === 'DELIVERED';
                    const isExpanded = expandedOrderId === order.id;
                    const orderItemsTotal = getOrderItemsTotal(order);

                    return (
                      <div
                        key={order.id}
                        className="rounded-xl bg-white border border-slate-200/80 hover:border-emerald-300 transition-all overflow-hidden shadow-2xs"
                      >
                        {/* Order Clickable Header */}
                        <div
                          onClick={() => toggleOrder(order.id)}
                          className="p-3 sm:p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer"
                        >
                          {/* Left: ID, Time, Customer */}
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="font-mono font-black text-sm text-emerald-700">
                                {order.id}
                              </span>
                              <span className="text-xs text-slate-600 font-medium">
                                ({order.recipientName || 'Customer'})
                              </span>
                              <span className="text-xs text-slate-400 font-normal">
                                &bull; {formatOrderTime(order.createdAt)}
                              </span>

                              {/* Status Badge */}
                              {isCancelled ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800">
                                  <XCircle className="w-3 h-3" />
                                  REJECTED
                                </span>
                              ) : order.status === 'OUT_FOR_DELIVERY' || order.status === 'PICKED_UP' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800">
                                  <Bike className="w-3 h-3 text-blue-600 animate-pulse" />
                                  OUT FOR DELIVERY
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" />
                                  DELIVERED
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right: Total Product Amount & Chevron */}
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-base font-black font-sans ${
                                isCancelled ? 'line-through text-slate-400' : 'text-slate-900'
                              }`}
                            >
                              {formatCurrency(orderItemsTotal)}
                            </span>
                            <span className="p-1 rounded-lg bg-slate-100 text-slate-600">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </span>
                          </div>
                        </div>

                        {/* 📦 Expanded Full Details: ONLY Products, Quantity & Product Prices */}
                        {isExpanded && (
                          <div className="p-3.5 bg-slate-50/90 border-t border-slate-200/80 animate-in fade-in duration-150">
                            <div className="divide-y divide-slate-200 rounded-xl bg-white border border-slate-200 p-2.5">
                              {order.items.map((it: any, idx) => {
                                const p = getProductInfo(it);
                                return (
                                  <div
                                    key={idx}
                                    className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
                                  >
                                    <div className="flex items-center gap-2 min-w-0 pr-2">
                                      <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded text-xs">
                                        {p.quantity}×
                                      </span>
                                      <span className="font-semibold text-slate-900 truncate">
                                        {p.name}
                                      </span>
                                    </div>
                                    <span className="font-mono font-bold text-slate-800 flex-shrink-0">
                                      {formatCurrency(p.price * p.quantity)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-4 text-center text-xs text-slate-600">
                    No completed orders for this day yet.
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

export default OrderHistory;
