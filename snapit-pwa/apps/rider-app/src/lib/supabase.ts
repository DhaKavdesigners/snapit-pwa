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
  status: string; // 'PLACED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REJECTED', 'CANCELLED'
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
  rider_assignment?: string; // 'UNASSIGNED', 'OFFERED', 'ACCEPTED', 'REJECTED', 'TIMEOUT', 'AUTO_ASSIGNED', 'ADMIN_ASSIGNED'
  delivery_pin?: string | number;
  delivery_fee?: number;
  assigned_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DbStore {
  id: string;
  name: string;
  address?: string;
  store_address?: string;
  store_location?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  is_online?: boolean;
  rush_mode?: boolean;
}

export interface DbRiderProfile {
  id: string;
  user_id?: string;
  name: string;
  phone: string;
  mpin?: string;
  dob?: string;
  alt_phone?: string;
  email?: string;
  address?: string;
  avatar_url?: string;
  selfie_url?: string;
  aadhaar_number?: string;
  aadhaar_doc_url?: string;
  pan_number?: string;
  pan_doc_url?: string;
  dl_number?: string;
  dl_doc_url?: string;
  upi_id?: string;
  vehicle_type?: string;
  vehicle_number?: string;
  selected_zone_id?: string;
  selected_zone_name?: string;
  is_verified?: boolean;
  verification_step?: number;
  is_online?: boolean;
  current_lat?: number;
  current_lng?: number;
  wallet_balance?: number;
  rating?: number;
  total_deliveries?: number;
  acceptance_rate?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DbRiderSlot {
  id: string;
  rider_id: string;
  slot_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  start_timestamp: number;
  end_timestamp: number;
  zone_id: string;
  zone_name: string;
  status: string; // 'BOOKED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXTENDED', 'PENDING_APPROVAL'
  booked_at?: string;
  created_at?: string;
}

export interface DbWalletTransaction {
  id: string;
  rider_id: string;
  order_id?: string | null;
  amount: number;
  type: string; // 'TRIP_EARNING', 'TIP', 'SURGE', 'BONUS', 'PENALTY', 'CASHOUT'
  status: string; // 'AVAILABLE', 'PENDING', 'TRANSFERRED'
  description?: string;
  created_at?: string;
}

export interface DbSupportTicket {
  id: string;
  rider_id: string;
  order_id?: string | null;
  category: string;
  message: string;
  status: string; // 'OPEN', 'IN_PROGRESS', 'RESOLVED'
  admin_response?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DbNotification {
  id: string;
  rider_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  amount?: number;
  action_route?: string;
  created_at?: string;
}
