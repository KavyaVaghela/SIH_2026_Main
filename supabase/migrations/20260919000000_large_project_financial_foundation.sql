-- ====================================================================
-- PHASE 1: LARGE PROJECT FINANCIAL FOUNDATION
-- Migration: 20260919000000_large_project_financial_foundation.sql
-- Description: Establishes append-only financial structures for Large Projects:
--              - Original & Current Estimate tracking on project_requests
--              - Estimate Revision History (project_estimate_revisions)
--              - Payment Plans & Installments (project_payment_plans, project_payment_installments)
--              - Customer Payments Ledger (project_payments)
--              - RLS Policies, Indexes, and Realtime Publications
-- ====================================================================

-- 1. ENHANCE project_requests TABLE WITH FINANCIAL LEDGER COLUMNS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'project_requests' AND column_name = 'original_estimate_amount'
  ) THEN
    ALTER TABLE public.project_requests 
      ADD COLUMN original_estimate_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (original_estimate_amount >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'project_requests' AND column_name = 'current_estimated_total'
  ) THEN
    ALTER TABLE public.project_requests 
      ADD COLUMN current_estimated_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (current_estimated_total >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'project_requests' AND column_name = 'actual_cost_to_date'
  ) THEN
    ALTER TABLE public.project_requests 
      ADD COLUMN actual_cost_to_date NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (actual_cost_to_date >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'project_requests' AND column_name = 'payments_received'
  ) THEN
    ALTER TABLE public.project_requests 
      ADD COLUMN payments_received NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (payments_received >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'project_requests' AND column_name = 'settled_amount'
  ) THEN
    ALTER TABLE public.project_requests 
      ADD COLUMN settled_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (settled_amount >= 0);
  END IF;
END $$;

-- 2. CREATE project_estimate_revisions TABLE
CREATE TABLE IF NOT EXISTS public.project_estimate_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_request_id UUID NOT NULL REFERENCES public.project_requests(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  previous_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (previous_amount >= 0),
  current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (current_amount >= 0),
  difference_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  revision_reason TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CREATE project_payment_plans TABLE
CREATE TABLE IF NOT EXISTS public.project_payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_request_id UUID NOT NULL REFERENCES public.project_requests(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  plan_type VARCHAR(50) NOT NULL, -- 'FULL_PAYMENT', 'INSTALLMENTS_2', 'INSTALLMENTS_3', 'INSTALLMENTS_4'
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'SUPERSEDED', 'CANCELLED'
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CREATE project_payment_installments TABLE
CREATE TABLE IF NOT EXISTS public.project_payment_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_plan_id UUID NOT NULL REFERENCES public.project_payment_plans(id) ON DELETE CASCADE,
  project_request_id UUID NOT NULL REFERENCES public.project_requests(id) ON DELETE CASCADE,
  installment_number INT NOT NULL CHECK (installment_number > 0),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  due_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PAID', 'OVERDUE'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CREATE project_payments TABLE (Customer Payments Ledger)
CREATE TABLE IF NOT EXISTS public.project_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_request_id UUID NOT NULL REFERENCES public.project_requests(id) ON DELETE CASCADE,
  installment_id UUID REFERENCES public.project_payment_installments(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(50) NOT NULL DEFAULT 'SIMULATED_GATEWAY',
  transaction_reference VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS', -- 'SUCCESS', 'PENDING', 'FAILED'
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_project_estimate_revisions_project ON public.project_estimate_revisions(project_request_id);
CREATE INDEX IF NOT EXISTS idx_project_payment_plans_project ON public.project_payment_plans(project_request_id);
CREATE INDEX IF NOT EXISTS idx_project_payment_installments_plan ON public.project_payment_installments(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_project_payment_installments_project ON public.project_payment_installments(project_request_id);
CREATE INDEX IF NOT EXISTS idx_project_payments_project ON public.project_payments(project_request_id);
CREATE INDEX IF NOT EXISTS idx_project_payments_customer ON public.project_payments(customer_id);

-- 7. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.project_estimate_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_payment_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_payments ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLICIES
DROP POLICY IF EXISTS "project_estimate_revisions_access" ON public.project_estimate_revisions;
CREATE POLICY "project_estimate_revisions_access"
  ON public.project_estimate_revisions FOR ALL USING (
    created_by = auth.uid() OR
    project_request_id IN (
      SELECT id FROM public.project_requests 
      WHERE customer_id = auth.uid() OR federation_id = public.current_federation_id()
    ) OR
    public.is_super_admin()
  );

DROP POLICY IF EXISTS "project_payment_plans_access" ON public.project_payment_plans;
CREATE POLICY "project_payment_plans_access"
  ON public.project_payment_plans FOR ALL USING (
    project_request_id IN (
      SELECT id FROM public.project_requests 
      WHERE customer_id = auth.uid() OR federation_id = public.current_federation_id()
    ) OR
    public.is_super_admin()
  );

DROP POLICY IF EXISTS "project_payment_installments_access" ON public.project_payment_installments;
CREATE POLICY "project_payment_installments_access"
  ON public.project_payment_installments FOR ALL USING (
    project_request_id IN (
      SELECT id FROM public.project_requests 
      WHERE customer_id = auth.uid() OR federation_id = public.current_federation_id()
    ) OR
    public.is_super_admin()
  );

DROP POLICY IF EXISTS "project_payments_access" ON public.project_payments;
CREATE POLICY "project_payments_access"
  ON public.project_payments FOR ALL USING (
    customer_id = auth.uid() OR
    project_request_id IN (
      SELECT id FROM public.project_requests 
      WHERE customer_id = auth.uid() OR federation_id = public.current_federation_id()
    ) OR
    public.is_super_admin()
  );

-- 9. REALTIME ENABLEMENT
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'project_estimate_revisions') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.project_estimate_revisions;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'project_payment_plans') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.project_payment_plans;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'project_payment_installments') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.project_payment_installments;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'project_payments') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.project_payments;
    END IF;
  END IF;
END $$;
