-- ==============================================================================
-- MIGRATION: 20261003_rider_passbook_column.sql
-- Description: Add bank_passbook_doc_url and passbook_doc_url to rider_profiles.
--              Backfill rider_1 (phone: 8217649688) with the uploaded passbook image.
-- ==============================================================================

-- 1. Add passbook document columns to rider_profiles if not already existing
ALTER TABLE public.rider_profiles
  ADD COLUMN IF NOT EXISTS bank_passbook_doc_url TEXT,
  ADD COLUMN IF NOT EXISTS passbook_doc_url TEXT;

-- 2. Backfill existing uploaded passbook for rider_1 (8217649688)
UPDATE public.rider_profiles
SET
  bank_passbook_doc_url = 'https://satzvkmpatnbxpeiecvg.supabase.co/storage/v1/object/public/rider-documents/kyc/8217649688/bank_1791044679163_passbook.webp',
  passbook_doc_url = 'https://satzvkmpatnbxpeiecvg.supabase.co/storage/v1/object/public/rider-documents/kyc/8217649688/bank_1791044679163_passbook.webp'
WHERE phone = '8217649688'
  AND (bank_passbook_doc_url IS NULL OR bank_passbook_doc_url = '');
