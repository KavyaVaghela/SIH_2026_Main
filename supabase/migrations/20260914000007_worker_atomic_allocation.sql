-- ====================================================================
-- PHASE 4: WORKER ALLOCATION & CONCURRENCY-SAFE BUSY STATE
-- Migration: 20260914000007_worker_atomic_allocation.sql
-- Description: Provides database-level atomic worker allocation, concurrency guards,
--              and automatic invalidation of competing requests upon worker assignment.
-- ====================================================================

-- 1. Index on workers(availability_status) for fast row-level locking & queries
CREATE INDEX IF NOT EXISTS idx_workers_id_avail 
  ON public.workers(id, availability_status);

-- 2. Stored Function: Concurrency-Safe Worker Allocation
CREATE OR REPLACE FUNCTION public.allocate_worker_to_request(
  p_request_id UUID,
  p_worker_id UUID,
  p_customer_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_worker_status public.worker_availability_status;
  v_job_status VARCHAR(50);
  v_estimate RECORD;
  v_booking_id UUID;
  v_booking_number VARCHAR(50);
  v_agreed_amount NUMERIC(10, 2);
  v_platform_fee NUMERIC(10, 2);
  v_worker_earnings NUMERIC(10, 2);
  v_service_id UUID;
  v_federation_id UUID;
  v_address_id UUID;
  v_description TEXT;
  v_preferred_schedule TIMESTAMPTZ;
  v_otp VARCHAR(6);
BEGIN
  -- 1. Check & Lock Worker Row with FOR UPDATE (Exclusive Row-Level Lock)
  SELECT availability_status INTO v_worker_status
  FROM public.workers
  WHERE id = p_worker_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Worker not found.', 'code', 404);
  END IF;

  IF v_worker_status <> 'AVAILABLE'::public.worker_availability_status THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Worker is no longer available for this booking.',
      'code', 409
    );
  END IF;

  -- 2. Check & Lock Job Request Row
  SELECT status, service_id, description, preferred_schedule
  INTO v_job_status, v_service_id, v_description, v_preferred_schedule
  FROM public.job_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Service request not found.', 'code', 404);
  END IF;

  IF v_job_status = 'CONFIRMED' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'A worker has already been confirmed for this service request.',
      'code', 409
    );
  END IF;

  -- 3. Verify Worker Estimate for this request
  SELECT id, estimated_amount, status
  INTO v_estimate
  FROM public.worker_estimates
  WHERE job_request_id = p_request_id AND worker_id = p_worker_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Selected worker estimate not found.', 'code', 404);
  END IF;

  IF v_estimate.status = 'DECLINED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot select a worker who has declined the request.', 'code', 400);
  END IF;

  v_agreed_amount := COALESCE(v_estimate.estimated_amount, 350.00);
  v_platform_fee := ROUND(v_agreed_amount * 0.05, 2);
  v_worker_earnings := v_agreed_amount - v_platform_fee;
  v_otp := LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
  v_booking_number := 'BK-' || LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');

  -- 4. Get Worker Federation & Customer Default Address
  SELECT federation_id INTO v_federation_id FROM public.workers WHERE id = p_worker_id;
  IF v_federation_id IS NULL THEN
    v_federation_id := 'b765df3b-c418-4a15-b79f-3cbc09e475dc';
  END IF;

  SELECT id INTO v_address_id FROM public.addresses WHERE profile_id = p_customer_id ORDER BY is_default DESC LIMIT 1;
  IF v_address_id IS NULL THEN
    v_address_id := '3f50baf2-d986-4bec-88c2-dfa901d78a0b';
  END IF;

  -- 5. Atomic Update: Set Worker to BUSY
  UPDATE public.workers
  SET availability_status = 'BUSY'::public.worker_availability_status,
      updated_at = NOW()
  WHERE id = p_worker_id;

  -- 6. Atomic Update: Set Job Request to CONFIRMED
  UPDATE public.job_requests
  SET status = 'CONFIRMED',
      updated_at = NOW()
  WHERE id = p_request_id;

  -- 7. Update Estimates for THIS Request
  UPDATE public.worker_estimates
  SET status = 'SELECTED'
  WHERE job_request_id = p_request_id AND worker_id = p_worker_id;

  UPDATE public.worker_estimates
  SET status = 'NOT_SELECTED'
  WHERE job_request_id = p_request_id 
    AND worker_id <> p_worker_id 
    AND status <> 'DECLINED';

  -- 8. Invalidate Worker's active estimates on ALL OTHER pending requests
  UPDATE public.worker_estimates
  SET status = 'WORKER_UNAVAILABLE'
  WHERE worker_id = p_worker_id
    AND job_request_id <> p_request_id
    AND status IN ('PENDING', 'ESTIMATE_SUBMITTED', 'INTERESTED');

  -- 9. Create Canonical Booking Record in public.bookings
  INSERT INTO public.bookings (
    booking_number,
    customer_id,
    worker_id,
    service_id,
    federation_id,
    address_id,
    status,
    problem_description,
    otp_code,
    scheduled_start_at,
    scheduled_end_at,
    total_amount,
    platform_fee,
    worker_earnings,
    created_at,
    updated_at
  ) VALUES (
    v_booking_number,
    p_customer_id,
    p_worker_id,
    v_service_id,
    v_federation_id,
    v_address_id,
    'BOOKING_CONFIRMED'::public.booking_status,
    v_description,
    v_otp,
    COALESCE(v_preferred_schedule, NOW()),
    COALESCE(v_preferred_schedule, NOW()) + INTERVAL '2 hours',
    v_agreed_amount,
    v_platform_fee,
    v_worker_earnings,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_booking_id;

  -- 10. Record status history
  INSERT INTO public.booking_status_history (
    booking_id,
    previous_status,
    new_status,
    changed_by,
    notes,
    created_at
  ) VALUES (
    v_booking_id,
    NULL,
    'BOOKING_CONFIRMED'::public.booking_status,
    p_customer_id,
    'Booking confirmed and worker allocated via customer selection',
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'booking_number', v_booking_number,
    'request_id', p_request_id,
    'worker_id', p_worker_id,
    'agreed_amount', v_agreed_amount
  );
END;
$$;
