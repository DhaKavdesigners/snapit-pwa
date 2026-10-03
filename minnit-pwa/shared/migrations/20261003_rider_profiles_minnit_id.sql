-- ==============================================================================
-- MIGRATION: 20261003_rider_profiles_minnit_id
-- Description: Add minnit_id (MR-XXXXXX) and home_hub columns to rider_profiles.
--              NON-BREAKING: existing id (UUID PK) and Rider_ID columns are kept.
--              Run this in Supabase SQL Editor → New Query → Run.
-- ==============================================================================

-- ─── STEP 1: Add new columns (safe, idempotent) ───────────────────────────────

ALTER TABLE public.rider_profiles
  ADD COLUMN IF NOT EXISTS minnit_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS home_hub  TEXT NOT NULL DEFAULT 'KGF';

-- ─── STEP 2: Create internal sequence for the scrambled numeric part ──────────
-- This sequence drives the bijective scrambler (same algorithm as idGenerator.ts).
-- It starts at 1 and only moves forward (NEVER recycle or reset).

CREATE SEQUENCE IF NOT EXISTS public.rider_minnit_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- ─── STEP 3: Create scrambler function ────────────────────────────────────────
-- Mirrors the TypeScript scramble() in common_logic/idGenerator.ts exactly.
--   RIDER.multiplier = 573_901
--   RIDER.offset     = 161_803
--   RIDER.space      = 900_000  (100001–999999 → always 6 digits)
--   RIDER.start      = 100_001
--
-- Formula: start + ((seq * multiplier + offset) % space)
--
-- Output is always in range [100001, 999999] → 6 digits, no leading zeros.

CREATE OR REPLACE FUNCTION public.scramble_rider_seq(seq BIGINT)
RETURNS BIGINT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 100001 + ((seq * 573901 + 161803) % 900000);
$$;

-- ─── STEP 4: Generate-and-assign function ────────────────────────────────────
-- Called by the application on admin approval.
-- Safe to call multiple times: skips rows that already have minnit_id.

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
  -- If already assigned, return existing
  SELECT minnit_id INTO v_id
  FROM public.rider_profiles
  WHERE id = p_rider_row_id;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  -- Loop until we find a code that is not already taken (collision guard)
  LOOP
    v_seq  := nextval('public.rider_minnit_seq');
    v_code := public.scramble_rider_seq(v_seq);
    v_id   := 'MR-' || v_code::TEXT;

    SELECT EXISTS (
      SELECT 1 FROM public.rider_profiles WHERE minnit_id = v_id
    ) INTO v_exists;

    EXIT WHEN NOT v_exists;
  END LOOP;

  -- Write to the row
  UPDATE public.rider_profiles
  SET minnit_id = v_id
  WHERE id = p_rider_row_id;

  RETURN v_id;
END;
$$;

-- ─── STEP 5: Backfill existing approved riders who have no minnit_id ─────────
-- Only riders with verification_status = 'APPROVED' (i.e., already active)
-- get a minnit_id. PENDING / REJECTED riders receive it upon approval instead.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id FROM public.rider_profiles
    WHERE minnit_id IS NULL
      AND verification_status = 'APPROVED'
    ORDER BY created_at ASC  -- oldest first for deterministic ordering
  LOOP
    PERFORM public.assign_rider_minnit_id(r.id);
  END LOOP;
END;
$$;

-- ─── STEP 6: Verify the result ────────────────────────────────────────────────
-- Run this SELECT after the migration to confirm everything looks correct.
-- Expected: all APPROVED riders have a minnit_id in MR-XXXXXX format.

SELECT
  id,
  name,
  phone,
  "Rider_ID"  AS old_rider_id,
  minnit_id,
  home_hub,
  verification_status
FROM public.rider_profiles
ORDER BY created_at;
