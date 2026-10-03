-- ==============================================================================
-- MIGRATION: 20261003_rider_profiles_minnit_id
-- Description: Add minnit_id (MR-XXXXXX) and home_hub columns to rider_profiles.
--              Ensures verification columns exist safely (idempotent & non-breaking).
--              Run this in Supabase SQL Editor → New Query → Run.
-- ==============================================================================

-- ─── STEP 1: Add new & required columns (safe, idempotent, non-breaking) ───────
-- This ensures all verification columns and Minnit ID columns exist.

ALTER TABLE public.rider_profiles
  ADD COLUMN IF NOT EXISTS minnit_id           TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS home_hub            TEXT NOT NULL DEFAULT 'KGF',
  ADD COLUMN IF NOT EXISTS "Rider_ID"          TEXT,
  ADD COLUMN IF NOT EXISTS is_verified         BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS verification_step   INT DEFAULT 3,
  ADD COLUMN IF NOT EXISTS verified_at         TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS verified_by         TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason    TEXT DEFAULT NULL;

-- ─── STEP 2: Optional Status Check Constraint ─────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_rider_verification_status'
  ) THEN
    ALTER TABLE public.rider_profiles
      ADD CONSTRAINT check_rider_verification_status
      CHECK (verification_status IN ('PENDING', 'APPROVED', 'REJECTED'));
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Safe ignore if existing records have other values
  NULL;
END $$;

-- ─── STEP 3: Create sequence for the scrambled numeric part ───────────────────
-- This sequence drives the bijective scrambler (same algorithm as idGenerator.ts).
-- It starts at 1 and only increments forward (NEVER recycle or reset).

CREATE SEQUENCE IF NOT EXISTS public.rider_minnit_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- ─── STEP 4: Create bijective scrambler function ──────────────────────────────
-- Mirrors the TypeScript scramble() in common_logic/idGenerator.ts exactly:
--   RIDER.multiplier = 573_901
--   RIDER.offset     = 161_803
--   RIDER.space      = 900_000  (100001–999999 → always 6 digits)
--   RIDER.start      = 100_001
--
-- Formula: start + ((seq * multiplier + offset) % space)
-- Output: range [100001, 999999] → guaranteed 6 digits, no leading zeros.

CREATE OR REPLACE FUNCTION public.scramble_rider_seq(seq BIGINT)
RETURNS BIGINT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 100001 + ((seq * 573901 + 161803) % 900000);
$$;

-- ─── STEP 5: Generate-and-assign function ────────────────────────────────────
-- Assigns a unique MR-XXXXXX ID to a rider profile.
-- Safe to call repeatedly: returns existing minnit_id if already present.

CREATE OR REPLACE FUNCTION public.assign_rider_minnit_id(p_rider_row_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_seq    BIGINT;
  v_code   BIGINT;
  v_id     TEXT;
  v_exists BOOLEAN;
BEGIN
  -- If already assigned, return existing ID
  SELECT minnit_id INTO v_id
  FROM public.rider_profiles
  WHERE id = p_rider_row_id;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  -- Collision guard loop
  LOOP
    v_seq  := nextval('public.rider_minnit_seq');
    v_code := public.scramble_rider_seq(v_seq);
    v_id   := 'MR-' || v_code::TEXT;

    SELECT EXISTS (
      SELECT 1 FROM public.rider_profiles WHERE minnit_id = v_id
    ) INTO v_exists;

    EXIT WHEN NOT v_exists;
  END LOOP;

  -- Write minnit_id and default home_hub if not set
  UPDATE public.rider_profiles
  SET 
    minnit_id = v_id,
    home_hub  = COALESCE(home_hub, 'KGF')
  WHERE id = p_rider_row_id;

  RETURN v_id;
END;
$$;

-- ─── STEP 6: Atomic Admin Approval RPC ───────────────────────────────────────
-- Approves rider, marks verified, and automatically generates minnit_id.

CREATE OR REPLACE FUNCTION public.admin_approve_rider(
  p_rider_id TEXT,
  p_admin_identifier TEXT DEFAULT 'Master Admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_minnit_id TEXT;
  v_row_id    TEXT;
BEGIN
  -- Lookup rider by id, phone, or Rider_ID
  SELECT id INTO v_row_id
  FROM public.rider_profiles
  WHERE id = p_rider_id OR phone = p_rider_id OR "Rider_ID" = p_rider_id
  LIMIT 1;

  IF v_row_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Rider profile not found');
  END IF;

  -- 1. Ensure minnit_id is generated and assigned
  v_minnit_id := public.assign_rider_minnit_id(v_row_id);

  -- 2. Mark profile as approved
  UPDATE public.rider_profiles
  SET
    verification_status = 'APPROVED',
    is_verified = true,
    verification_step = 4,
    verified_at = now(),
    verified_by = p_admin_identifier,
    rejection_reason = NULL
  WHERE id = v_row_id;

  RETURN jsonb_build_object(
    'success', true,
    'rider_id', v_row_id,
    'minnit_id', v_minnit_id
  );
END;
$$;

-- ─── STEP 7: Backfill existing approved riders (Dynamic SQL) ─────────────────
-- Uses EXECUTE to safely evaluate columns added in STEP 1 without plan-cache errors.
-- Only riders who are already approved/verified receive a minnit_id.
-- Pending/unapproved riders stay NULL until verified.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    EXECUTE 'SELECT id FROM public.rider_profiles
             WHERE minnit_id IS NULL
               AND (COALESCE(verification_status, ''PENDING'') = ''APPROVED'' OR COALESCE(is_verified, false) = true)
             ORDER BY created_at ASC'
  LOOP
    PERFORM public.assign_rider_minnit_id(r.id);
  END LOOP;
END;
$$;

-- ─── STEP 8: Verify migration result ─────────────────────────────────────────

SELECT
  id,
  name,
  phone,
  "Rider_ID" AS old_rider_id,
  minnit_id,
  home_hub,
  is_verified,
  verification_status
FROM public.rider_profiles
ORDER BY created_at;
