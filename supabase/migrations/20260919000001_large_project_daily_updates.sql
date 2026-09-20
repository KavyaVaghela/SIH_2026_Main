-- Migration: Large Project Daily Updates, Proof Media, and Expenses
-- Description: Structured tables and RLS policies for worker daily project execution updates

-- 1. Create project_daily_updates table
CREATE TABLE IF NOT EXISTS public.project_daily_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_request_id UUID NOT NULL REFERENCES public.project_requests(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.profiles(id),
    allocation_id UUID REFERENCES public.project_allocations(id) ON DELETE SET NULL,
    update_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    work_description TEXT NOT NULL,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create project_daily_update_media table
CREATE TABLE IF NOT EXISTS public.project_daily_update_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_update_id UUID NOT NULL REFERENCES public.project_daily_updates(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create project_expenses table
CREATE TABLE IF NOT EXISTS public.project_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_request_id UUID NOT NULL REFERENCES public.project_requests(id) ON DELETE CASCADE,
    daily_update_id UUID REFERENCES public.project_daily_updates(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.profiles(id),
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    expense_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Enable Row-Level Security (RLS) on all tables
ALTER TABLE public.project_daily_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_daily_update_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_expenses ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for project_daily_updates
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public/admin select daily_updates') THEN
        CREATE POLICY "Allow public/admin select daily_updates"
            ON public.project_daily_updates FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow worker insert daily_updates') THEN
        CREATE POLICY "Allow worker insert daily_updates"
            ON public.project_daily_updates FOR INSERT
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow worker update own daily_updates') THEN
        CREATE POLICY "Allow worker update own daily_updates"
            ON public.project_daily_updates FOR UPDATE
            USING (auth.uid() = worker_id);
    END IF;
END $$;

-- 6. Create RLS Policies for project_daily_update_media
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow select daily_update_media') THEN
        CREATE POLICY "Allow select daily_update_media"
            ON public.project_daily_update_media FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow insert daily_update_media') THEN
        CREATE POLICY "Allow insert daily_update_media"
            ON public.project_daily_update_media FOR INSERT
            WITH CHECK (true);
    END IF;
END $$;

-- 7. Create RLS Policies for project_expenses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow select project_expenses') THEN
        CREATE POLICY "Allow select project_expenses"
            ON public.project_expenses FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow insert project_expenses') THEN
        CREATE POLICY "Allow insert project_expenses"
            ON public.project_expenses FOR INSERT
            WITH CHECK (true);
    END IF;
END $$;

-- 8. Create Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_project_daily_updates_proj_id ON public.project_daily_updates(project_request_id);
CREATE INDEX IF NOT EXISTS idx_project_daily_updates_worker_id ON public.project_daily_updates(worker_id);
CREATE INDEX IF NOT EXISTS idx_project_daily_update_media_update_id ON public.project_daily_update_media(daily_update_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_proj_id ON public.project_expenses(project_request_id);
