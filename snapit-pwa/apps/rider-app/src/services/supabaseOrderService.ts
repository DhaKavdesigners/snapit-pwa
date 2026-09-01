import { supabase, DbOrder, DbStore, DbRiderProfile } from '@/lib/supabase';
import { Order, RiderProfile } from '@/types';
import { calculateDeliveryFee, generateDeliveryPin } from '../../../../common_logic/deliveryLogic';

/** Map a Supabase DB order row to Rider App Order object */
export function mapDbOrderToAppOrder(dbOrder: DbOrder, store?: DbStore): Order {
  let deliveryAddrStr = 'Customer Address';
  let dropLat = 12.9550;
  let dropLng = 78.2720;

  if (typeof dbOrder.delivery_address === 'string') {
    deliveryAddrStr = dbOrder.delivery_address;
  } else if (dbOrder.delivery_address && typeof dbOrder.delivery_address === 'object') {
    deliveryAddrStr = dbOrder.delivery_address.address || dbOrder.delivery_address.formatted || dbOrder.delivery_address.line1 || 'Customer Address';
    if (dbOrder.delivery_address.lat) dropLat = Number(dbOrder.delivery_address.lat);
    if (dbOrder.delivery_address.lng) dropLng = Number(dbOrder.delivery_address.lng);
  }

  const STORES_MAP: Record<string, string> = {
    g1: 'Mhetha Stores',
    d1: 'Nandhini KGF',
    s1: 'Mhetha Stores',
    s4: 'Nandhini KGF',
    f1: 'Bakio - Pizza & Burgers',
    f2: 'Mayura Pure Veg',
    f3: 'Ambur Star Dum Biriyani',
    f4: 'Al Baik Crunch Express',
    f5: 'Al Naz Shawarma & Rolls',
  };

  const KGF_STORES_COORDS: Record<string, { lat: number; lng: number; address: string }> = {
    g1: { lat: 12.9365, lng: 78.2672, address: 'Main Road, Andersonpet, KGF' },
    d1: { lat: 12.9348, lng: 78.2685, address: 'South Gilberts Road, Andersonpet, KGF' },
    f1: { lat: 12.9382, lng: 78.2658, address: 'Andersonpet Main Road, KGF' },
    s1: { lat: 12.9365, lng: 78.2672, address: 'Main Road, Andersonpet, KGF' },
    s4: { lat: 12.9348, lng: 78.2685, address: 'South Gilberts Road, Andersonpet, KGF' },
  };

  const defaultCoords = (dbOrder.store_id && KGF_STORES_COORDS[dbOrder.store_id]) || {
    lat: 12.9365,
    lng: 78.2672,
    address: 'Andersonpet, KGF',
  };

  const shopLat = store?.lat || defaultCoords.lat;
  const shopLng = store?.lng || defaultCoords.lng;
  const storeName = store?.name || (dbOrder.store_id ? STORES_MAP[dbOrder.store_id] : '') || 'Mhetha Stores';
  const storeAddress = store?.address || store?.store_address || defaultCoords.address;
  const storePhone = store?.phone || '8217649688';

  // Items
  const items = Array.isArray(dbOrder.items)
    ? dbOrder.items.map((item: any) => ({
        name: item.name || item.title || 'Item',
        quantity: Number(item.quantity || item.qty || 1),
        price: Number(item.price || item.price_paise || 0),
      }))
    : [{ name: 'Order Package', quantity: 1, price: 100 }];

  // Compute rider payout: from database delivery_fee column (defaults to common_logic if unset)
  const earnings = Number(dbOrder.delivery_fee) || calculateDeliveryFee({ distanceKm: 2.4 }).feeRupees;

  // 4-Digit Handshake PIN from database delivery_pin column or common_logic generator
  let rawOtp = '4821';
  if (dbOrder.delivery_pin !== undefined && dbOrder.delivery_pin !== null) {
    const pinStr = String(dbOrder.delivery_pin);
    rawOtp = pinStr.length >= 4 ? pinStr.slice(-4) : pinStr.padStart(4, '0');
  } else {
    rawOtp = generateDeliveryPin(dbOrder.id).pinString;
  }

  return {
    id: dbOrder.id,
    orderNumber: String(dbOrder.id).slice(-5).toUpperCase(),
    customerName: dbOrder.recipient_name || 'Customer',
    customerPhone: dbOrder.recipient_phone || '+91 8217649688',
    restaurantName: storeName,
    restaurantAddress: storeAddress,
    deliveryAddress: deliveryAddrStr,
    distanceKm: 2.4,
    estimatedMinutes: 12,
    earnings,
    items,
    status: mapDbStatusToAppStatus(dbOrder.status, dbOrder),
    dbStatus: dbOrder.status,
    shopkeeperHandoverConfirmed: Boolean(dbOrder.shopkeeper_handover_confirmed || dbOrder.status === 'OUT_OF_SHOP'),
    riderPickupConfirmed: Boolean(dbOrder.rider_pickup_confirmed),
    otp: rawOtp,
    timestamp: dbOrder.created_at ? new Date(dbOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
    paymentMethod: dbOrder.payment_method || 'Prepaid UPI',
    shopLocation: {
      lat: shopLat,
      lng: shopLng,
      name: storeName,
      address: storeAddress,
    },
    customerLocation: {
      lat: dropLat,
      lng: dropLng,
      name: dbOrder.recipient_name || 'Customer',
      address: deliveryAddrStr,
    },
    riderStartLocation: { lat: 12.9602, lng: 78.2711 },
    navStage: 'idle',
  };
}

function mapDbStatusToAppStatus(dbStatus: string, dbOrder?: DbOrder): any {
  const s = (dbStatus || '').toUpperCase();
  if (s === 'PLACED' || s === 'PENDING') return 'pending';
  if (s === 'PREPARING' || s === 'PACKING' || s === 'ACCEPTED' || s === 'RIDER_ARRIVING_TO_STORE' || s === 'ASSIGNED') return 'picking_up';
  if (s === 'ARRIVED_AT_STORE' || s === 'READY_FOR_PICKUP' || s === 'OUT_OF_SHOP') {
    const shopConfirmed = Boolean(dbOrder?.shopkeeper_handover_confirmed || s === 'OUT_OF_SHOP');
    const riderConfirmed = Boolean(dbOrder?.rider_pickup_confirmed);
    if (shopConfirmed && riderConfirmed) return 'in_transit';
    return 'arrived_at_pickup';
  }
  if (s === 'PICKED_UP' || s === 'IN_TRANSIT' || s === 'OUT_FOR_DELIVERY') return 'in_transit';
  if (s === 'RIDER_AT_LOC' || s === 'ARRIVED_AT_CUSTOMER' || s === 'ARRIVED_AT_DROPOFF') return 'arrived_at_dropoff';
  if (s === 'DELIVERED' || s === 'COMPLETED') return 'delivered';
  if (s === 'CANCELLED' || s === 'REJECTED') return 'cancelled';
  return 'pending';
}

function mapAppStatusToDbStatus(appStatus: string): string {
  const upper = (appStatus || '').toUpperCase();
  if (['PLACED', 'PREPARING', 'PACKING', 'RIDER_ARRIVING_TO_STORE', 'READY_FOR_PICKUP', 'OUT_OF_SHOP', 'OUT_FOR_DELIVERY', 'RIDER_AT_LOC', 'ARRIVED_AT_CUSTOMER', 'DELIVERED', 'CANCELLED'].includes(upper)) {
    return upper;
  }
  if (appStatus === 'accepted' || appStatus === 'picking_up') return 'RIDER_ARRIVING_TO_STORE';
  if (appStatus === 'arrived_at_pickup') return 'ARRIVED_AT_STORE';
  if (appStatus === 'in_transit') return 'OUT_FOR_DELIVERY';
  if (appStatus === 'arrived_at_dropoff') return 'RIDER_AT_LOC';
  if (appStatus === 'delivered') return 'DELIVERED';
  if (appStatus === 'cancelled') return 'CANCELLED';
  return 'RIDER_ARRIVING_TO_STORE';
}

/** Fetch stores from Supabase */
export async function fetchStores(): Promise<DbStore[]> {
  try {
    const { data, error } = await supabase.from('stores').select('*');
    if (error) {
      console.warn('Error fetching stores from Supabase:', error);
      return [];
    }
    return (data || []) as DbStore[];
  } catch (err) {
    console.warn('fetchStores exception:', err);
    return [];
  }
}

/** Fetch live active orders from Supabase */
export async function fetchLiveOrders(): Promise<DbOrder[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .not('status', 'in', '("DELIVERED","CANCELLED","REJECTED")')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching live orders from Supabase:', error);
      return [];
    }
    return (data || []) as DbOrder[];
  } catch (err) {
    console.warn('fetchLiveOrders exception:', err);
    return [];
  }
}

/** Assign rider to order without modifying merchant status */
export async function assignRiderToOrder(orderId: string, riderId: string) {
  try {
    const cleanRiderId = riderId.replace(/[^0-9]/g, '').slice(-10) || riderId;
    const updatePayload: any = {
      rider_assignment: 'ASSIGNED',
      rider_id: cleanRiderId,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (error) console.warn('Error assigning rider to order in Supabase:', error);
    return { data, error };
  } catch (err) {
    console.warn('Supabase assignRiderToOrder exception:', err);
    return { error: err };
  }
}

/** Update an order's status in Supabase */
export async function updateDbOrderStatus(
  orderId: string,
  status: string,
  riderId?: string
) {
  try {
    const dbStatus = mapAppStatusToDbStatus(status);
    const updatePayload: any = {
      status: dbStatus,
      updated_at: new Date().toISOString(),
    };
    if (riderId) updatePayload.rider_id = riderId;

    const { data, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (error) console.warn('Error updating Supabase order status:', error);
    return { data, error };
  } catch (err) {
    console.warn('Supabase updateDbOrderStatus exception:', err);
    return { error: err };
  }
}

/** Update order handover confirmation state in Supabase */
export async function updateDbOrderHandover(
  orderId: string,
  updates: {
    status?: string;
    rider_id?: string;
    rider_pickup_confirmed?: boolean;
    shopkeeper_handover_confirmed?: boolean;
  }
) {
  try {
    const updatePayload: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (error) console.warn('Error updating Supabase handover status:', error);
    return { data, error };
  } catch (err) {
    console.warn('Supabase updateDbOrderHandover exception:', err);
    return { error: err };
  }
}

/** Upload file/photo to Supabase Storage */
export async function uploadFileToSupabaseStorage(
  file: File | Blob | string,
  bucket: string,
  path: string
): Promise<string> {
  try {
    if (typeof file === 'string' && file.startsWith('data:')) {
      return file;
    }
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file as any, { upsert: true });

    if (error) {
      const { data: pubUrl } = supabase.storage.from(bucket).getPublicUrl(path);
      return pubUrl?.publicUrl || (typeof window !== 'undefined' && typeof file !== 'string' ? URL.createObjectURL(file) : String(file));
    }

    const { data: pubUrl } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return pubUrl.publicUrl;
  } catch (err: any) {
    return typeof window !== 'undefined' && typeof file !== 'string' ? URL.createObjectURL(file) : String(file);
  }
}

/** Subscribe to live incoming orders */
export function subscribeToOrders(
  onNewOrder: (order: DbOrder) => void,
  onOrderUpdated: (order: DbOrder) => void
) {
  const channel = supabase
    .channel('public:orders')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'orders' },
      (payload) => {
        if (payload.new) onNewOrder(payload.new as DbOrder);
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders' },
      (payload) => {
        if (payload.new) onOrderUpdated(payload.new as DbOrder);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** Register a new rider profile into Supabase */
export async function registerRiderInDb(riderData: {
  name: string;
  phone: string;
  mpin: string;
  dob?: string;
  alt_phone?: string;
  email?: string;
  address?: string;
  vehicle_type?: string;
  vehicle_number?: string;
  selected_zone_id?: string;
  selected_zone_name?: string;
  aadhaar_number?: string;
  aadhaar_doc_url?: string;
  pan_number?: string;
  pan_doc_url?: string;
  dl_number?: string;
  dl_doc_url?: string;
  upi_id?: string;
  avatar_url?: string;
  selfie_url?: string;
}): Promise<{ profile?: DbRiderProfile; error?: string }> {
  try {
    const cleanPhone = riderData.phone.replace(/[^0-9]/g, '').slice(-10);
    const newRecord: any = {
      id: cleanPhone,
      user_id: cleanPhone,
      name: riderData.name,
      phone: cleanPhone,
      mpin: riderData.mpin,
      dob: riderData.dob || null,
      alt_phone: riderData.alt_phone || null,
      email: riderData.email || null,
      address: riderData.address || null,
      vehicle_type: riderData.vehicle_type || 'Bike',
      vehicle_number: riderData.vehicle_number || '',
      selected_zone_id: riderData.selected_zone_id || 'zone-1',
      selected_zone_name: riderData.selected_zone_name || 'Robertsonpet',
      aadhaar_number: riderData.aadhaar_number || null,
      aadhaar_doc_url: riderData.aadhaar_doc_url || null,
      pan_number: riderData.pan_number || null,
      pan_doc_url: riderData.pan_doc_url || null,
      dl_number: riderData.dl_number || null,
      dl_doc_url: riderData.dl_doc_url || null,
      upi_id: riderData.upi_id || `${cleanPhone}@upi`,
      avatar_url: riderData.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      selfie_url: riderData.selfie_url || null,
      wallet_balance: 0,
      rating: 5.0,
      total_deliveries: 0,
      acceptance_rate: 100,
      is_verified: true,
      verification_step: 4,
      is_online: false,
      current_lat: 12.9602,
      current_lng: 78.2711,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let { data, error } = await supabase
      .from('rider_profiles')
      .upsert(newRecord, { onConflict: 'phone' })
      .select()
      .single();

    if (error && error.code === '22P02') {
      // Fallback if user_id column in database is still typed as UUID
      const fallbackRecord = { ...newRecord };
      delete fallbackRecord.user_id;
      const res = await supabase
        .from('rider_profiles')
        .upsert(fallbackRecord, { onConflict: 'phone' })
        .select()
        .single();
      data = res.data;
      error = res.error;
    }

    if (error) {
      console.warn('Error saving rider to Supabase:', error);
      return { error: error.message };
    }

    return { profile: data as DbRiderProfile };
  } catch (err: any) {
    console.warn('registerRiderInDb exception:', err);
    return { error: err.message || 'Network error saving rider profile.' };
  }
}

/** Login a rider using Phone + MPIN */
export async function loginRiderWithMpin(
  phone: string,
  mpin: string
): Promise<{ profile?: DbRiderProfile; error?: string }> {
  try {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const { data, error } = await supabase
      .from('rider_profiles')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (error) {
      console.warn('Error querying rider profile:', error);
      return { error: 'Database connection failed. Please check your network.' };
    }

    if (!data) {
      return { error: 'Rider profile not found. Please register first.' };
    }

    if (data.mpin && data.mpin !== mpin) {
      return { error: 'Incorrect 4-Digit MPIN. Please try again.' };
    }

    return { profile: data as DbRiderProfile };
  } catch (err: any) {
    console.warn('loginRiderWithMpin exception:', err);
    return { error: err.message || 'Login error.' };
  }
}

/** Login with MPIN only for quick unlock */
export async function loginRiderWithMpinOnly(
  mpin: string
): Promise<{ profile?: DbRiderProfile; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('rider_profiles')
      .select('*')
      .eq('mpin', mpin)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return { error: 'Incorrect MPIN.' };
    }

    return { profile: data as DbRiderProfile };
  } catch (err: any) {
    return { error: 'Login failed.' };
  }
}

/** Fetch a rider profile by phone */
export async function fetchRiderProfileFromDb(
  phone: string
): Promise<DbRiderProfile | null> {
  try {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const { data, error } = await supabase
      .from('rider_profiles')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle();
    if (error || !data) return null;
    return data as DbRiderProfile;
  } catch (err) {
    return null;
  }
}

/** Fetch rider delivered orders and calculate actual live earnings from Supabase */
export async function fetchRiderDeliveredStats(riderPhoneOrName?: string): Promise<{
  todayEarnings: number;
  todayDeliveries: number;
  totalEarnings: number;
  totalDeliveries: number;
  orders: Order[];
}> {
  try {
    const { data: dbOrders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'DELIVERED')
      .order('created_at', { ascending: false });

    if (error || !dbOrders) {
      return { todayEarnings: 0, todayDeliveries: 0, totalEarnings: 0, totalDeliveries: 0, orders: [] };
    }

    const stores = await fetchStores();
    const mappedOrders = dbOrders.map((o) => {
      const store = stores.find((s) => s.id === o.store_id);
      return mapDbOrderToAppOrder(o, store);
    });

    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();

    const todayOrders = dbOrders.filter((o) => {
      if (!o.created_at) return false;
      const d = new Date(o.created_at);
      return d.getFullYear() === todayYear && d.getMonth() === todayMonth && d.getDate() === todayDate;
    });

    const todayEarnings = todayOrders.reduce((sum, o) => sum + (Number(o.delivery_fee) || 45), 0);
    const totalEarnings = dbOrders.reduce((sum, o) => sum + (Number(o.delivery_fee) || 45), 0);

    return {
      todayEarnings,
      todayDeliveries: todayOrders.length,
      totalEarnings,
      totalDeliveries: dbOrders.length,
      orders: mappedOrders,
    };
  } catch (err) {
    console.warn('Error fetching rider delivered stats:', err);
    return { todayEarnings: 0, todayDeliveries: 0, totalEarnings: 0, totalDeliveries: 0, orders: [] };
  }
}

/** Update rider live GPS location in Supabase */
export async function updateRiderLiveLocation(
  phone: string,
  lat: number,
  lng: number,
  isOnline?: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (!cleanPhone) return { success: false, error: 'No phone number provided' };

    const updatePayload: any = {
      current_lat: lat,
      current_lng: lng,
      updated_at: new Date().toISOString(),
    };
    if (isOnline !== undefined) {
      updatePayload.is_online = isOnline;
    }

    const { error } = await supabase
      .from('rider_profiles')
      .update(updatePayload)
      .eq('phone', cleanPhone);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Update rider online status in Supabase */
export async function updateRiderOnlineStatus(
  phone: string,
  isOnline: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (!cleanPhone) return { success: false, error: 'No phone number provided' };

    const { error } = await supabase
      .from('rider_profiles')
      .update({
        is_online: isOnline,
        updated_at: new Date().toISOString(),
      })
      .eq('phone', cleanPhone);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

