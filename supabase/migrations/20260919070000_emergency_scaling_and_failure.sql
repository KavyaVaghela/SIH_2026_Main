-- ============================================================================
-- Migration: 20260919070000_emergency_scaling_and_failure.sql
-- Description: Multi-Team Emergency Scaling, Failure Handling & Expanded Member States
-- ============================================================================

-- 1. Support Multiple Response Teams per Incident
DO $$
BEGIN
  -- Drop single team unique constraint on emergency_response_teams
  ALTER TABLE public.emergency_response_teams 
    DROP CONSTRAINT IF EXISTS uk_emergency_response_teams_incident;

  -- Add team_type to distinguish PRIMARY, SECONDARY, SPECIALIZED_UNIT, or SUPPORT teams
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'emergency_response_teams' 
    AND column_name = 'team_type'
  ) THEN
    ALTER TABLE public.emergency_response_teams
      ADD COLUMN team_type VARCHAR(50) NOT NULL DEFAULT 'PRIMARY';
  END IF;

  -- Add parent_team_id for sub-teams or support teams attached to a primary team
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'emergency_response_teams' 
    AND column_name = 'parent_team_id'
  ) THEN
    ALTER TABLE public.emergency_response_teams
      ADD COLUMN parent_team_id UUID REFERENCES public.emergency_response_teams(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Notice updating emergency_response_teams schema: %', SQLERRM;
END $$;

-- 2. Expand emergency_response_team_members status constraint
DO $$
BEGIN
  ALTER TABLE public.emergency_response_team_members
    DROP CONSTRAINT IF EXISTS emergency_response_team_members_status_check;

  ALTER TABLE public.emergency_response_team_members
    ADD CONSTRAINT emergency_response_team_members_status_check
    CHECK (status IN (
      'ASSIGNED',
      'CHECK-IN_PENDING',
      'ACTIVE',
      'STANDBY',
      'NO_SHOW',
      'REPLACEMENT_REQUIRED',
      'RELEASED'
    ));
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Notice updating emergency_response_team_members_status_check: %', SQLERRM;
END $$;

-- 3. Indexes for Multi-Team Performance
CREATE INDEX IF NOT EXISTS idx_emergency_teams_incident_type 
  ON public.emergency_response_teams(incident_id, team_type);

CREATE INDEX IF NOT EXISTS idx_emergency_teams_parent_team_id 
  ON public.emergency_response_teams(parent_team_id);

CREATE INDEX IF NOT EXISTS idx_emergency_team_members_status 
  ON public.emergency_response_team_members(status);

-- 4. Enable Realtime Publications for new fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'emergency_response_teams'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_response_teams;
  END IF;
END $$;
