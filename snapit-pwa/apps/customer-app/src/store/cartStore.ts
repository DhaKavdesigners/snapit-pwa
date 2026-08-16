import { create } from 'zustand';
import { CartItem } from '../types';

export interface LastOrder {
  orderId: string;
  total: number;       // in paise
  itemNames: string[]; // product names at time of order
  paymentMethod: 'upi' | 'upiDelivery';
}

interface CartState {
  items: CartItem[];
  lastOrder: LastOrder | null;
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  saveLastOrder: (order: LastOrder) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  lastOrder: null,
  addItem: (productId) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { productId, quantity: 1 }] };
    }),
  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),
  updateQuantity: (productId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return {
          items: state.items.filter((i) => i.productId !== productId),
        };
      }
      return {
        items: state.items.map((i) =>
          i.productId === productId ? { ...i, quantity } : i
        ),
      };
    }),
  saveLastOrder: (order) => set({ lastOrder: order }),
  clearCart: () => set({ items: [] }),
}));

