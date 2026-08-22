import React from 'react';
import { AlertTriangle, Power } from 'lucide-react';
import { useMerchantStore } from '../../store/useMerchantStore';

export const OfflineBanner: React.FC = () => {
  const { isOnline, toggleStoreStatus } = useMerchantStore();

  if (isOnline) return null;

  return (
    <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 text-white px-4 py-3 shadow-md animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-white/20 text-white flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">
              Store is Currently OFFLINE
            </h3>
            <p className="text-xs text-rose-100 font-medium">
              Your store is hidden from customers. Turn your store ONLINE to start receiving live orders.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleStoreStatus}
          className="px-4 py-2 bg-white text-rose-700 hover:bg-rose-50 active:scale-95 text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer"
        >
          <Power className="w-3.5 h-3.5" />
          <span>Switch Store ONLINE</span>
        </button>
      </div>
    </div>
  );
};
