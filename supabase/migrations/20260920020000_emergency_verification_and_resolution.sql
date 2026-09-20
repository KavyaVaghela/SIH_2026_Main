-- ============================================================================
-- Migration: 20260920020000_emergency_verification_and_resolution.sql
-- Description: Task 8 Emergency Verification, Field Check-In, Team Field States & Resolution Workflow
-- ============================================================================

-- 1. Create emergency_verifications table (One Emergency -> One Verification -> Multiple Workers)
CREATE TABLE IF NOT EXISTS public.emergency_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.emergency_incidents(id) ON DELETE CASCADE,
  verification_token VARCHAR(64) NOT NULL UNIQUE,
  verification_code VARCHAR(8) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'EXPIRED', 'REVOKED')),
  verified_at TIMESTAMPTZ,
  verified_by_worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.emergency_response_teams(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uk_emergency_verification_incident UNIQUE (incident_id)
);

CREATE INDEX IF NOT EXISTS idx_emergency_verifications_incident 
  ON public.emergency_verifications(incident_id);
CREATE INDEX IF NOT EXISTS idx_emergency_verifications_token 
  ON public.emergency_verifications(verification_token);
CREATE INDEX IF NOT EXISTS idx_emergency_verifications_code 
  ON public.emergency_verifications(verification_code);

-- 2. Create emergency_check_ins table
CREATE TABLE IF NOT EXISTS public.emergency_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.emergency_incidents(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.emergency_response_teams(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  check_in_time TIMESTAMPTZ DEFAULT now() NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'CHECKED_IN' CHECK (status IN ('CHECKED_IN', 'LATE', 'EXCUSED')),
  verification_method VARCHAR(50) NOT NULL DEFAULT 'QR_EMERGENCY_VERIFICATION',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uk_emergency_check_ins_team_worker UNIQUE (team_id, worker_id)
);

CREATE INDEX IF NOT EXISTS idx_emergency_check_ins_incident 
  ON public.emergency_check_ins(incident_id);
CREATE INDEX IF NOT EXISTS idx_emergency_check_ins_team 
  ON public.emergency_check_ins(team_id);
CREATE INDEX IF NOT EXISTS idx_emergency_check_ins_worker 
  ON public.emergency_check_ins(worker_id);

-- 3. Add columns to emergency_incidents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN verified_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'verified_by_worker_id'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN verified_by_worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'verification_code'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN verification_code VARCHAR(8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'verification_token'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN verification_token VARCHAR(64);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'resolution_requested_at'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN resolution_requested_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'resolution_requested_by_worker_id'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN resolution_requested_by_worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'resolution_summary'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN resolution_summary TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'completed_work'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN completed_work TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'remaining_concerns'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN remaining_concerns TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'resolution_evidence_photos'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN resolution_evidence_photos TEXT[] DEFAULT '{}'::text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'resolved_at'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN resolved_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'closed_at'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN closed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'closed_by_admin_id'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN closed_by_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_incidents' AND column_name = 'closure_notes'
  ) THEN
    ALTER TABLE public.emergency_incidents ADD COLUMN closure_notes TEXT;
  END IF;
END $$;

-- 4. Add field_status to emergency_response_teams
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'emergency_response_teams' AND column_name = 'field_status'
  ) THEN
    ALTER TABLE public.emergency_response_teams 
      ADD COLUMN field_status VARCHAR(50) NOT NULL DEFAULT 'DISPATCHED';
    
    ALTER TABLE public.emergency_response_teams
      ADD CONSTRAINT emergency_response_teams_field_status_check
      CHECK (field_status IN ('DISPATCHED', 'ARRIVING', 'ON_SITE', 'WORK_IN_PROGRESS', 'AWAITING_SUPPORT', 'READY_FOR_RESOLUTION', 'RESOLVED'));
  END IF;
END $$;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.emergency_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_check_ins ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for emergency_verifications
DO $$
BEGIN
  -- SELECT Policy:
  -- Service role, Super Admin, Customer who owns the incident, Team Members assigned to incident, or Federation Admin
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_verifications' AND policyname = 'emergency_verifications_select_policy'
  ) THEN
    CREATE POLICY "emergency_verifications_select_policy"
      ON public.emergency_verifications FOR SELECT
      USING (
        auth.role() = 'service_role' OR
        public.is_super_admin() OR
        incident_id IN (SELECT id FROM public.emergency_incidents WHERE customer_id = auth.uid()) OR
        incident_id IN (
          SELECT incident_id FROM public.emergency_response_team_members
          WHERE worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid())
        ) OR
        incident_id IN (
          SELECT id FROM public.emergency_incidents 
          WHERE (federation_id IS NOT NULL AND (
            federation_id = public.current_federation_id() OR
            federation_id = ((auth.jwt() -> 'user_metadata' ->> 'federation_id')::uuid)
          ))
        )
      );
  END IF;

  -- ALL for Service Role
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_verifications' AND policyname = 'service_role_emergency_verifications'
  ) THEN
    CREATE POLICY "service_role_emergency_verifications"
      ON public.emergency_verifications FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 7. RLS Policies for emergency_check_ins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_check_ins' AND policyname = 'emergency_check_ins_select_policy'
  ) THEN
    CREATE POLICY "emergency_check_ins_select_policy"
      ON public.emergency_check_ins FOR SELECT
      USING (
        auth.role() = 'service_role' OR
        public.is_super_admin() OR
        worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid()) OR
        incident_id IN (SELECT id FROM public.emergency_incidents WHERE customer_id = auth.uid()) OR
        incident_id IN (
          SELECT id FROM public.emergency_incidents 
          WHERE (federation_id IS NOT NULL AND (
            federation_id = public.current_federation_id() OR
            federation_id = ((auth.jwt() -> 'user_metadata' ->> 'federation_id')::uuid)
          ))
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_check_ins' AND policyname = 'service_role_emergency_check_ins'
  ) THEN
    CREATE POLICY "service_role_emergency_check_ins"
      ON public.emergency_check_ins FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 8. Enable Realtime Publications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'emergency_verifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_verifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'emergency_check_ins'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_check_ins;
  END IF;
END $$;
