-- ============================================================================
-- Migration: 20260919060000_emergency_control_center.sql
-- Description: Federation Emergency Control Center Tables, Audit Logs, Support Requests & RLS
-- ============================================================================

-- 1. Emergency Audit Logs Table
CREATE TABLE IF NOT EXISTS public.emergency_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.emergency_incidents(id) ON DELETE CASCADE,
    federation_id UUID NOT NULL REFERENCES public.federations(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    previous_state JSONB DEFAULT '{}'::jsonb,
    new_state JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance & chronological queries
CREATE INDEX IF NOT EXISTS idx_emergency_audit_logs_incident_id 
    ON public.emergency_audit_logs (incident_id);

CREATE INDEX IF NOT EXISTS idx_emergency_audit_logs_federation_id 
    ON public.emergency_audit_logs (federation_id);

CREATE INDEX IF NOT EXISTS idx_emergency_audit_logs_created_at 
    ON public.emergency_audit_logs (created_at DESC);

-- 2. Emergency Support Requests Table (Additional Team / External Federation Support Foundation)
CREATE TABLE IF NOT EXISTS public.emergency_support_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.emergency_incidents(id) ON DELETE CASCADE,
    requesting_federation_id UUID NOT NULL REFERENCES public.federations(id) ON DELETE CASCADE,
    requested_by_admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK (request_type IN ('ADDITIONAL_TEAM', 'EXTERNAL_FEDERATION_SUPPORT', 'SPECIALIZED_UNIT')),
    target_federation_id UUID REFERENCES public.federations(id) ON DELETE SET NULL,
    requested_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
    requested_worker_count INTEGER NOT NULL DEFAULT 1 CHECK (requested_worker_count >= 1),
    reason TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING_REVIEW', 'ACCEPTED', 'DECLINED', 'CANCELLED')) DEFAULT 'PENDING_REVIEW',
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for support requests
CREATE INDEX IF NOT EXISTS idx_emergency_support_requests_incident_id 
    ON public.emergency_support_requests (incident_id);

CREATE INDEX IF NOT EXISTS idx_emergency_support_requests_fed_id 
    ON public.emergency_support_requests (requesting_federation_id);

CREATE INDEX IF NOT EXISTS idx_emergency_support_requests_status 
    ON public.emergency_support_requests (status);

-- 3. Row Level Security (RLS)
ALTER TABLE public.emergency_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_support_requests ENABLE ROW LEVEL SECURITY;

-- Audit logs policies:
-- Service role full access
CREATE POLICY "Service role full access to emergency_audit_logs"
    ON public.emergency_audit_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Authenticated users (Federation Admins & Team Members) can read logs within their federation
CREATE POLICY "Federation scoped read for emergency_audit_logs"
    ON public.emergency_audit_logs
    FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR federation_id = public.current_federation_id()
        OR federation_id = ((auth.jwt() -> 'user_metadata' ->> 'federation_id')::uuid)
    );

-- Authenticated Federation Admins can insert audit logs for their federation
CREATE POLICY "Federation Admin can insert emergency_audit_logs"
    ON public.emergency_audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_super_admin()
        OR federation_id = public.current_federation_id()
        OR federation_id = ((auth.jwt() -> 'user_metadata' ->> 'federation_id')::uuid)
    );

-- Support requests policies:
-- Service role full access
CREATE POLICY "Service role full access to emergency_support_requests"
    ON public.emergency_support_requests
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Federation Admins can read support requests they requested or were targeted to
CREATE POLICY "Federation scoped read for emergency_support_requests"
    ON public.emergency_support_requests
    FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR requesting_federation_id = public.current_federation_id()
        OR requesting_federation_id = ((auth.jwt() -> 'user_metadata' ->> 'federation_id')::uuid)
        OR target_federation_id = public.current_federation_id()
        OR target_federation_id = ((auth.jwt() -> 'user_metadata' ->> 'federation_id')::uuid)
    );

-- Federation Admins can insert support requests for their federation
CREATE POLICY "Federation Admin can insert emergency_support_requests"
    ON public.emergency_support_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_super_admin()
        OR requesting_federation_id = public.current_federation_id()
        OR requesting_federation_id = ((auth.jwt() -> 'user_metadata' ->> 'federation_id')::uuid)
    );

-- Grants
GRANT ALL ON TABLE public.emergency_audit_logs TO service_role;
GRANT SELECT, INSERT ON TABLE public.emergency_audit_logs TO authenticated;

GRANT ALL ON TABLE public.emergency_support_requests TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.emergency_support_requests TO authenticated;

-- 4. Enable Realtime Publications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'emergency_audit_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_audit_logs;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'emergency_support_requests'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_support_requests;
    END IF;
END $$;
