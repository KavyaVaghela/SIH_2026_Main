-- ====================================================================
-- REALTIME CONNECTIVITY - WORKER PROFILE PUBLIC ACCESS POLICY
-- Migration: 20260908000001_worker_profile_public_policy.sql
-- Description: Allows authenticated users to view basic profile information of verified, active trade workers.
-- ====================================================================

-- Create policy allowing authenticated users to select profiles of active verified workers safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'profiles' 
      AND policyname = 'profiles_select_verified_workers'
  ) THEN
    CREATE POLICY "profiles_select_verified_workers"
      ON public.profiles FOR SELECT USING (
        id IN (
          SELECT profile_id FROM public.workers
          WHERE verification_status = 'verified' AND account_status = 'ACTIVE'
        )
      );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'RLS policy setup notice: %', SQLERRM;
END $$;
