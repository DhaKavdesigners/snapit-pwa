-- ==============================================================================
-- Add Bank Passbook Document URL Column to rider_profiles (Optional, Safe to Re-run)
-- ==============================================================================

ALTER TABLE public.rider_profiles
  ADD COLUMN IF NOT EXISTS bank_passbook_doc_url TEXT DEFAULT NULL;

ALTER TABLE public.rider_profiles
  ADD COLUMN IF NOT EXISTS passbook_doc_url TEXT DEFAULT NULL;
