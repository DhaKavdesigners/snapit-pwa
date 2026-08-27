import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://satzvkmpatnbxpeiecvg.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Dj9NK5v5Dn1LiNhhg9BKsA_5QN5rtXp';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export interface DbOrder {
  id: string;
  customer_id?: string;
  store_id?: string;
  rider_id?: string | null;
  status: string;
  items: Array<{ name: string; quantity: number; price?: number }>;
  estimated_total: number;
  delivery_address: any;
  recipient_name: string;
  recipient_phone: string;
  cooking_instructions?: string;
  payment_method?: string;
  payment_status?: string;
  shopkeeper_handover_confirmed?: boolean;
  rider_pickup_confirmed?: boolean;
  delivery_pin?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DbStore {
  id: string;
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  phone?: string;
}

export interface DbRiderProfile {
  id: string;
  user_id?: string;
  name: string;
  phone: string;
  mpin?: string;
  alt_phone?: string;
  email?: string;
  address?: string;
  avatar_url?: string;
  selfie_url?: string;
  aadhaar_number?: string;
  pan_number?: string;
  dl_number?: string;
  upi_id?: string;
  vehicle_type?: string;
  vehicle_number?: string;
  selected_zone_id?: string;
  selected_zone_name?: string;
  is_verified?: boolean;
  verification_step?: number;
  is_online?: boolean;
  wallet_balance?: number;
  rating?: number;
  total_deliveries?: number;
  acceptance_rate?: number;
  created_at?: string;
  updated_at?: string;
}

