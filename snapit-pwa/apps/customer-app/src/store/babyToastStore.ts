import { create } from 'zustand';

export type BabyToastType =
  | 'item_added_first'
  | 'item_added'
  | 'more_item'
  | 'favourite_saved';

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