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

interface MobileHistoryViewProps {
  onOpenSettlement: () => void;
}

export const MobileHistoryView: React.FC<MobileHistoryViewProps> = ({ onOpenSettlement }) => {
  const { orders, historicalGroups } = useMerchantStore();
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({
    'Today (Live Activity)': true,
  });

  const toggleGroup = (key: string) => {
    setExpandedDates((prev) => ({ ...prev, [key]: !prev[key] }));
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
  const collectedPaise = todayGroup.collectedPaise || 0;
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

        {/* 3-Col Summary Breakdown */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-center text-xs">
          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Orders</span>
            <strong className="text-sm font-black text-white">{completedOrdersCount}</strong>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Gross</span>
            <strong className="text-xs font-black text-emerald-400 truncate block">
              {formatCurrency(collectedPaise)}
            </strong>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Fee (5%)</span>
            <strong className="text-xs font-black text-rose-400 truncate block">
              -{formatCurrency(platformFeePaise)}
            </strong>
          </div>
        </div>
      </div>

      {/* 3. 2x2 Performance Metrics Grid (Guaranteed 2 columns so NO truncation happens) */}
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
              Prepaid UPI
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
          <span className="text-[10px] text-slate-500 font-medium">Daily Receipts</span>
        </div>

        {historicalGroups.map((group) => {
          const isExpanded = Boolean(expandedDates[group.dateKey]);

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
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-black text-slate-900">{group.dateKey}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                    {group.orderCount} orders
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-700 font-sans">
                    {formatCurrency(group.collectedPaise)}
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

                      return (
                        <div key={order.id} className="pt-2 first:pt-0">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900">
                              <span>{order.id}</span>
                              <span className="text-slate-500 font-normal">
                                ({order.recipientName || 'Customer'})
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 font-bold">
                              {isDelivered ? (
                                <span className="text-emerald-700 flex items-center gap-1 text-[11px]">
                                  <CheckCircle2 className="w-3 h-3" />
                                  {formatCurrency(order.estimatedTotal)}
                                </span>
                              ) : (
                                <span className="text-rose-600 flex items-center gap-1 text-[11px]">
                                  <XCircle className="w-3 h-3" />
                                  CANCELLED
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                            <span>{formatOrderTime(order.createdAt)}</span>
                            <span className="flex items-center gap-1 font-extrabold text-emerald-700">
                              <CreditCard className="w-3 h-3 text-emerald-600" />
                              <span>PAID ONLINE (UPI)</span>
                            </span>
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
