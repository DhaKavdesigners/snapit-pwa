import { supabase, DbOrder, DbStore } from '@/lib/supabase';
import { Order } from '@/types';
import { mapDbOrderToAppOrder } from './supabaseOrderService';

/** Fetch available or active orders for rider */
export async function fetchRiderActiveAndLiveOrders(
  riderPhone: string
): Promise<{ activeOrder: Order | null; incomingOrder: Order | null }> {
  const cleanPhone = riderPhone.replace(/[^0-9]/g, '');

  try {
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('*')
      .not('status', 'in', '("DELIVERED","CANCELLED","REJECTED")')
      .order('created_at', { ascending: false });

    if (error || !ordersData) {
      return { activeOrder: null, incomingOrder: null };
    }

    const { data: storesData } = await supabase.from('stores').select('*');
    const storesMap = new Map<string, DbStore>();
    (storesData || []).forEach((st: DbStore) => storesMap.set(st.id, st));

    let active: Order | null = null;
    let incoming: Order | null = null;

    for (const dbOrder of ordersData) {
      const store = dbOrder.store_id ? storesMap.get(dbOrder.store_id) : undefined;
      const appOrder = mapDbOrderToAppOrder(dbOrder, store);

      // Order is actively assigned to this rider
      if (dbOrder.rider_id === cleanPhone) {
        if (dbOrder.rider_assignment === 'OFFERED' && !active) {
          incoming = appOrder;
        } else if (['ACCEPTED', 'AUTO_ASSIGNED', 'ADMIN_ASSIGNED'].includes(dbOrder.rider_assignment || '') || !dbOrder.rider_assignment) {
          active = appOrder;
        }
      }
      // Unassigned order available for offer
      else if (!dbOrder.rider_id && !incoming && !active) {
        incoming = appOrder;
      }
    }

    return { activeOrder: active, incomingOrder: incoming };
  } catch (err) {
    console.warn('Error in fetchRiderActiveAndLiveOrders:', err);
    return { activeOrder: null, incomingOrder: null };
  }
}

/** Accept an offered order in Supabase */
export async function acceptOrderInDb(
  orderId: string,
  riderPhone: string
): Promise<{ success: boolean; error?: string }> {
  const cleanPhone = riderPhone.replace(/[^0-9]/g, '');
  if (!cleanPhone) return { success: false, error: 'Rider phone is required' };

  try {
    const { error } = await supabase
      .from('orders')
      .update({
        rider_id: cleanPhone,
        rider_assignment: 'ACCEPTED',
        status: 'RIDER_ARRIVING_TO_STORE',
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to accept order' };
  }
}

/** Decline/Reject an order offer */
export async function declineOrderInDb(
  orderId: string,
  riderPhone: string,
  reason: string = 'Rider passed offer'
): Promise<boolean> {
  const cleanPhone = riderPhone.replace(/[^0-9]/g, '');

  try {
    const { error } = await supabase
      .from('orders')
      .update({
        rider_id: null,
        rider_assignment: 'REJECTED',
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    return !error;
  } catch {
    return false;
  }
}

/** Subscribe to live Supabase order changes */
export function subscribeToLiveOrders(
  riderPhone: string,
  onOrderUpdate: () => void
): () => void {
  const channel = supabase
    .channel('public:orders:rider_feed')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      () => {
        onOrderUpdate();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
