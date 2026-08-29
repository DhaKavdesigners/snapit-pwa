import React from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { useMerchantStore } from '../../store/useMerchantStore';

export const LowStockWarningBanner: React.FC = () => {
  const { products, acknowledgedLowStockIds, dismissLowStockAlert } = useMerchantStore();

  // Find active products with stock <= 3 and > 0 that haven't been acknowledged yet
  const unacknowledgedLowStock = products.filter(
    (p) =>
      p.stockCount > 0 &&
      p.stockCount <= 3 &&
      p.availability === 'AVAILABLE' &&
      p.inStock !== false &&
      !acknowledgedLowStockIds.includes(p.id)
  );

  if (unacknowledgedLowStock.length === 0) return null;

  const count = unacknowledgedLowStock.length;

  return (
    <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 text-white px-4 py-2.5 shadow-md animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-white/20 text-white flex-shrink-0">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <h3 className="text-xs sm:text-sm font-black tracking-tight text-white">
            Low Stock Warning
          </h3>
        </div>

        <button
          type="button"
          onClick={dismissLowStockAlert}
          className="px-4 py-1.5 bg-white text-amber-950 hover:bg-amber-50 active:scale-95 text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>OK</span>
        </button>
      </div>
    </div>
  );
};

