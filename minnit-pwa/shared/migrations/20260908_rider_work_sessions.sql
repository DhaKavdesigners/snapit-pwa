-- =============================================================================
-- MINNIT RIDER 2.0 — WORK SESSION MIGRATION
-- File: 20260908_rider_work_sessions.sql
-- Purpose: Replace slot-booking with flexible shift session system
-- Safe to re-run: All statements use IF NOT EXISTS / DROP IF EXISTS
-- =============================================================================

-- =============================================================================
-- PART 1: Extend rider_profiles with live session state columns
-- These 5 columns let Admin see who is online, for how long, and in what zone
-- without needing a separate rider_presence table join.
-- =============================================================================

ALTER TABLE public.rider_profiles
  ADD COLUMN IF NOT EXISTS session_started_at    TIMESTAMPTZ         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS session_ends_at       TIMESTAMPTZ         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS session_duration_mins INTEGER             DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS available_for_order   BOOLEAN             DEFAULT false,
  ADD COLUMN IF NOT EXISTS current_session_id    TEXT                DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS riding_preferences    TEXT[]              DEFAULT '{}';

-- Add current_lat / current_lng if somehow missing (should already exist)
ALTER TABLE public.rider_profiles
  ADD COLUMN IF NOT EXISTS current_lat DOUBLE PRECISION DEFAULT 12.9602,
  ADD COLUMN IF NOT EXISTS current_lng DOUBLE PRECISION DEFAULT 78.2711;

COMMENT ON COLUMN public.rider_profiles.riding_preferences   IS 'Rider preferred riding windows: morning, afternoon, evening, night. For priority dispatch.';


COMMENT ON COLUMN public.rider_profiles.session_started_at    IS 'Timestamp when the current work session started';
COMMENT ON COLUMN public.rider_profiles.session_ends_at       IS 'Planned end time the rider committed to when starting the session';
COMMENT ON COLUMN public.rider_profiles.session_duration_mins IS 'Planned session length: 120, 240, or 360 minutes';
COMMENT ON COLUMN public.rider_profiles.available_for_order   IS 'true=ONLINE+AVAILABLE, false=ONLINE+BUSY or OFFLINE. Dispatch uses this.';
COMMENT ON COLUMN public.rider_profiles.current_session_id    IS 'FK reference to rider_shift_sessions.id for the active session';

-- =============================================================================
-- PART 2: rider_shift_sessions — session history / reliability log
-- One row per work session. Records planned vs actual duration.
-- Used by Admin for rider reliability score (completed / early exits).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.rider_shift_sessions (
  -- Identity
  id                    TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::text,
  rider_id              TEXT          NOT NULL REFERENCES public.rider_profiles(id) ON DELETE CASCADE,

  -- Zone context
  zone_id               TEXT          NOT NULL,
  zone_name             TEXT          NOT NULL,

  -- Session timing
  started_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  committed_until       TIMESTAMPTZ   NOT NULL,          -- Planned end (started_at + planned_duration)
  ended_at              TIMESTAMPTZ   DEFAULT NULL,      -- Actual end (NULL = still active)

  -- Duration tracking
  planned_duration_mins INTEGER       NOT NULL,          -- 120 | 240 | 360
  actual_duration_mins  INTEGER       DEFAULT NULL,      -- Computed on session end

  -- Status
  -- ACTIVE      : session is ongoing
  -- COMPLETED   : session ran to planned end
  -- ENDED_EARLY : rider ended before committed_until
  -- CANCELLED   : system-cancelled (e.g. admin action)
  status                TEXT          NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'COMPLETED', 'ENDED_EARLY', 'CANCELLED')),
  ended_early           BOOLEAN       NOT NULL DEFAULT false,

  -- Performance within session
  orders_completed      INTEGER       NOT NULL DEFAULT 0,

  -- Metadata
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Index for fast rider history queries
CREATE INDEX IF NOT EXISTS idx_rider_shift_sessions_rider_id
  ON public.rider_shift_sessions (rider_id, started_at DESC);

-- Index for active session lookup
CREATE INDEX IF NOT EXISTS idx_rider_shift_sessions_active
  ON public.rider_shift_sessions (rider_id, status)
  WHERE status = 'ACTIVE';

COMMENT ON TABLE public.rider_shift_sessions IS
  'Work session log. Each row = one riding session. Used for rider reliability scoring and Admin zone supply visibility.';

-- =============================================================================
-- PART 3: Row Level Security
-- Same open policy as rider_profiles for Phase 1 (MPIN auth, no Supabase Auth yet)
-- =============================================================================

ALTER TABLE public.rider_shift_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe re-run)
DROP POLICY IF EXISTS "public_read_sessions"   ON public.rider_shift_sessions;
DROP POLICY IF EXISTS "public_insert_sessions" ON public.rider_shift_sessions;
DROP POLICY IF EXISTS "public_update_sessions" ON public.rider_shift_sessions;

CREATE POLICY "public_read_sessions"
  ON public.rider_shift_sessions FOR SELECT USING (true);

CREATE POLICY "public_insert_sessions"
  ON public.rider_shift_sessions FOR INSERT WITH CHECK (true);

CREATE POLICY "public_update_sessions"
  ON public.rider_shift_sessions FOR UPDATE USING (true);

-- =============================================================================
-- PART 4: Add rider_shift_sessions to Supabase Realtime publication
-- This lets Admin panel subscribe to live session changes via Supabase Realtime
-- =============================================================================

ALTER TABLE public.rider_shift_sessions REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'rider_shift_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_shift_sessions;
  END IF;
END
$$;

-- Also ensure rider_profiles is in realtime (should already be there)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'rider_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_profiles;
  END IF;
END
$$;

-- =============================================================================
-- PART 5: Helper view for Admin Panel — Live Rider Presence
-- Admin can query this view to get all online riders with session info in one go.
-- =============================================================================

CREATE OR REPLACE VIEW public.v_rider_live_presence AS
SELECT
  rp.id                      AS rider_id,
  rp.name                    AS rider_name,
  rp.phone                   AS rider_phone,
  rp.selected_zone_id        AS zone_id,
  rp.selected_zone_name      AS zone_name,
  rp.is_online,
  rp.available_for_order,
  rp.current_lat,
  rp.current_lng,
  rp.session_started_at,
  rp.session_ends_at,
  rp.session_duration_mins,
  rp.current_session_id,
  rp.updated_at              AS last_heartbeat,
  -- Computed: seconds remaining in session
  CASE
    WHEN rp.session_ends_at IS NOT NULL AND rp.is_online
    THEN EXTRACT(EPOCH FROM (rp.session_ends_at - NOW()))::INTEGER
    ELSE NULL
  END                        AS session_seconds_remaining,
  -- Computed: rider status for dispatch
  CASE
    WHEN NOT rp.is_online               THEN 'OFFLINE'
    WHEN rp.available_for_order = false THEN 'ONLINE_BUSY'
    ELSE                                     'ONLINE_AVAILABLE'
  END                        AS dispatch_status,
  -- Computed: ghost detection (no heartbeat in 5 min but marked online)
  CASE
    WHEN rp.is_online AND rp.updated_at < NOW() - INTERVAL '5 minutes'
    THEN true ELSE false
  END                        AS is_ghost_online
FROM public.rider_profiles rp;

COMMENT ON VIEW public.v_rider_live_presence IS
  'Admin-facing view: live rider presence, zone, session timing, and dispatch status in one query.';

-- =============================================================================
-- PART 6: Helper view for Admin — Rider Reliability Score
-- =============================================================================

CREATE OR REPLACE VIEW public.v_rider_reliability AS
SELECT
  rider_id,
  COUNT(*)                                              AS total_sessions,
  COUNT(*) FILTER (WHERE status = 'COMPLETED')          AS completed_sessions,
  COUNT(*) FILTER (WHERE ended_early = true)            AS early_exits,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'COMPLETED')::NUMERIC
    / NULLIF(COUNT(*), 0) * 100,
    1
  )                                                     AS completion_rate_pct,
  SUM(orders_completed)                                 AS total_orders_in_sessions,
  ROUND(AVG(planned_duration_mins), 0)                  AS avg_planned_duration_mins,
  ROUND(AVG(actual_duration_mins), 0)                   AS avg_actual_duration_mins,
  MAX(started_at)                                       AS last_session_at
FROM public.rider_shift_sessions
GROUP BY rider_id;

COMMENT ON VIEW public.v_rider_reliability IS
  'Per-rider reliability score: completion rate, early exits, total orders across sessions.';

-- =============================================================================
-- VERIFICATION QUERY (run to confirm everything is in place)
-- =============================================================================
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'rider_profiles'
--   AND column_name IN (
--     'session_started_at', 'session_ends_at',
--     'session_duration_mins', 'available_for_order', 'current_session_id'
--   );

-- SELECT tablename, policyname
-- FROM pg_policies
-- WHERE tablename = 'rider_shift_sessions';

-- SELECT * FROM public.v_rider_live_presence LIMIT 5;
