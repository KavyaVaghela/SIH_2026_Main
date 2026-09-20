-- ====================================================================
-- EMERGENCY SERVICES: 3-LEVEL PRIORITY SELECTION
-- Migration: 20260919000000_emergency_priority.sql
-- Description: Adds priority column to bookings table for emergency dispatch
-- ====================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'emergency_priority') THEN
    CREATE TYPE emergency_priority AS ENUM ('LOW', 'MODERATE', 'HIGH');
  END IF;
END $$;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'LOW';

CREATE INDEX IF NOT EXISTS idx_bookings_priority
  ON public.bookings(priority);
