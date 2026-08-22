import React from 'react';
import { ShoppingBag, CheckCircle2, TrendingUp, XCircle, Receipt } from 'lucide-react';
import { useMerchantStore } from '../../store/useMerchantStore';
import { formatCurrency } from '../../utils/formatters';

interface DailyMetricsBarProps {
  onOpenSettlement?: () => void;
}

export const DailyMetricsBar: React.FC<DailyMetricsBarProps> = ({ onOpenSettlement }) => {
  const { orders, historicalGroups } = useMerchantStore();

  const todayHistory = historicalGroups[0];
  const activeOrdersCount = orders.length;
  const completedOrdersCount = todayHistory?.orderCount || 0;
  const collectedPaise = todayHistory?.collectedPaise || 0;
  const lostPaise = todayHistory?.lostPaise || 0;
  const totalOrdersCount = activeOrdersCount + completedOrdersCount + (todayHistory?.rejectedCount || 0);

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {/* Top Header Row with Title on Left and 11:00 PM Settlement on Right */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
            Today's Counter Performance
          </h2>
        </div>

        {onOpenSettlement && (
          <button
            type="button"
            onClick={onOpenSettlement}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-emerald-400 font-extrabold text-xs shadow-sm transition-all cursor-pointer border border-slate-700"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>11:00 PM Daily Settlement</span>
          </button>
        )}
      </div>

      {/* Metrics Row: 4 Columns in 1 Single Row on Desktop (2 Columns on Small Mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* 1. Live Active Queue */}
        <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              Active Queue
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5 leading-none">
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

        {/* 2. Today's Collected Sales */}
        <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              Collected Sales
            </span>
            <div className="text-lg sm:text-xl font-black text-emerald-700 font-sans mt-0.5 leading-none truncate">
              {formatCurrency(collectedPaise)}
            </div>
            <span className="text-[10px] font-bold text-slate-500 block mt-1">
              Gross UPI/COD
            </span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 flex-shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        {/* 3. Delivered Today */}
        <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              Delivered
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5 leading-none">
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

        {/* 4. Cancelled / Lost Value */}
        <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              Cancelled
            </span>
            <div className="text-lg sm:text-xl font-black text-rose-600 font-sans mt-0.5 leading-none truncate">
              {formatCurrency(lostPaise)}
            </div>
            <span className="text-[10px] font-semibold text-slate-500 block mt-1">
              {todayHistory?.rejectedCount || 0} Rejected
            </span>
          </div>
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 flex-shrink-0">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
