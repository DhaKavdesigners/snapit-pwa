import React from 'react';
import { Inbox, Radio } from 'lucide-react';
import { useMerchantStore } from '../../store/useMerchantStore';
import { MobileOrderCard } from './MobileOrderCard';

export const MobileLiveOrdersView: React.FC = () => {
  const { orders, isOnline, toggleStoreStatus } = useMerchantStore();

  const placedCount = orders.filter((o) => o.status === 'PLACED').length;
  const preparingCount = orders.filter((o) => o.status === 'PREPARING').length;
  const readyCount = orders.filter((o) => o.status === 'READY_FOR_PICKUP').length;

  return (
    <div className="space-y-4">
      {/* Top Status Header */}
      <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-black text-slate-950">LIVE ORDERS QUEUE</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 font-mono">
              {orders.length} ACTIVE
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Real-time order progression
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold">
          <Radio className={`w-3.5 h-3.5 ${isOnline ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
          <span className="text-[10px] font-mono">{isOnline ? 'LISTENING' : 'PAUSED'}</span>
        </div>
      </div>

      {/* Status Summary Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-[11px] flex-shrink-0">
          All: {orders.length}
        </span>
        <span className={`px-2.5 py-1 rounded-xl font-extrabold text-[11px] flex-shrink-0 ${
          placedCount > 0 ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-slate-100 text-slate-500'
        }`}>
          Placed: {placedCount}
        </span>
        <span className={`px-2.5 py-1 rounded-xl font-extrabold text-[11px] flex-shrink-0 ${
          preparingCount > 0 ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-500'
        }`}>
          Prep: {preparingCount}
        </span>
        <span className={`px-2.5 py-1 rounded-xl font-extrabold text-[11px] flex-shrink-0 ${
          readyCount > 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-500'
        }`}>
          Ready: {readyCount}
        </span>
      </div>

      {/* Orders Feed */}
      {orders.length > 0 ? (
        <div className="space-y-3.5">
          {orders.map((order) => (
            <MobileOrderCard key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <div className="py-12 px-4 text-center flex flex-col items-center justify-center rounded-2xl bg-white border border-dashed border-slate-200 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Inbox className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 mb-1">
            No Active Orders
          </h4>
          <p className="text-xs text-slate-500 max-w-xs mb-4">
            {isOnline
              ? 'Store is ONLINE. Incoming orders placed by customers will ring and appear here in real-time.'
              : 'Store is OFFLINE. Switch your store ONLINE to start receiving orders.'}
          </p>

          {!isOnline && (
            <button
              type="button"
              onClick={toggleStoreStatus}
              className="px-4 py-2 bg-emerald-600 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              Switch Store ONLINE
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileLiveOrdersView;
