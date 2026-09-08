-- ====================================================================
-- Migration: 20260908000003_verified_worker_skills_availability_rls.sql
-- Description: Allows public / customer SELECT access to worker_skills and worker_availability for active verified workers.
-- ====================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'worker_skills' 
      AND policyname = 'worker_skills_select_verified'
  ) THEN
    CREATE POLICY "worker_skills_select_verified"
      ON public.worker_skills FOR SELECT USING (
        worker_id IN (
          SELECT id FROM public.workers
          WHERE verification_status = 'verified' AND account_status = 'ACTIVE'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'worker_availability' 
      AND policyname = 'worker_availability_select_verified'
  ) THEN
    CREATE POLICY "worker_availability_select_verified"
      ON public.worker_availability FOR SELECT USING (
        worker_id IN (
          SELECT id FROM public.workers
          WHERE verification_status = 'verified' AND account_status = 'ACTIVE'
        )
      );
  END IF;
END $$;
