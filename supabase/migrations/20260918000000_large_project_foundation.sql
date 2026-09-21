-- ====================================================================
-- PHASE 1: LARGE PROJECT FOUNDATION & DATA MODEL
-- Migration: 20260918000000_large_project_foundation.sql
-- Description: Establishes backend data/business foundation for Large Projects.
--              Includes schema extensions, financial tracking, material expenses,
--              payment milestones, atomic FCFS worker allocation, and RLS policies.
-- ====================================================================

-- 1. ENHANCE project_requests TABLE
DO $$
BEGIN
  -- Add address_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'project_requests' AND column_name = 'address_id'
  ) THEN
    ALTER TABLE public.project_requests 
      ADD COLUMN address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL;
  END IF;

  -- Add category_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'project_requests' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE public.project_requests 
      ADD COLUMN category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL;
  END IF;

  -- Add desired_start_date if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'project_requests' AND column_name = 'desired_start_date'
  ) THEN
    ALTER TABLE public.project_requests 
      ADD COLUMN desired_start_date TIMESTAMPTZ;
  END IF;

  -- Add desired_end_date if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'project_requests' AND column_name = 'desired_end_date'
  ) THEN
    ALTER TABLE public.project_requests 
      ADD COLUMN desired_end_date TIMESTAMPTZ;
  END IF;

  -- Add site_photos if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'project_requests' AND column_name = 'site_photos'
  ) THEN
    ALTER TABLE public.project_requests 
      ADD COLUMN site_photos JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Add rejection_reason if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'project_requests' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE public.project_requests 
      ADD COLUMN rejection_reason TEXT;
  END IF;

  -- Financial Ledger Fields
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

-- 2. ENHANCE project_requirements TABLE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'project_requirements' AND column_name = 'title'
  ) THEN
    ALTER TABLE public.project_requirements 
      ADD COLUMN title VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'project_requirements' AND column_name = 'daily_rate'
  ) THEN
    ALTER TABLE public.project_requirements 
      ADD COLUMN daily_rate NUMERIC(10, 2) CHECK (daily_rate >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'project_requirements' AND column_name = 'estimated_days'
  ) THEN
    ALTER TABLE public.project_requirements 
      ADD COLUMN estimated_days INTEGER CHECK (estimated_days > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'project_requirements' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.project_requirements 
      ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'OPEN';
  END IF;
END $$;

-- 3. ENHANCE project_allocations TABLE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'project_allocations' AND column_name = 'daily_rate'
  ) THEN
    ALTER TABLE public.project_allocations 
      ADD COLUMN daily_rate NUMERIC(10, 2) CHECK (daily_rate >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'project_allocations' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE public.project_allocations 
      ADD COLUMN start_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'project_allocations' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE public.project_allocations 
      ADD COLUMN end_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'project_allocations' AND column_name = 'response_status'
  ) THEN
    ALTER TABLE public.project_allocations 
      ADD COLUMN response_status VARCHAR(50) NOT NULL DEFAULT 'INVITED';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'project_allocations' AND column_name = 'responded_at'
  ) THEN
    ALTER TABLE public.project_allocations 
      ADD COLUMN responded_at TIMESTAMPTZ;
  END IF;

  -- Add unique constraint on (requirement_id, worker_id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uk_project_req_worker'
  ) THEN
    ALTER TABLE public.project_allocations 
      ADD CONSTRAINT uk_project_req_worker UNIQUE (requirement_id, worker_id);
  END IF;
END $$;

-- 4. CREATE project_expenses TABLE
CREATE TABLE IF NOT EXISTS public.project_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_request_id UUID NOT NULL REFERENCES public.project_requests(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  receipt_url TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL', -- 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PAID'
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CREATE project_milestones TABLE
CREATE TABLE IF NOT EXISTS public.project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_request_id UUID NOT NULL REFERENCES public.project_requests(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  due_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'PLANNED', -- 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'INVOICED', 'PAID'
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggers for updated_at on new tables
CREATE TRIGGER trigger_update_project_expenses_updated_at
  BEFORE UPDATE ON public.project_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_project_milestones_updated_at
  BEFORE UPDATE ON public.project_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_requests_customer ON public.project_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_project_requests_federation ON public.project_requests(federation_id);
CREATE INDEX IF NOT EXISTS idx_project_requests_status ON public.project_requests(status);
CREATE INDEX IF NOT EXISTS idx_project_requirements_project ON public.project_requirements(project_request_id);
CREATE INDEX IF NOT EXISTS idx_project_allocations_project ON public.project_allocations(project_request_id);
CREATE INDEX IF NOT EXISTS idx_project_allocations_worker ON public.project_allocations(worker_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_project ON public.project_expenses(project_request_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON public.project_milestones(project_request_id);

-- 6. STORED PROCEDURE: Concurrency-Safe Worker Allocation to Project Requirement (FCFS)
CREATE OR REPLACE FUNCTION public.allocate_worker_to_project_requirement(
  p_requirement_id UUID,
  p_worker_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req_id UUID;
  v_project_request_id UUID;
  v_required_count INT := 5;
  v_current_accepted INT := 0;
  v_daily_rate NUMERIC(10, 2) := 900.00;
  v_req_status VARCHAR(50) := 'OPEN';
  v_desc TEXT;
  v_workers_match TEXT[];
  v_rate_match TEXT[];
BEGIN
  -- 1. Try to find by project_requirements ID or project_request_id
  SELECT id, project_request_id, required_workers_count, daily_rate, status
  INTO v_req_id, v_project_request_id, v_required_count, v_daily_rate, v_req_status
  FROM public.project_requirements
  WHERE id = p_requirement_id OR project_request_id = p_requirement_id
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  -- 2. If no project_requirements row exists yet, check project_requests and auto-create
  IF v_req_id IS NULL THEN
    SELECT id, description, status
    INTO v_project_request_id, v_desc, v_req_status
    FROM public.project_requests
    WHERE id = p_requirement_id
    FOR UPDATE;

    IF v_project_request_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Project or requirement not found.', 'code', 404);
    END IF;

    -- Parse workers count from description if available
    v_workers_match := regexp_matches(COALESCE(v_desc, ''), '\[Workers\]:\s*(\d+)');
    IF array_length(v_workers_match, 1) >= 1 THEN
      v_required_count := v_workers_match[1]::INT;
    END IF;

    -- Parse daily rate from description if available
    v_rate_match := regexp_matches(COALESCE(v_desc, ''), '\[Daily Rate\]:\s*(\d+)');
    IF array_length(v_rate_match, 1) >= 1 THEN
      v_daily_rate := v_rate_match[1]::NUMERIC;
    END IF;

    -- Create requirement record automatically
    INSERT INTO public.project_requirements (
      project_request_id,
      title,
      required_workers_count,
      daily_rate,
      status
    ) VALUES (
      v_project_request_id,
      'General Artisan Requirement',
      v_required_count,
      v_daily_rate,
      'OPEN'
    )
    RETURNING id INTO v_req_id;
  END IF;

  IF v_req_status = 'CLOSED' OR v_req_status = 'FILLED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This requirement is no longer accepting allocations.', 'code', 409);
  END IF;

  -- 3. Count current ACCEPTED allocations for this requirement / project
  SELECT COUNT(*) INTO v_current_accepted
  FROM public.project_allocations
  WHERE (requirement_id = v_req_id OR project_request_id = v_project_request_id)
    AND response_status = 'ACCEPTED';

  IF v_current_accepted >= v_required_count THEN
    UPDATE public.project_requirements SET status = 'FILLED' WHERE id = v_req_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Requirement capacity has already been filled.',
      'code', 409
    );
  END IF;

  -- 4. Upsert allocation record for worker
  INSERT INTO public.project_allocations (
    project_request_id,
    requirement_id,
    worker_id,
    daily_rate,
    response_status,
    allocated_at,
    responded_at,
    status
  ) VALUES (
    v_project_request_id,
    v_req_id,
    p_worker_id,
    v_daily_rate,
    'ACCEPTED',
    NOW(),
    NOW(),
    'assigned'
  )
  ON CONFLICT (requirement_id, worker_id)
  DO UPDATE SET
    response_status = 'ACCEPTED',
    responded_at = NOW(),
    status = 'assigned';

  -- Re-count accepted slots after insert
  SELECT COUNT(*) INTO v_current_accepted
  FROM public.project_allocations
  WHERE (requirement_id = v_req_id OR project_request_id = v_project_request_id)
    AND response_status = 'ACCEPTED';

  -- If capacity reached, mark requirement as FILLED
  IF v_current_accepted >= v_required_count THEN
    UPDATE public.project_requirements SET status = 'FILLED' WHERE id = v_req_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'requirement_id', v_req_id,
    'project_request_id', v_project_request_id,
    'worker_id', p_worker_id,
    'accepted_count', v_current_accepted,
    'required_count', v_required_count
  );
END;
$$;

-- Grant execution to authenticated, anon, and service_role
GRANT EXECUTE ON FUNCTION public.allocate_worker_to_project_requirement(UUID, UUID) TO authenticated, anon, service_role;

-- 7. RLS POLICIES & REALTIME
ALTER TABLE public.project_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_expenses_access" ON public.project_expenses;
CREATE POLICY "project_expenses_access"
  ON public.project_expenses FOR ALL USING (
    submitted_by = auth.uid() OR
    project_request_id IN (
      SELECT id FROM public.project_requests 
      WHERE customer_id = auth.uid() OR federation_id = public.current_federation_id()
    ) OR
    public.is_super_admin()
  );

DROP POLICY IF EXISTS "project_milestones_access" ON public.project_milestones;
CREATE POLICY "project_milestones_access"
  ON public.project_milestones FOR ALL USING (
    project_request_id IN (
      SELECT id FROM public.project_requests 
      WHERE customer_id = auth.uid() OR federation_id = public.current_federation_id()
    ) OR
    public.is_super_admin()
  );

-- Realtime enablement
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'project_expenses') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.project_expenses;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'project_milestones') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.project_milestones;
    END IF;
  END IF;
END $$;
