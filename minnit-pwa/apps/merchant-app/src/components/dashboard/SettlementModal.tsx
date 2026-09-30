import React, { useState } from 'react';
import {
  Receipt,
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Building,
  ArrowUpRight,
} from 'lucide-react';
import { useMerchantStore } from '../../store/useMerchantStore';
import { formatCurrency } from '../../utils/formatters';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({ isOpen, onClose }) => {
  const { historicalGroups, products, activeStore } = useMerchantStore();
  const [isSettled, setIsSettled] = useState(false);

  if (!isOpen) return null;

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

  const getOrderItemsTotal = (order: any) => {
    if (!order.items || order.items.length === 0) return order.estimatedTotal || 0;
    const subtotal = order.items.reduce((sum: number, it: any) => {
      const p = getProductInfo(it);
      return sum + p.price * p.quantity;
    }, 0);
    return subtotal > 0 ? subtotal : order.estimatedTotal || 0;
  };

  const todayGroup = historicalGroups[0];
  const allFulfilledOrders = todayGroup?.orders.filter((o) => o.status !== 'CANCELLED' && (o.status as any) !== 'REJECTED') || [];
  const totalGrossPaise = allFulfilledOrders.length > 0
    ? allFulfilledOrders.reduce((sum, o) => sum + getOrderItemsTotal(o), 0)
    : todayGroup?.collectedPaise || 0;
  const platformFeePaise = 0; // 0% FREE platform fee
  const netPayablePaise = totalGrossPaise;
  const totalLostPaise = todayGroup?.orders
    ? todayGroup.orders
        .filter((o) => (o.status as any) === 'REJECTED' || o.status === 'CANCELLED')
        .reduce((sum, o) => sum + getOrderItemsTotal(o), 0)
    : todayGroup?.lostPaise || 0;

  const handleSettleLedger = () => {
    setIsSettled(true);
    setTimeout(() => {
      onClose();
      setIsSettled(false);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm sm:max-w-md w-full p-4 sm:p-5 relative my-auto max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-3 pr-8 flex-shrink-0">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-100 text-emerald-700 flex-shrink-0">
            <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-black text-slate-950 truncate">
              Daily 11:00 PM Settlement
            </h3>
            <p className="text-xs text-slate-500 font-mono truncate">
              {activeStore.name} &bull; Ledger Reconciliation
            </p>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {/* Summary Card */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Net Merchant Payout
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-700 font-mono">
                Auto-Transfer 11:00 PM
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-sans">
              {formatCurrency(netPayablePaise)}
            </div>
            <p className="text-[11px] text-emerald-800/90 mt-1 font-medium">
              Calculated from {allFulfilledOrders.length} fulfilled orders (100% Prepaid Online via UPI) with 0% platform fee (FREE).
            </p>
          </div>

          {/* Payment Channel Breakdown */}
          <div className="space-y-2.5 text-xs">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Payment Mode Ledger
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
              {/* UPI Online (100% Prepaid) */}
              <div className="p-3.5 flex items-center justify-between gap-2 bg-white">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 flex-shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-slate-900 truncate text-xs sm:text-sm">
                      100% Prepaid Online via UPI
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold font-mono">
                      {allFulfilledOrders.length} Fulfilled Orders &bull; Direct Digital Payment
                    </div>
                  </div>
                </div>
                <span className="font-black text-emerald-700 font-sans text-sm sm:text-base flex-shrink-0">
                  {formatCurrency(totalGrossPaise)}
                </span>
              </div>

              {/* Platform Deduction */}
              <div className="p-3 flex items-center justify-between bg-slate-100/60">
                <div className="text-slate-600 font-semibold text-xs flex items-center gap-1.5">
                  <span>SnapIt Platform Fee (0%)</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 font-mono">FREE</span>
                </div>
                <span className="font-black text-emerald-700 font-sans text-xs uppercase tracking-wider">
                  FREE
                </span>
              </div>

              {/* Cancelled Loss */}
              {totalLostPaise > 0 && (
                <div className="p-3 flex items-center justify-between bg-rose-50/50">
                  <div className="text-rose-700 font-semibold text-xs">Cancelled Orders Value</div>
                  <span className="font-bold text-rose-700 font-sans text-xs">
                    {formatCurrency(totalLostPaise)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Direct Bank Account Details */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Building className="w-4 h-4 text-slate-600" />
              <div>
                <span className="font-bold text-slate-900 block text-[11px]">Direct Bank Settlement</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  SBI KGF Main Branch &bull; A/C ending **4821
                </span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-4 border-t border-slate-100 flex-shrink-0 mt-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleSettleLedger}
            disabled={isSettled}
            className="flex-2 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-75"
          >
            {isSettled ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200 animate-bounce" />
                <span>Settlement Verified!</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                <span>Verify & Approve Ledger</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettlementModal;
