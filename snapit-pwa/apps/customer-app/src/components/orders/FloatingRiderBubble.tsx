import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrderStore, getActiveOrders } from '../../store/orderStore';
import riderIconImg from '../../assets/rider_icon.jpg';

export const FloatingRiderBubble: React.FC = () => {
  const { orders, storesMap, setTrackerOpen } = useOrderStore();
  const activeOrders = getActiveOrders(orders);

  // Snapping side state: 'right' | 'left'
  const [snapSide, setSnapSide] = useState<'right' | 'left'>('right');

  // If no active orders, don't show the bubble
  if (activeOrders.length === 0) return null;

  const topOrder = activeOrders[0];
  const storeName = storesMap[topOrder.store_id] || 'SnapIt Store';

  // Check if store is Food or Grocery
  const isFood = (topOrder.store_id || '').toLowerCase().startsWith('f') || 
    ['bakio', 'mayura', 'biriyani', 'biryani', 'al baik', 'al naz', 'restaurant', 'cafe', 'kitchen']
      .some(k => storeName.toLowerCase().includes(k));

  // Progress and ETA
  const getStatusInfo = (st: string) => {
    switch (st) {
      case 'PLACED':
      case 'PENDING':
        return { label: 'Placed', eta: '15m', progress: 20 };
      case 'ACCEPTED':
      case 'PREPARING':
        return { 
          label: isFood ? 'Cooking' : 'Packing', 
          eta: `${topOrder.prep_time_minutes || 10}m`, 
          progress: 40 
        };
      case 'READY':
      case 'READY_FOR_PICKUP':
        return { label: 'Ready', eta: '8m', progress: 60 };
      case 'OUT_OF_SHOP':
      case 'HANDED_OVER':
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY':
        return { label: 'On Way', eta: '4m', progress: 85 };
      case 'DELIVERED':
        return { label: 'Delivered', eta: '0m', progress: 100 };
      default:
        return { label: 'Live', eta: '10m', progress: 30 };
    }
  };

  const statusInfo = getStatusInfo(topOrder.status);

  // Handle Drag End to Snap to Left or Right Edge
  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x < -40) {
      setSnapSide('left');
    } else if (info.offset.x > 40) {
      setSnapSide('right');
    }
  };

  return (
    <AnimatePresence>
      {/* Mobile Shell Contained Wrapper (Never jumps to desktop sides) */}
      <div className="fixed bottom-24 inset-x-0 mx-auto max-w-md pointer-events-none z-40">
        <motion.div
          drag
          dragConstraints={{ top: -450, bottom: 0, left: -20, right: 20 }}
          dragElastic={0.12}
          onDragEnd={handleDragEnd}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => setTrackerOpen(true, topOrder.id)}
          className={`pointer-events-auto cursor-pointer absolute bottom-0 ${
            snapSide === 'right' ? 'right-4' : 'left-4'
          } flex flex-col items-center select-none touch-none`}
        >
          {/* Circular Floating Rider Bubble */}
          <div className="relative w-16 h-16 rounded-full bg-white p-1 border-[3px] border-[#00E676] shadow-[0_8px_25px_rgba(0,230,118,0.4)] flex items-center justify-center transition-shadow hover:shadow-[0_8px_30px_rgba(0,230,118,0.6)]">
            {/* Ambient Pulsing Glow */}
            <span className="animate-ping absolute inset-0 rounded-full bg-[#00E676] opacity-30 pointer-events-none" />

            {/* Rider Image prominently displayed */}
            <img
              src={riderIconImg}
              alt="SnapIt Rider"
              className="w-full h-full object-contain rounded-full pointer-events-none"
            />

            {/* Active Live Green Pulsing Beacon Badge */}
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#00E676] border-2 border-white shadow-xs" />
            </span>
          </div>

          {/* Micro Status Tag below bubble */}
          <div className="mt-1 bg-gray-950 text-[#00E676] border border-emerald-500/60 text-[9.5px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-black/40 flex items-center gap-1 tracking-tight">
            <span>⚡ {statusInfo.eta}</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
