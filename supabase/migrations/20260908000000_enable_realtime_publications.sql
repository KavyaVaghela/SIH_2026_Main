-- ====================================================================
-- REALTIME CONNECTIVITY - PUBLICATION CONFIGURATION
-- Migration: 20260908000000_enable_realtime_publications.sql
-- Description: Enables Supabase Realtime (Postgres Changes) for core business entities.
-- ====================================================================

-- Enable Supabase Realtime publication on target tables safely
DO $$
BEGIN
  -- 1. job_requests
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'job_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE job_requests;
  END IF;

  -- 2. bookings
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bookings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
  END IF;

  -- 3. booking_status_history
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'booking_status_history') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE booking_status_history;
  END IF;

  -- 4. worker_estimates
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'worker_estimates') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE worker_estimates;
  END IF;

  -- 5. invoices
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoices') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
  END IF;

  -- 6. payments
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE payments;
  END IF;

  -- 7. notifications
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;

  -- 8. reviews
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
  END IF;

  -- 9. project_requests
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'project_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE project_requests;
  END IF;

  -- 10. project_requirements
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'project_requirements') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE project_requirements;
  END IF;

  -- 11. project_allocations
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'project_allocations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE project_allocations;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Already member of publication
  WHEN OTHERS THEN
    RAISE NOTICE 'Realtime publication setup notice: %', SQLERRM;
END $$;
