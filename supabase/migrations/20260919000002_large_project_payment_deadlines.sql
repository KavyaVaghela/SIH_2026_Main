-- ====================================================================
-- PHASE 3 UPDATE: LARGE PROJECT PAYMENT DEADLINES & OBLIGATIONS
-- Migration: 20260919000002_large_project_payment_deadlines.sql
-- Description: Adds due_at, paid_at, and payment_status to payment plans & installments schema.
-- ====================================================================

DO $$
BEGIN
  -- 1. ENHANCE project_payment_installments if columns missing
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_payment_installments'
  ) THEN
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
  END IF;

  -- 2. ENHANCE project_payment_plans if columns missing
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_payment_plans'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'project_payment_plans' AND column_name = 'installments_schedule'
    ) THEN
      ALTER TABLE public.project_payment_plans ADD COLUMN installments_schedule JSONB DEFAULT '[]'::jsonb;
    END IF;
  END IF;
END $$;
