-- ==============================================================================
-- MIGRATION: 20261012_rider_email_alt_phone.sql
-- Description: Ensure email and alt_phone columns exist in public.rider_profiles
-- ==============================================================================

ALTER TABLE public.rider_profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS alt_phone TEXT;

COMMENT ON COLUMN public.rider_profiles.email IS 'Mandatory contact email address for rider communications';
COMMENT ON COLUMN public.rider_profiles.alt_phone IS 'Optional alternative 10-digit phone number for secondary contact';
