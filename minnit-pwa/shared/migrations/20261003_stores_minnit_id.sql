-- =============================================================================
-- MINNIT PWA — STORE & MERCHANT MINNIT ID MIGRATION
-- File: minnit-pwa/shared/migrations/20261003_stores_minnit_id.sql
-- Purpose:
--   1. Add minnit_id TEXT UNIQUE and hub TEXT DEFAULT 'KGF' to stores table.
--   2. Non-breaking: Preserves existing primary keys (e.g. 's1', 's4') and FK references.
--   3. Category stays as a separate column (category TEXT), NEVER in the ID.
--   4. Implement bijective scrambler generator (MM-[HUB]-XXXXXX) from common_logic/idGenerator.ts.
--   5. Backfill existing stores with deterministic Minnit IDs.
--   6. Auto-generate Minnit ID via trigger on future store inserts if omitted.
-- =============================================================================

-- 1. ADD COLUMNS (NON-BREAKING)
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS minnit_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS hub TEXT DEFAULT 'KGF';

-- 2. CREATE DEDICATED SEQUENCE FOR STORES
CREATE SEQUENCE IF NOT EXISTS public.stores_seq START WITH 1 INCREMENT BY 1;

-- 3. CENTRALIZED SCRAMBLER FUNCTION (Matches common_logic/idGenerator.ts)
-- Multiplier: 410051, Offset: 314159, Space: 900000, Start: 100001
CREATE OR REPLACE FUNCTION public.generate_minnit_merchant_id(
  p_seq BIGINT,
  p_hub TEXT DEFAULT 'KGF'
)
RETURNS TEXT AS $$
DECLARE
  v_code BIGINT;
  v_clean_hub TEXT;
BEGIN
  v_clean_hub := UPPER(TRIM(COALESCE(p_hub, 'KGF')));
  IF v_clean_hub = '' THEN
    v_clean_hub := 'KGF';
  END IF;

  -- Bijective scrambler formula: 100001 + ((seq * 410051 + 314159) % 900000)
  v_code := 100001 + ((p_seq * 410051 + 314159) % 900000);
  RETURN 'MM-' || v_clean_hub || '-' || v_code::TEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. TRIGGER FUNCTION FOR FUTURE INSERTS
CREATE OR REPLACE FUNCTION public.trg_assign_store_minnit_id()
RETURNS TRIGGER AS $$
DECLARE
  v_next_seq BIGINT;
BEGIN
  -- Normalize hub
  IF NEW.hub IS NULL OR TRIM(NEW.hub) = '' THEN
    NEW.hub := 'KGF';
  ELSE
    NEW.hub := UPPER(TRIM(NEW.hub));
  END IF;

  -- Auto-generate minnit_id if not explicitly provided
  IF NEW.minnit_id IS NULL OR TRIM(NEW.minnit_id) = '' THEN
    v_next_seq := nextval('public.stores_seq');
    NEW.minnit_id := public.generate_minnit_merchant_id(v_next_seq, NEW.hub);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to stores table
DROP TRIGGER IF EXISTS set_store_minnit_id ON public.stores;
CREATE TRIGGER set_store_minnit_id
  BEFORE INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_assign_store_minnit_id();

-- 5. BACKFILL EXISTING STORES
DO $$
DECLARE
  r RECORD;
  v_seq BIGINT;
BEGIN
  -- Backfill deterministically ordered by created_at / id
  FOR r IN (
    SELECT id, hub
    FROM public.stores
    WHERE minnit_id IS NULL OR TRIM(minnit_id) = ''
    ORDER BY created_at ASC, id ASC
  ) LOOP
    v_seq := nextval('public.stores_seq');
    UPDATE public.stores
    SET
      hub = COALESCE(NULLIF(TRIM(hub), ''), 'KGF'),
      minnit_id = public.generate_minnit_merchant_id(v_seq, COALESCE(NULLIF(TRIM(hub), ''), 'KGF'))
    WHERE id = r.id;
  END LOOP;
END $$;

-- 6. INDEX FOR FAST LOOKUPS
CREATE INDEX IF NOT EXISTS idx_stores_minnit_id ON public.stores (minnit_id);
CREATE INDEX IF NOT EXISTS idx_stores_hub ON public.stores (hub);

-- 7. RE-VERIFY REALTIME REPLICA IDENTITY
ALTER TABLE public.stores REPLICA IDENTITY FULL;
