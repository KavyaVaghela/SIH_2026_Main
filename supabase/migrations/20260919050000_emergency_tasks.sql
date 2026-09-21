-- ====================================================================
-- EMERGENCY SERVICES: EMERGENCY TASKS & FIELD COORDINATION
-- Migration: 20260919050000_emergency_tasks.sql
-- Description: Persistent Incident Tasks, Team Lead Coordination, and Additional Worker Requests
-- ====================================================================

-- 1. Create emergency_incident_tasks table
CREATE TABLE IF NOT EXISTS public.emergency_incident_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.emergency_incidents(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.emergency_response_teams(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  task_order INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
  ),
  assigned_worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL,
  assigned_role VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  CONSTRAINT uk_emergency_tasks_incident_order UNIQUE (incident_id, task_order)
);

-- 2. Create emergency_additional_worker_requests table
CREATE TABLE IF NOT EXISTS public.emergency_additional_worker_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.emergency_incidents(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.emergency_response_teams(id) ON DELETE CASCADE,
  requested_by_worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  requested_role VARCHAR(100) NOT NULL,
  requested_skill VARCHAR(100),
  requested_worker_count INTEGER NOT NULL DEFAULT 1 CHECK (requested_worker_count >= 1),
  status VARCHAR(40) NOT NULL DEFAULT 'PENDING_FEDERATION_REVIEW' CHECK (
    status IN ('PENDING_FEDERATION_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED')
  ),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Indexes for fast retrieval and query filtering
CREATE INDEX IF NOT EXISTS idx_emergency_tasks_incident_id 
  ON public.emergency_incident_tasks(incident_id);

CREATE INDEX IF NOT EXISTS idx_emergency_tasks_team_id 
  ON public.emergency_incident_tasks(team_id);

CREATE INDEX IF NOT EXISTS idx_emergency_tasks_assigned_worker_id 
  ON public.emergency_incident_tasks(assigned_worker_id);

CREATE INDEX IF NOT EXISTS idx_emergency_tasks_status 
  ON public.emergency_incident_tasks(status);

CREATE INDEX IF NOT EXISTS idx_emergency_tasks_task_order 
  ON public.emergency_incident_tasks(incident_id, task_order);

CREATE INDEX IF NOT EXISTS idx_emergency_add_workers_incident_id 
  ON public.emergency_additional_worker_requests(incident_id);

CREATE INDEX IF NOT EXISTS idx_emergency_add_workers_team_id 
  ON public.emergency_additional_worker_requests(team_id);

CREATE INDEX IF NOT EXISTS idx_emergency_add_workers_status 
  ON public.emergency_additional_worker_requests(status);

-- 4. Enable Row Level Security
ALTER TABLE public.emergency_incident_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_additional_worker_requests ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: emergency_incident_tasks
DO $$
BEGIN
  -- SELECT: Team members, Team Lead, Incident Customer (read-only progress), Federation Admin, Super Admin
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_incident_tasks' AND policyname = 'emergency_tasks_select_policy'
  ) THEN
    CREATE POLICY "emergency_tasks_select_policy"
      ON public.emergency_incident_tasks FOR SELECT
      USING (
        public.is_super_admin() OR
        auth.role() = 'service_role' OR
        incident_id IN (SELECT id FROM public.emergency_incidents WHERE customer_id = auth.uid()) OR
        team_id IN (
          SELECT team_id FROM public.emergency_response_team_members
          WHERE worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid())
        ) OR
        team_id IN (
          SELECT id FROM public.emergency_response_teams
          WHERE federation_id = public.current_federation_id()
        )
      );
  END IF;

  -- INSERT: System service_role or Team Lead only
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_incident_tasks' AND policyname = 'emergency_tasks_insert_policy'
  ) THEN
    CREATE POLICY "emergency_tasks_insert_policy"
      ON public.emergency_incident_tasks FOR INSERT
      WITH CHECK (
        public.is_super_admin() OR
        auth.role() = 'service_role' OR
        team_id IN (
          SELECT id FROM public.emergency_response_teams
          WHERE team_lead_worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid())
        )
      );
  END IF;

  -- UPDATE: Assigned worker can update status (start/complete), Team Lead can assign/reassign
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_incident_tasks' AND policyname = 'emergency_tasks_update_policy'
  ) THEN
    CREATE POLICY "emergency_tasks_update_policy"
      ON public.emergency_incident_tasks FOR UPDATE
      USING (
        public.is_super_admin() OR
        auth.role() = 'service_role' OR
        assigned_worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid()) OR
        team_id IN (
          SELECT id FROM public.emergency_response_teams
          WHERE team_lead_worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid())
        )
      );
  END IF;
END $$;

-- 6. RLS Policies: emergency_additional_worker_requests
DO $$
BEGIN
  -- SELECT: Team members, Federation Admin, Super Admin
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_additional_worker_requests' AND policyname = 'emergency_add_workers_select_policy'
  ) THEN
    CREATE POLICY "emergency_add_workers_select_policy"
      ON public.emergency_additional_worker_requests FOR SELECT
      USING (
        public.is_super_admin() OR
        auth.role() = 'service_role' OR
        team_id IN (
          SELECT team_id FROM public.emergency_response_team_members
          WHERE worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid())
        ) OR
        team_id IN (
          SELECT id FROM public.emergency_response_teams
          WHERE federation_id = public.current_federation_id()
        )
      );
  END IF;

  -- INSERT: Team Lead only
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_additional_worker_requests' AND policyname = 'emergency_add_workers_insert_policy'
  ) THEN
    CREATE POLICY "emergency_add_workers_insert_policy"
      ON public.emergency_additional_worker_requests FOR INSERT
      WITH CHECK (
        public.is_super_admin() OR
        auth.role() = 'service_role' OR
        (
          requested_by_worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid()) AND
          team_id IN (
            SELECT id FROM public.emergency_response_teams
            WHERE team_lead_worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid())
          )
        )
      );
  END IF;
END $$;

-- 7. Realtime Publications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'emergency_incident_tasks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE emergency_incident_tasks;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'emergency_additional_worker_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE emergency_additional_worker_requests;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
  WHEN OTHERS THEN
    RAISE NOTICE 'Realtime publication setup notice: %', SQLERRM;
END $$;
