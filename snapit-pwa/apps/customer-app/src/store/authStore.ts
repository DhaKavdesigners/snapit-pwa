import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserProfile {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  pincode: string;
  // ── Trust tier flags (mirrors Firestore schema) ──────────────────────────
  phoneVerified: boolean;       // true after OTP completion
  deliveryVerified: boolean;    // true after 1st successful delivery
  completedOrdersCount: number; // incremented on each delivery PIN handshake
  maxCodLimit: number;          // in paise: 30000 = ₹300 (unverified), 100000 = ₹1000 (verified)
}

interface AuthState {
  isLoggedIn: boolean;
  userLandmark: string;
  userProfile: UserProfile | null;
  login: (landmark: string) => void;
  register: (profile: Omit<UserProfile, 'phoneVerified' | 'deliveryVerified' | 'completedOrdersCount' | 'maxCodLimit'>) => void;
  /** Called by Rider Dashboard when delivery PIN is accepted */
  confirmDelivery: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      userLandmark: '',
      userProfile: null,

      login: (landmark) => set({ isLoggedIn: true, userLandmark: landmark }),

      register: (profileBase) => {
        const profile: UserProfile = {
          ...profileBase,
          phoneVerified: true,       // OTP passed → phone is confirmed
          deliveryVerified: false,   // stays false until first real delivery
          completedOrdersCount: 0,
          maxCodLimit: 30000,        // ₹300 COD cap for new users
        };
        set({
          isLoggedIn: true,
          userProfile: profile,
          userLandmark: profile.landmark?.trim() || profile.addressLine2?.trim() || 'Home (KGF)',
        });
      },

      /** Rider triggers this after the customer enters the correct delivery PIN */
      confirmDelivery: () => {
        const prev = get().userProfile;
        if (!prev) return;
        const newCount = prev.completedOrdersCount + 1;
        set({
          userProfile: {
            ...prev,
            deliveryVerified: true,
            completedOrdersCount: newCount,
            maxCodLimit: 100000, // ₹1,000 COD limit unlocked
          },
        });
      },

      logout: () => set({ isLoggedIn: false, userProfile: null, userLandmark: '' }),
    }),
    { name: 'snapit-auth' }
  )
);
