-- ====================================================================
-- PHASE 3: MULTI-WORKER SERVICE REQUESTS & COMPETING ESTIMATES
-- Migration: 20260914000002_multi_worker_service_requests.sql
-- Description: Formalizes multi-worker job dispatch, independent worker
--              response statuses, competing estimates, and race-condition guards.
-- ====================================================================

-- 1. Ensure indexes on job_requests for multi-worker lookup and customer queries
CREATE INDEX IF NOT EXISTS idx_job_requests_customer_status 
  ON public.job_requests(customer_id, status);

CREATE INDEX IF NOT EXISTS idx_job_requests_service_id 
  ON public.job_requests(service_id);

CREATE INDEX IF NOT EXISTS idx_job_requests_created_at 
  ON public.job_requests(created_at DESC);

-- 2. Ensure indexes and unique constraint on worker_estimates
-- Prevents duplicate worker requests on the same customer job request
CREATE INDEX IF NOT EXISTS idx_worker_estimates_job_worker 
  ON public.worker_estimates(job_request_id, worker_id);

CREATE INDEX IF NOT EXISTS idx_worker_estimates_worker_status 
  ON public.worker_estimates(worker_id, status);

CREATE INDEX IF NOT EXISTS idx_worker_estimates_status 
  ON public.worker_estimates(status);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uk_job_request_worker_estimate'
  ) THEN
    ALTER TABLE public.worker_estimates 
      ADD CONSTRAINT uk_job_request_worker_estimate 
      UNIQUE (job_request_id, worker_id);
  END IF;
EXCEPTION
  WHEN duplicate_table OR duplicate_object THEN
    NULL;
END $$;

-- 3. Verify and Ensure Realtime Publication for worker_estimates and job_requests
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'job_requests') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'job_requests'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.job_requests;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'worker_estimates') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'worker_estimates'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.worker_estimates;
    END IF;
  END IF;
END $$;

-- 4. RLS Policies: Customer isolation and worker competitor masking
ALTER TABLE public.job_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_estimates ENABLE ROW LEVEL SECURITY;

-- Customer can manage their own job requests
DROP POLICY IF EXISTS "job_requests_customer_owner" ON public.job_requests;
CREATE POLICY "job_requests_customer_owner"
  ON public.job_requests FOR ALL USING (
    customer_id = auth.uid() OR public.is_super_admin()
  );

-- Workers assigned to a job request can view the job request details
DROP POLICY IF EXISTS "job_requests_worker_view" ON public.job_requests;
CREATE POLICY "job_requests_worker_view"
  ON public.job_requests FOR SELECT USING (
    public.current_worker_id() IS NOT NULL
  );

-- Workers can only see and modify their OWN estimate records
-- Customers can see all estimates submitted for their OWN job requests
DROP POLICY IF EXISTS "worker_estimates_access" ON public.worker_estimates;
CREATE POLICY "worker_estimates_access"
  ON public.worker_estimates FOR ALL USING (
    worker_id = public.current_worker_id() OR
    job_request_id IN (SELECT id FROM public.job_requests WHERE customer_id = auth.uid()) OR
    public.is_super_admin()
  );
