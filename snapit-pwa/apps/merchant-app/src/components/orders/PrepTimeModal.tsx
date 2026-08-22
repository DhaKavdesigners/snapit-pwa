import React, { useState } from 'react';
import { ChefHat, Clock, X, Check } from 'lucide-react';
import { useMerchantStore } from '../../store/useMerchantStore';

export const PrepTimeModal: React.FC = () => {
  const { prepModalOrderId, setPrepModalOrderId, acceptOrder, orders } = useMerchantStore();
  const [selectedMinutes, setSelectedMinutes] = useState(10);

  if (!prepModalOrderId) return null;

  const currentOrder = orders.find((o) => o.id === prepModalOrderId);
  const timeOptions = [5, 10, 15, 20, 30];

  const handleConfirm = () => {
    acceptOrder(prepModalOrderId, selectedMinutes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm sm:max-w-md w-full p-4 sm:p-5 relative my-auto animate-in zoom-in-95 duration-150">
        {/* Close button */}
        <button
          type="button"
          onClick={() => setPrepModalOrderId(null)}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-950">Accept & Set Prep Time</h3>
            <p className="text-xs text-slate-600 font-mono">
              Order {currentOrder?.id || prepModalOrderId}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-5">
          Choose estimated kitchen preparation time. This coordinates the rider dispatch ETA so the rider arrives exactly when the bag is ready.
        </p>

        {/* 1-Tap Time Selector Chips */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {timeOptions.map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => setSelectedMinutes(mins)}
              className={`h-14 rounded-2xl flex flex-col items-center justify-center border font-bold transition-all cursor-pointer ${
                selectedMinutes === mins
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25 scale-105'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <span className="text-base font-extrabold">{mins}</span>
              <span className="text-[10px] uppercase font-medium">min</span>
            </button>
          ))}
        </div>

        {/* Confirm Acceptance Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPrepModalOrderId(null)}
            className="flex-1 h-12 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-2 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Confirm & Start ({selectedMinutes} mins)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
