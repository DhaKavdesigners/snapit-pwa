import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

interface UserProfile {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  pincode: string;
  // ── Trust tier flags ────────────────────────────────────────────────────────
  phoneVerified: boolean;       // true after OTP completion
  deliveryVerified: boolean;    // true after 1st successful delivery
  completedOrdersCount: number; // incremented on each delivery PIN handshake
  maxCodLimit: number;          // in paise
}

interface AuthState {
  isLoggedIn: boolean;
  userLandmark: string;
  userProfile: UserProfile | null;
  login: (landmark: string) => void;
  register: (profile: Omit<UserProfile, 'phoneVerified' | 'deliveryVerified' | 'completedOrdersCount' | 'maxCodLimit'>) => Promise<void>;
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

      register: async (profileBase) => {
        const profile: UserProfile = {
          ...profileBase,
          phoneVerified: true,       // OTP passed → phone is confirmed
          deliveryVerified: false,   // stays false until first real delivery
          completedOrdersCount: 0,
          maxCodLimit: 30000,
        };

        set({
          isLoggedIn: true,
          userProfile: profile,
          userLandmark: profile.landmark?.trim() || profile.addressLine2?.trim() || 'Home (KGF)',
        });

        // ⚡ Save registered customer profile directly into Supabase database!
        try {
          const { error } = await supabase.from('profiles').upsert({
            id: profile.phone.trim(),
            name: profile.name.trim(),
            phone: profile.phone.trim(),
            address_line1: profile.addressLine1.trim(),
            address_line2: profile.addressLine2.trim(),
            landmark: profile.landmark?.trim() || '',
            pincode: profile.pincode.trim(),
            delivery_verified: false,
            updated_at: new Date().toISOString(),
          });

          if (error) {
            console.warn('Supabase profiles sync note:', error.message);
          } else {
            console.info(`⚡ Customer profile for "${profile.name}" (${profile.phone}) successfully saved to Supabase!`);
          }
        } catch (err) {
          console.warn('Could not sync customer profile to Supabase:', err);
        }
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
            maxCodLimit: 100000,
          },
        });
      },

      logout: () => set({ isLoggedIn: false, userProfile: null, userLandmark: '' }),
    }),
    { name: 'snapit-auth' }
  )
);
