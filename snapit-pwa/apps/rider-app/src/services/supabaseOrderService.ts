import { supabase, DbOrder, DbStore, DbRiderProfile } from '@/lib/supabase';
import { Order, RiderProfile } from '@/types';

/** Map a Supabase DB order row to Rider App Order object */
export function mapDbOrderToAppOrder(dbOrder: DbOrder, store?: DbStore): Order {
  let deliveryAddrStr = 'Customer Address';
  let dropLat = 12.963;
  let dropLng = 77.638;

  if (typeof dbOrder.delivery_address === 'string') {
    deliveryAddrStr = dbOrder.delivery_address;
  } else if (dbOrder.delivery_address && typeof dbOrder.delivery_address === 'object') {
    deliveryAddrStr = dbOrder.delivery_address.address || dbOrder.delivery_address.formatted || 'Customer Address';
    if (dbOrder.delivery_address.lat) dropLat = Number(dbOrder.delivery_address.lat);
    if (dbOrder.delivery_address.lng) dropLng = Number(dbOrder.delivery_address.lng);
  }

  const shopLat = store?.lat || 12.9785;
  const shopLng = store?.lng || 77.645;
  const storeName = store?.name || 'Partner Store';
  const storeAddress = store?.address || 'Store Location';

  // Items
  const items = Array.isArray(dbOrder.items)
    ? dbOrder.items.map((item: any) => ({
        name: item.name || item.title || 'Item',
        quantity: Number(item.quantity || item.qty || 1),
        price: Number(item.price || 0),
      }))
    : [{ name: 'Order Package', quantity: 1, price: dbOrder.estimated_total || 100 }];

  // Compute rider payout (base + approx distance)
  const earnings = Math.max(40, Math.round((dbOrder.estimated_total || 200) * 0.18));

  return {
    id: dbOrder.id,
    orderNumber: String(dbOrder.id).slice(-5).toUpperCase(),
    customerName: dbOrder.recipient_name || 'Customer',
    customerPhone: dbOrder.recipient_phone || '+91 91234 56789',
    restaurantName: storeName,
    restaurantAddress: storeAddress,
    deliveryAddress: deliveryAddrStr,
    distanceKm: 2.4,
    estimatedMinutes: 12,
    earnings,
    items,
    status: mapDbStatusToAppStatus(dbOrder.status),
    otp: '1234',
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
    riderStartLocation: { lat: 12.9716, lng: 77.6412 },
    navStage: 'idle',
  };
}

function mapDbStatusToAppStatus(dbStatus: string): any {
  const s = (dbStatus || '').toUpperCase();
  if (s === 'PLACED' || s === 'PENDING' || s === 'ASSIGNED') return 'pending';
  if (s === 'ACCEPTED') return 'accepted';
  if (s === 'ARRIVED_AT_STORE' || s === 'ARRIVED_AT_PICKUP') return 'arrived_at_pickup';
  if (s === 'PICKED_UP' || s === 'IN_TRANSIT') return 'in_transit';
  if (s === 'ARRIVED_AT_CUSTOMER' || s === 'ARRIVED_AT_DROPOFF') return 'arrived_at_dropoff';
  if (s === 'DELIVERED' || s === 'COMPLETED') return 'delivered';
  if (s === 'CANCELLED') return 'cancelled';
  return 'pending';
}

function mapAppStatusToDbStatus(appStatus: string): string {
  if (appStatus === 'accepted') return 'ACCEPTED';
  if (appStatus === 'arrived_at_pickup') return 'ARRIVED_AT_STORE';
  if (appStatus === 'in_transit') return 'PICKED_UP';
  if (appStatus === 'arrived_at_dropoff') return 'ARRIVED_AT_CUSTOMER';
  if (appStatus === 'delivered') return 'DELIVERED';
  return 'PLACED';
}

/** Fetch stores from Supabase */
export async function fetchStores(): Promise<DbStore[]> {
  try {
    const { data, error } = await supabase.from('stores').select('*');
    if (error) {
      console.warn('Error fetching stores from Supabase:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase fetchStores exception:', err);
    return [];
  }
}

/** Fetch pending or assigned live orders */
export async function fetchLiveOrders(): Promise<DbOrder[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) {
      console.warn('Error fetching orders from Supabase:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase fetchLiveOrders exception:', err);
    return [];
  }
}

/** Update order status in Supabase */
export async function updateDbOrderStatus(orderId: string, status: string, riderId?: string) {
  try {
    const updatePayload: any = {
      status: mapAppStatusToDbStatus(status),
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
    const cleanPhone = riderData.phone.replace(/[^0-9+]/g, '');
    const newRecord = {
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
      selected_zone_name: riderData.selected_zone_name || 'Downtown Central',
      aadhaar_number: riderData.aadhaar_number || null,
      aadhaar_doc_url: riderData.aadhaar_doc_url || null,
      pan_number: riderData.pan_number || null,
      pan_doc_url: riderData.pan_doc_url || null,
      dl_number: riderData.dl_number || null,
      dl_doc_url: riderData.dl_doc_url || null,
      upi_id: riderData.upi_id || null,
      avatar_url: riderData.avatar_url || riderData.selfie_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      selfie_url: riderData.selfie_url || null,
      is_verified: true, // Temporary instant approval as requested
      verification_step: 4,
      is_online: false,
      wallet_balance: 0,
      rating: 5.0,
      total_deliveries: 0,
      acceptance_rate: 100,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('rider_profiles')
      .upsert(newRecord, { onConflict: 'phone' })
      .select()
      .single();

    if (error) {
      console.warn('Supabase rider_profiles table note:', error.message);
      // If table is not created in Supabase yet, return fallback local record so user can proceed without blocking
      return {
        profile: {
          id: `rider-${Date.now()}`,
          name: riderData.name,
          phone: cleanPhone,
          mpin: riderData.mpin,
          vehicle_type: riderData.vehicle_type || 'Bike',
          vehicle_number: riderData.vehicle_number || '',
          selected_zone_id: riderData.selected_zone_id || 'zone-1',
          selected_zone_name: riderData.selected_zone_name || 'Downtown Central',
          avatar_url: riderData.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          is_verified: true,
          verification_step: 4,
          is_online: false,
          wallet_balance: 0,
          rating: 5.0,
          total_deliveries: 0,
          acceptance_rate: 100,
        } as DbRiderProfile,
      };
    }

    return { profile: data as DbRiderProfile };
  } catch (err: any) {
    console.warn('registerRiderInDb exception:', err);
    return {
      profile: {
        id: `rider-${Date.now()}`,
        name: riderData.name,
        phone: riderData.phone,
        mpin: riderData.mpin,
        vehicle_type: riderData.vehicle_type || 'Bike',
        vehicle_number: riderData.vehicle_number || '',
        selected_zone_id: riderData.selected_zone_id || 'zone-1',
        selected_zone_name: riderData.selected_zone_name || 'Downtown Central',
        avatar_url: riderData.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        is_verified: true,
        verification_step: 4,
        is_online: false,
        wallet_balance: 0,
        rating: 5.0,
        total_deliveries: 0,
        acceptance_rate: 100,
      } as DbRiderProfile,
    };
  }
}

/** Authenticate rider with phone number and MPIN */
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
      .single();

    if (error || !data) {
      // Check local storage for fallback account
      try {
        const saved = localStorage.getItem('snapit_rider_profile_v2');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.phone === cleanPhone || parsed.phone?.replace(/[^0-9+]/g, '') === cleanPhone) {
            if (parsed.mpin === mpin) {
              return { profile: parsed as DbRiderProfile };
            }
            return { error: 'Incorrect MPIN. Please try again.' };
          }
        }
      } catch (e) {}

      return { error: 'No account found with this phone number. Please register first.' };
    }

    if (data.mpin !== mpin) {
      return { error: 'Incorrect MPIN. Please try again or use Forgot MPIN.' };
    }

    return { profile: data as DbRiderProfile };
  } catch (err: any) {
    console.warn('loginRiderWithMpin exception:', err);
    return { error: err.message || 'Login failed' };
  }
}

/** Authenticate rider with MPIN only */
export async function loginRiderWithMpinOnly(
  mpin: string
): Promise<{ profile?: DbRiderProfile; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('rider_profiles')
      .select('*')
      .eq('mpin', mpin)
      .limit(1);

    if (error || !data || data.length === 0) {
      // Check local storage for fallback account
      try {
        const saved = localStorage.getItem('snapit_rider_profile_v2');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.mpin === mpin) {
            return { profile: parsed as DbRiderProfile };
          }
        }
      } catch (e) {}

      return { error: 'Incorrect MPIN or no rider account found with this MPIN.' };
    }

    return { profile: data[0] as DbRiderProfile };
  } catch (err: any) {
    console.warn('loginRiderWithMpinOnly exception:', err);
    try {
      const saved = localStorage.getItem('snapit_rider_profile_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.mpin === mpin) {
          return { profile: parsed as DbRiderProfile };
        }
      }
    } catch (e) {}
    return { error: err.message || 'Login failed' };
  }
}

/** Upload a file or base64 blob to Supabase Storage bucket 'rider-documents' */
export async function uploadFileToSupabaseStorage(
  fileOrBlob: File | Blob | string,
  folder: 'selfies' | 'kyc' | 'avatars' = 'selfies',
  customFileName?: string
): Promise<string | null> {
  try {
    let blobToUpload: Blob;
    let fileExt = 'jpg';

    if (typeof fileOrBlob === 'string') {
      if (fileOrBlob.startsWith('data:')) {
        const parts = fileOrBlob.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        fileExt = mime.includes('png') ? 'png' : mime.includes('pdf') ? 'pdf' : 'jpg';
        const byteString = atob(parts[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        blobToUpload = new Blob([ab], { type: mime });
      } else {
        return fileOrBlob; // Already a remote URL
      }
    } else if (fileOrBlob instanceof File) {
      blobToUpload = fileOrBlob;
      fileExt = fileOrBlob.name.split('.').pop() || 'jpg';
    } else {
      blobToUpload = fileOrBlob;
    }

    const uniqueName = customFileName || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${folder}/${uniqueName}`;

    const { data, error } = await supabase.storage
      .from('rider-documents')
      .upload(filePath, blobToUpload, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.warn('Supabase storage note:', error.message);
      if (typeof fileOrBlob === 'string') return fileOrBlob;
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('rider-documents')
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.warn('uploadFileToSupabaseStorage exception:', err);
    if (typeof fileOrBlob === 'string') return fileOrBlob;
    return null;
  }
}

/** Fetch rider profile by phone */
export async function fetchRiderProfileFromDb(phone: string): Promise<DbRiderProfile | null> {
  try {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const { data, error } = await supabase
      .from('rider_profiles')
      .select('*')
      .eq('phone', cleanPhone)
      .single();

    if (error) return null;
    return data as DbRiderProfile;
  } catch (err) {
    return null;
  }
}

