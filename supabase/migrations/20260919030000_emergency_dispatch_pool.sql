-- ====================================================================
-- EMERGENCY SERVICES: EMERGENCY DISPATCH POOL
-- Migration: 20260919030000_emergency_dispatch_pool.sql
-- Description: Deterministic Worker Eligibility & Dispatch Pool
-- ====================================================================

-- 1. Create emergency_dispatch_pool table
CREATE TABLE IF NOT EXISTS public.emergency_dispatch_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.emergency_incidents(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  federation_id UUID NOT NULL REFERENCES public.federations(id) ON DELETE RESTRICT,
  required_role VARCHAR(100) NOT NULL,
  matched_skills TEXT[] NOT NULL DEFAULT '{}'::text[],
  eligibility_score NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
  eligibility_reasons JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(30) NOT NULL DEFAULT 'DISPATCHED' CHECK (
    status IN ('CANDIDATE', 'DISPATCHED', 'EXPIRED', 'WITHDRAWN')
  ),
  offered_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  responded_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uk_dispatch_pool_incident_worker UNIQUE (incident_id, worker_id)
);

-- 2. Indexes for fast retrieval and filtering
CREATE INDEX IF NOT EXISTS idx_dispatch_pool_incident_id 
  ON public.emergency_dispatch_pool(incident_id);

CREATE INDEX IF NOT EXISTS idx_dispatch_pool_worker_id 
  ON public.emergency_dispatch_pool(worker_id);

CREATE INDEX IF NOT EXISTS idx_dispatch_pool_status 
  ON public.emergency_dispatch_pool(status);

CREATE INDEX IF NOT EXISTS idx_dispatch_pool_federation_id 
  ON public.emergency_dispatch_pool(federation_id);

CREATE INDEX IF NOT EXISTS idx_dispatch_pool_offered_at 
  ON public.emergency_dispatch_pool(offered_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE public.emergency_dispatch_pool ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DO $$
BEGIN
  -- SELECT Policy:
  -- - Super Admin or service_role can view all
  -- - Workers can only view opportunities dispatched to themselves
  -- - Federation Admin can view records within their federation
  -- - Customer who reported the incident can view dispatch status of their incident (read-only)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_dispatch_pool' AND policyname = 'emergency_dispatch_pool_select_policy'
  ) THEN
    CREATE POLICY "emergency_dispatch_pool_select_policy"
      ON public.emergency_dispatch_pool FOR SELECT
      USING (
        public.is_super_admin() OR
        auth.role() = 'service_role' OR
        worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid()) OR
        (federation_id IS NOT NULL AND federation_id = public.current_federation_id()) OR
        incident_id IN (SELECT id FROM public.emergency_incidents WHERE customer_id = auth.uid())
      );
  END IF;

  -- INSERT Policy: Super Admin, service_role, or system dispatch
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_dispatch_pool' AND policyname = 'emergency_dispatch_pool_insert_policy'
  ) THEN
    CREATE POLICY "emergency_dispatch_pool_insert_policy"
      ON public.emergency_dispatch_pool FOR INSERT
      WITH CHECK (
        public.is_super_admin() OR
        auth.role() = 'service_role'
      );
  END IF;

  -- UPDATE Policy: Super Admin, service_role, or Federation Admin. Customers strictly forbidden.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_dispatch_pool' AND policyname = 'emergency_dispatch_pool_update_policy'
  ) THEN
    CREATE POLICY "emergency_dispatch_pool_update_policy"
      ON public.emergency_dispatch_pool FOR UPDATE
      USING (
        public.is_super_admin() OR
        auth.role() = 'service_role' OR
        (federation_id IS NOT NULL AND federation_id = public.current_federation_id())
      );
  END IF;

  -- DELETE Policy: Super Admin and service_role only
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_dispatch_pool' AND policyname = 'emergency_dispatch_pool_delete_policy'
  ) THEN
    CREATE POLICY "emergency_dispatch_pool_delete_policy"
      ON public.emergency_dispatch_pool FOR DELETE
      USING (
        public.is_super_admin() OR
        auth.role() = 'service_role'
      );
  END IF;
END $$;

-- 5. Realtime Publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'emergency_dispatch_pool') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE emergency_dispatch_pool;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
  WHEN OTHERS THEN
    RAISE NOTICE 'Realtime publication setup notice: %', SQLERRM;
END $$;
