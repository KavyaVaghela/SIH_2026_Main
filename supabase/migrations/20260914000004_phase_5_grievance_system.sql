-- ====================================================================
-- PHASE 5: COMPLAINTS, GRIEVANCE & DISPUTE RESOLUTION SYSTEM
-- Migration: 20260914000004_phase_5_grievance_system.sql
-- Description: Indexes, RLS isolation policies, and realtime publication
--              for complaints & cooperative grievance conciliation cases.
-- ====================================================================

-- 1. Performance Indexes for Complaints & Disputes Lookup
CREATE INDEX IF NOT EXISTS idx_complaints_booking_id 
  ON public.complaints(booking_id);

CREATE INDEX IF NOT EXISTS idx_complaints_target_profile 
  ON public.complaints(target_profile_id);

CREATE INDEX IF NOT EXISTS idx_complaints_status_created 
  ON public.complaints(status, created_at DESC);

-- 2. Ensure Realtime Publication for Complaints
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'complaints') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'complaints'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;
    END IF;
  END IF;
END $$;

-- 3. Update Row Level Security (RLS) on Complaints
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Drop previous generic policy if exists
DROP POLICY IF EXISTS "complaints_access_policy" ON public.complaints;
DROP POLICY IF EXISTS "complaints_select_policy" ON public.complaints;
DROP POLICY IF EXISTS "complaints_insert_policy" ON public.complaints;
DROP POLICY IF EXISTS "complaints_update_policy" ON public.complaints;

-- SELECT: Complainant, Target party, Federation Admin (within federation), or Super Admin
CREATE POLICY "complaints_select_policy"
  ON public.complaints FOR SELECT USING (
    raised_by = auth.uid() OR
    target_profile_id = auth.uid() OR
    booking_id IN (SELECT id FROM public.bookings WHERE federation_id = public.current_federation_id()) OR
    public.is_super_admin()
  );

-- INSERT: Authenticated users can file their own complaints
CREATE POLICY "complaints_insert_policy"
  ON public.complaints FOR INSERT WITH CHECK (
    raised_by = auth.uid() OR
    public.is_super_admin()
  );

-- UPDATE: Federation Admin and Super Admin can manage complaints; Complainant/Target can respond when authorized
CREATE POLICY "complaints_update_policy"
  ON public.complaints FOR UPDATE USING (
    booking_id IN (SELECT id FROM public.bookings WHERE federation_id = public.current_federation_id()) OR
    public.is_super_admin() OR
    raised_by = auth.uid() OR
    target_profile_id = auth.uid()
  );
