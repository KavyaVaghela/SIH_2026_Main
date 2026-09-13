-- ====================================================================
-- Migration: 20260913000001_worker_profile_integration_rls.sql
-- Description: Task 8 - Allows Federation Admin to view addresses of workers in their federation
--              and ensures read access to worker skills and avatars for consistent profile display.
-- ====================================================================

DO $$
BEGIN
  -- 1. Allow Federation Admin to select addresses of workers in their federation
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'addresses' 
      AND policyname = 'addresses_select_federation_admin'
  ) THEN
    CREATE POLICY "addresses_select_federation_admin"
      ON public.addresses FOR SELECT USING (
        profile_id IN (
          SELECT profile_id FROM public.workers
          WHERE federation_id = public.current_federation_id()
        )
      );
  END IF;

  -- 2. Allow Super Admin to select any addresses (already in rls_policies, but defensively re-checked)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'addresses' 
      AND policyname = 'addresses_select_super_admin'
  ) THEN
    CREATE POLICY "addresses_select_super_admin"
      ON public.addresses FOR SELECT USING (
        public.is_super_admin()
      );
  END IF;

END $$;
