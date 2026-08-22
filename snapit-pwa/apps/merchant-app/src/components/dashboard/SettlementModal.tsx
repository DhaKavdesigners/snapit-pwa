import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  CheckCircle2,
  Receipt,
  Download,
} from 'lucide-react';
import { useMerchantStore } from '../../store/useMerchantStore';
import { formatCurrency } from '../../utils/formatters';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({ isOpen, onClose }) => {
  const { historicalGroups, activeStore, gstPercent } = useMerchantStore();
  const [isSettled, setIsSettled] = useState(false);

  if (!isOpen) return null;

  const todayGroup = historicalGroups[0];
  const allDeliveredOrders = todayGroup?.orders.filter((o) => o.status === 'DELIVERED') || [];

  // Breakdowns by payment method
  const upiOnlineOrders = allDeliveredOrders.filter((o) => o.paymentMethod === 'UPI_NOW');
  const upiOnlinePaise = upiOnlineOrders.reduce((sum, o) => sum + o.estimatedTotal, 0);

  const doorstepOrders = allDeliveredOrders.filter((o) => o.paymentMethod === 'UPI_DELIVERY' || o.paymentMethod === 'CASH');
  const doorstepPaise = doorstepOrders.reduce((sum, o) => sum + o.estimatedTotal, 0);

  const totalCollectedPaise = todayGroup?.collectedPaise || 0;
  const totalLostPaise = todayGroup?.lostPaise || 0;

  // Platform commission / deductions (5% platform fee)
  const platformFeePaise = Math.round(totalCollectedPaise * 0.05);
  const netPayablePaise = totalCollectedPaise - platformFeePaise;

  const handleSettleLedger = () => {
    setIsSettled(true);
    setTimeout(() => {
      setIsSettled(false);
      onClose();
    }, 2000);
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
              {activeStore.name} &bull; KGF Dark Store
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-4 flex-shrink-0">
          End-of-day UPI settlement verification and reconciliation ledger for daily merchant payout.
        </p>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {/* Summary Card */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Net Merchant Payout
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-700 font-mono">
                Auto-Transfer 11:30 PM
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-sans">
              {formatCurrency(netPayablePaise)}
            </div>
            <p className="text-[11px] text-emerald-800/90 mt-1 font-medium">
              Calculated from {allDeliveredOrders.length} delivered orders after platform service charges.
            </p>
          </div>

          {/* Payment Channel Breakdown */}
          <div className="space-y-2.5 text-xs">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Payment Mode Ledger
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
              {/* UPI Online */}
              <div className="p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 flex-shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate text-xs sm:text-sm">
                      Direct UPI Online (Prepaid)
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {upiOnlineOrders.length} Orders
                    </div>
                  </div>
                </div>
                <span className="font-bold text-slate-900 font-sans text-xs sm:text-sm flex-shrink-0">
                  {formatCurrency(upiOnlinePaise)}
                </span>
              </div>

              {/* Doorstep COD / UPI */}
              <div className="p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 flex-shrink-0">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate text-xs sm:text-sm">
                      Doorstep QR / Cash Collection
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {doorstepOrders.length} Orders
                    </div>
                  </div>
                </div>
                <span className="font-bold text-slate-900 font-sans text-xs sm:text-sm flex-shrink-0">
                  {formatCurrency(doorstepPaise)}
                </span>
              </div>

              {/* Platform Deduction */}
              <div className="p-3 flex items-center justify-between bg-slate-100/60">
                <div className="text-slate-600 font-semibold text-xs">
                  SnapIt Platform Fee (5%)
                </div>
                <span className="font-bold text-slate-600 font-sans text-xs">
                  - {formatCurrency(platformFeePaise)}
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
