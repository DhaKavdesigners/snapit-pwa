import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface LiveOrderItem {
  id?: string;
  name: string;
  quantity: number;
  price_paise: number;
}

export interface LiveDeliveryAddress {
  label?: string;
  title?: string;
  line1?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  city?: string;
  pincode?: string;
}

export interface LiveOrder {
  id: string;
  created_at: string;
  customer_id: string;
  store_id: string;
  status: string;
  estimated_total: number;
  total_amount_paise?: number;
  delivery_address: LiveDeliveryAddress;
  items: LiveOrderItem[];
  prep_time_minutes?: number;
  delivery_pin?: string;
  rider_name?: string;
  rider_phone?: string;
  rider_vehicle?: string;
  rejection_reason?: string;
  recipient_phone?: string;
}

interface OrderState {
  orders: LiveOrder[];
  storesMap: Record<string, string>;
  isTrackerOpen: boolean;
  selectedOrderId: string | null;
  isLoading: boolean;
  
  // Actions
  setTrackerOpen: (open: boolean, orderId?: string) => void;
  fetchOrders: (phone?: string) => Promise<void>;
  initLiveSubscription: (phone?: string) => () => void;
}

const DEFAULT_STORES_MAP: Record<string, string> = {
  g1: 'Mhetha Stores',
  s1: 'Mhetha Stores',
  g2: 'Vishal Mart',
  s2: 'Vishal Mart',
  g3: 'RR Bazar',
  s3: 'RR Bazar',
  d1: 'Nandhini KGF',
  s4: 'Nandhini KGF',
  f1: 'Bakio',
  f2: 'Mayura',
  f3: 'Ambur Biriyani KGF',
  f4: 'Al Baik',
  f5: 'Al Naz',
};

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  storesMap: DEFAULT_STORES_MAP,
  isTrackerOpen: false,
  selectedOrderId: null,
  isLoading: false,

  setTrackerOpen: (open, orderId) => {
    set({
      isTrackerOpen: open,
      selectedOrderId: orderId || get().selectedOrderId || null,
    });
  },

  fetchOrders: async (phoneParam) => {
    try {
      const rawPhone = phoneParam || '8217649688';
      const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
      const withPlus91 = `+91${cleanPhone}`;
      const with91 = `91${cleanPhone}`;
      
      const [storesRes, ordersRes] = await Promise.all([
        supabase.from('stores').select('id, name'),
        supabase
          .from('orders')
          .select('*')
          .or(`customer_id.eq.${cleanPhone},customer_id.eq.${withPlus91},customer_id.eq.${with91},customer_id.eq.${rawPhone},recipient_phone.eq.${cleanPhone},recipient_phone.eq.${withPlus91}`)
          .order('created_at', { ascending: false })
      ]);

      if (storesRes.data) {
        const map: Record<string, string> = { ...DEFAULT_STORES_MAP };
        storesRes.data.forEach((st: any) => {
          map[st.id] = st.name;
        });
        set({ storesMap: map });
      }

      if (ordersRes.data && ordersRes.data.length > 0) {
        set({ orders: ordersRes.data });
      } else {
        // Fallback: if no phone-matched orders, query latest active orders to ensure live preview always reflects
        const { data: latestOrders } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        if (latestOrders && latestOrders.length > 0) {
          set({ orders: latestOrders });
        }
      }
    } catch (err) {
      console.warn('Failed to fetch live orders:', err);
    }
  },

  initLiveSubscription: (phoneParam) => {
    const rawPhone = phoneParam || '8217649688';
    get().fetchOrders(rawPhone);

    const channel = supabase
      .channel('live-orders-global-tracker')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          get().fetchOrders(rawPhone);
        }
      )
      .subscribe();

    const interval = setInterval(() => {
      get().fetchOrders(rawPhone);
    }, 2500);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  },
}));

// Helper selector to get top active order
export const getActiveOrders = (orders: LiveOrder[]) => {
  return orders.filter((o) =>
    ['PLACED', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'READY_FOR_PICKUP', 'OUT_OF_SHOP', 'HANDED_OVER', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(
      o.status
    )
  );
};
