-- ====================================================================
-- REALTIME CONNECTIVITY - WORKERS TABLE PUBLICATION
-- Migration: 20260914000000_enable_workers_realtime.sql
-- Description: Enables Supabase Realtime (Postgres Changes CDC) for public.workers.
-- ====================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'workers') THEN
    -- Check if table is not already in the publication
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'workers'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.workers;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'profiles'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
  WHEN OTHERS THEN
    RAISE NOTICE 'Realtime workers publication notice: %', SQLERRM;
END $$;
