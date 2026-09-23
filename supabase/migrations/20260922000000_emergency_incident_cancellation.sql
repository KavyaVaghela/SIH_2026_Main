-- ====================================================================
-- EMERGENCY SERVICES: INCIDENT CANCELLATION STATUS CONSTRAINT UPDATE
-- Migration: 20260922000000_emergency_incident_cancellation.sql
-- Description: Idempotently update emergency_incidents_status_check constraint
--              to include CANCELLED status while preserving all existing statuses.
-- ====================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.emergency_incidents'::regclass
          AND conname = 'emergency_incidents_status_check'
    ) THEN
        ALTER TABLE public.emergency_incidents
        DROP CONSTRAINT emergency_incidents_status_check;
    END IF;

    ALTER TABLE public.emergency_incidents
    ADD CONSTRAINT emergency_incidents_status_check
    CHECK (
        status IN (
            'AWAITING_RESPONSE',
            'DISPATCHING',
            'TEAM_FORMING',
            'ACTIVE',
            'STAFFING_SHORTAGE',
            'RESOLVED',
            'CLOSED',
            'CANCELLED'
        )
    );
END $$;
