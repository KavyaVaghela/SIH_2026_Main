-- ====================================================================
-- LARGE PROJECT EXECUTION & SETTLEMENT LIFECYCLE
-- Migration: 20260920000000_large_project_execution_lifecycle.sql
-- Description: Consolidated migration ensuring all structured tables
--              exist for daily updates, expenses (with verification),
--              estimate revisions, payment plans, installments,
--              payments, final bills, and settlements.
-- Safety: All CREATE TABLE use IF NOT EXISTS. All ALTER use DO $$ checks.
-- ====================================================================

-- ============================================================
-- 1. project_daily_updates
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_daily_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_request_id UUID NOT NULL REFERENCES public.project_requests(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL,
    allocation_id UUID,
    update_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    work_description TEXT NOT NULL,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pdu_project_id ON public.project_daily_updates(project_request_id);
CREATE INDEX IF NOT EXISTS idx_pdu_worker_id ON public.project_daily_updates(worker_id);
CREATE INDEX IF NOT EXISTS idx_pdu_update_date ON public.project_daily_updates(update_date);

-- ============================================================
-- 2. project_daily_update_media
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_daily_update_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_update_id UUID NOT NULL REFERENCES public.project_daily_updates(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pdum_update_id ON public.project_daily_update_media(daily_update_id);

-- ============================================================
-- 3. project_expenses (enhanced with verification)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_request_id UUID NOT NULL REFERENCES public.project_requests(id) ON DELETE CASCADE,
    daily_update_id UUID,
    worker_id UUID NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    submitted_amount NUMERIC(12,2),
    verified_amount NUMERIC(12,2),
    verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    expense_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add verification columns if table existed without them
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_expenses' AND column_name = 'submitted_amount'
  ) THEN
    ALTER TABLE public.project_expenses ADD COLUMN submitted_amount NUMERIC(12,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_expenses' AND column_name = 'verified_amount'
  ) THEN
    ALTER TABLE public.project_expenses ADD COLUMN verified_amount NUMERIC(12,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_expenses' AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE public.project_expenses ADD COLUMN verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_expenses' AND column_name = 'verified_by'
  ) THEN
    ALTER TABLE public.project_expenses ADD COLUMN verified_by UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_expenses' AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE public.project_expenses ADD COLUMN verified_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_expenses' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.project_expenses ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_expenses' AND column_name = 'daily_update_id'
  ) THEN
    ALTER TABLE public.project_expenses ADD COLUMN daily_update_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_expenses' AND column_name = 'worker_id'
  ) THEN
    ALTER TABLE public.project_expenses ADD COLUMN worker_id UUID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pe_project_id ON public.project_expenses(project_request_id);
CREATE INDEX IF NOT EXISTS idx_pe_worker_id ON public.project_expenses(worker_id);
CREATE INDEX IF NOT EXISTS idx_pe_daily_update_id ON public.project_expenses(daily_update_id);
CREATE INDEX IF NOT EXISTS idx_pe_verification ON public.project_expenses(verification_status);

-- ============================================================
-- 4. project_estimate_revisions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_estimate_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_request_id UUID NOT NULL REFERENCES public.project_requests(id) ON DELETE CASCADE,
    version INT NOT NULL DEFAULT 1,
    previous_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (previous_amount >= 0),
    current_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
    difference_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    revision_reason TEXT,
    customer_response VARCHAR(50) DEFAULT 'PENDING',
    customer_responded_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_estimate_revisions' AND column_name = 'customer_response'
  ) THEN
    ALTER TABLE public.project_estimate_revisions ADD COLUMN customer_response VARCHAR(50) DEFAULT 'PENDING';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_estimate_revisions' AND column_name = 'customer_responded_at'
  ) THEN
    ALTER TABLE public.project_estimate_revisions ADD COLUMN customer_responded_at TIMESTAMPTZ;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_per_project_id ON public.project_estimate_revisions(project_request_id);

-- ============================================================
-- 5. project_payment_plans
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_payment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_request_id UUID NOT NULL REFERENCES public.project_requests(id) ON DELETE CASCADE,
    version INT NOT NULL DEFAULT 1,
    plan_type VARCHAR(50) NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    installments_schedule JSONB DEFAULT '[]'::jsonb,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ppp_project_id ON public.project_payment_plans(project_request_id);

-- ============================================================
-- 6. project_payment_installments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_payment_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_plan_id UUID NOT NULL REFERENCES public.project_payment_plans(id) ON DELETE CASCADE,
    project_request_id UUID NOT NULL REFERENCES public.project_requests(id) ON DELETE CASCADE,
    installment_number INT NOT NULL CHECK (installment_number > 0),
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    due_date DATE,
    due_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    payment_reference VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_payment_installments' AND column_name = 'due_at'
  ) THEN
    ALTER TABLE public.project_payment_installments ADD COLUMN due_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_payment_installments' AND column_name = 'paid_at'
  ) THEN
    ALTER TABLE public.project_payment_installments ADD COLUMN paid_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_payment_installments' AND column_name = 'payment_reference'
  ) THEN
    ALTER TABLE public.project_payment_installments ADD COLUMN payment_reference VARCHAR(255);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ppi_plan_id ON public.project_payment_installments(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_ppi_project_id ON public.project_payment_installments(project_request_id);

-- ============================================================
-- 7. project_payments (Customer Payment Ledger)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_request_id UUID NOT NULL REFERENCES public.project_requests(id) ON DELETE CASCADE,
    installment_id UUID,
    customer_id UUID NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'SIMULATED_GATEWAY',
    transaction_reference VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pp_project_id ON public.project_payments(project_request_id);
CREATE INDEX IF NOT EXISTS idx_pp_customer_id ON public.project_payments(customer_id);

-- ============================================================
-- 8. project_final_bills (NEW)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_final_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_request_id UUID NOT NULL REFERENCES public.project_requests(id) ON DELETE CASCADE,
    original_estimate NUMERIC(12,2) NOT NULL DEFAULT 0,
    current_estimate NUMERIC(12,2) NOT NULL DEFAULT 0,
    verified_expense_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    final_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
    remaining_due NUMERIC(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'GENERATED',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pfb_project_id ON public.project_final_bills(project_request_id);

-- ============================================================
-- 9. project_settlements (NEW)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_request_id UUID NOT NULL REFERENCES public.project_requests(id) ON DELETE CASCADE,
    settlement_type VARCHAR(50) NOT NULL,
    verified_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    already_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
    settlement_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    settled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ps_project_id ON public.project_settlements(project_request_id);

-- ============================================================
-- 10. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================
ALTER TABLE public.project_daily_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_daily_update_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_estimate_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_payment_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_final_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_settlements ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 11. RLS POLICIES
-- ============================================================

DO $$
BEGIN
  DROP POLICY IF EXISTS "pdu_select" ON public.project_daily_updates;
  CREATE POLICY "pdu_select" ON public.project_daily_updates FOR SELECT USING (true);

  DROP POLICY IF EXISTS "pdu_insert" ON public.project_daily_updates;
  CREATE POLICY "pdu_insert" ON public.project_daily_updates FOR INSERT WITH CHECK (true);

  DROP POLICY IF EXISTS "pdu_update" ON public.project_daily_updates;
  CREATE POLICY "pdu_update" ON public.project_daily_updates FOR UPDATE USING (true);
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "pdum_select" ON public.project_daily_update_media;
  CREATE POLICY "pdum_select" ON public.project_daily_update_media FOR SELECT USING (true);

  DROP POLICY IF EXISTS "pdum_insert" ON public.project_daily_update_media;
  CREATE POLICY "pdum_insert" ON public.project_daily_update_media FOR INSERT WITH CHECK (true);
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "pe_all" ON public.project_expenses;
  CREATE POLICY "pe_all" ON public.project_expenses FOR ALL USING (true);
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "per_all" ON public.project_estimate_revisions;
  CREATE POLICY "per_all" ON public.project_estimate_revisions FOR ALL USING (true);
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "ppp_all" ON public.project_payment_plans;
  CREATE POLICY "ppp_all" ON public.project_payment_plans FOR ALL USING (true);
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "ppi_all" ON public.project_payment_installments;
  CREATE POLICY "ppi_all" ON public.project_payment_installments FOR ALL USING (true);
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "pp_all" ON public.project_payments;
  CREATE POLICY "pp_all" ON public.project_payments FOR ALL USING (true);
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "pfb_all" ON public.project_final_bills;
  CREATE POLICY "pfb_all" ON public.project_final_bills FOR ALL USING (true);
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "ps_all" ON public.project_settlements;
  CREATE POLICY "ps_all" ON public.project_settlements FOR ALL USING (true);
END $$;

-- ============================================================
-- 12. REALTIME PUBLICATIONS
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH tbl IN ARRAY ARRAY[
      'project_daily_updates',
      'project_daily_update_media',
      'project_expenses',
      'project_estimate_revisions',
      'project_payment_plans',
      'project_payment_installments',
      'project_payments',
      'project_final_bills',
      'project_settlements'
    ] LOOP
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = tbl
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
      END IF;
    END LOOP;
  END IF;
END $$;
