-- ====================================================================
-- SERVICE TO SKILL RELATIONSHIP ENHANCEMENT
-- Migration: 20260914000001_service_skills_relationship.sql
-- Description: Adds service_id to skills table to formalize Category -> Sub-Service -> Skill hierarchy
-- ====================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'skills') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'skills' 
        AND column_name = 'service_id'
    ) THEN
      ALTER TABLE public.skills ADD COLUMN service_id UUID REFERENCES public.services(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_skills_service_id ON public.skills(service_id);
      CREATE INDEX IF NOT EXISTS idx_skills_category_service ON public.skills(category_id, service_id);
    END IF;
  END IF;
END $$;
