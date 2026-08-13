import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserProfile {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  pincode: string;
}

interface AuthState {
  isLoggedIn: boolean;
  userLandmark: string;
  userProfile: UserProfile | null;
  login: (landmark: string) => void;
  register: (profile: UserProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      userLandmark: '',
      userProfile: null,
      login: (landmark) => set({ isLoggedIn: true, userLandmark: landmark }),
      register: (profile) => set({
        isLoggedIn: true,
        userProfile: profile,
        userLandmark: profile.landmark?.trim() || profile.addressLine2?.trim() || 'Home (KGF)',
      }),
      logout: () => set({ isLoggedIn: false, userProfile: null, userLandmark: '' }),
    }),
    { name: 'snapit-auth' }   // persists to localStorage under this key
  )
);


