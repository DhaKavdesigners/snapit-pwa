import React, { useState } from 'react';
import { AlertCircle, X, Check } from 'lucide-react';
import { useMerchantStore } from '../../store/useMerchantStore';

export const RejectModal: React.FC = () => {
  const { rejectModalOrderId, setRejectModalOrderId, rejectOrder, orders } = useMerchantStore();
  const [selectedReason, setSelectedReason] = useState('Out of Stock');
  const [customNotes, setCustomNotes] = useState('');

  if (!rejectModalOrderId) return null;

  const currentOrder = orders.find((o) => o.id === rejectModalOrderId);

  const reasons = [
    'Out of Stock / Item Unavailable',
    'Shop Overloaded / High Rush',
    'Store Closing / Kitchen Off',
    'Customer Requested Cancellation',
  ];

  const handleConfirmReject = () => {
    const finalReason = customNotes.trim() ? `${selectedReason} - ${customNotes.trim()}` : selectedReason;
    rejectOrder(rejectModalOrderId, finalReason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm sm:max-w-md w-full p-4 sm:p-5 relative my-auto animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={() => setRejectModalOrderId(null)}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-rose-100 text-rose-700">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-950">Reject Order</h3>
            <p className="text-xs text-rose-600 font-mono font-semibold">
              Order {currentOrder?.id || rejectModalOrderId}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-4">
          Please provide a mandatory reason for rejecting this order. The customer will be refunded immediately.
        </p>

        {/* Reason Selector */}
        <div className="space-y-2 mb-4">
          {reasons.map((r) => (
            <label
              key={r}
              className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer text-xs font-semibold transition-all ${
                selectedReason === r
                  ? 'border-rose-500 bg-rose-50/60 text-rose-950 font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="rejectReason"
                checked={selectedReason === r}
                onChange={() => setSelectedReason(r)}
                className="text-rose-600 focus:ring-rose-500"
              />
              <span>{r}</span>
            </label>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={() => setRejectModalOrderId(null)}
            className="flex-1 h-12 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Go Back
          </button>
          <button
            type="button"
            onClick={handleConfirmReject}
            className="flex-1 h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-lg shadow-rose-600/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Confirm Rejection</span>
          </button>
        </div>
      </div>
    </div>
  );
};
