'use client';

import React from 'react';
import { Order } from '@/types';

interface RouteTimelineProps {
  order: Order;
}

export const RouteTimeline: React.FC<RouteTimelineProps> = ({ order }) => {
  return (
    <div className="flex flex-col gap-3 relative pl-6 py-1">
      {/* Dashed connector line */}
      <div className="absolute left-[7px] top-3 bottom-3 w-[2px] border-l-2 border-dashed border-outline-variant/60" />

      {/* Pickup location point */}
      <div className="flex gap-3 relative z-10">
        <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-primary mt-1 -ml-[23px] shrink-0 shadow-sm" />
        <div className="flex-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">
            Pickup Store
          </span>
          <p className="text-xs font-semibold text-on-surface leading-tight mt-0.5">
            {order.restaurantName}
          </p>
          <p className="text-[11px] text-secondary mt-0.5 truncate">
            {order.restaurantAddress}
          </p>
        </div>
      </div>

      {/* Dropoff location point */}
      <div className="flex gap-3 relative z-10">
        <div className="w-3.5 h-3.5 rounded-full bg-primary mt-1 -ml-[23px] shrink-0 shadow-glow" />
        <div className="flex-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">
            Customer Dropoff
          </span>
          <p className="text-xs font-semibold text-on-surface leading-tight mt-0.5">
            {order.customerName}
          </p>
          <p className="text-[11px] text-secondary mt-0.5 truncate">
            {order.deliveryAddress}
          </p>
        </div>
      </div>
    </div>
  );
};
