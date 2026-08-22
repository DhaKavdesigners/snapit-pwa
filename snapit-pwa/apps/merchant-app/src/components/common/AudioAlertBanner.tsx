import React from 'react';
import { BellRing, ArrowRight } from 'lucide-react';
import { useMerchantStore } from '../../store/useMerchantStore';

export const AudioAlertBanner: React.FC = () => {
  const { orders, setPrepModalOrderId } = useMerchantStore();

  const pendingOrders = orders.filter((o) => o.status === 'PLACED');

  if (pendingOrders.length === 0) return null;

  const firstPending = pendingOrders[0];

  return (
    <div className="bg-amber-500 text-slate-950 px-3.5 py-2.5 shadow-md border-b-2 border-amber-600 animate-ring-pulse z-20 w-full">
      <div className="space-y-2">
        {/* Top Row: Bell icon + Title */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-amber-950 text-amber-300 animate-bounce flex-shrink-0">
            <BellRing className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-black tracking-tight leading-tight truncate">
              🚨 {pendingOrders.length} NEW ORDER{pendingOrders.length > 1 ? 'S' : ''} WAITING!
            </h3>
            <span className="text-[11px] font-bold text-amber-950 block truncate">
              {firstPending.id} &bull; {firstPending.recipientName || 'Customer'}
            </span>
          </div>
        </div>

        {/* Action Button: Full width touch button */}
        <button
          type="button"
          onClick={() => setPrepModalOrderId(firstPending.id)}
          className="w-full h-10 bg-slate-950 hover:bg-slate-900 active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Review & Accept {firstPending.id}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default AudioAlertBanner;
