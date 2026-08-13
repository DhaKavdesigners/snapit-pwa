import { create } from 'zustand';

interface AuthState {
  isLoggedIn: boolean;
  userLandmark: string;
  login: (landmark: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  userLandmark: 'Home (KGF)', // Default mock landmark
  login: (landmark) => set({ isLoggedIn: true, userLandmark: landmark }),
  logout: () => set({ isLoggedIn: false }),
}));
