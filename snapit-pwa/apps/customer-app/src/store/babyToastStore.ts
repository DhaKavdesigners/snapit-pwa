import { create } from 'zustand';

export type BabyToastType =
  // ── Girl (Catie) — Shopping mode ──────────────────────────
  | 'item_added_first'   // very first item — iteam_added_toast.jpg
  | 'item_added'         // item added — iteam_added.jpg
  | 'more_item'          // 2nd+ item — more_item_added.jpg
  | 'favourite_saved'    // saved favourite — saved_favoraoite_toast.jpg
  // ── Boy (Milo) — Food mode ─────────────────────────────────
  | 'food_first'         // first food item — boy_item_added.jpg (pizza scene)
  | 'food_pizza'         // pizza added — boy_pizza_added.jpg
  | 'food_burger'        // burger added — boy_burger_added.jpg
  | 'food_biriyani'      // biriyani added — boy_biriyani_aroma.jpg
  | 'food_more'          // more food items — boy_biriyani_aroma_small.jpg
  | 'food_favourite';    // food favourite saved — saved_favoraoite_toast.jpg

interface BabyToastState {
  visible: boolean;
  type: BabyToastType | null;
  productName: string;
  showToast: (type: BabyToastType, productName?: string) => void;
  hideToast: () => void;
}

let dismissTimer: ReturnType<typeof setTimeout> | null = null;

export const useBabyToastStore = create<BabyToastState>((set) => ({
  visible: false,
  type: null,
  productName: '',
  showToast: (type, productName = '') => {
    if (dismissTimer) clearTimeout(dismissTimer);
    set({ visible: true, type, productName });
    dismissTimer = setTimeout(() => {
      set({ visible: false });
    }, 2400);
  },
  hideToast: () => {
    if (dismissTimer) clearTimeout(dismissTimer);
    set({ visible: false });
  },
}));

/** Returns true if the product name sounds like a food item */
export function detectFoodToastType(
  productName: string,
  isFirstItem: boolean,
  isMoreItems: boolean
): BabyToastType {
  const lower = productName.toLowerCase();
  if (lower.includes('pizza')) return 'food_pizza';
  if (lower.includes('burger') || lower.includes('sandwich')) return 'food_burger';
  if (lower.includes('biriyani') || lower.includes('biryani') || lower.includes('rice')) return 'food_biriyani';
  if (isFirstItem) return 'food_first';
  if (isMoreItems) return 'food_more';
  return 'food_first';
}