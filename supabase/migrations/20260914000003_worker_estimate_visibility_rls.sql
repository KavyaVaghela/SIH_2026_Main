-- ====================================================================
-- PHASE 3 BUG FIX: WORKER ESTIMATE CUSTOMER VISIBILITY & RLS POLICIES
-- Migration: 20260914000003_worker_estimate_visibility_rls.sql
-- Description: 
-- 1. Enables workers invited to a job request to update status to 
--    'RESPONSES_PENDING' or 'ESTIMATES_AVAILABLE'.
-- 2. Enables customers to view workers and profiles of workers associated
--    with their job requests (even if verification_status is pending).
-- 3. Ensures worker_estimates and job_requests have full replica identity.
-- ====================================================================

-- 1. Worker status update on job_requests
DROP POLICY IF EXISTS "job_requests_worker_status_update" ON public.job_requests;
CREATE POLICY "job_requests_worker_status_update"
  ON public.job_requests FOR UPDATE USING (
    id IN (
      SELECT job_request_id FROM public.worker_estimates
      WHERE worker_id = public.current_worker_id()
    ) OR public.is_super_admin()
  )
  WITH CHECK (
    status IN ('WORKERS_REQUESTED', 'RESPONSES_PENDING', 'ESTIMATES_AVAILABLE')
  );

-- 2. Customer view of workers on their job requests
DROP POLICY IF EXISTS "workers_customer_job_request_view" ON public.workers;
CREATE POLICY "workers_customer_job_request_view"
  ON public.workers FOR SELECT USING (
    id IN (
      SELECT worker_id FROM public.worker_estimates
      WHERE job_request_id IN (
        SELECT id FROM public.job_requests WHERE customer_id = auth.uid()
      )
    ) OR
    (verification_status = 'verified' AND account_status = 'ACTIVE') OR
    profile_id = auth.uid() OR
    federation_id = public.current_federation_id() OR
    public.is_super_admin()
  );

-- 3. Customer view of profiles for workers on their job requests
DROP POLICY IF EXISTS "profiles_customer_job_request_view" ON public.profiles;
CREATE POLICY "profiles_customer_job_request_view"
  ON public.profiles FOR SELECT USING (
    id IN (
      SELECT profile_id FROM public.workers
      WHERE id IN (
        SELECT worker_id FROM public.worker_estimates
        WHERE job_request_id IN (
          SELECT id FROM public.job_requests WHERE customer_id = auth.uid()
        )
      )
    )
  );

-- 4. Ensure REPLICA IDENTITY FULL for real-time Postgres CDC notifications
ALTER TABLE public.worker_estimates REPLICA IDENTITY FULL;
ALTER TABLE public.job_requests REPLICA IDENTITY FULL;
