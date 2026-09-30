-- ==============================================================================
-- MINNIT / SNAPIT — DATABASE MIGRATION: ENFORCE REGISTERED USERS & RIDERS ONLY
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/satzvkmpatnbxpeiecvg/sql
-- ==============================================================================

-- 1. Ensure existing historical guest orders don't fail FK validation
INSERT INTO public.profiles (id, name, phone)
VALUES ('guest_user', 'Legacy Guest Checkout', '+91 0000000000')
ON CONFLICT (id) DO NOTHING;

-- 2. Ensure historical test rider (9876543210) exists in rider_profiles so FK validation passes
INSERT INTO public.rider_profiles (id, name, phone, mpin, vehicle_type, is_verified, is_online)
VALUES ('9876543210', 'Suresh (Legacy Partner)', '9876543210', '1234', 'Motorcycle', true, false)
ON CONFLICT (id) DO NOTHING;

-- 3. Remove the guest_user default from orders.customer_id
-- Future orders must explicitly provide a registered customer's ID (phone number)
ALTER TABLE public.orders 
ALTER COLUMN customer_id DROP DEFAULT;

-- 4. Set customer_id as mandatory (NOT NULL)
ALTER TABLE public.orders 
ALTER COLUMN customer_id SET NOT NULL;

-- 5. Add Foreign Key: orders.customer_id -> profiles.id
-- Enforces that ONLY registered customers can place orders
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS fk_orders_customer;

ALTER TABLE public.orders
ADD CONSTRAINT fk_orders_customer
FOREIGN KEY (customer_id) 
REFERENCES public.profiles(id) 
ON DELETE RESTRICT;

-- 6. Add Foreign Key: orders.rider_id -> rider_profiles.id
-- Enforces that ONLY registered riders can accept and deliver orders
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS fk_orders_rider;

ALTER TABLE public.orders
ADD CONSTRAINT fk_orders_rider
FOREIGN KEY (rider_id) 
REFERENCES public.rider_profiles(id) 
ON DELETE SET NULL;

-- 7. Confirm Realtime publication includes profiles, rider_profiles, and orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'rider_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_profiles;
  END IF;
END $$;
