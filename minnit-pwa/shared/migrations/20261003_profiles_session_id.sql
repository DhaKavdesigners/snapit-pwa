-- ==============================================================================
-- MINNIT QUICK-COMMERCE — DATABASE MIGRATION: PROFILES SESSION TRACKING
-- File: shared/migrations/20261003_profiles_session_id.sql
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/satzvkmpatnbxpeiecvg/sql
-- ==============================================================================

-- 1. Add session_id column to profiles for explicit single-device session identity
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- 2. Verify profiles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;
