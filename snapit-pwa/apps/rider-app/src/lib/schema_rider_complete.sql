-- ==============================================================================
-- SNAPIT COMPLETE RIDER MASTER DATABASE MIGRATION SCRIPT
-- Idempotent script: Safe to run multiple times in Supabase SQL Editor
-- ==============================================================================

-- 1. ENHANCE PUBLIC.ORDERS TABLE WITH RIDER DISPATCH & HANDSHAKE FIELDS
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_pin TEXT DEFAULT '4821';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee INTEGER DEFAULT 45;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shopkeeper_handover_confirmed BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rider_pickup_confirmed BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rider_assignment TEXT DEFAULT 'UNASSIGNED'; -- UNASSIGNED, OFFERED, ACCEPTED, REJECTED, TIMEOUT, AUTO_ASSIGNED, ADMIN_ASSIGNED
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- 2. CREATE / ENSURE RIDER_PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.rider_profiles (
  id TEXT PRIMARY KEY, -- 10-digit Phone Number (e.g. '9876543210')
  user_id TEXT,
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
  selected_zone_name TEXT DEFAULT 'Robertsonpet',
  
  -- KYC Documents & Numbers
  aadhaar_number TEXT,
  aadhaar_doc_url TEXT,
  pan_number TEXT,
  pan_doc_url TEXT,
  dl_number TEXT,
  dl_doc_url TEXT,
  upi_id TEXT,

  -- Operational & Status
  is_verified BOOLEAN DEFAULT true,
  verification_step INT DEFAULT 4, -- 1: Submitted, 2: Under Review, 3: Admin Check, 4: Approved
  is_online BOOLEAN DEFAULT false,
  current_lat DOUBLE PRECISION DEFAULT 12.9716,
  current_lng DOUBLE PRECISION DEFAULT 77.5946,
  
  -- Performance & Financials
  wallet_balance INTEGER DEFAULT 0,
  rating NUMERIC(3, 2) DEFAULT 5.0,
  total_deliveries INTEGER DEFAULT 0,
  acceptance_rate INTEGER DEFAULT 100,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CREATE RIDER_SLOTS TABLE (Booked working slots)
CREATE TABLE IF NOT EXISTS public.rider_slots (
  id TEXT PRIMARY KEY, -- e.g. 'slot-9876543210-2026-08-31-10'
  rider_id TEXT NOT NULL REFERENCES public.rider_profiles(id) ON DELETE CASCADE,
  slot_date TEXT NOT NULL, -- YYYY-MM-DD
  start_time TEXT NOT NULL, -- HH:mm (e.g. '10:00')
  end_time TEXT NOT NULL, -- HH:mm (e.g. '12:00')
  start_timestamp BIGINT NOT NULL,
  end_timestamp BIGINT NOT NULL,
  zone_id TEXT NOT NULL DEFAULT 'zone-1',
  zone_name TEXT NOT NULL DEFAULT 'Robertsonpet',
  status TEXT NOT NULL DEFAULT 'BOOKED', -- BOOKED, ACTIVE, COMPLETED, CANCELLED, EXTENDED, PENDING_APPROVAL
  booked_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rider_slots_rider_date ON public.rider_slots(rider_id, slot_date);

-- 4. CREATE RIDER_WALLET_TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.rider_wallet_transactions (
  id TEXT PRIMARY KEY,
  rider_id TEXT NOT NULL REFERENCES public.rider_profiles(id) ON DELETE CASCADE,
  order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL, -- in rupees (or paise)
  type TEXT NOT NULL, -- 'TRIP_EARNING', 'TIP', 'SURGE', 'BONUS', 'PENALTY', 'CASHOUT'
  status TEXT NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'PENDING', 'TRANSFERRED'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rider_wallet_rider_id ON public.rider_wallet_transactions(rider_id);

-- 5. CREATE RIDER_SUPPORT_TICKETS TABLE
CREATE TABLE IF NOT EXISTS public.rider_support_tickets (
  id TEXT PRIMARY KEY,
  rider_id TEXT NOT NULL REFERENCES public.rider_profiles(id) ON DELETE CASCADE,
  order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
  category TEXT NOT NULL, -- 'Order issue', 'Payment issue', 'Shop issue', 'Customer issue', 'App issue', 'GPS/map issue', 'Account/KYC issue', 'Other'
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'IN_PROGRESS', 'RESOLVED'
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rider_support_rider_id ON public.rider_support_tickets(rider_id);

-- 6. CREATE RIDER_NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.rider_notifications (
  id TEXT PRIMARY KEY,
  rider_id TEXT NOT NULL REFERENCES public.rider_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  read BOOLEAN NOT NULL DEFAULT false,
  amount INTEGER,
  action_route TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rider_notifications_rider_id ON public.rider_notifications(rider_id);

-- 7. ENABLE ROW LEVEL SECURITY (RLS) ACROSS ALL TABLES
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_notifications ENABLE ROW LEVEL SECURITY;

-- 8. CREATE SAFE RLS POLICIES
DROP POLICY IF EXISTS "Allow public read orders" ON public.orders;
CREATE POLICY "Allow public read orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public update orders" ON public.orders;
CREATE POLICY "Allow public update orders" ON public.orders FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read rider_profiles" ON public.rider_profiles;
CREATE POLICY "Allow public read rider_profiles" ON public.rider_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert rider_profiles" ON public.rider_profiles;
CREATE POLICY "Allow public insert rider_profiles" ON public.rider_profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update rider_profiles" ON public.rider_profiles;
CREATE POLICY "Allow public update rider_profiles" ON public.rider_profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public all rider_slots" ON public.rider_slots;
CREATE POLICY "Allow public all rider_slots" ON public.rider_slots FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all rider_wallet_transactions" ON public.rider_wallet_transactions;
CREATE POLICY "Allow public all rider_wallet_transactions" ON public.rider_wallet_transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all rider_support_tickets" ON public.rider_support_tickets;
CREATE POLICY "Allow public all rider_support_tickets" ON public.rider_support_tickets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all rider_notifications" ON public.rider_notifications;
CREATE POLICY "Allow public all rider_notifications" ON public.rider_notifications FOR ALL USING (true) WITH CHECK (true);

-- 9. ADD TABLES TO SUPABASE REALTIME PUBLICATION
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_slots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_wallet_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_notifications;
