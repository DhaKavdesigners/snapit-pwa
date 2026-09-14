import { create } from 'zustand';

type ContextType = 'shopping' | 'food';

interface ContextState {
  activeContext: ContextType;
  setContext: (context: ContextType) => void;
}

export const useContextStore = create<ContextState>((set) => ({
  activeContext: 'food',
  setContext: (context) => set({ activeContext: context }),
}));
