import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

interface UserProfile {
  minnit_id?: string;
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
  setMinnitId: (minnitId: string) => void;
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

        // ⚡ 1. Save registered customer profile directly into Supabase database with session_id!
        try {
          const profilePayload: any = {
            id: cleanPhone,
            name: profile.name.trim(),
            phone: cleanPhone,
            address_line1: profile.addressLine1.trim(),
            address_line2: profile.addressLine2.trim(),
            landmark: profile.landmark?.trim() || '',
            pincode: profile.pincode.trim(),
            delivery_verified: false,
            updated_at: newSessionTimestamp,
            session_id: newSessionId,
          };

          const { data: upsertData, error } = await supabase
            .from('profiles')
            .upsert(profilePayload)
            .select('minnit_id')
            .maybeSingle();

          if (error && error.message?.includes('session_id')) {
            // Column session_id not migrated yet, retry without it
            delete profilePayload.session_id;
            const { data: retryData } = await supabase
              .from('profiles')
              .upsert(profilePayload)
              .select('minnit_id')
              .maybeSingle();
            if (retryData?.minnit_id) {
              set((state) => ({
                userProfile: state.userProfile ? { ...state.userProfile, minnit_id: retryData.minnit_id } : null
              }));
            }
          } else if (upsertData?.minnit_id) {
            set((state) => ({
              userProfile: state.userProfile ? { ...state.userProfile, minnit_id: upsertData.minnit_id } : null
            }));
          }

          if (error && !error.message?.includes('session_id')) {
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

      setMinnitId: (minnitId) => {
        const prev = get().userProfile;
        if (prev) {
          set({ userProfile: { ...prev, minnit_id: minnitId } });
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
