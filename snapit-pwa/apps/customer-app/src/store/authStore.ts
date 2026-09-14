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
  sessionId?: string;
  sessionTimestamp?: string;
  sessionRevokedMessage?: string | null;
  login: (landmark: string) => void;
  register: (profile: Omit<UserProfile, 'phoneVerified' | 'deliveryVerified' | 'completedOrdersCount' | 'maxCodLimit'>) => Promise<void>;
  /** Called by Rider Dashboard when delivery PIN is accepted */
  confirmDelivery: () => void;
  revokeCurrentSession: (reason?: string) => void;
  clearSessionRevokedMessage: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      userLandmark: '',
      userProfile: null,
      sessionId: undefined,
      sessionTimestamp: undefined,
      sessionRevokedMessage: null,

      login: (landmark) => set({ isLoggedIn: true, userLandmark: landmark }),

      register: async (profileBase) => {
        const newSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        const newSessionTimestamp = new Date().toISOString();
        const cleanPhone = profileBase.phone.trim().replace(/\D/g, '').slice(-10);

        const profile: UserProfile = {
          ...profileBase,
          phone: cleanPhone,
          phoneVerified: true,       // OTP passed → phone is confirmed
          deliveryVerified: false,   // stays false until first real delivery
          completedOrdersCount: 0,
          maxCodLimit: 30000,
        };

        set({
          isLoggedIn: true,
          userProfile: profile,
          userLandmark: profile.landmark?.trim() || profile.addressLine2?.trim() || 'Home (KGF)',
          sessionId: newSessionId,
          sessionTimestamp: newSessionTimestamp,
          sessionRevokedMessage: null,
        });

        // ⚡ 1. Save registered customer profile directly into Supabase database with updated_at timestamp!
        try {
          const { error } = await supabase.from('profiles').upsert({
            id: cleanPhone,
            name: profile.name.trim(),
            phone: cleanPhone,
            address_line1: profile.addressLine1.trim(),
            address_line2: profile.addressLine2.trim(),
            landmark: profile.landmark?.trim() || '',
            pincode: profile.pincode.trim(),
            delivery_verified: false,
            updated_at: newSessionTimestamp,
          });

          if (error) {
            console.warn('Supabase profiles sync note:', error.message);
          } else {
            console.info(`⚡ Customer profile for "${profile.name}" (${cleanPhone}) successfully saved with session ${newSessionId}!`);
          }
        } catch (err) {
          console.warn('Could not sync customer profile to Supabase:', err);
        }

        // ⚡ 2. Broadcast single-device revocation to all other active tabs/devices listening on this phone!
        try {
          const channel = supabase.channel(`user-session-${cleanPhone}`);
          channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              channel.send({
                type: 'broadcast',
                event: 'session_revoked',
                payload: {
                  newSessionId,
                  timestamp: newSessionTimestamp,
                  phone: cleanPhone,
                },
              });
              // Cleanup ephemeral broadcast channel after message dispatch
              setTimeout(() => {
                supabase.removeChannel(channel);
              }, 1500);
            }
          });
        } catch (err) {
          console.warn('Error dispatching session broadcast:', err);
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

      revokeCurrentSession: (reason = 'Your Minnit account was logged in on another device.') => {
        set({
          isLoggedIn: false,
          userProfile: null,
          userLandmark: '',
          sessionId: undefined,
          sessionTimestamp: undefined,
          sessionRevokedMessage: reason,
        });
      },

      clearSessionRevokedMessage: () => set({ sessionRevokedMessage: null }),

      logout: () => set({ 
        isLoggedIn: false, 
        userProfile: null, 
        userLandmark: '', 
        sessionId: undefined, 
        sessionTimestamp: undefined,
        sessionRevokedMessage: null,
      }),
    }),
    { name: 'snapit-auth' }
  )
);
