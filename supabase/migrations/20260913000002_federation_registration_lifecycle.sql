-- ====================================================================
-- Migration: 20260913000002_federation_registration_lifecycle.sql
-- Description: Task 9 — Adds lifecycle status, rejection reason, review metadata,
-- and RLS policies for federation registration review & approval.
-- ====================================================================

-- 1. Add status and review metadata columns to public.federations
ALTER TABLE public.federations
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id);

-- 2. Ensure valid lifecycle states
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'federations_status_check'
  ) THEN
    ALTER TABLE public.federations
      ADD CONSTRAINT federations_status_check
      CHECK (status IN ('PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED'));
  END IF;
END $$;

-- 3. Update RLS policy to permit pending/rejected federation admins to query their own record
DROP POLICY IF EXISTS "federations_public_view_active" ON public.federations;
CREATE POLICY "federations_public_view_active"
  ON public.federations FOR SELECT
  USING (
    is_active = TRUE
    OR public.is_super_admin()
    OR contact_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );
