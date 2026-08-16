/**
 * useOrderStream.ts — Mock Supabase Realtime order stream
 *
 * Phase 1: Simulates live order dispatch using setInterval.
 * Phase 2: Replace interval logic with real Supabase Realtime channel.
 *
 * Architecture:
 * - Riders NEVER talk to customer/merchant apps directly.
 * - All telemetry flows via Supabase Realtime on the `orders` table.
 * - READY_FOR_PICKUP transition → fires dispatch audio chime.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useRiderStore } from '../stores/riderStore';
import { playDispatchChime } from '../lib/audio';
import {
  MOCK_INCOMING_ORDERS,
  nextOrderId,
  MOCK_ADDRESSES,
  MOCK_STORES,
  now,
} from '../lib/mockData';
import type { Order } from '../../../../shared/types/snapit-types';

const DISPATCH_INTERVAL_MS = 35_000; // New order every 35s when online
const SIMULATED_AMOUNTS = [18500, 24000, 31500, 45000, 28000, 19500, 38000];
const SIMULATED_ITEM_COUNTS = [2, 3, 1, 4, 2, 3, 2];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMockOrder(): Order {
  const store = randomFrom(MOCK_STORES);
  const address = randomFrom(MOCK_ADDRESSES);
  const amount = randomFrom(SIMULATED_AMOUNTS);
  const itemCount = randomFrom(SIMULATED_ITEM_COUNTS);
  const isUpiDelivery = Math.random() > 0.6;

  return {
    id: nextOrderId(),
    customerId: `cust-${Math.floor(Math.random() * 900) + 100}`,
    storeId: store.id,
    status: 'READY_FOR_PICKUP',
    items: Array.from({ length: itemCount }, (_, i) => ({
      productId: `auto-${i}`,
      quantity: Math.floor(Math.random() * 2) + 1,
    })),
    estimatedTotal: amount,
    deliveryAddress: address,
    deliveryAddressSnapshot: address,
    paymentMethod: isUpiDelivery ? 'UPI_DELIVERY' : 'UPI_NOW',
    handshakePinHash: String(Math.floor(1000 + Math.random() * 9000)),
    idempotencyKey: `idem-${Date.now()}`,
    createdAt: now(),
    updatedAt: now(),
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface UseOrderStreamOptions {
  /** Called when a new READY_FOR_PICKUP order arrives */
  onNewDispatch?: (order: Order) => void;
}

export function useOrderStream(options: UseOrderStreamOptions = {}) {
  const {
    isOnline,
    addIncomingOrder,
    setIncomingOrders,
    isDispatchChimeEnabled,
  } = useRiderStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSeededRef = useRef(false);
  const { onNewDispatch } = options;

  const handleNewOrder = useCallback(
    (order: Order) => {
      addIncomingOrder(order);
      if (isDispatchChimeEnabled) {
        playDispatchChime();
      }
      onNewDispatch?.(order);
    },
    [addIncomingOrder, isDispatchChimeEnabled, onNewDispatch],
  );

  useEffect(() => {
    if (!isOnline) {
      // Clear interval and seed when going offline
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIncomingOrders([]);
      hasSeededRef.current = false;
      return;
    }

    // Seed with realistic initial orders on first going online
    if (!hasSeededRef.current) {
      hasSeededRef.current = true;
      // Stagger initial orders to feel organic
      MOCK_INCOMING_ORDERS.forEach((order, i) => {
        setTimeout(() => {
          handleNewOrder(order);
        }, i * 800);
      });
    }

    // Simulate Supabase Realtime: new READY_FOR_PICKUP orders arrive periodically
    intervalRef.current = setInterval(() => {
      const newOrder = generateMockOrder();
      handleNewOrder(newOrder);
    }, DISPATCH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOnline, handleNewOrder, setIncomingOrders]);

  // ── Phase 2: Real Supabase Realtime (commented — activate when DB ready) ──
  //
  // useEffect(() => {
  //   if (!riderId) return;
  //   const channel = supabase
  //     .channel('rider-orders')
  //     .on(
  //       'postgres_changes',
  //       { event: 'UPDATE', schema: 'public', table: 'orders', filter: `rider_id=eq.${riderId}` },
  //       (payload) => {
  //         const order = payload.new as Order;
  //         if (order.status === 'READY_FOR_PICKUP') {
  //           handleNewOrder(order);
  //         }
  //       },
  //     )
  //     .subscribe();
  //   return () => { supabase.removeChannel(channel); };
  // }, [riderId, handleNewOrder]);
}
