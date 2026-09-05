'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { Order } from '@/types';

export const DELIVERY_STAGES = [
  { id: 'accepted', label: 'Order Accepted', shortLabel: 'Order Accepted' },
  { id: 'picked_up', label: 'Order Picked Up', shortLabel: 'Order Picked Up' },
  { id: 'delivered', label: 'Delivered', shortLabel: 'Delivered' },
] as const;

/**
 * Maps the real order status and database status strictly to 0..2
 * 0: Order Accepted
 * 1: Order Picked Up
 * 2: Delivered
 */
export function getDeliveryStageIndex(order: Order): number {
  const s = (order.status || '').toLowerCase();
  const dbS = (order.dbStatus || '').toUpperCase();

  // Stage 2: Delivered
  if (dbS === 'DELIVERED' || dbS === 'COMPLETED' || s === 'delivered') {
    return 2;
  }

  // Stage 1: Order Picked Up
  if (
    dbS === 'OUT_FOR_DELIVERY' ||
    dbS === 'IN_TRANSIT' ||
    dbS === 'PICKED_UP' ||
    dbS === 'RIDER_AT_LOC' ||
    dbS === 'ARRIVED_AT_CUSTOMER' ||
    dbS === 'ARRIVED_AT_DROPOFF' ||
    s === 'in_transit' ||
    s === 'arrived_at_dropoff' ||
    Boolean(order.riderPickupConfirmed)
  ) {
    return 1;
  }

  // Stage 0: Order Accepted (placed, accepted, preparing, packing, ready for pickup, or waiting handover)
  return 0;
}

interface DeliveryProgressScooterProps {
  order: Order;
  className?: string;
}

export const DeliveryProgressScooter: React.FC<DeliveryProgressScooterProps> = ({
  order,
  className = '',
}) => {
  const currentStageIndex = getDeliveryStageIndex(order);
  const currentStage = DELIVERY_STAGES[currentStageIndex];
  const progressPct = (currentStageIndex / (DELIVERY_STAGES.length - 1)) * 100;

  return (
    <div className={`w-full bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 shadow-2xs ${className}`}>
      {/* Top Header: Section title + Real Status Beacon Badge */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
          Delivery Progress
        </span>
        <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-red-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          {currentStage.label}
        </span>
      </div>

      {/* Progress Track & Scooter Animation Area */}
      <div className="relative mx-5 pt-8 pb-1">
        {/* Scooter Icon (Smoothly travels along track strictly driven by real status) */}
        <div
          className="absolute top-0 transform -translate-x-1/2 transition-all duration-700 ease-out z-20 pointer-events-none"
          style={{ left: `${progressPct}%` }}
        >
          <div className="flex flex-col items-center">
            {/* Cute Little Red Scooter with Driving Bob & Exhaust Smoke */}
            <div className="relative animate-scooter-bob flex items-center justify-center">
              {/* Smokeout Animation (Exhaust puffs billowing from tailpipe) */}
              <div className="absolute -left-1 bottom-1 pointer-events-none w-0 h-0">
                <span className="absolute w-2 h-2 rounded-full bg-slate-400/60 blur-[0.4px] animate-smoke-1 -left-1 bottom-0" />
                <span className="absolute w-2.5 h-2.5 rounded-full bg-slate-300/70 blur-[0.5px] animate-smoke-2 -left-2 bottom-0.5" />
                <span className="absolute w-1.5 h-1.5 rounded-full bg-slate-400/50 blur-[0.3px] animate-smoke-3 -left-0.5 bottom-0" />
              </div>

              {/* Cute Red Scooter SVG */}
              <svg
                width="44"
                height="32"
                viewBox="0 0 44 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="filter drop-shadow-sm"
              >
                {/* Rear Delivery Box */}
                <rect x="5" y="11" width="7.5" height="6.5" rx="1.5" fill="#DC2626" stroke="#B91C1C" strokeWidth="0.8" />
                <rect x="7" y="13.2" width="3.2" height="1.8" rx="0.5" fill="#FEF2F2" />

                {/* Exhaust Pipe */}
                <path d="M5 25.5 H9" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />

                {/* Back Wheel */}
                <circle cx="11" cy="24.5" r="5" fill="#1E293B" />
                <circle cx="11" cy="24.5" r="3" fill="#E2E8F0" />
                <circle cx="11" cy="24.5" r="1.2" fill="#94A3B8" />

                {/* Front Wheel */}
                <circle cx="33" cy="24.5" r="5" fill="#1E293B" />
                <circle cx="33" cy="24.5" r="3" fill="#E2E8F0" />
                <circle cx="33" cy="24.5" r="1.2" fill="#94A3B8" />

                {/* Chassis / Rear Cowl */}
                <ellipse cx="14" cy="20" rx="6.2" ry="5" fill="#EF4444" />
                {/* Highlight on cowl */}
                <ellipse cx="13" cy="18" rx="3.5" ry="1.4" fill="#FCA5A5" opacity="0.75" />

                {/* Footboard */}
                <path d="M16 23 H26" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />

                {/* Dark Curved Seat */}
                <path d="M12 14.5 C12 13 14.5 12.5 20.5 13 C21.8 13.1 22.2 14.3 21.2 15.2 C18.5 15.8 14.5 15.8 12 14.5 Z" fill="#1E293B" />

                {/* Front Fairing / Apron */}
                <path d="M26 23 L31 12 C31.5 10.8 33 10.8 33.6 12 L31.6 24" stroke="#EF4444" strokeWidth="3.2" strokeLinecap="round" />
                {/* Front mudguard */}
                <path d="M30 22 C30 19 36 19 36 22" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" fill="none" />

                {/* Steering Column & Handlebars */}
                <line x1="31.5" y1="12" x2="32.8" y2="8" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="30" y1="8" x2="35.5" y2="7.5" stroke="#334155" strokeWidth="2" strokeLinecap="round" />

                {/* Cute Rearview Mirror */}
                <path d="M30.5 7.5 L29 4.8" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" />
                <circle cx="28.5" cy="4.2" r="1.3" fill="#E2E8F0" stroke="#64748B" strokeWidth="0.6" />

                {/* Cute Glowing Headlight */}
                <circle cx="34.8" cy="8.5" r="2.6" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="0.8" />
                <circle cx="35.3" cy="8" r="0.9" fill="#FFFFFF" />

                {/* Cute emblem dot */}
                <circle cx="32.2" cy="15.5" r="0.9" fill="#FEF2F2" />
              </svg>
            </div>

            {/* Downward indicator triangle */}
            <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[5px] border-t-red-500 mx-auto -mt-0.5" />
          </div>
        </div>

        {/* Progress Line Track */}
        <div className="relative h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 via-rose-500 to-red-600 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Milestone Nodes */}
        <div className="absolute top-8 left-0 right-0 flex justify-between transform -translate-y-1/2 pointer-events-none">
          {DELIVERY_STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <div key={stage.id} className="flex flex-col items-center">
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all flex items-center justify-center ${
                    isCompleted
                      ? 'bg-red-500 border-red-500 text-white'
                      : isCurrent
                      ? 'bg-white border-red-500 ring-4 ring-red-100'
                      : 'bg-white border-slate-300'
                  }`}
                >
                  {isCompleted && <Check className="w-2 h-2 stroke-[3]" />}
                  {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Milestone Labels below track (Left, Center, Right aligned) */}
        <div className="relative mt-3 h-5 text-[10px]">
          {/* Milestone 0: Order Accepted */}
          <div
            className={`absolute left-0 text-left transition-colors ${
              currentStageIndex === 0
                ? 'font-extrabold text-red-600'
                : currentStageIndex > 0
                ? 'font-bold text-slate-700'
                : 'text-slate-400'
            }`}
          >
            <span>Order Accepted</span>
          </div>

          {/* Milestone 1: Order Picked Up */}
          <div
            className={`absolute left-1/2 transform -translate-x-1/2 text-center transition-colors whitespace-nowrap ${
              currentStageIndex === 1
                ? 'font-extrabold text-red-600'
                : currentStageIndex > 1
                ? 'font-bold text-slate-700'
                : 'text-slate-400'
            }`}
          >
            <span>Order Picked Up</span>
          </div>

          {/* Milestone 2: Delivered */}
          <div
            className={`absolute right-0 text-right transition-colors ${
              currentStageIndex === 2
                ? 'font-extrabold text-emerald-600'
                : 'text-slate-400'
            }`}
          >
            <span>Delivered</span>
          </div>
        </div>
      </div>
    </div>
  );
};
