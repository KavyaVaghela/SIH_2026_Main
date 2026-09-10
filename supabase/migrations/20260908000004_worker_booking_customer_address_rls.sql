-- ====================================================================
-- Migration: 20260908000004_worker_booking_customer_address_rls.sql
-- Description: Allows workers to view the profile and address of customers who have assigned bookings to them.
-- ====================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'profiles' 
      AND policyname = 'profiles_select_customer_for_assigned_worker'
  ) THEN
    CREATE POLICY "profiles_select_customer_for_assigned_worker"
      ON public.profiles FOR SELECT USING (
        id IN (
          SELECT customer_id FROM public.bookings
          WHERE worker_id = public.current_worker_id()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'addresses' 
      AND policyname = 'addresses_select_for_assigned_worker'
  ) THEN
    CREATE POLICY "addresses_select_for_assigned_worker"
      ON public.addresses FOR SELECT USING (
        id IN (
          SELECT address_id FROM public.bookings
          WHERE worker_id = public.current_worker_id()
        )
      );
  END IF;
END $$;
