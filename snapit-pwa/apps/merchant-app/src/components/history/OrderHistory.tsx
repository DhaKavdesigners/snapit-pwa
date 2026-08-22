import React from 'react';
import {
  History,
  Calendar,
  CheckCircle2,
  XCircle,
  CreditCard,
  Banknote,
  User,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { useMerchantStore } from '../../store/useMerchantStore';
import { formatCurrency, formatOrderTime } from '../../utils/formatters';

export const OrderHistory: React.FC = () => {
  const { historicalGroups, products } = useMerchantStore();

  const getProductInfo = (productId: string) => {
    return (
      products.find((p) => p.id === productId) || {
        id: productId,
        name: 'Item ' + productId,
        price: 0,
      }
    );
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
            Past completed and settled orders &bull; Used for 11:00 PM daily cash and UPI reconciliation
          </p>
        </div>
      </div>

      {/* Date Groups */}
      <div className="space-y-6">
        {historicalGroups.map((group, groupIdx) => (
          <div
            key={`${group.dateKey}-${groupIdx}`}
            className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/50"
          >
            {/* Group Summary Header */}
            <div className="p-3.5 sm:p-4 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span className="font-extrabold text-slate-900 text-sm">{group.dateKey}</span>
              </div>

              {/* Group Metrics Pills */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-700">
                  Orders: <strong className="text-slate-900">{group.orderCount}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 border border-emerald-200 font-bold text-emerald-900">
                  Collected: <strong className="text-emerald-700">{formatCurrency(group.collectedPaise)}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-700">
                  Rejected: <strong className="text-slate-900">{group.rejectedCount}</strong>
                </span>
                {group.lostPaise > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-rose-100 border border-rose-200 font-bold text-rose-800">
                    Lost: <strong className="text-rose-700">{formatCurrency(group.lostPaise)}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Individual Orders in Group */}
            <div className="divide-y divide-slate-200/80 p-2 sm:p-3">
              {group.orders.length > 0 ? (
                group.orders.map((order) => {
                  const isCancelled = order.status === 'CANCELLED';

                  return (
                    <div
                      key={order.id}
                      className="p-3 sm:p-4 rounded-xl bg-white hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 my-1"
                    >
                      {/* Left: ID, Time, Customer & Items */}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono font-black text-sm text-slate-950">
                            {order.id}
                          </span>
                          <span className="text-xs text-slate-600 font-medium">
                            {formatOrderTime(order.createdAt)}
                          </span>

                          {/* Status Badge */}
                          {isCancelled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800">
                              <XCircle className="w-3 h-3" />
                              REJECTED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              DELIVERED
                            </span>
                          )}
                        </div>

                        {/* Items summary */}
                        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 flex-wrap">
                          {order.items.map((it, idx) => {
                            const p = getProductInfo(it.productId);
                            return (
                              <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                                <strong className="text-slate-950">{it.quantity}×</strong> {p.name}
                              </span>
                            );
                          })}
                        </div>

                        {/* Customer & Address */}
                        <div className="flex items-center gap-3 text-[11px] text-slate-600">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-600" />
                            {order.recipientName || 'Customer'}
                          </span>
                          <span className="text-slate-300">&bull;</span>
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-slate-600" />
                            {order.deliveryAddress.line1}
                          </span>
                        </div>
                      </div>

                      {/* Right: Payment & Total Amount */}
                      <div className="flex items-center justify-between md:flex-col md:items-end gap-1.5 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                        <div className="flex items-center gap-1 text-xs">
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-extrabold text-[11px]">
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>UPI Paid (Online)</span>
                          </span>
                        </div>

                        <span
                          className={`text-base font-black font-sans ${
                            isCancelled ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {formatCurrency(order.estimatedTotal)}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-center text-xs text-slate-600">
                  No completed orders for this day yet.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
