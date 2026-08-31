import { supabase, DbRiderProfile } from '@/lib/supabase';
import { RiderProfile } from '@/types';
import { mapDbProfileToAppRider } from './authService';

/** Register or update a complete rider profile in Supabase */
export async function registerOrUpdateRiderProfile(
  profileData: Partial<RiderProfile> & { phone: string; name: string }
): Promise<{ success: boolean; rider?: RiderProfile; error?: string }> {
  const cleanPhone = profileData.phone.replace(/[^0-9]/g, '');
  if (!cleanPhone || cleanPhone.length < 10) {
    return { success: false, error: 'Valid 10-digit phone number is required.' };
  }

  const payload: Partial<DbRiderProfile> = {
    id: cleanPhone,
    user_id: cleanPhone,
    name: profileData.name,
    phone: cleanPhone,
    mpin: profileData.mpin || '1234',
    dob: profileData.dob || '1998-05-15',
    alt_phone: profileData.altPhone,
    email: profileData.email,
    address: profileData.address || 'Robertsonpet, KGF',
    avatar_url: profileData.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    selfie_url: profileData.selfieCapturedUrl,
    vehicle_type: profileData.vehicleType || 'Motorcycle',
    vehicle_number: profileData.vehicleNumber || 'KA-08-EV-4091',
    selected_zone_id: profileData.selectedZoneId || 'zone-1',
    selected_zone_name: profileData.selectedZone || 'Robertsonpet',
    aadhaar_number: profileData.aadhaarNumber,
    aadhaar_doc_url: profileData.aadhaarDoc,
    pan_number: profileData.panNumber,
    pan_doc_url: profileData.panDoc,
    dl_number: profileData.dlNumber,
    dl_doc_url: profileData.dlDoc,
    upi_id: profileData.upiId || `${cleanPhone}@okaxis`,
    is_verified: profileData.isVerified ?? true,
    verification_step: profileData.verificationStep || 4,
    wallet_balance: profileData.walletBalance ?? 0,
    rating: profileData.rating ?? 5.0,
    total_deliveries: profileData.totalDeliveries ?? 0,
    acceptance_rate: profileData.acceptanceRate ?? 100,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('rider_profiles')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      console.warn('Error saving rider profile to Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true, rider: mapDbProfileToAppRider(data) };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save rider profile.' };
  }
}

/** Update online status in Supabase */
export async function updateRiderOnlineStatus(phone: string, isOnline: boolean): Promise<boolean> {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (!cleanPhone) return false;

  try {
    const { error } = await supabase
      .from('rider_profiles')
      .update({ is_online: isOnline, updated_at: new Date().toISOString() })
      .eq('phone', cleanPhone);

    if (error) {
      console.warn('Error updating online status:', error);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Update live rider GPS location in Supabase (throttled) */
export async function updateRiderGpsLocation(
  phone: string,
  latitude: number,
  longitude: number
): Promise<boolean> {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (!cleanPhone) return false;

  try {
    const { error } = await supabase
      .from('rider_profiles')
      .update({
        current_lat: latitude,
        current_lng: longitude,
        updated_at: new Date().toISOString(),
      })
      .eq('phone', cleanPhone);

    return !error;
  } catch {
    return false;
  }
}

/** Upload document or selfie image to Supabase Storage bucket 'rider-documents' */
export async function uploadRiderDocument(
  file: File | Blob,
  phone: string,
  docType: 'selfie' | 'aadhaar' | 'pan' | 'dl'
): Promise<{ url?: string; error?: string }> {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const timestamp = Date.now();
  const fileExt = (file as File).name ? (file as File).name.split('.').pop() : 'jpg';
  const filePath = `${cleanPhone}/${docType}_${timestamp}.${fileExt}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from('rider-documents')
      .upload(filePath, file, { upsert: true, contentType: file.type || 'image/jpeg' });

    if (uploadError) {
      console.warn('Storage upload error:', uploadError);
      return { error: uploadError.message };
    }

    const { data } = supabase.storage.from('rider-documents').getPublicUrl(filePath);
    return { url: data.publicUrl };
  } catch (err: any) {
    return { error: err.message || 'File upload failed.' };
  }
}
