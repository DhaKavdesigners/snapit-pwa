-- ============================================================================
-- MINNIT KGF — ORDER STATUS VALIDATION & ATOMIC RIDER DISPATCH
-- Authoritative database functions for Merchant Acceptance & Rider Assignment
-- ============================================================================

-- 1. Merchant Accept Order: Atomically transitions order from PLACED -> PREPARING
CREATE OR REPLACE FUNCTION public.merchant_accept_order(
  p_order_id TEXT,
  p_prep_minutes INT DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status TEXT;
  v_updated RECORD;
BEGIN
  -- Row-level lock to prevent concurrent modification or race condition with cancellation
  SELECT status INTO v_current_status
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'ORDER_NOT_FOUND');
  END IF;

  -- Cannot accept if already cancelled or rejected
  IF v_current_status IN ('CANCELLED', 'REJECTED') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ORDER_ALREADY_CLOSED',
      'current_status', v_current_status
    );
  END IF;

  -- Idempotency check: if already PREPARING, return success without duplicate write
  IF v_current_status = 'PREPARING' THEN
    RETURN jsonb_build_object('success', true, 'idempotent', true);
  END IF;

  -- Atomic conditional update: only if currently PLACED or PENDING
  UPDATE public.orders
  SET
    status = 'PREPARING',
    prep_time_minutes = COALESCE(p_prep_minutes, prep_time_minutes, 15),
    updated_at = NOW()
  WHERE id = p_order_id AND status IN ('PLACED', 'PENDING')
  RETURNING * INTO v_updated;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'STATUS_TRANSITION_FAILED');
  END IF;

  RETURN jsonb_build_object('success', true, 'order', row_to_json(v_updated));
END;
$$;

-- 2. Merchant Reject Order: Atomically transitions order to REJECTED and clears any rider assignment
CREATE OR REPLACE FUNCTION public.merchant_reject_order(
  p_order_id TEXT,
  p_reason TEXT DEFAULT 'Store unable to fulfill'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status TEXT;
  v_updated RECORD;
BEGIN
  -- Row-level lock
  SELECT status INTO v_current_status
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'ORDER_NOT_FOUND');
  END IF;

  -- Idempotency: if already REJECTED, return success
  IF v_current_status = 'REJECTED' THEN
    RETURN jsonb_build_object('success', true, 'idempotent', true);
  END IF;

  UPDATE public.orders
  SET
    status = 'REJECTED',
    rejection_reason = COALESCE(p_reason, rejection_reason, 'Store unable to fulfill'),
    rider_id = NULL,
    rider_assignment = NULL,
    updated_at = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_updated;

  RETURN jsonb_build_object('success', true, 'order', row_to_json(v_updated));
END;
$$;

-- 3. Assign Rider If Preparing: Authoritative status check before committing rider assignment
-- Mandatory condition: Rider assignment is committed ONLY if orders.status = 'PREPARING'.
CREATE OR REPLACE FUNCTION public.assign_rider_if_preparing(
  p_order_id TEXT,
  p_rider_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status TEXT;
  v_current_rider TEXT;
  v_updated RECORD;
BEGIN
  -- Row-level lock to prevent simultaneous assignment, rejection, or cancellation
  SELECT status, rider_id INTO v_current_status, v_current_rider
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'ORDER_NOT_FOUND');
  END IF;

  -- Mandatory rule: Status must be PREPARING
  IF v_current_status <> 'PREPARING' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_STATUS',
      'current_status', v_current_status
    );
  END IF;

  -- Idempotency check: if already assigned to this exact rider, return success
  IF v_current_rider = p_rider_id THEN
    RETURN jsonb_build_object('success', true, 'idempotent', true);
  END IF;

  -- Conflict check: if assigned to another rider
  IF v_current_rider IS NOT NULL AND v_current_rider <> '' AND v_current_rider <> p_rider_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ALREADY_ASSIGNED_TO_ANOTHER_RIDER'
    );
  END IF;

  -- Atomically commit rider assignment while validating PREPARING status
  UPDATE public.orders
  SET
    rider_id = p_rider_id,
    rider_assignment = 'ASSIGNED',
    updated_at = NOW()
  WHERE id = p_order_id AND status = 'PREPARING'
  RETURNING * INTO v_updated;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'CONCURRENT_STATUS_CHANGE');
  END IF;

  RETURN jsonb_build_object('success', true, 'order', row_to_json(v_updated));
END;
$$;

-- 4. Validate Order Dispatch Eligibility: Helper RPC for pre-notification checks
CREATE OR REPLACE FUNCTION public.check_order_dispatch_eligibility(
  p_order_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rec RECORD;
BEGIN
  SELECT id, status, rider_id, rider_assignment INTO v_rec
  FROM public.orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'ORDER_NOT_FOUND');
  END IF;

  -- Only PREPARING orders are eligible for dispatch
  IF v_rec.status <> 'PREPARING' THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'INVALID_STATUS',
      'current_status', v_rec.status
    );
  END IF;

  -- Must not be already assigned
  IF v_rec.rider_assignment = 'ASSIGNED' AND v_rec.rider_id IS NOT NULL AND v_rec.rider_id <> '' THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'ALREADY_ASSIGNED',
      'rider_id', v_rec.rider_id
    );
  END IF;

  RETURN jsonb_build_object('eligible', true, 'status', v_rec.status);
END;
$$;
