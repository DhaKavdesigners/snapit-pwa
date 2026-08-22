import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { useMerchantStore } from '../../store/useMerchantStore';

export const DeleteConfirmModal: React.FC = () => {
  const { deletingProductId, setDeletingProductId, removeProduct, products } = useMerchantStore();

  if (!deletingProductId) return null;

  const targetProduct = products.find((p) => p.id === deletingProductId);

  const handleConfirm = () => {
    removeProduct(deletingProductId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-4 sm:p-5 relative my-auto animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={() => setDeletingProductId(null)}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-rose-100 text-rose-700">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-950">Remove Product?</h3>
            <p className="text-xs text-slate-600">This item will be delisted</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-6">
          Are you sure you want to remove <strong className="text-slate-900">"{targetProduct?.name || 'this item'}"</strong> from the merchant catalog? Customers will no longer be able to view or order it.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDeletingProductId(null)}
            className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-lg shadow-rose-600/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove Product</span>
          </button>
        </div>
      </div>
    </div>
  );
};
