-- ==============================================================================
-- SNAPIT COMPLETE RIDER TABLE & STORAGE SETUP (RUN IN SUPABASE SQL EDITOR)
-- ==============================================================================

-- 1. Drop old table if starting from scratch (optional)
DROP TABLE IF EXISTS public.rider_profiles CASCADE;

-- 2. Create rider_profiles table with ALL registration data
CREATE TABLE public.rider_profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  mpin TEXT NOT NULL,
  dob TEXT,
  alt_phone TEXT,
  email TEXT,
  address TEXT,
  avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  selfie_url TEXT,
  
  -- Vehicle & Zone Information
  vehicle_type TEXT DEFAULT 'Motorcycle',
  vehicle_number TEXT,
  selected_zone_id TEXT DEFAULT 'zone-1',
  selected_zone_name TEXT DEFAULT 'Downtown Central',
  
  -- KYC Documents & Numbers
  aadhaar_number TEXT,
  aadhaar_doc_url TEXT,
  pan_number TEXT,
  pan_doc_url TEXT,
  dl_number TEXT,
  dl_doc_url TEXT,
  upi_id TEXT,

  -- Operational & Status (Auto-approved)
  is_verified BOOLEAN DEFAULT true,
  verification_step INT DEFAULT 4,
  is_online BOOLEAN DEFAULT false,
  current_lat DOUBLE PRECISION DEFAULT 12.9716,
  current_lng DOUBLE PRECISION DEFAULT 77.6412,
  
  -- Performance & Financials
  wallet_balance INTEGER DEFAULT 0,
  rating NUMERIC(3, 2) DEFAULT 5.0,
  total_deliveries INTEGER DEFAULT 0,
  acceptance_rate INTEGER DEFAULT 100,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Safely add rider_profiles to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'rider_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_profiles;
  END IF;
END $$;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.rider_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for rider_profiles
DROP POLICY IF EXISTS "Allow public read rider_profiles" ON public.rider_profiles;
CREATE POLICY "Allow public read rider_profiles" 
  ON public.rider_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert rider_profiles" ON public.rider_profiles;
CREATE POLICY "Allow public insert rider_profiles" 
  ON public.rider_profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update rider_profiles" ON public.rider_profiles;
CREATE POLICY "Allow public update rider_profiles" 
  ON public.rider_profiles FOR UPDATE USING (true);

-- 6. Setup Supabase Storage Bucket for Selfies & KYC Documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('rider-documents', 'rider-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 7. Storage Policies for rider-documents bucket
DROP POLICY IF EXISTS "Allow public upload rider-documents" ON storage.objects;
CREATE POLICY "Allow public upload rider-documents"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'rider-documents');

DROP POLICY IF EXISTS "Allow public view rider-documents" ON storage.objects;
CREATE POLICY "Allow public view rider-documents"
  ON storage.objects FOR SELECT USING (bucket_id = 'rider-documents');

DROP POLICY IF EXISTS "Allow public update rider-documents" ON storage.objects;
CREATE POLICY "Allow public update rider-documents"
  ON storage.objects FOR UPDATE USING (bucket_id = 'rider-documents');

