import { create } from 'zustand';

type ContextType = 'shopping' | 'food';

interface ContextState {
  activeContext: ContextType;
  setContext: (context: ContextType) => void;
}

export const useContextStore = create<ContextState>((set) => ({
  activeContext: 'shopping',
  setContext: (context) => set({ activeContext: context }),
}));
