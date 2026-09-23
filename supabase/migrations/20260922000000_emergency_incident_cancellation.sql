-- ====================================================================
-- EMERGENCY SERVICES: INCIDENT CANCELLATION STATUS CONSTRAINT UPDATE
-- Migration: 20260922000000_emergency_incident_cancellation.sql
-- Description: Idempotently update emergency_incidents_status_check constraint
--              to include CANCELLED status while preserving all existing statuses.
-- ====================================================================

DO $$ 
DECLARE
  con_record RECORD;
BEGIN
  -- 1. Find and drop any existing check constraints on public.emergency_incidents checking status
  FOR con_record IN (
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'emergency_incidents'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%status%'
  ) LOOP
    EXECUTE 'ALTER TABLE public.emergency_incidents DROP CONSTRAINT IF EXISTS ' || quote_ident(con_record.conname);
  END LOOP;

  -- 2. Explicitly drop emergency_incidents_status_check if it still exists
  ALTER TABLE public.emergency_incidents 
    DROP CONSTRAINT IF EXISTS emergency_incidents_status_check;

  -- 3. Add authoritative emergency_incidents_status_check constraint with CANCELLED
  ALTER TABLE public.emergency_incidents 
    ADD CONSTRAINT emergency_incidents_status_check 
    CHECK (status IN (
      'AWAITING_RESPONSE',
      'DISPATCHING',
      'TEAM_FORMING',
      'ACTIVE',
      'STAFFING_SHORTAGE',
      'RESOLVED',
      'CLOSED',
      'CANCELLED'
    ));
END $$;
