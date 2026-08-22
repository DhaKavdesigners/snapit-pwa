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
  User,
} from 'lucide-react';
import { useMerchantStore } from '../../store/useMerchantStore';
import { formatCurrency, formatOrderTime } from '../../utils/formatters';

interface MobileHistoryViewProps {
  onOpenSettlement: () => void;
}

export const MobileHistoryView: React.FC<MobileHistoryViewProps> = ({ onOpenSettlement }) => {
  const { historicalGroups } = useMerchantStore();
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({
    'Today (Live Activity)': true,
  });

  const toggleGroup = (key: string) => {
    setExpandedDates((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const todayGroup = historicalGroups[0] || {
    dateKey: 'Today',
    orderCount: 0,
    collectedPaise: 0,
    rejectedCount: 0,
    lostPaise: 0,
    orders: [],
  };

  const platformFeePaise = Math.round(todayGroup.collectedPaise * 0.05);
  const netPayoutPaise = todayGroup.collectedPaise - platformFeePaise;

  return (
    <div className="space-y-4 pb-8">
      {/* 11:00 PM Settlement Summary Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-md">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                11:00 PM SETTLEMENT
              </h3>
              <p className="text-[10px] text-slate-300">Today's Net Payout</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSettlement}
            className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 text-[11px] font-black shadow-sm"
          >
            View Ledger
          </button>
        </div>

        <div className="text-2xl font-black text-white font-sans tracking-tight mb-3">
          {formatCurrency(netPayoutPaise)}
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-700/60 text-center text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Orders</span>
            <strong className="text-sm font-bold text-white">{todayGroup.orderCount}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Gross</span>
            <strong className="text-xs font-bold text-emerald-400">
              {formatCurrency(todayGroup.collectedPaise)}
            </strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Fee (5%)</span>
            <strong className="text-xs font-bold text-rose-400">
              -{formatCurrency(platformFeePaise)}
            </strong>
          </div>
        </div>
      </div>

      {/* Date-Grouped Transaction History */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Historical Transactions
        </h4>

        {historicalGroups.map((group) => {
          const isExpanded = Boolean(expandedDates[group.dateKey]);

          return (
            <div
              key={group.dateKey}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden"
            >
              {/* Header */}
              <button
                type="button"
                onClick={() => toggleGroup(group.dateKey)}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-black text-slate-900">{group.dateKey}</span>
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-slate-100 text-slate-700">
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

              {/* Order List */}
              {isExpanded && (
                <div className="p-3 border-t border-slate-100 divide-y divide-slate-100 bg-slate-50/50 space-y-2">
                  {group.orders.map((order) => {
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
                          <span className="flex items-center gap-1 font-semibold">
                            {order.paymentMethod === 'UPI_NOW' ? (
                              <>
                                <CreditCard className="w-2.5 h-2.5 text-emerald-600" />
                                <span>UPI ONLINE</span>
                              </>
                            ) : (
                              <>
                                <Banknote className="w-2.5 h-2.5 text-amber-600" />
                                <span>DOORSTEP COD</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
