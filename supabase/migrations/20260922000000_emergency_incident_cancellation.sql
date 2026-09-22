-- Migration: Add CANCELLED to emergency_incidents status check constraint idempotently
DO $$ 
BEGIN
  ALTER TABLE public.emergency_incidents 
    DROP CONSTRAINT IF EXISTS emergency_incidents_status_check;
  
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
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Notice updating emergency_incidents_status_check: %', SQLERRM;
END $$;
