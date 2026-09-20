-- ====================================================================
-- PHASE 3: LARGE PROJECT EXECUTION & CHECKPOINTS
-- Migration: 20260919000001_large_project_execution_checkpoints.sql
-- Description: Adds progress tracking, start/completion timestamps, and daily checkpoints table.
-- ====================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'project_requests' AND column_name = 'progress_percentage'
  ) THEN
    ALTER TABLE public.project_requests 
      ADD COLUMN progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'project_requests' AND column_name = 'started_at'
  ) THEN
    ALTER TABLE public.project_requests 
      ADD COLUMN started_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'project_requests' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.project_requests 
      ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Daily progress checkpoints table
CREATE TABLE IF NOT EXISTS public.project_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project_requests(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL,
  progress INTEGER NOT NULL CHECK (progress >= 0 AND progress <= 100),
  work_summary TEXT NOT NULL,
  checkpoint_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_checkpoints_project ON public.project_checkpoints(project_id);

-- RLS
ALTER TABLE public.project_checkpoints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_checkpoints_access" ON public.project_checkpoints;
CREATE POLICY "project_checkpoints_access"
  ON public.project_checkpoints FOR ALL USING (true);

-- Realtime
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'project_checkpoints') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.project_checkpoints;
    END IF;
  END IF;
END $$;
