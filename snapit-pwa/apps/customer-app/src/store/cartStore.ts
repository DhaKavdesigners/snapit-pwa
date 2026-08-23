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
  addItem: (productId: string, maxStock?: number) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number, maxStock?: number) => void;
  saveLastOrder: (order: LastOrder) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  lastOrder: null,
  addItem: (productId, maxStock = 99) => {
    let success = true;
    set((state) => {
      const existing = state.items.find((i) => i.productId === productId);
      if (existing) {
        if (existing.quantity >= maxStock) {
          success = false;
          return state;
        }
        return {
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity: Math.min(i.quantity + 1, maxStock) } : i
          ),
        };
      }
      if (maxStock <= 0) {
        success = false;
        return state;
      }
      return { items: [...state.items, { productId, quantity: 1 }] };
    });
    return success;
  },
  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),
  updateQuantity: (productId, quantity, maxStock = 99) =>
    set((state) => {
      if (quantity <= 0) {
        return {
          items: state.items.filter((i) => i.productId !== productId),
        };
      }
      const safeQuantity = Math.min(quantity, maxStock);
      return {
        items: state.items.map((i) =>
          i.productId === productId ? { ...i, quantity: safeQuantity } : i
        ),
      };
    }),
  saveLastOrder: (order) => set({ lastOrder: order }),
  clearCart: () => set({ items: [] }),
}));

