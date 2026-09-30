-- ==============================================================================
-- MINNIT RIDER APP — SINGLE ACTIVE DEVICE SESSION MANAGEMENT SETUP
-- File: schema_rider_device_sessions.sql
-- Purpose: Server-enforced single active session per rider with Realtime invalidation
-- ==============================================================================

-- 1. Create rider_device_sessions table
CREATE TABLE IF NOT EXISTS public.rider_device_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  rider_id TEXT NOT NULL REFERENCES public.rider_profiles(id) ON DELETE CASCADE,
  rider_code TEXT, -- Normalized Rider_ID (e.g. 'MM0001')
  session_token TEXT NOT NULL UNIQUE,
  device_info TEXT, -- Browser / platform descriptor (no IMEI or hardware PII)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invalidated_at TIMESTAMPTZ DEFAULT NULL
);

-- 2. Enforce exactly ONE active session per rider at database level
CREATE UNIQUE INDEX IF NOT EXISTS idx_rider_device_sessions_unique_active
  ON public.rider_device_sessions (rider_id)
  WHERE is_active = true;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_rider_device_sessions_token
  ON public.rider_device_sessions (session_token);

CREATE INDEX IF NOT EXISTS idx_rider_device_sessions_rider_id
  ON public.rider_device_sessions (rider_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.rider_device_sessions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Allow public read rider_device_sessions" ON public.rider_device_sessions;
CREATE POLICY "Allow public read rider_device_sessions"
  ON public.rider_device_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert rider_device_sessions" ON public.rider_device_sessions;
CREATE POLICY "Allow public insert rider_device_sessions"
  ON public.rider_device_sessions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update rider_device_sessions" ON public.rider_device_sessions;
CREATE POLICY "Allow public update rider_device_sessions"
  ON public.rider_device_sessions FOR UPDATE USING (true);

-- 5. Add rider_device_sessions to Realtime publication
ALTER TABLE public.rider_device_sessions REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'rider_device_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_device_sessions;
  END IF;
END $$;

-- 6. Atomic session activation function
-- Deactivates all existing sessions for this rider and activates the new one atomically
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
BEGIN
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

  -- Also update rider_profiles mirror columns if they exist
  BEGIN
    UPDATE public.rider_profiles
    SET active_session_token = p_session_token,
        active_session_updated_at = NOW()
    WHERE id = p_rider_id;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore if columns not yet added to rider_profiles
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

-- 7. Session validation & heartbeat function
CREATE OR REPLACE FUNCTION public.validate_rider_session(
  p_session_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session RECORD;
BEGIN
  SELECT * INTO v_session
  FROM public.rider_device_sessions
  WHERE session_token = p_session_token
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'is_valid', false,
      'error', 'Session not found'
    );
  END IF;

  IF NOT v_session.is_active THEN
    RETURN jsonb_build_object(
      'is_valid', false,
      'rider_id', v_session.rider_id,
      'invalidated_at', v_session.invalidated_at,
      'error', 'Session invalidated from another device'
    );
  END IF;

  -- Update heartbeat
  UPDATE public.rider_device_sessions
  SET last_active_at = NOW()
  WHERE id = v_session.id;

  RETURN jsonb_build_object(
    'is_valid', true,
    'rider_id', v_session.rider_id,
    'rider_code', v_session.rider_code,
    'created_at', v_session.created_at
  );
END;
$$;

-- 8. Explicit session termination function (Logout)
CREATE OR REPLACE FUNCTION public.terminate_rider_session(
  p_session_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.rider_device_sessions
  SET is_active = false,
      invalidated_at = NOW()
  WHERE session_token = p_session_token
    AND is_active = true;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 9. Add optional mirror columns to rider_profiles for multi-layer support
ALTER TABLE public.rider_profiles
  ADD COLUMN IF NOT EXISTS active_session_token TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS active_session_device_info TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS active_session_updated_at TIMESTAMPTZ DEFAULT NULL;
