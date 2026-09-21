-- Migration: 20260920120000_daily_monitoring_ledger.sql
-- Description: Structured Daily Monitoring, Worker Labour Charges, Material Expenses & Customer Queries

-- 1. Project Daily Updates Table
CREATE TABLE IF NOT EXISTS public.project_daily_updates (
    id TEXT PRIMARY KEY,
    project_request_id UUID NOT NULL REFERENCES public.project_requests(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    allocation_id UUID REFERENCES public.project_allocations(id) ON DELETE SET NULL,
    work_date DATE NOT NULL DEFAULT CURRENT_DATE,
    work_description TEXT NOT NULL,
    progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Project Daily Update Media (Proof Photos)
CREATE TABLE IF NOT EXISTS public.project_daily_update_media (
    id TEXT PRIMARY KEY,
    daily_update_id TEXT NOT NULL REFERENCES public.project_daily_updates(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Project Expenses (Material Expenses)
CREATE TABLE IF NOT EXISTS public.project_expenses (
    id TEXT PRIMARY KEY,
    project_request_id UUID NOT NULL REFERENCES public.project_requests(id) ON DELETE CASCADE,
    daily_update_id TEXT REFERENCES public.project_daily_updates(id) ON DELETE SET NULL,
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    verified_amount NUMERIC DEFAULT 0,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Project Worker Daily Charges (Labor Cost Ledger)
CREATE TABLE IF NOT EXISTS public.project_worker_daily_charges (
    id TEXT PRIMARY KEY,
    project_request_id UUID NOT NULL REFERENCES public.project_requests(id) ON DELETE CASCADE,
    daily_update_id TEXT REFERENCES public.project_daily_updates(id) ON DELETE SET NULL,
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    charge_date DATE NOT NULL DEFAULT CURRENT_DATE,
    daily_rate NUMERIC NOT NULL DEFAULT 900,
    charge_amount NUMERIC NOT NULL DEFAULT 900,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_project_worker_date UNIQUE (project_request_id, worker_id, charge_date)
);

-- 5. Project Customer Queries
CREATE TABLE IF NOT EXISTS public.project_customer_queries (
    id TEXT PRIMARY KEY,
    project_request_id UUID NOT NULL REFERENCES public.project_requests(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    daily_update_id TEXT REFERENCES public.project_daily_updates(id) ON DELETE SET NULL,
    expense_id TEXT REFERENCES public.project_expenses(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED', 'CLOSED')),
    response TEXT,
    responded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high-performance querying
CREATE INDEX IF NOT EXISTS idx_pdu_proj ON public.project_daily_updates(project_request_id);
CREATE INDEX IF NOT EXISTS idx_pdu_worker ON public.project_daily_updates(worker_id);
CREATE INDEX IF NOT EXISTS idx_pdu_date ON public.project_daily_updates(work_date);
CREATE INDEX IF NOT EXISTS idx_pdum_update ON public.project_daily_update_media(daily_update_id);
CREATE INDEX IF NOT EXISTS idx_pexp_proj ON public.project_expenses(project_request_id);
CREATE INDEX IF NOT EXISTS idx_pexp_status ON public.project_expenses(status);
CREATE INDEX IF NOT EXISTS idx_pwdc_proj ON public.project_worker_daily_charges(project_request_id);
CREATE INDEX IF NOT EXISTS idx_pwdc_worker_date ON public.project_worker_daily_charges(project_request_id, worker_id, charge_date);
CREATE INDEX IF NOT EXISTS idx_pcq_proj ON public.project_customer_queries(project_request_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.project_daily_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_daily_update_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_worker_daily_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_customer_queries ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow Read for authenticated users involved with project
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow read project_daily_updates') THEN
        CREATE POLICY "Allow read project_daily_updates" ON public.project_daily_updates FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow read project_daily_update_media') THEN
        CREATE POLICY "Allow read project_daily_update_media" ON public.project_daily_update_media FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow read project_expenses') THEN
        CREATE POLICY "Allow read project_expenses" ON public.project_expenses FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow read project_worker_daily_charges') THEN
        CREATE POLICY "Allow read project_worker_daily_charges" ON public.project_worker_daily_charges FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow read project_customer_queries') THEN
        CREATE POLICY "Allow read project_customer_queries" ON public.project_customer_queries FOR SELECT TO authenticated USING (true);
    END IF;
END $$;
