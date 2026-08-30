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
  rider_id?: string;
  rider_assignment?: string;
  rider_name?: string;
  rider_phone?: string;
  rider_vehicle?: string;
  rider_avatar?: string;
  rider_rating?: number;
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

      let rawOrders: any[] = [];
      if (ordersRes.data && ordersRes.data.length > 0) {
        rawOrders = ordersRes.data;
      } else {
        // Fallback: if no phone-matched orders, query latest active orders to ensure live preview always reflects
        const { data: latestOrders } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        if (latestOrders && latestOrders.length > 0) {
          rawOrders = latestOrders;
        }
      }

      // Fetch Real Rider Profiles for any assigned rider_id
      const riderIds = Array.from(
        new Set(
          rawOrders
            .map((o: any) => o.rider_id)
            .filter((id: any) => typeof id === 'string' && id.trim().length > 0)
        )
      );

      let riderMap: Record<string, any> = {};
      if (riderIds.length > 0) {
        try {
          const { data: profiles } = await supabase
            .from('rider_profiles')
            .select('id, name, phone, vehicle_type, vehicle_number, avatar_url, selfie_url');
          if (profiles) {
            profiles.forEach((p: any) => {
              if (p.id) riderMap[p.id] = p;
              if (p.phone) riderMap[p.phone] = p;
              const cleanP = (p.phone || '').replace(/\D/g, '').slice(-10);
              if (cleanP) riderMap[cleanP] = p;
            });
          }
        } catch (err) {
          console.warn('Failed to fetch rider profiles:', err);
        }
      }

      // Merge Real Rider Data into Orders
      const enrichedOrders: LiveOrder[] = rawOrders.map((o: any) => {
        const rId = o.rider_id ? String(o.rider_id).trim() : '';
        const cleanRId = rId.replace(/\D/g, '').slice(-10);
        const rider = (rId && riderMap[rId]) || (cleanRId && riderMap[cleanRId]);

        return {
          ...o,
          rider_id: o.rider_id,
          rider_name: rider?.name || o.rider_name || (o.rider_id ? 'Assigned Rider' : undefined),
          rider_phone: rider?.phone || o.rider_phone || (o.rider_id ? String(o.rider_id) : undefined),
          rider_vehicle: rider 
            ? `${rider.vehicle_type || 'Bike'} (${rider.vehicle_number || 'KA-08'})` 
            : o.rider_vehicle || (o.rider_id ? 'Minnit Fleet Partner' : undefined),
          rider_avatar: rider?.selfie_url || rider?.avatar_url || o.rider_avatar,
          rider_rating: 4.9,
        };
      });

      set({ orders: enrichedOrders });
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
  return orders.filter((o) => {
    const s = (o.status || '').toUpperCase();
    return [
      'PLACED',
      'PENDING',
      'ACCEPTED',
      'PREPARING',
      'PACKING',
      'RIDER_ARRIVING_TO_STORE',
      'RIDER_ASSIGNED',
      'READY',
      'READY_FOR_PICKUP',
      'OUT_OF_SHOP',
      'HANDED_OVER',
      'PICKED_UP',
      'OUT_FOR_DELIVERY',
      'RIDER_AT_LOC',
      'RIDER_AT_LOCATION',
      'ARRIVED_AT_CUSTOMER',
      'ARRIVED',
      'RIDER_ARRIVED',
      'ARRIVED_AT_DROPOFF',
      'AT_LOCATION',
    ].includes(s);
  });
};
