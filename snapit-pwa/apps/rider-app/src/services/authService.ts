import { supabase, DbRiderProfile } from '@/lib/supabase';
import { RiderProfile } from '@/types';

const SESSION_KEY = 'snapit_rider_session_phone';

export interface AuthResult {
  success: boolean;
  rider?: RiderProfile;
  error?: string;
  isNewUser?: boolean;
}

/** Convert DbRiderProfile to App RiderProfile */
export function mapDbProfileToAppRider(db: DbRiderProfile): RiderProfile {
  return {
    name: db.name || 'Rider Partner',
    dob: db.dob || '1998-05-15',
    phone: db.phone || '',
    altPhone: db.alt_phone || '',
    email: db.email || '',
    address: db.address || 'Robertsonpet, KGF',
    avatarUrl: db.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    selfieCapturedUrl: db.selfie_url || '',
    aadhaarNumber: db.aadhaar_number || '',
    aadhaarDoc: db.aadhaar_doc_url || '',
    panNumber: db.pan_number || '',
    panDoc: db.pan_doc_url || '',
    dlNumber: db.dl_number || '',
    dlDoc: db.dl_doc_url || '',
    walletBalance: Number(db.wallet_balance) || 0,
    upiId: db.upi_id || (db.phone ? `${db.phone}@okaxis` : 'rider@okaxis'),
    rating: Number(db.rating) || 5.0,
    totalDeliveries: Number(db.total_deliveries) || 0,
    acceptanceRate: Number(db.acceptance_rate) || 100,
    vehicleType: db.vehicle_type || 'Motorcycle',
    vehicleNumber: db.vehicle_number || 'KA-08-EV-4091',
    selectedZone: db.selected_zone_name || 'Robertsonpet',
    selectedZoneId: db.selected_zone_id || 'zone-1',
    isVerified: Boolean(db.is_verified ?? true),
    verificationStep: Number(db.verification_step) || 4,
    mpin: db.mpin || '1234',
    isAuthenticated: true,
  };
}

/** Login rider with Phone & MPIN */
export async function loginWithPhoneAndMpin(phone: string, mpin: string): Promise<AuthResult> {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (!cleanPhone || cleanPhone.length < 10) {
    return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
  }

  try {
    const { data, error } = await supabase
      .from('rider_profiles')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (error) {
      console.warn('Database error during login:', error);
      return { success: false, error: 'Database connection failed. Please try again.' };
    }

    if (!data) {
      return { success: false, error: 'No registered rider profile found for this phone number. Please complete onboarding.' };
    }

    if (data.mpin && data.mpin !== mpin) {
      return { success: false, error: 'Incorrect 4-digit MPIN. Please try again.' };
    }

    // Save session in local storage for persistence across reloads
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, cleanPhone);
    }

    return { success: true, rider: mapDbProfileToAppRider(data) };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred during login.' };
  }
}

/** Login with MPIN only (checks saved phone number or active profile) */
export async function loginWithMpinOnly(mpin: string, savedPhone?: string): Promise<AuthResult> {
  let targetPhone = savedPhone;
  if (!targetPhone && typeof window !== 'undefined') {
    targetPhone = localStorage.getItem(SESSION_KEY) || undefined;
  }

  if (targetPhone) {
    return loginWithPhoneAndMpin(targetPhone, mpin);
  }

  // Fallback: match any rider by MPIN if single user device
  try {
    const { data, error } = await supabase
      .from('rider_profiles')
      .select('*')
      .eq('mpin', mpin)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return { success: false, error: 'Incorrect MPIN. Please enter your registered phone number.' };
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, data.phone);
    }

    return { success: true, rider: mapDbProfileToAppRider(data) };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to authenticate MPIN.' };
  }
}

/** Restore active session on page reload */
export async function restoreSession(): Promise<RiderProfile | null> {
  if (typeof window === 'undefined') return null;

  const savedPhone = localStorage.getItem(SESSION_KEY);
  if (!savedPhone) return null;

  try {
    const { data, error } = await supabase
      .from('rider_profiles')
      .select('*')
      .eq('phone', savedPhone)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapDbProfileToAppRider(data);
  } catch {
    return null;
  }
}

/** Logout rider */
export async function logoutRider(phone?: string): Promise<void> {
  if (phone) {
    try {
      await supabase
        .from('rider_profiles')
        .update({ is_online: false, updated_at: new Date().toISOString() })
        .eq('phone', phone);
    } catch (e) {
      console.warn('Error setting offline status on logout:', e);
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}
