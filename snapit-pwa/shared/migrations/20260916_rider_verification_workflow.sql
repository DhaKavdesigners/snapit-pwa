-- =============================================================================
-- MINNIT RIDER APP — REGISTRATION & ADMIN APPROVAL WORKFLOW MIGRATION
-- File: 20260916_rider_verification_workflow.sql
-- Purpose: Add server-authoritative verification_status to rider_profiles,
--          enforce login protection in session activation, and add admin functions.
-- Safe to re-run: Uses IF NOT EXISTS / OR REPLACE.
-- =============================================================================

-- 1. Extend rider_profiles with verification status columns
ALTER TABLE public.rider_profiles
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS verified_by TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL;

-- 2. Add constraint for allowed status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_rider_verification_status'
  ) THEN
    ALTER TABLE public.rider_profiles
      ADD CONSTRAINT check_rider_verification_status
      CHECK (verification_status IN ('PENDING', 'APPROVED', 'REJECTED'));
  END IF;
END $$;

-- 3. Backfill existing riders: preserve ALL existing active riders
-- Anyone who was previously is_verified = true or has completed deliveries/created earlier is grandfathered as APPROVED
UPDATE public.rider_profiles
SET verification_status = 'APPROVED',
    verified_at = COALESCE(created_at, NOW()),
    verified_by = 'System Migration'
WHERE (is_verified = true OR total_deliveries > 0)
  AND (verification_status IS NULL OR verification_status = 'PENDING');

-- 4. Ensure newly registered riders default to PENDING and unverified
ALTER TABLE public.rider_profiles
  ALTER COLUMN verification_status SET DEFAULT 'PENDING',
  ALTER COLUMN is_verified SET DEFAULT false,
  ALTER COLUMN verification_step SET DEFAULT 3;

-- 5. Helpful index for querying pending riders in Admin Panel
CREATE INDEX IF NOT EXISTS idx_rider_profiles_verification_status
  ON public.rider_profiles (verification_status);

-- 6. Ensure rider_profiles is published to Supabase Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'rider_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_profiles;
  END IF;
END $$;

-- 7. Stored Procedure: Admin Approve Rider (Atomic & Secure)
CREATE OR REPLACE FUNCTION public.admin_approve_rider(
  p_rider_id TEXT,
  p_admin_identifier TEXT DEFAULT 'Master Admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rider RECORD;
BEGIN
  -- Validate rider exists
  SELECT * INTO v_rider
  FROM public.rider_profiles
  WHERE id = p_rider_id OR phone = p_rider_id OR "Rider_ID" = p_rider_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Rider profile not found'
    );
  END IF;

  -- Update to APPROVED
  UPDATE public.rider_profiles
  SET verification_status = 'APPROVED',
      is_verified = true,
      verification_step = 4,
      verified_at = NOW(),
      verified_by = p_admin_identifier,
      rejection_reason = NULL,
      updated_at = NOW()
  WHERE id = v_rider.id;

  RETURN jsonb_build_object(
    'success', true,
    'rider_id', v_rider.id,
    'rider_code', v_rider."Rider_ID",
    'verification_status', 'APPROVED',
    'verified_at', NOW(),
    'verified_by', p_admin_identifier
  );
END;
$$;

-- 8. Stored Procedure: Admin Reject Rider
CREATE OR REPLACE FUNCTION public.admin_reject_rider(
  p_rider_id TEXT,
  p_reason TEXT DEFAULT 'Documents could not be verified',
  p_admin_identifier TEXT DEFAULT 'Master Admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rider RECORD;
BEGIN
  SELECT * INTO v_rider
  FROM public.rider_profiles
  WHERE id = p_rider_id OR phone = p_rider_id OR "Rider_ID" = p_rider_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Rider profile not found'
    );
  END IF;

  UPDATE public.rider_profiles
  SET verification_status = 'REJECTED',
      is_verified = false,
      rejection_reason = p_reason,
      verified_at = NOW(),
      verified_by = p_admin_identifier,
      updated_at = NOW()
  WHERE id = v_rider.id;

  RETURN jsonb_build_object(
    'success', true,
    'rider_id', v_rider.id,
    'rider_code', v_rider."Rider_ID",
    'verification_status', 'REJECTED',
    'rejection_reason', p_reason
  );
END;
$$;

-- 9. Server-Side Security in activate_rider_session
-- Prevents unapproved riders from activating a device session even if they bypass the client
CREATE OR REPLACE FUNCTION public.activate_rider_session(
  p_rider_id TEXT,
  p_session_token TEXT,
  p_rider_code TEXT DEFAULT NULL,
  p_device_info TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_session RECORD;
  v_verification_status TEXT;
  v_is_verified BOOLEAN;
BEGIN
  -- Verify rider approval status
  SELECT verification_status, is_verified
  INTO v_verification_status, v_is_verified
  FROM public.rider_profiles
  WHERE id = p_rider_id;

  -- Block unapproved riders (allow backward compatibility if status is unset but is_verified is true)
  IF v_verification_status = 'PENDING' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Your rider account is pending admin verification. Please wait for approval.'
    );
  END IF;

  IF v_verification_status = 'REJECTED' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Your rider account registration was not approved. Please contact support.'
    );
  END IF;

  IF v_verification_status IS NULL AND (v_is_verified IS FALSE) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Your rider account is not verified.'
    );
  END IF;

  -- Atomically invalidate any existing active session for this rider
  UPDATE public.rider_device_sessions
  SET is_active = false,
      invalidated_at = NOW()
  WHERE rider_id = p_rider_id
    AND is_active = true;

  -- Insert the newly activated session
  INSERT INTO public.rider_device_sessions (
    id,
    rider_id,
    rider_code,
    session_token,
    device_info,
    is_active,
    created_at,
    last_active_at
  ) VALUES (
    gen_random_uuid()::text,
    p_rider_id,
    p_rider_code,
    p_session_token,
    p_device_info,
    true,
    NOW(),
    NOW()
  )
  RETURNING * INTO v_new_session;

  -- Update rider_profiles mirror columns if they exist
  BEGIN
    UPDATE public.rider_profiles
    SET active_session_token = p_session_token,
        active_session_updated_at = NOW()
    WHERE id = p_rider_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_new_session.id,
    'rider_id', v_new_session.rider_id,
    'session_token', v_new_session.session_token,
    'is_active', v_new_session.is_active,
    'created_at', v_new_session.created_at
  );
END;
$$;
