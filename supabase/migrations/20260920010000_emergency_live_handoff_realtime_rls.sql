-- ====================================================================
-- COOPERATIVE GIG SERVICES PLATFORM - EMERGENCY SYSTEM
-- Migration: 20260920010000_emergency_live_handoff_realtime_rls.sql
-- Description: Enhances public.current_federation_id() for Federation Admins,
--              updates emergency_incidents SELECT RLS policy to support JWT metadata,
--              and ensures emergency_incidents is registered in supabase_realtime.
-- ====================================================================

-- 1. Enhance current_federation_id() to support Federation Admins via JWT metadata and auth.users
CREATE OR REPLACE FUNCTION public.current_federation_id()
RETURNS UUID AS $$
  SELECT fid FROM (
    -- Priority 1: Worker's federation
    SELECT federation_id AS fid, 1 AS priority 
    FROM public.workers 
    WHERE profile_id = auth.uid() AND federation_id IS NOT NULL

    UNION ALL

    -- Priority 2: JWT user_metadata federation_id
    SELECT (auth.jwt() -> 'user_metadata' ->> 'federation_id')::UUID AS fid, 2 AS priority
    WHERE (auth.jwt() -> 'user_metadata' ->> 'federation_id') IS NOT NULL 
      AND (auth.jwt() -> 'user_metadata' ->> 'federation_id') != ''

    UNION ALL

    -- Priority 3: auth.users raw_user_meta_data federation_id
    SELECT (raw_user_meta_data ->> 'federation_id')::UUID AS fid, 3 AS priority 
    FROM auth.users 
    WHERE id = auth.uid() 
      AND (raw_user_meta_data ->> 'federation_id') IS NOT NULL
      AND (raw_user_meta_data ->> 'federation_id') != ''

    UNION ALL

    -- Priority 4: Federation contact_email matches profile email
    SELECT f.id AS fid, 4 AS priority 
    FROM public.federations f
    JOIN public.profiles p ON f.contact_email = p.email
    WHERE p.id = auth.uid() AND f.id IS NOT NULL

    UNION ALL

    -- Priority 5: Fallback default federation for unassigned FEDERATION_ADMIN
    SELECT f.id AS fid, 5 AS priority 
    FROM public.federations f
    WHERE EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'FEDERATION_ADMIN'
    )
    AND (f.code = 'FED-GJ-AHM-01' OR f.code = 'FED-AMD-01')
    LIMIT 1
  ) sub
  WHERE fid IS NOT NULL
  ORDER BY priority ASC
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Update emergency_incidents SELECT policy to ensure Federation Admin can read and receive Realtime events
DROP POLICY IF EXISTS "emergency_incidents_select_policy" ON public.emergency_incidents;

CREATE POLICY "emergency_incidents_select_policy"
  ON public.emergency_incidents FOR SELECT
  USING (
    public.is_super_admin() OR
    auth.role() = 'service_role' OR
    customer_id = auth.uid() OR
    (federation_id IS NOT NULL AND (
      federation_id = public.current_federation_id() OR
      federation_id = ((auth.jwt() -> 'user_metadata' ->> 'federation_id')::uuid)
    ))
  );

-- 3. Ensure emergency_incidents is registered in supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'emergency_incidents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_incidents;
  END IF;
END $$;
