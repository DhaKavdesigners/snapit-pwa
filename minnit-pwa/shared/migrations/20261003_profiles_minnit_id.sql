-- ==============================================================================
-- MINNIT QUICK-COMMERCE — DATABASE MIGRATION: CUSTOMER MINNIT ID (MU-XXXXXX)
-- File: shared/migrations/20261003_profiles_minnit_id.sql
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/satzvkmpatnbxpeiecvg/sql
-- ==============================================================================

-- 1. NON-BREAKING COLUMN ADDITION: Add minnit_id TEXT UNIQUE without dropping id
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS minnit_id TEXT UNIQUE;

-- 2. CREATE POSTGRES SEQUENCE for sequential customer ID allocation
CREATE SEQUENCE IF NOT EXISTS public.profiles_minnit_id_seq
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;

-- 3. BIJECTIVE SCRAMBLER FUNCTION (Coprime modular mapping)
-- Mathematical parity with minnit-pwa/common_logic/idGenerator.ts -> generateUserId()
-- Multiplier: 682,801 | Offset: 271,828 | Space: 900,000 | Range: 100,001–999,999
CREATE OR REPLACE FUNCTION public.generate_minnit_user_id(seq BIGINT)
RETURNS TEXT AS $$
DECLARE
  v_multiplier BIGINT := 682801;
  v_offset     BIGINT := 271828;
  v_space      BIGINT := 900000;
  v_start      BIGINT := 100001;
  v_code       BIGINT;
BEGIN
  v_code := v_start + ((seq * v_multiplier + v_offset) % v_space);
  RETURN 'MU-' || v_code::TEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. BEFORE INSERT TRIGGER FUNCTION
-- Automatically assigns a scrambled MU-XXXXXX ID if minnit_id is omitted or null
CREATE OR REPLACE FUNCTION public.trg_set_profile_minnit_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.minnit_id IS NULL OR NEW.minnit_id = '' THEN
    NEW.minnit_id := public.generate_minnit_user_id(nextval('public.profiles_minnit_id_seq'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profile_minnit_id_trigger ON public.profiles;
CREATE TRIGGER set_profile_minnit_id_trigger
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.trg_set_profile_minnit_id();

-- 5. SET COLUMN DEFAULT AS A SECONDARY SAFETY MECHANISM
ALTER TABLE public.profiles
ALTER COLUMN minnit_id SET DEFAULT public.generate_minnit_user_id(nextval('public.profiles_minnit_id_seq'));

-- 6. BACKFILL EXISTING CUSTOMER ROWS DETERMINISTICALLY
-- Preserves creation order (Vishva D -> MU-154630, Suresh Chokili -> MU-837431)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT id 
    FROM public.profiles 
    WHERE minnit_id IS NULL 
    ORDER BY created_at ASC
  ) LOOP
    UPDATE public.profiles
    SET minnit_id = public.generate_minnit_user_id(nextval('public.profiles_minnit_id_seq'))
    WHERE id = r.id;
  END LOOP;
END $$;

-- 7. ENSURE PROFILES TABLE REMAINS IN REALTIME PUBLICATION
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;

-- Verification Query: Check generated Minnit IDs
SELECT id, name, phone, minnit_id, created_at
FROM public.profiles
ORDER BY created_at ASC;
