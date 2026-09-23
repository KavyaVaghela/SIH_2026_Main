-- ====================================================================
-- EMERGENCY SERVICES: INCIDENT FOUNDATION
-- Migration: 20260919010000_emergency_incidents_foundation.sql
-- Description: Independent Emergency Incident operational entity, decoupled from bookings
-- ====================================================================

-- 1. Create emergency_incidents table
CREATE TABLE IF NOT EXISTS public.emergency_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id VARCHAR(32) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  federation_id UUID REFERENCES public.federations(id) ON DELETE SET NULL,
  category_name VARCHAR(100) NOT NULL,
  emergency_type VARCHAR(150) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'HIGH' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status VARCHAR(30) NOT NULL DEFAULT 'AWAITING_RESPONSE' CHECK (
    status IN (
      'AWAITING_RESPONSE',
      'DISPATCHING',
      'TEAM_FORMING',
      'ACTIVE',
      'STAFFING_SHORTAGE',
      'RESOLVED',
      'CLOSED',
      'CANCELLED'
    )
  ),
  location TEXT NOT NULL,
  address_details JSONB DEFAULT '{}'::jsonb,
  description TEXT NOT NULL,
  evidence_photos TEXT[] DEFAULT '{}'::text[],
  approx_people_affected INTEGER DEFAULT 1,
  immediate_danger BOOLEAN DEFAULT false,
  danger_details TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Indexes for fast retrieval and filtering
CREATE INDEX IF NOT EXISTS idx_emergency_incidents_emergency_id 
  ON public.emergency_incidents(emergency_id);

CREATE INDEX IF NOT EXISTS idx_emergency_incidents_customer_id 
  ON public.emergency_incidents(customer_id);

CREATE INDEX IF NOT EXISTS idx_emergency_incidents_status 
  ON public.emergency_incidents(status);

CREATE INDEX IF NOT EXISTS idx_emergency_incidents_created_at 
  ON public.emergency_incidents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_emergency_incidents_federation_id 
  ON public.emergency_incidents(federation_id);

-- 3. Enable Row Level Security
ALTER TABLE public.emergency_incidents ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DO $$
BEGIN
  -- SELECT Policy: Super Admins, service_role, incident reporter (Customer), or Federation Admin
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_incidents' AND policyname = 'emergency_incidents_select_policy'
  ) THEN
    CREATE POLICY "emergency_incidents_select_policy"
      ON public.emergency_incidents FOR SELECT
      USING (
        public.is_super_admin() OR
        auth.role() = 'service_role' OR
        customer_id = auth.uid() OR
        (federation_id IS NOT NULL AND federation_id = public.current_federation_id())
      );
  END IF;

  -- INSERT Policy: Authenticated customers can insert incidents for themselves, initial status must be AWAITING_RESPONSE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_incidents' AND policyname = 'emergency_incidents_insert_policy'
  ) THEN
    CREATE POLICY "emergency_incidents_insert_policy"
      ON public.emergency_incidents FOR INSERT
      WITH CHECK (
        auth.role() = 'service_role' OR
        (
          auth.role() = 'authenticated' AND
          customer_id = auth.uid() AND
          status = 'AWAITING_RESPONSE'
        )
      );
  END IF;

  -- UPDATE Policy: Super Admins and Federation Admins only. Customers CANNOT alter incidents or change status.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_incidents' AND policyname = 'emergency_incidents_update_policy'
  ) THEN
    CREATE POLICY "emergency_incidents_update_policy"
      ON public.emergency_incidents FOR UPDATE
      USING (
        public.is_super_admin() OR
        auth.role() = 'service_role' OR
        (federation_id IS NOT NULL AND federation_id = public.current_federation_id())
      );
  END IF;

  -- DELETE Policy: Super Admin and service_role only
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'emergency_incidents' AND policyname = 'emergency_incidents_delete_policy'
  ) THEN
    CREATE POLICY "emergency_incidents_delete_policy"
      ON public.emergency_incidents FOR DELETE
      USING (
        public.is_super_admin() OR
        auth.role() = 'service_role'
      );
  END IF;
END $$;

-- 5. Realtime Publication configuration
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'emergency_incidents') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE emergency_incidents;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
  WHEN OTHERS THEN
    RAISE NOTICE 'Realtime publication setup notice: %', SQLERRM;
END $$;
