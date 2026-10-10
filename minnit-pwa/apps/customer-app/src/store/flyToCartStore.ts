import { create } from 'zustand';

export interface FlyingItem {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  imageUrl: string;
  isFood?: boolean;
}

interface FlyToCartState {
  items: FlyingItem[];
  triggerFly: (opts: { startX: number; startY: number; imageUrl: string; isFood?: boolean }) => void;
  removeItem: (id: string) => void;
}

export const useFlyToCartStore = create<FlyToCartState>((set) => ({
  items: [],
  triggerFly: ({ startX, startY, imageUrl, isFood = false }) => {
    // 1. Locate the bottom nav cart / bag target dynamically
    let endX = window.innerWidth / 2;
    let endY = window.innerHeight - 36;

    const target = document.getElementById('bottom-nav-cart-target');
    if (target) {
      const rect = target.getBoundingClientRect();
      endX = rect.left + rect.width / 2;
      endY = rect.top + rect.height / 2;
    }

    const newItem: FlyingItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      startX,
      startY,
      endX,
      endY,
      imageUrl,
      isFood,
    };

    set((state) => ({ items: [...state.items, newItem] }));
  },
  removeItem: (id) => {
    set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
  },
}));
