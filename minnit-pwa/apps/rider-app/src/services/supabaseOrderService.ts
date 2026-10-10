import { supabase, DbOrder, DbStore, DbRiderProfile } from '@/lib/supabase';
import { Order, RiderProfile, OrderHistoryItem, DateFilterOption, OrderHistoryCategory, TimelineStep, CancellationSource, PickupStatus, ReturnStatus } from '@/types';
import { calculateDeliveryFee, generateDeliveryPin } from '../../../../common_logic/deliveryLogic';
import { formatOrderNumber } from '@/utils/orderUtils';


/** Map a Supabase DB order row to Rider App Order object */
export function mapDbOrderToAppOrder(dbOrder: DbOrder, store?: DbStore): Order {
  let deliveryAddrStr = 'Customer Address';
  let dropLat = 0;
  let dropLng = 0;

  if (typeof dbOrder.delivery_address === 'string') {
    deliveryAddrStr = dbOrder.delivery_address;
  } else if (dbOrder.delivery_address && typeof dbOrder.delivery_address === 'object') {
    deliveryAddrStr =
      dbOrder.delivery_address.address ||
      dbOrder.delivery_address.formatted ||
      dbOrder.delivery_address.line1 ||
      'Customer Address';
    if (dbOrder.delivery_address.lat) dropLat = Number(dbOrder.delivery_address.lat);
    if (dbOrder.delivery_address.lng) dropLng = Number(dbOrder.delivery_address.lng);
  }

  if (!dropLat && (dbOrder as any).lat) dropLat = Number((dbOrder as any).lat);
  if (!dropLng && (dbOrder as any).lng) dropLng = Number((dbOrder as any).lng);
  if (!dropLat && (dbOrder as any).drop_lat) dropLat = Number((dbOrder as any).drop_lat);
  if (!dropLng && (dbOrder as any).drop_lng) dropLng = Number((dbOrder as any).drop_lng);
  if (!dropLat && (dbOrder as any).latitude) dropLat = Number((dbOrder as any).latitude);
  if (!dropLng && (dbOrder as any).longitude) dropLng = Number((dbOrder as any).longitude);

  const STORES_MAP: Record<string, string> = {
    g1: 'Mhetha Stores',
    d1: 'Nandhini KGF',
    s1: 'Mhetha Stores',
    s4: 'Nandhini KGF',
    f1: 'Ambur Biriyani KGF',
    f2: 'MR & MRS KITCHEN',
    f3: 'Babu Juice Shop',
    f4: 'Cool Shop',
    f5: 'Al Naz Shawarma & Rolls',
  };

  const KGF_STORES_COORDS: Record<string, { lat: number; lng: number; address: string }> = {
    g1: { lat: 12.9365, lng: 78.2672, address: 'Main Road, Andersonpet, KGF' },
    d1: { lat: 12.9348, lng: 78.2685, address: 'South Gilberts Road, Andersonpet, KGF' },
    f1: { lat: 12.9382, lng: 78.2658, address: 'Andersonpet Main Road, KGF' },
    s1: { lat: 12.9365, lng: 78.2672, address: 'Main Road, Andersonpet, KGF' },
    s4: { lat: 12.9348, lng: 78.2685, address: 'South Gilberts Road, Andersonpet, KGF' },
  };

  const knownStoreCoords = dbOrder.store_id ? KGF_STORES_COORDS[dbOrder.store_id] : undefined;
  const shopLat = Number(store?.lat || (store as any)?.latitude || knownStoreCoords?.lat || 0);
  const shopLng = Number(store?.lng || (store as any)?.longitude || knownStoreCoords?.lng || 0);
  const storeName = store?.name || (dbOrder.store_id ? STORES_MAP[dbOrder.store_id] : '') || 'Store';
  const storeAddress = store?.address || store?.store_address || knownStoreCoords?.address || 'Store Location';
  const storePhone = store?.phone || '8217649688';

  // Items
  const items = Array.isArray(dbOrder.items)
    ? dbOrder.items.map((item: any) => ({
        name: item.name || item.title || 'Item',
        quantity: Number(item.quantity || item.qty || 1),
        price: Number(item.price || item.price_paise || 0),
      }))
    : [{ name: 'Order Package', quantity: 1, price: 100 }];

  // Calculate actual distance between store and customer if valid coordinates are present
  let distanceKm = Number((dbOrder as any).distance_km || 0);
  if (!distanceKm && shopLat && dropLat) {
    const R = 6371; // Earth radius in km
    const dLat = (dropLat - shopLat) * (Math.PI / 180);
    const dLon = (dropLng - shopLng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(shopLat * (Math.PI / 180)) * Math.cos(dropLat * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distanceKm = Math.round(R * c * 10) / 10;
  }
  const estimatedMinutes = distanceKm > 0 ? Math.max(5, Math.round(distanceKm * 4 + 5)) : 0;

  // Compute rider payout: from database delivery_fee column (defaults to common_logic if unset)
  const earnings = Number(dbOrder.delivery_fee) || calculateDeliveryFee({ distanceKm: distanceKm || 2 }).feeRupees;

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
    orderNumber: formatOrderNumber((dbOrder as any).order_number || (dbOrder as any).order_no || dbOrder.id),
    customerName: dbOrder.recipient_name || 'Customer',
    customerPhone: dbOrder.recipient_phone || storePhone,
    restaurantName: storeName,
    restaurantAddress: storeAddress,
    deliveryAddress: deliveryAddrStr,
    distanceKm,
    estimatedMinutes,
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
    riderStartLocation: undefined,
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
  bucketOrCategory: string,
  path: string
): Promise<string> {
  try {
    // 1. Resolve canonical bucket ('rider-documents') and target path
    let targetBucket = 'rider-documents';
    let targetPath = path;

    if (bucketOrCategory === 'kyc') {
      targetBucket = 'rider-documents';
      targetPath = path.startsWith('kyc/') ? path : `kyc/${path}`;
    } else if (bucketOrCategory === 'selfies') {
      targetBucket = 'rider-documents';
      targetPath = path.startsWith('selfies/') ? path : `selfies/${path}`;
    } else if (bucketOrCategory) {
      targetBucket = bucketOrCategory;
    }

    // 2. Prepare upload payload (convert base64 data: URLs to Blob)
    let uploadPayload: Blob | File;
    let contentType = 'image/jpeg';

    if (typeof file === 'string' && file.startsWith('data:')) {
      try {
        const parts = file.split(';base64,');
        contentType = parts[0].split(':')[1] || 'image/jpeg';
        const binaryString = typeof window !== 'undefined' ? window.atob(parts[1]) : Buffer.from(parts[1], 'base64').toString('binary');
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        uploadPayload = new Blob([bytes], { type: contentType });
      } catch (convErr) {
        console.warn('Failed to convert base64 dataUrl to Blob:', convErr);
        return file;
      }
    } else if (typeof file === 'string') {
      // It's already a full URL or path
      return file;
    } else {
      uploadPayload = file;
      if (file.type) contentType = file.type;
    }

    // 3. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(targetBucket)
      .upload(targetPath, uploadPayload, {
        upsert: true,
        contentType,
      });

    if (error) {
      console.error(`[Storage] Upload error to ${targetBucket}/${targetPath}:`, error);
      return typeof window !== 'undefined' ? URL.createObjectURL(uploadPayload) : '';
    }

    // 4. Return valid public URL from Supabase Storage
    const { data: pubUrl } = supabase.storage.from(targetBucket).getPublicUrl(data.path);
    return pubUrl.publicUrl;
  } catch (err: any) {
    console.error('[Storage] Upload exception:', err);
    return typeof window !== 'undefined' && typeof file !== 'string' ? URL.createObjectURL(file as Blob) : String(file);
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
  payout_mode?: 'UPI' | 'BANK';
  bank_account_holder?: string;
  bank_account_no?: string;
  bank_ifsc?: string;
  bank_passbook_doc_url?: string;
  avatar_url?: string;
  selfie_url?: string;
}): Promise<{ profile?: DbRiderProfile; riderId?: string; error?: string }> {
  try {
    const cleanPhone = riderData.phone.replace(/[^0-9]/g, '').slice(-10);
    const newRecord: any = {
      id: cleanPhone,
      name: riderData.name,
      phone: cleanPhone,
      mpin: riderData.mpin,
      dob: riderData.dob || null,
      alt_phone: riderData.alt_phone || null,
      email: riderData.email || null,
      address: riderData.address || null,
      vehicle_type: riderData.vehicle_type || 'Bike',
      vehicle_number: riderData.vehicle_number || '',
      selected_zone_id: riderData.selected_zone_id || 'Z01',
      selected_zone_name: riderData.selected_zone_name || 'Robertsonpet',
      aadhaar_number: riderData.aadhaar_number || null,
      aadhaar_doc_url: riderData.aadhaar_doc_url || null,
      pan_number: riderData.pan_number || null,
      pan_doc_url: riderData.pan_doc_url || null,
      dl_number: riderData.dl_number || null,
      dl_doc_url: riderData.dl_doc_url || null,
      upi_id: riderData.upi_id || (riderData.bank_account_no ? `bank:${riderData.bank_account_no}` : `${cleanPhone}@upi`),
      payout_mode: riderData.payout_mode || 'UPI',
      bank_account_holder: riderData.bank_account_holder || null,
      bank_account_no: riderData.bank_account_no || null,
      bank_ifsc: riderData.bank_ifsc || null,
      bank_passbook_doc_url: riderData.bank_passbook_doc_url || null,
      avatar_url: riderData.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      selfie_url: riderData.selfie_url || null,
      wallet_balance: 0,
      rating: 5.0,
      total_deliveries: 0,
      acceptance_rate: 100,
      is_verified: false,
      verification_step: 3,
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

    // Fallback if newly added columns do not exist yet in public.rider_profiles
    if (error && error.message) {
      console.warn('Upsert warning, retrying with core columns:', error.message);
      const optionalCols = [
        'verification_status',
        'payout_mode',
        'bank_account_holder',
        'bank_account_no',
        'bank_ifsc',
        'bank_passbook_doc_url',
        'passbook_doc_url',
      ];
      let needsRetry = false;
      for (const col of optionalCols) {
        if (error.message.toLowerCase().includes(col.toLowerCase())) {
          delete newRecord[col];
          needsRetry = true;
        }
      }
      if (needsRetry) {
        const retry = await supabase
          .from('rider_profiles')
          .upsert(newRecord, { onConflict: 'phone' })
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }
    }

    if (error) {
      console.warn('Error saving rider to Supabase:', error);
      return { error: error.message };
    }

    // Only assign Minnit Rider ID if rider is officially verified; leave blank while pending
    const generatedRiderId = data?.is_verified ? (data?.minnit_id || data?.Rider_ID) : undefined;

    return {
      profile: data as DbRiderProfile,
      riderId: generatedRiderId || undefined,
    };
  } catch (err: any) {
    console.warn('registerRiderInDb exception:', err);
    return { error: err.message || 'Network error saving rider profile.' };
  }
}

export interface LoginRiderResult {
  profile?: DbRiderProfile;
  error?: string;
  verificationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

/**
 * Login a rider using Minnit Rider ID (MR-XXXXXX or MM0001) or phone and 4-Digit MPIN.
 * Normalizes Rider ID (e.g. mr-834904 -> MR-834904).
 * Never exposes or logs the MPIN.
 * Strictly verifies server-side approval status.
 */
export async function loginRiderWithRiderId(
  riderIdOrPhone: string,
  mpin: string
): Promise<LoginRiderResult> {
  try {
    const rawInput = (riderIdOrPhone || '').trim();
    if (!rawInput) {
      return { error: 'Please enter your Minnit Rider ID.' };
    }
    if (!mpin || mpin.length < 4) {
      return { error: 'Please enter your 4-digit MPIN.' };
    }

    // Case-insensitive normalization & multi-format candidate generation
    const normalizedId = rawInput.toUpperCase();
    const cleanDigits = rawInput.replace(/[^0-9]/g, '');

    // Allow flexible input: 835705, MR-835705, MR835705, MM0001, 0001, phone, etc.
    const candidates = new Set<string>();
    candidates.add(normalizedId);

    if (cleanDigits) {
      candidates.add(`MR-${cleanDigits}`);
      candidates.add(`MR${cleanDigits}`);
      candidates.add(cleanDigits);
      if (cleanDigits.length <= 4) {
        candidates.add(`MM${cleanDigits.padStart(4, '0')}`);
      }
    }
    if (normalizedId.startsWith('MR')) {
      const nums = normalizedId.replace(/[^0-9]/g, '');
      if (nums) {
        candidates.add(`MR-${nums}`);
        candidates.add(nums);
      }
    }

    const orClauses: string[] = [];
    candidates.forEach((c) => {
      orClauses.push(`minnit_id.ilike.${c}`);
      orClauses.push(`Rider_ID.ilike.${c}`);
      orClauses.push(`id.ilike.${c}`);
    });

    // 1. Primary lookup by minnit_id, Rider_ID, or ID
    let { data, error } = await supabase
      .from('rider_profiles')
      .select('*')
      .or(orClauses.join(','))
      .maybeSingle();

    // 2. Fallback: lookup by phone number (if 10+ digits provided)
    if (!data && cleanDigits.length >= 10) {
      const phoneRes = await supabase
        .from('rider_profiles')
        .select('*')
        .eq('phone', cleanDigits.slice(-10))
        .maybeSingle();
      if (phoneRes.data) {
        data = phoneRes.data;
        error = null;
      }
    }

    if (error) {
      console.warn('Error querying rider profile:', error);
      return { error: 'Database connection failed. Please check your network.' };
    }

    if (!data) {
      return { error: `Rider with ID "${rawInput}" not found. Please verify your Rider ID or register.` };
    }

    // Secure credential check without logging credentials
    if (data.mpin && data.mpin !== mpin) {
      return { error: 'Incorrect 4-Digit MPIN. Please try again.' };
    }

    // ── SERVER-AUTHORITATIVE VERIFICATION STATUS CHECK ──
    const status = data.verification_status;
    const isVerifiedBool = data.is_verified;

    if (status === 'PENDING') {
      return {
        error: 'Your registration is pending verification by the Minnit Admin Team.',
        verificationStatus: 'PENDING',
        profile: data as DbRiderProfile,
      };
    }

    if (status === 'REJECTED') {
      return {
        error: data.rejection_reason || 'Your registration was not approved. Please contact Minnit Admin Support.',
        verificationStatus: 'REJECTED',
        profile: data as DbRiderProfile,
      };
    }

    // Legacy fallback: if status column not present, check is_verified
    if (!status && isVerifiedBool === false) {
      return {
        error: 'Your registration is pending verification by the Minnit Admin Team.',
        verificationStatus: 'PENDING',
        profile: data as DbRiderProfile,
      };
    }

    return {
      profile: data as DbRiderProfile,
      verificationStatus: 'APPROVED',
    };
  } catch (err: any) {
    return { error: err.message || 'Login failed.' };
  }
}

/** Login a rider using Phone + MPIN (Backwards compatibility) */
export async function loginRiderWithMpin(
  phone: string,
  mpin: string
): Promise<{ profile?: DbRiderProfile; error?: string }> {
  return loginRiderWithRiderId(phone, mpin);
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
export async function fetchRiderDeliveredStats(...identifiers: (string | undefined)[]): Promise<{
  todayEarnings: number;
  todayDeliveries: number;
  thisWeekEarnings: number;
  thisWeekDeliveries: number;
  thisMonthEarnings: number;
  thisMonthDeliveries: number;
  totalEarnings: number;
  totalDeliveries: number;
  orders: Order[];
}> {
  try {
    const rawIds = identifiers.filter((id): id is string => Boolean(id && typeof id === 'string' && id.trim()));
    if (rawIds.length === 0) {
      return {
        todayEarnings: 0,
        todayDeliveries: 0,
        thisWeekEarnings: 0,
        thisWeekDeliveries: 0,
        thisMonthEarnings: 0,
        thisMonthDeliveries: 0,
        totalEarnings: 0,
        totalDeliveries: 0,
        orders: [],
      };
    }

    const candidateSet = new Set<string>();
    for (const raw of rawIds) {
      candidateSet.add(raw.trim());
      const cleanPhone = raw.replace(/[^0-9]/g, '').slice(-10);
      if (cleanPhone.length >= 10) {
        candidateSet.add(cleanPhone);
      }
    }
    const candidates = Array.from(candidateSet);
    const orClauses = candidates.map((c) => `rider_id.eq.${c}`).join(',');

    const stores = await fetchStores();
    const dbOrdersList: any[] = [];

    // 1. Try querying rider_order_assignments if table exists
    try {
      const { data: assignments, error: aErr } = await supabase
        .from('rider_order_assignments')
        .select('*, order:orders(*)')
        .or(orClauses)
        .in('status', ['DELIVERED', 'COMPLETED'])
        .order('created_at', { ascending: false });

      if (!aErr && assignments && assignments.length > 0) {
        assignments.forEach((a: any) => {
          const o = a.order || {};
          const customerOrderId = o.id || a.order_id;
          const distanceKm = Number(a.distance_km || o.distance_km || 2.4);
          const earning = Number(a.earning || o.delivery_fee) || calculateDeliveryFee({ distanceKm }).feeRupees;
          dbOrdersList.push({
            id: customerOrderId,
            store_id: o.store_id,
            created_at: a.delivered_at || a.updated_at || a.created_at || o.created_at,
            updated_at: a.delivered_at || a.updated_at || o.updated_at,
            delivered_at: a.delivered_at || a.updated_at,
            delivery_fee: earning,
            distance_km: distanceKm,
            raw_order: o,
          });
        });
      }
    } catch (assignTableErr) {
      // Ignore if table does not exist
    }

    // 2. Query standard orders table
    try {
      const { data: dbOrders, error: oErr } = await supabase
        .from('orders')
        .select('*')
        .or(orClauses)
        .in('status', ['DELIVERED', 'COMPLETED'])
        .order('created_at', { ascending: false });

      if (!oErr && dbOrders && dbOrders.length > 0) {
        dbOrders.forEach((o: any) => {
          if (!dbOrdersList.some((item) => item.id === o.id)) {
            const distanceKm = Number(o.distance_km || 2.4);
            const earning = Number(o.delivery_fee || o.earning || o.payout) || calculateDeliveryFee({ distanceKm }).feeRupees;
            dbOrdersList.push({
              id: o.id,
              store_id: o.store_id,
              created_at: o.delivered_at || o.updated_at || o.created_at,
              updated_at: o.delivered_at || o.updated_at || o.updated_at,
              delivered_at: o.delivered_at || o.updated_at,
              delivery_fee: earning,
              distance_km: distanceKm,
              raw_order: o,
            });
          }
        });
      }
    } catch (orderQueryErr) {
      console.warn('Error querying orders table in fetchRiderDeliveredStats:', orderQueryErr);
    }

    const mappedOrders: Order[] = dbOrdersList.map((item) => {
      const store = stores.find((s) => s.id === item.store_id);
      if (item.raw_order && item.raw_order.items) {
        return mapDbOrderToAppOrder(item.raw_order, store);
      }
      const dist = Number(item.distance_km || 2.4);
      return {
        id: item.id,
        orderNumber: formatOrderNumber(item.id),
        status: 'delivered' as const,
        restaurantName: store?.name || 'Store Partner',
        restaurantAddress: store?.address || 'Store Location',
        deliveryAddress: 'Customer Location',
        distanceKm: dist,
        estimatedMinutes: Math.max(5, Math.round(dist * 4 + 5)),
        otp: '4821',
        items: [],
        totalAmount: 0,
        earnings: item.delivery_fee,
        timestamp: item.created_at ? new Date(item.created_at).toLocaleTimeString() : 'Delivered',
        customerName: 'Customer',
        customerPhone: '',
        paymentMethod: 'UPI' as const,
        notes: '',
      };
    });

    const todayBounds = getISTDateBounds('today');
    const weekBounds = getISTDateBounds('this_week');
    const monthBounds = getISTDateBounds('this_month');

    let todayEarnings = 0;
    let todayDeliveries = 0;
    let thisWeekEarnings = 0;
    let thisWeekDeliveries = 0;
    let thisMonthEarnings = 0;
    let thisMonthDeliveries = 0;
    let totalEarnings = 0;

    dbOrdersList.forEach((item) => {
      const orderTimeIso = item.created_at || item.updated_at;
      const orderEarning = Number(item.delivery_fee) || 30;
      totalEarnings += orderEarning;

      if (orderTimeIso) {
        const t = new Date(orderTimeIso).getTime();
        if (todayBounds && t >= new Date(todayBounds.startUtc).getTime() && t <= new Date(todayBounds.endUtc).getTime()) {
          todayEarnings += orderEarning;
          todayDeliveries++;
        }
        if (weekBounds && t >= new Date(weekBounds.startUtc).getTime() && t <= new Date(weekBounds.endUtc).getTime()) {
          thisWeekEarnings += orderEarning;
          thisWeekDeliveries++;
        }
        if (monthBounds && t >= new Date(monthBounds.startUtc).getTime() && t <= new Date(monthBounds.endUtc).getTime()) {
          thisMonthEarnings += orderEarning;
          thisMonthDeliveries++;
        }
      }
    });

    return {
      todayEarnings,
      todayDeliveries,
      thisWeekEarnings,
      thisWeekDeliveries,
      thisMonthEarnings,
      thisMonthDeliveries,
      totalEarnings,
      totalDeliveries: dbOrdersList.length,
      orders: mappedOrders,
    };
  } catch (err) {
    console.warn('Error fetching rider delivered stats:', err);
    return {
      todayEarnings: 0,
      todayDeliveries: 0,
      thisWeekEarnings: 0,
      thisWeekDeliveries: 0,
      thisMonthEarnings: 0,
      thisMonthDeliveries: 0,
      totalEarnings: 0,
      totalDeliveries: 0,
      orders: [],
    };
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

/** Fetch all registered riders from Supabase for live fleet capacity calculation */
export async function fetchAllRiders(): Promise<DbRiderProfile[]> {
  try {
    const { data, error } = await supabase
      .from('rider_profiles')
      .select('*');

    if (error) {
      console.warn('Error fetching all riders from Supabase:', error);
      return [];
    }
    return (data || []) as DbRiderProfile[];
  } catch (err) {
    console.warn('fetchAllRiders exception:', err);
    return [];
  }
}

/**
 * Format timestamp in Indian Standard Time (IST / Asia/Kolkata).
 * Output example: "02 Oct • 7:42 PM"
 */
export function formatISTDateTime(isoString?: string | null): { dateStr: string; timeStr: string; fullStr: string } {
  if (!isoString) return { dateStr: '', timeStr: '', fullStr: '' };
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { dateStr: '', timeStr: '', fullStr: '' };

    const dateStr = d.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
    });
    const timeStr = d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return {
      dateStr,
      timeStr,
      fullStr: `${dateStr} • ${timeStr}`,
    };
  } catch (e) {
    return { dateStr: '', timeStr: '', fullStr: '' };
  }
}

/**
 * Calculate precise IST (UTC+05:30) date boundaries for historical order queries.
 * Prevents UTC timezone drift across midnight boundaries.
 */
export function getISTDateBounds(
  filter: DateFilterOption,
  customRange?: { from: string; to: string }
): { startUtc: string; endUtc: string } | null {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +05:30 in ms
  const nowMs = Date.now();
  const nowIst = new Date(nowMs + IST_OFFSET_MS);

  const istYear = nowIst.getUTCFullYear();
  const istMonth = nowIst.getUTCMonth(); // 0-11
  const istDate = nowIst.getUTCDate();
  const istDay = nowIst.getUTCDay(); // 0 = Sun, 1 = Mon ...

  const toUtcIso = (y: number, m: number, d: number, hour = 0, min = 0, sec = 0, ms = 0) => {
    const utcEpoch = Date.UTC(y, m, d, hour, min, sec, ms) - IST_OFFSET_MS;
    return new Date(utcEpoch).toISOString();
  };

  switch (filter) {
    case 'today': {
      return {
        startUtc: toUtcIso(istYear, istMonth, istDate, 0, 0, 0, 0),
        endUtc: toUtcIso(istYear, istMonth, istDate, 23, 59, 59, 999),
      };
    }
    case 'yesterday': {
      const yDate = new Date(Date.UTC(istYear, istMonth, istDate - 1));
      const yY = yDate.getUTCFullYear();
      const yM = yDate.getUTCMonth();
      const yD = yDate.getUTCDate();
      return {
        startUtc: toUtcIso(yY, yM, yD, 0, 0, 0, 0),
        endUtc: toUtcIso(yY, yM, yD, 23, 59, 59, 999),
      };
    }
    case 'last_7_days': {
      const pastDate = new Date(Date.UTC(istYear, istMonth, istDate - 6));
      return {
        startUtc: toUtcIso(pastDate.getUTCFullYear(), pastDate.getUTCMonth(), pastDate.getUTCDate(), 0, 0, 0, 0),
        endUtc: toUtcIso(istYear, istMonth, istDate, 23, 59, 59, 999),
      };
    }
    case 'this_week': {
      // Monday to today in IST
      const daysSinceMonday = istDay === 0 ? 6 : istDay - 1;
      const monDate = new Date(Date.UTC(istYear, istMonth, istDate - daysSinceMonday));
      return {
        startUtc: toUtcIso(monDate.getUTCFullYear(), monDate.getUTCMonth(), monDate.getUTCDate(), 0, 0, 0, 0),
        endUtc: toUtcIso(istYear, istMonth, istDate, 23, 59, 59, 999),
      };
    }
    case 'last_week': {
      const daysSinceMonday = istDay === 0 ? 6 : istDay - 1;
      const lastMon = new Date(Date.UTC(istYear, istMonth, istDate - daysSinceMonday - 7));
      const lastSun = new Date(Date.UTC(istYear, istMonth, istDate - daysSinceMonday - 1));
      return {
        startUtc: toUtcIso(lastMon.getUTCFullYear(), lastMon.getUTCMonth(), lastMon.getUTCDate(), 0, 0, 0, 0),
        endUtc: toUtcIso(lastSun.getUTCFullYear(), lastSun.getUTCMonth(), lastSun.getUTCDate(), 23, 59, 59, 999),
      };
    }
    case 'this_month': {
      return {
        startUtc: toUtcIso(istYear, istMonth, 1, 0, 0, 0, 0),
        endUtc: toUtcIso(istYear, istMonth, istDate, 23, 59, 59, 999),
      };
    }
    case 'last_month': {
      const prevMonthLastDate = new Date(Date.UTC(istYear, istMonth, 0));
      return {
        startUtc: toUtcIso(prevMonthLastDate.getUTCFullYear(), prevMonthLastDate.getUTCMonth(), 1, 0, 0, 0, 0),
        endUtc: toUtcIso(prevMonthLastDate.getUTCFullYear(), prevMonthLastDate.getUTCMonth(), prevMonthLastDate.getUTCDate(), 23, 59, 59, 999),
      };
    }
    case 'custom': {
      if (!customRange?.from || !customRange?.to) return null;
      const [fromY, fromM, fromD] = customRange.from.split('-').map(Number);
      const [toY, toM, toD] = customRange.to.split('-').map(Number);
      if (!fromY || !fromM || !fromD || !toY || !toM || !toD) return null;

      // Prevent future dates by capping 'to' date to today in IST
      const maxToUtc = toUtcIso(istYear, istMonth, istDate, 23, 59, 59, 999);
      let calculatedEnd = toUtcIso(toY, toM - 1, toD, 23, 59, 59, 999);
      if (new Date(calculatedEnd).getTime() > new Date(maxToUtc).getTime()) {
        calculatedEnd = maxToUtc;
      }

      return {
        startUtc: toUtcIso(fromY, fromM - 1, fromD, 0, 0, 0, 0),
        endUtc: calculatedEnd,
      };
    }
    default:
      return null;
  }
}

export interface FetchOrderHistoryOptions {
  category: OrderHistoryCategory;
  dateFilter?: DateFilterOption;
  customRange?: { from: string; to: string };
  searchQuery?: string;
}

/**
 * Fetch rider's Order History for Completed or Cancelled deliveries.
 * Queries Supabase orders scoped to authenticated rider.
 * Performs accurate IST date boundaries and case-insensitive Order ID search.
 */
export async function fetchRiderOrderHistory(
  riderPhoneOrId: string,
  options: FetchOrderHistoryOptions
): Promise<{ orders: OrderHistoryItem[]; error?: string }> {
  try {
    if (!riderPhoneOrId) {
      return { orders: [] };
    }

    const cleanPhone = riderPhoneOrId.replace(/[^0-9]/g, '').slice(-10);
    const stores = await fetchStores();

    // 1. Try querying rider_order_assignments if table exists
    try {
      let query = supabase
        .from('rider_order_assignments')
        .select('*, order:orders(*)')
        .or(`rider_id.eq.${cleanPhone},rider_id.eq.${riderPhoneOrId}`);

      if (options.category === 'completed') {
        query = query.eq('status', 'DELIVERED');
      } else {
        query = query.eq('status', 'CANCELLED');
      }

      const bounds = options.dateFilter ? getISTDateBounds(options.dateFilter, options.customRange) : null;
      if (bounds) {
        query = query.gte('created_at', bounds.startUtc).lte('created_at', bounds.endUtc);
      }

      const { data: assignments, error: assignError } = await query.order('created_at', { ascending: false });

      if (!assignError && assignments && assignments.length > 0) {
        const mapped = assignments.map((a: any) => {
          const o = a.order || {};
          const store = stores.find((s) => s.id === o.store_id);
          const customerOrderId = o.id || a.order_id;
          const displayOrderNum = formatOrderNumber(customerOrderId);
          const distanceKm = Number(a.distance_km || o.distance_km || 2);
          const pickupStatus: PickupStatus = a.pickup_confirmed || a.picked_up_at ? 'picked_up' : 'before_pickup';
          const returnStatus: ReturnStatus = a.return_status || 'none';
          const cancelledBy: CancellationSource = a.cancelled_by?.toLowerCase() || 'system';
          const cancellationReason = a.cancellation_reason || 'Assignment ended';
          const individualEarnings = Number(a.earning || o.delivery_fee) || calculateDeliveryFee({ distanceKm }).feeRupees;

          const timeline: TimelineStep[] = [];
          timeline.push({
            title: 'Order Placed & Accepted',
            time: formatISTDateTime(a.created_at || o.created_at).fullStr,
            completed: true,
          });

          if (options.category === 'completed') {
            timeline.push({
              title: 'Picked Up from Store',
              time: formatISTDateTime(a.picked_up_at || a.created_at).timeStr,
              completed: true,
            });
            timeline.push({
              title: 'Out for Delivery',
              completed: true,
            });
            timeline.push({
              title: 'Delivered Successfully',
              time: formatISTDateTime(a.delivered_at || a.updated_at).fullStr,
              completed: true,
              current: true,
              note: 'Verified with Customer PIN',
            });
          } else {
            if (pickupStatus === 'picked_up') {
              timeline.push({
                title: 'Package Picked Up from Store',
                time: formatISTDateTime(a.picked_up_at || a.created_at).timeStr,
                completed: true,
              });
              timeline.push({
                title: 'Delivery Ended / Cancelled',
                time: formatISTDateTime(a.cancelled_at || a.updated_at).fullStr,
                completed: true,
                note: cancellationReason,
              });
              if (returnStatus === 'returned_to_shop') {
                timeline.push({
                  title: 'Returned to Store',
                  time: formatISTDateTime(a.return_confirmed_at || a.updated_at).fullStr,
                  completed: true,
                  current: true,
                  note: 'Store confirmed package return',
                });
              } else {
                timeline.push({
                  title: 'Return to Store Pending',
                  completed: false,
                  current: true,
                  note: 'Pending return handover to store',
                });
              }
            } else {
              timeline.push({
                title: 'Cancelled Before Pickup',
                time: formatISTDateTime(a.cancelled_at || a.updated_at).fullStr,
                completed: true,
                current: true,
                note: cancellationReason,
              });
            }
          }

          const item: OrderHistoryItem = {
            id: customerOrderId,
            orderNumber: displayOrderNum,
            assignmentId: a.id,
            category: options.category,
            customerName: o.recipient_name || 'Customer',
            customerPhone: o.recipient_phone || '',
            restaurantName: store?.name || 'Store Partner',
            restaurantAddress: store?.address || store?.store_address || 'Store Location',
            deliveryAddress: typeof o.delivery_address === 'string' ? o.delivery_address : (o.delivery_address?.line1 || o.delivery_address?.address || 'Customer Location'),
            distanceKm,
            earnings: options.category === 'completed' ? individualEarnings : 0,
            items: Array.isArray(o.items) ? o.items.map((it: any) => ({ name: it.name || 'Item', quantity: Number(it.quantity || 1), price: Number(it.price || 0) })) : [],
            status: a.status,
            dbStatus: o.status || a.status,
            createdAt: a.created_at,
            completedAt: a.delivered_at || a.updated_at,
            cancelledAt: a.cancelled_at || a.updated_at,
            cancelledBy,
            cancellationReason,
            pickupStatus,
            returnStatus,
            timeline,
          };
          return item;
        });

        // Apply search filter if query is present
        let filtered = mapped;
        if (options.searchQuery && options.searchQuery.trim()) {
          const q = options.searchQuery.toLowerCase().replace(/^#/, '').trim();
          filtered = mapped.filter((item: OrderHistoryItem) =>
            item.id.toLowerCase().includes(q) ||
            item.orderNumber.toLowerCase().includes(q) ||
            item.restaurantName.toLowerCase().includes(q)
          );
        }

        return { orders: filtered };
      }
    } catch (assignTableErr) {
      // rider_order_assignments does not exist; proceed to fallback query on orders table
    }

    // 2. Standard Orders Table Query
    let ordersQuery = supabase
      .from('orders')
      .select('*');

    // Scoped strictly to authenticated rider (phone or ID)
    if (cleanPhone) {
      ordersQuery = ordersQuery.or(`rider_id.eq.${cleanPhone},rider_id.eq.${riderPhoneOrId}`);
    } else {
      ordersQuery = ordersQuery.eq('rider_id', riderPhoneOrId);
    }

    if (options.category === 'completed') {
      ordersQuery = ordersQuery.eq('status', 'DELIVERED');
    } else {
      ordersQuery = ordersQuery.in('status', ['CANCELLED', 'REJECTED']);
    }

    // Filter by timestamp:
    // Completed tab uses completion/delivery timestamp (updated_at)
    // Cancelled tab uses cancellation timestamp (updated_at)
    const bounds = options.dateFilter ? getISTDateBounds(options.dateFilter, options.customRange) : null;
    if (bounds) {
      ordersQuery = ordersQuery.gte('updated_at', bounds.startUtc).lte('updated_at', bounds.endUtc);
    }

    ordersQuery = ordersQuery.order('updated_at', { ascending: false });

    const { data: dbOrders, error } = await ordersQuery;

    if (error) {
      console.warn('Error querying rider order history:', error);
      return { orders: [], error: 'Unable to load orders. Please try again.' };
    }

    if (!dbOrders) {
      return { orders: [] };
    }

    const mappedOrders: OrderHistoryItem[] = dbOrders.map((o: DbOrder) => {
      const store = stores.find((s) => s.id === o.store_id);
      const customerOrderId = o.id; // Exact customer order ID from Supabase
      const displayOrderNum = formatOrderNumber(customerOrderId);

      // Distance calculation
      let distanceKm = Number((o as any).distance_km || 0);
      if (!distanceKm) {
        distanceKm = 2.4; // Safe fallback
      }

      const individualEarnings = Number(o.delivery_fee) || calculateDeliveryFee({ distanceKm }).feeRupees;

      // Extract delivery address text
      let deliveryAddressText = 'Customer Location';
      if (typeof o.delivery_address === 'string') {
        deliveryAddressText = o.delivery_address;
      } else if (o.delivery_address && typeof o.delivery_address === 'object') {
        deliveryAddressText = o.delivery_address.line1 || o.delivery_address.address || o.delivery_address.formatted || 'Customer Location';
      }

      // Cancellation details
      const rawReason = (o as any).cancellation_reason || o.rejection_reason || '';
      let cancellationReason = rawReason;
      let cancelledBy: CancellationSource = 'system';

      const lowerReason = rawReason.toLowerCase();
      if (lowerReason.includes('customer')) {
        cancelledBy = 'customer';
        cancellationReason = rawReason || 'Customer cancelled';
      } else if (lowerReason.includes('shop') || lowerReason.includes('merchant') || lowerReason.includes('store') || lowerReason.includes('item') || lowerReason.includes('stock')) {
        cancelledBy = 'store';
        cancellationReason = rawReason || 'Shop cancelled';
      } else if (lowerReason.includes('rider') || lowerReason.includes('vehicle') || lowerReason.includes('breakdown') || lowerReason.includes('emergency')) {
        cancelledBy = 'rider';
        cancellationReason = rawReason || 'Rider unable to complete delivery';
      } else if (lowerReason.includes('admin') || lowerReason.includes('support')) {
        cancelledBy = 'admin';
        cancellationReason = rawReason || 'Cancelled by support team';
      } else if (lowerReason.includes('address') || lowerReason.includes('unreachable')) {
        cancelledBy = 'customer';
        cancellationReason = rawReason || 'Customer unreachable / Address issue';
      } else {
        cancellationReason = rawReason || 'Delivery cancelled';
      }

      const pickupConfirmed = Boolean(o.rider_pickup_confirmed || o.shopkeeper_handover_confirmed || (o.status || '').toUpperCase() === 'OUT_FOR_DELIVERY');
      const pickupStatus: PickupStatus = pickupConfirmed ? 'picked_up' : 'before_pickup';

      let returnStatus: ReturnStatus = 'none';
      if (pickupStatus === 'picked_up') {
        const rawReturn = String((o as any).return_status || '').toUpperCase();
        if (rawReturn === 'RETURNED_TO_SHOP' || (o as any).return_confirmed_at) {
          returnStatus = 'returned_to_shop';
        } else {
          returnStatus = 'return_pending';
        }
      }

      // Formulate authentic Timeline
      const timeline: TimelineStep[] = [];
      timeline.push({
        title: 'Order Placed & Accepted',
        time: formatISTDateTime(o.created_at).fullStr,
        completed: true,
      });

      if (options.category === 'completed') {
        timeline.push({
          title: 'Picked Up from Store',
          time: formatISTDateTime(o.created_at).timeStr,
          completed: true,
        });
        timeline.push({
          title: 'Out for Delivery',
          completed: true,
        });
        timeline.push({
          title: 'Delivered Successfully',
          time: formatISTDateTime(o.updated_at || o.created_at).fullStr,
          completed: true,
          current: true,
          note: 'Handover verified with Customer PIN',
        });
      } else {
        if (pickupStatus === 'picked_up') {
          timeline.push({
            title: 'Package Picked Up from Store',
            time: formatISTDateTime(o.created_at).timeStr,
            completed: true,
          });
          timeline.push({
            title: 'Delivery Ended / Cancelled',
            time: formatISTDateTime(o.updated_at || o.created_at).fullStr,
            completed: true,
            note: cancellationReason,
          });
          if (returnStatus === 'returned_to_shop') {
            timeline.push({
              title: 'Returned to Store',
              time: formatISTDateTime((o as any).return_confirmed_at || o.updated_at).fullStr,
              completed: true,
              current: true,
              note: 'Store confirmed package return',
            });
          } else {
            timeline.push({
              title: 'Return to Store Pending',
              completed: false,
              current: true,
              note: 'Rider return to store pending merchant confirmation',
            });
          }
        } else {
          timeline.push({
            title: 'Cancelled Before Pickup',
            time: formatISTDateTime(o.updated_at || o.created_at).fullStr,
            completed: true,
            current: true,
            note: cancellationReason,
          });
        }
      }

      const item: OrderHistoryItem = {
        id: customerOrderId,
        orderNumber: displayOrderNum,
        category: options.category,
        customerName: o.recipient_name || 'Customer',
        customerPhone: o.recipient_phone || '',
        restaurantName: store?.name || 'Store Partner',
        restaurantAddress: store?.address || store?.store_address || 'Store Location',
        deliveryAddress: deliveryAddressText,
        distanceKm,
        earnings: options.category === 'completed' ? individualEarnings : 0,
        items: Array.isArray(o.items)
          ? o.items.map((it: any) => ({
              name: it.name || 'Item',
              quantity: Number(it.quantity || 1),
              price: Number(it.price || 0),
            }))
          : [],
        status: o.status,
        dbStatus: o.status,
        createdAt: o.created_at,
        completedAt: options.category === 'completed' ? (o.updated_at || o.created_at) : undefined,
        cancelledAt: options.category === 'cancelled' ? (o.updated_at || o.created_at) : undefined,
        cancelledBy,
        cancellationReason,
        pickupStatus,
        returnStatus,
        timeline,
      };
      return item;
    });

    // Apply Order ID search filter if present
    let filtered = mappedOrders;
    if (options.searchQuery && options.searchQuery.trim()) {
      const q = options.searchQuery.toLowerCase().replace(/^#/, '').trim();
      filtered = mappedOrders.filter((item: OrderHistoryItem) =>
        item.id.toLowerCase().includes(q) ||
        item.orderNumber.toLowerCase().includes(q) ||
        item.restaurantName.toLowerCase().includes(q)
      );
    }

    return { orders: filtered };
  } catch (err: any) {
    console.error('fetchRiderOrderHistory exception:', err);
    return { orders: [], error: 'Unable to load orders. Please try again.' };
  }
}


