-- ====================================================================
-- EMERGENCY SERVICES: REALTIME WORKER ACCEPT/DECLINE & RESPONSE TEAM FORMATION
-- Migration: 20260919040000_emergency_response_teams.sql
-- Description: Team and team member schema, atomic worker acceptance RPC, and RLS
-- ====================================================================

-- 1. Update emergency_dispatch_pool status check constraint to include ACCEPTED and DECLINED
DO $$
BEGIN
  ALTER TABLE public.emergency_dispatch_pool 
    DROP CONSTRAINT IF EXISTS emergency_dispatch_pool_status_check;

  ALTER TABLE public.emergency_dispatch_pool
    ADD CONSTRAINT emergency_dispatch_pool_status_check
    CHECK (status IN ('CANDIDATE', 'DISPATCHED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN'));
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Constraint update notice: %', SQLERRM;
END $$;

-- 2. Create emergency_response_teams table
CREATE TABLE IF NOT EXISTS public.emergency_response_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.emergency_incidents(id) ON DELETE CASCADE,
  federation_id UUID NOT NULL REFERENCES public.federations(id) ON DELETE RESTRICT,
  status VARCHAR(30) NOT NULL DEFAULT 'FORMED' CHECK (
    status IN ('FORMING', 'FORMED', 'ACTIVE', 'STANDBY', 'DISBANDED')
  ),
  team_lead_worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL,
  requires_team_lead BOOLEAN NOT NULL DEFAULT false,
  required_worker_count INTEGER NOT NULL DEFAULT 1,
  accepted_worker_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uk_emergency_response_teams_incident UNIQUE (incident_id)
);

-- 3. Create emergency_response_team_members table
CREATE TABLE IF NOT EXISTS public.emergency_response_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.emergency_response_teams(id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES public.emergency_incidents(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  role VARCHAR(100) NOT NULL,
  is_team_lead BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED' CHECK (
    status IN ('ASSIGNED', 'ACTIVE', 'STANDBY', 'RELEASED')
  ),
  accepted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uk_team_members_team_worker UNIQUE (team_id, worker_id),
  CONSTRAINT uk_team_members_incident_worker UNIQUE (incident_id, worker_id)
);

-- 4. Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_emergency_teams_incident_id 
  ON public.emergency_response_teams(incident_id);

CREATE INDEX IF NOT EXISTS idx_emergency_teams_federation_id 
  ON public.emergency_response_teams(federation_id);

CREATE INDEX IF NOT EXISTS idx_emergency_teams_status 
  ON public.emergency_response_teams(status);

CREATE INDEX IF NOT EXISTS idx_emergency_team_members_team_id 
  ON public.emergency_response_team_members(team_id);

CREATE INDEX IF NOT EXISTS idx_emergency_team_members_worker_id 
  ON public.emergency_response_team_members(worker_id);

CREATE INDEX IF NOT EXISTS idx_emergency_team_members_incident_id 
  ON public.emergency_response_team_members(incident_id);

-- 5. Stored Procedure: Atomic Worker Response & Team Formation
CREATE OR REPLACE FUNCTION public.respond_to_emergency_dispatch(
  p_dispatch_id UUID,
  p_worker_id UUID,
  p_response VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dispatch RECORD;
  v_incident RECORD;
  v_matrix RECORD;
  v_accepted_count INTEGER;
  v_required_count INTEGER;
  v_team_id UUID;
  v_team_lead_id UUID;
  v_requires_team_lead BOOLEAN;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- 1. Validate response parameter
  IF p_response NOT IN ('ACCEPT', 'DECLINE') THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 400,
      'error', 'Invalid response action. Must be ACCEPT or DECLINE.'
    );
  END IF;

  -- 2. Check and lock dispatch row
  SELECT id, incident_id, worker_id, federation_id, required_role, status, matched_skills
  INTO v_dispatch
  FROM public.emergency_dispatch_pool
  WHERE id = p_dispatch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 404,
      'error', 'Emergency dispatch record not found.'
    );
  END IF;

  -- 3. Verify worker authorization
  IF v_dispatch.worker_id <> p_worker_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 403,
      'error', 'Unauthorized: Worker may only respond to opportunities dispatched to themselves.'
    );
  END IF;

  -- 4. Check if already responded
  IF v_dispatch.status = 'ACCEPTED' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 409,
      'error', 'You have already accepted this emergency opportunity.'
    );
  END IF;

  IF v_dispatch.status = 'DECLINED' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 409,
      'error', 'You have already declined this emergency opportunity.'
    );
  END IF;

  IF v_dispatch.status IN ('EXPIRED', 'WITHDRAWN') THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 410,
      'error', 'This emergency opportunity is no longer available (status: ' || v_dispatch.status || ').'
    );
  END IF;

  -- 5. Branch: Worker DECLINE
  IF p_response = 'DECLINE' THEN
    UPDATE public.emergency_dispatch_pool
    SET status = 'DECLINED',
        responded_at = v_now,
        updated_at = v_now
    WHERE id = v_dispatch.id;

    RETURN jsonb_build_object(
      'success', true,
      'code', 200,
      'status', 'DECLINED',
      'dispatch_id', v_dispatch.id,
      'incident_id', v_dispatch.incident_id,
      'responded_at', v_now
    );
  END IF;

  -- 6. Branch: Worker ACCEPT (requires atomic staffing check)
  -- Check and lock the incident row
  SELECT id, emergency_id, federation_id, emergency_type, status
  INTO v_incident
  FROM public.emergency_incidents
  WHERE id = v_dispatch.incident_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 404,
      'error', 'Emergency incident associated with dispatch not found.'
    );
  END IF;

  IF v_incident.status IN ('RESOLVED', 'CLOSED') THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 409,
      'error', 'Emergency incident has already been resolved or closed.'
    );
  END IF;

  -- Resolve Response Matrix for this incident
  SELECT recommended_worker_count, requires_team_lead, worker_roles
  INTO v_matrix
  FROM public.emergency_response_matrix
  WHERE emergency_type = v_incident.emergency_type;

  IF FOUND THEN
    v_required_count := COALESCE(v_matrix.recommended_worker_count, 1);
    v_requires_team_lead := COALESCE(v_matrix.requires_team_lead, false);
  ELSE
    v_required_count := 1;
    v_requires_team_lead := false;
  END IF;

  -- Count currently accepted workers for this incident
  SELECT count(*) INTO v_accepted_count
  FROM public.emergency_dispatch_pool
  WHERE incident_id = v_incident.id AND status = 'ACCEPTED';

  -- Check if slot capacity is already filled
  IF v_accepted_count >= v_required_count THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 409,
      'error', 'Staffing capacity for this emergency incident has already been fulfilled.',
      'required_count', v_required_count,
      'accepted_count', v_accepted_count
    );
  END IF;

  -- Mark current worker dispatch as ACCEPTED
  UPDATE public.emergency_dispatch_pool
  SET status = 'ACCEPTED',
      responded_at = v_now,
      updated_at = v_now
  WHERE id = v_dispatch.id;

  v_accepted_count := v_accepted_count + 1;

  -- 7. Team Formation Check
  IF v_accepted_count >= v_required_count THEN
    -- Required staffing is completely fulfilled! Create/Form the Emergency Response Team
    
    -- Deterministic Team Lead Identification
    -- Check if any accepted worker has required_role matching Team Lead
    SELECT worker_id INTO v_team_lead_id
    FROM public.emergency_dispatch_pool
    WHERE incident_id = v_incident.id 
      AND status = 'ACCEPTED'
      AND (required_role ILIKE '%team lead%' OR required_role ILIKE '%lead%')
    LIMIT 1;

    -- Upsert Team record
    INSERT INTO public.emergency_response_teams (
      incident_id,
      federation_id,
      status,
      team_lead_worker_id,
      requires_team_lead,
      required_worker_count,
      accepted_worker_count,
      created_at,
      updated_at
    ) VALUES (
      v_incident.id,
      COALESCE(v_incident.federation_id, v_dispatch.federation_id),
      'FORMED',
      v_team_lead_id,
      v_requires_team_lead,
      v_required_count,
      v_accepted_count,
      v_now,
      v_now
    )
    ON CONFLICT (incident_id) DO UPDATE
    SET status = 'FORMED',
        team_lead_worker_id = EXCLUDED.team_lead_worker_id,
        accepted_worker_count = EXCLUDED.accepted_worker_count,
        updated_at = v_now
    RETURNING id INTO v_team_id;

    -- Insert all accepted workers into emergency_response_team_members
    INSERT INTO public.emergency_response_team_members (
      team_id,
      incident_id,
      worker_id,
      role,
      is_team_lead,
      status,
      accepted_at,
      created_at,
      updated_at
    )
    SELECT
      v_team_id,
      v_incident.id,
      edp.worker_id,
      edp.required_role,
      (edp.worker_id = v_team_lead_id),
      'ASSIGNED',
      COALESCE(edp.responded_at, v_now),
      v_now,
      v_now
    FROM public.emergency_dispatch_pool edp
    WHERE edp.incident_id = v_incident.id AND edp.status = 'ACCEPTED'
    ON CONFLICT (incident_id, worker_id) DO NOTHING;

    -- Transition Incident status to ACTIVE
    UPDATE public.emergency_incidents
    SET status = 'ACTIVE',
        updated_at = v_now
    WHERE id = v_incident.id;

    RETURN jsonb_build_object(
      'success', true,
      'code', 200,
      'status', 'ACCEPTED',
      'dispatch_id', v_dispatch.id,
      'incident_id', v_incident.id,
      'team_formed', true,
      'team_id', v_team_id,
      'required_count', v_required_count,
      'accepted_count', v_accepted_count,
      'team_lead_worker_id', v_team_lead_id
    );
  ELSE
    -- Partial staffing: Team is NOT formed yet
    -- Update Incident status to TEAM_FORMING
    UPDATE public.emergency_incidents
    SET status = 'TEAM_FORMING',
        updated_at = v_now
    WHERE id = v_incident.id;

    RETURN jsonb_build_object(
      'success', true,
      'code', 200,
      'status', 'ACCEPTED',
      'dispatch_id', v_dispatch.id,
      'incident_id', v_incident.id,
      'team_formed', false,
      'required_count', v_required_count,
      'accepted_count', v_accepted_count
    );
  END IF;
END;
$$;

-- 6. Enable Row Level Security
ALTER TABLE public.emergency_response_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_response_team_members ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies: emergency_response_teams
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_response_teams' AND policyname = 'emergency_teams_select_policy'
  ) THEN
    CREATE POLICY "emergency_teams_select_policy"
      ON public.emergency_response_teams FOR SELECT
      USING (
        public.is_super_admin() OR
        auth.role() = 'service_role' OR
        (federation_id IS NOT NULL AND federation_id = public.current_federation_id()) OR
        incident_id IN (SELECT id FROM public.emergency_incidents WHERE customer_id = auth.uid()) OR
        id IN (
          SELECT team_id FROM public.emergency_response_team_members
          WHERE worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_response_teams' AND policyname = 'emergency_teams_insert_policy'
  ) THEN
    CREATE POLICY "emergency_teams_insert_policy"
      ON public.emergency_response_teams FOR INSERT
      WITH CHECK (
        public.is_super_admin() OR
        auth.role() = 'service_role'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_response_teams' AND policyname = 'emergency_teams_update_policy'
  ) THEN
    CREATE POLICY "emergency_teams_update_policy"
      ON public.emergency_response_teams FOR UPDATE
      USING (
        public.is_super_admin() OR
        auth.role() = 'service_role' OR
        (federation_id IS NOT NULL AND federation_id = public.current_federation_id())
      );
  END IF;
END $$;

-- 8. RLS Policies: emergency_response_team_members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_response_team_members' AND policyname = 'emergency_team_members_select_policy'
  ) THEN
    CREATE POLICY "emergency_team_members_select_policy"
      ON public.emergency_response_team_members FOR SELECT
      USING (
        public.is_super_admin() OR
        auth.role() = 'service_role' OR
        worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid()) OR
        incident_id IN (SELECT id FROM public.emergency_incidents WHERE customer_id = auth.uid()) OR
        team_id IN (
          SELECT id FROM public.emergency_response_teams
          WHERE federation_id = public.current_federation_id()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_response_team_members' AND policyname = 'emergency_team_members_insert_policy'
  ) THEN
    CREATE POLICY "emergency_team_members_insert_policy"
      ON public.emergency_response_team_members FOR INSERT
      WITH CHECK (
        public.is_super_admin() OR
        auth.role() = 'service_role'
      );
  END IF;
END $$;

-- 9. Realtime Publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'emergency_response_teams') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE emergency_response_teams;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'emergency_response_team_members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE emergency_response_team_members;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
  WHEN OTHERS THEN
    RAISE NOTICE 'Realtime publication setup notice: %', SQLERRM;
END $$;
