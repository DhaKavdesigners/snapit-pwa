export type OrderStatus =
  | "PLACED"
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "READY_FOR_PICKUP"
  | "OUT_OF_SHOP"
  | "HANDED_OVER"
  | "PICKED_UP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED";

export interface OrderItem {
  id?: string;
  name: string;
  quantity: number;
  price_paise?: number;
  price?: number;
  image_url?: string;
  productId?: string;
  product_id?: string;
}

export interface AdminOrder {
  id: string;
  customer_id?: string;
  store_id: string;
  status: OrderStatus;
  items: OrderItem[];
  estimated_total: number; // in paise
  delivery_address: any;
  payment_method?: string;
  payment_status?: string;
  recipient_name?: string;
  recipient_phone?: string;
  delivery_pin?: string | number;
  delivery_fee?: number;
  rider_id?: string | null;
  created_at: string;
  updated_at?: string;
  prep_time_minutes?: number;
  rejection_reason?: string;
  rider_assignment?: string;
}

export interface AdminStore {
  id: string;
  name: string;
  category: "FOOD" | "GROCERY" | "DAIRY" | "food" | "grocery" | "dairy" | string;
  logo_url?: string;
  rating?: number;
  is_online?: boolean;
  rush_mode?: boolean;
  store_address?: string;
  address?: string; // alias/fallback
  store_location?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  landmark?: string;
  upi_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AdminMerchant {
  id: string;
  uid: string;
  password: string;
  store_id: string;
  name: string;
  phone?: string;
  role?: string;
  created_at?: string;
}

export interface StoreSettlementRecord {
  id: string;
  store_id: string;
  store_name: string;
  amount_rupees: number;
  amount_paise: number;
  utr_reference: string;
  payment_method: "UPI" | "IMPS" | "NEFT" | "CASH" | string;
  settled_at: string;
  settled_by: string;
  period_label: string;
  orders_count: number;
  notes?: string;
}

export interface AdminRider {
  id: string;
  name: string;
  phone: string;
  vehicle_type?: string;
  vehicle_number?: string;
  avatar_url?: string;
  is_online?: boolean;
  is_busy?: boolean;
  current_order_id?: string | null;
  total_trips?: number;
  rating?: number;
  created_at?: string;
}

export interface AdminProduct {
  id: string;
  store_id: string;
  name: string;
  price: number; // in paise in Supabase
  category?: string;
  sub_category?: string;
  description?: string;
  image_url?: string;
  in_stock?: boolean;
  stock_count?: number;
  delivery_eta_minutes?: number;
  availability?: "AVAILABLE" | "OUT OF STOCK" | string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AdminCustomerProfile {
  id: string;
  name?: string;
  phone: string;
  address_line1?: string;
  address_line2?: string;
  landmark?: string;
  pincode?: string;
  delivery_verified?: boolean;
  created_at?: string;
}
