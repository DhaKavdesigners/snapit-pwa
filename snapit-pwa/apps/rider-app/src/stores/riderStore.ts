/**
 * riderStore.ts — Zustand global state for SnapIt Rider App
 *
 * Single source of truth for rider session, order state, and UI flags.
 * Uses localStorage for session persistence across page refreshes.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Order, Rider } from '../../../../shared/types/snapit-types';

// ── Store Shape ──────────────────────────────────────────────────────────────

interface RiderStore {
  // Auth
  rider: Rider | null;
  isAuthenticated: boolean;

  // Operational
  isOnline: boolean;
  activeOrder: Order | null;
  incomingOrders: Order[];
  completedOrderIds: string[];

  // UI
  isDispatchChimeEnabled: boolean;

  // ── Actions ──
  setRider: (rider: Rider | null) => void;
  setAuthenticated: (v: boolean) => void;
  setOnline: (online: boolean) => void;
  setActiveOrder: (order: Order | null) => void;
  setIncomingOrders: (orders: Order[]) => void;
  addIncomingOrder: (order: Order) => void;
  removeIncomingOrder: (orderId: string) => void;
  updateActiveOrderStatus: (status: Order['status']) => void;
  incrementDeliveryCount: () => void;
  markOrderDelivered: (orderId: string) => void;
  setChimeEnabled: (v: boolean) => void;
  logout: () => void;
}

// ── Store Implementation ─────────────────────────────────────────────────────

export const useRiderStore = create<RiderStore>()(
  persist(
    (set) => ({
      // ── Initial state ──
      rider: null,
      isAuthenticated: false,
      isOnline: false,
      activeOrder: null,
      incomingOrders: [],
      completedOrderIds: [],
      isDispatchChimeEnabled: true,

      // ── Auth ──
      setRider: (rider) => set({ rider }),

      setAuthenticated: (v) => set({ isAuthenticated: v }),

      // ── Operational ──
      setOnline: (online) =>
        set((state) => ({
          isOnline: online,
          rider: state.rider
            ? { ...state.rider, isOnline: online }
            : null,
        })),

      setActiveOrder: (order) =>
        set((state) => ({
          activeOrder: order,
          rider: state.rider && order
            ? { ...state.rider, currentOrderId: order.id }
            : state.rider && !order
            ? { ...state.rider, currentOrderId: undefined }
            : state.rider,
        })),

      setIncomingOrders: (orders) => set({ incomingOrders: orders }),

      addIncomingOrder: (order) =>
        set((state) => ({
          incomingOrders: state.incomingOrders.some((o) => o.id === order.id)
            ? state.incomingOrders
            : [...state.incomingOrders, order],
        })),

      removeIncomingOrder: (orderId) =>
        set((state) => ({
          incomingOrders: state.incomingOrders.filter((o) => o.id !== orderId),
        })),

      updateActiveOrderStatus: (status) =>
        set((state) => ({
          activeOrder: state.activeOrder
            ? { ...state.activeOrder, status, updatedAt: new Date().toISOString() }
            : null,
        })),

      incrementDeliveryCount: () =>
        set((state) => ({
          rider: state.rider
            ? { ...state.rider, dailyDeliveryCount: state.rider.dailyDeliveryCount + 1 }
            : null,
        })),

      markOrderDelivered: (orderId) =>
        set((state) => ({
          activeOrder: null,
          completedOrderIds: [...state.completedOrderIds, orderId],
          rider: state.rider
            ? {
                ...state.rider,
                dailyDeliveryCount: state.rider.dailyDeliveryCount + 1,
                currentOrderId: undefined,
              }
            : null,
        })),

      setChimeEnabled: (v) => set({ isDispatchChimeEnabled: v }),

      logout: () =>
        set({
          rider: null,
          isAuthenticated: false,
          isOnline: false,
          activeOrder: null,
          incomingOrders: [],
          completedOrderIds: [],
        }),
    }),
    {
      name: 'snapit-rider-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist auth and preferences — not transient order state
      partialize: (state) => ({
        rider: state.rider,
        isAuthenticated: state.isAuthenticated,
        isDispatchChimeEnabled: state.isDispatchChimeEnabled,
      }),
    },
  ),
);

// ── Selectors ────────────────────────────────────────────────────────────────

export const selectRider = (s: RiderStore) => s.rider;
export const selectIsOnline = (s: RiderStore) => s.isOnline;
export const selectActiveOrder = (s: RiderStore) => s.activeOrder;
export const selectIncomingOrders = (s: RiderStore) => s.incomingOrders;
export const selectDailyCount = (s: RiderStore) => s.rider?.dailyDeliveryCount ?? 0;
export const selectIsAuth = (s: RiderStore) => s.isAuthenticated;
