-- ====================================================================
-- COOPERATIVE GIG SERVICES PLATFORM - ROW LEVEL SECURITY (RLS) POLICIES
-- File: supabase/policies/rls_policies.sql
-- Description: Centralized security policies enforcing strict role access.
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. SQL SECURITY HELPER FUNCTIONS
-- --------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role = 'SUPER_ADMIN' FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_worker_id()
RETURNS UUID AS $$
  SELECT id FROM public.workers WHERE profile_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_federation_id()
RETURNS UUID AS $$
  SELECT federation_id FROM public.workers WHERE profile_id = auth.uid()
  UNION ALL
  SELECT id FROM public.federations WHERE contact_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- --------------------------------------------------------------------
-- 2. ENABLE RLS ON ALL 26 TABLES
-- --------------------------------------------------------------------

ALTER TABLE federations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE welfare_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_allocations ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- 3. PUBLIC CATALOG READ & SUPER ADMIN MANAGEMENT
-- --------------------------------------------------------------------

CREATE POLICY "public_read_service_categories"
  ON service_categories FOR SELECT USING (is_active = TRUE OR public.is_super_admin());

CREATE POLICY "public_read_services"
  ON services FOR SELECT USING (is_active = TRUE OR public.is_super_admin());

CREATE POLICY "public_read_skills"
  ON skills FOR SELECT USING (TRUE);

CREATE POLICY "public_read_certifications"
  ON certifications FOR SELECT USING (TRUE);

CREATE POLICY "super_admin_manage_categories"
  ON service_categories FOR ALL USING (public.is_super_admin());

CREATE POLICY "super_admin_manage_services"
  ON services FOR ALL USING (public.is_super_admin());

CREATE POLICY "super_admin_manage_skills"
  ON skills FOR ALL USING (public.is_super_admin());

CREATE POLICY "super_admin_manage_certifications"
  ON certifications FOR ALL USING (public.is_super_admin());

-- --------------------------------------------------------------------
-- 4. PROFILES & ADDRESSES
-- --------------------------------------------------------------------

CREATE POLICY "profiles_select_own_or_admin"
  ON profiles FOR SELECT USING (
    id = auth.uid() OR
    public.is_super_admin() OR
    id IN (SELECT profile_id FROM workers WHERE federation_id = public.current_federation_id())
  );

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "super_admin_all_profiles"
  ON profiles FOR ALL USING (public.is_super_admin());

CREATE POLICY "addresses_owner_access"
  ON addresses FOR ALL USING (profile_id = auth.uid() OR public.is_super_admin());

-- --------------------------------------------------------------------
-- 5. FEDERATIONS & WORKERS
-- --------------------------------------------------------------------

CREATE POLICY "federations_public_view_active"
  ON federations FOR SELECT USING (is_active = TRUE OR public.is_super_admin());

CREATE POLICY "federations_admin_update_own"
  ON federations FOR UPDATE USING (
    id = public.current_federation_id() OR public.is_super_admin()
  );

CREATE POLICY "super_admin_manage_federations"
  ON federations FOR ALL USING (public.is_super_admin());

CREATE POLICY "workers_select_policy"
  ON workers FOR SELECT USING (
    (verification_status = 'verified' AND account_status = 'ACTIVE') OR
    profile_id = auth.uid() OR
    federation_id = public.current_federation_id() OR
    public.is_super_admin()
  );

CREATE POLICY "workers_update_self"
  ON workers FOR UPDATE USING (profile_id = auth.uid())
  WITH CHECK (
    profile_id = auth.uid() AND
    federation_id = (SELECT federation_id FROM public.workers WHERE profile_id = auth.uid()) AND
    verification_status = (SELECT verification_status FROM public.workers WHERE profile_id = auth.uid()) AND
    account_status = (SELECT account_status FROM public.workers WHERE profile_id = auth.uid())
  );

CREATE POLICY "federation_admin_manage_workers"
  ON workers FOR ALL USING (
    federation_id = public.current_federation_id() OR public.is_super_admin()
  );

-- --------------------------------------------------------------------
-- 6. WORKER QUALIFICATIONS & SCHEDULE
-- --------------------------------------------------------------------

CREATE POLICY "worker_skills_access"
  ON worker_skills FOR ALL USING (
    worker_id = public.current_worker_id() OR
    worker_id IN (SELECT id FROM workers WHERE federation_id = public.current_federation_id()) OR
    public.is_super_admin()
  );

CREATE POLICY "worker_certifications_access"
  ON worker_certifications FOR ALL USING (
    worker_id = public.current_worker_id() OR
    worker_id IN (SELECT id FROM workers WHERE federation_id = public.current_federation_id()) OR
    public.is_super_admin()
  );

CREATE POLICY "worker_availability_access"
  ON worker_availability FOR ALL USING (
    worker_id = public.current_worker_id() OR
    worker_id IN (SELECT id FROM workers WHERE federation_id = public.current_federation_id()) OR
    public.is_super_admin()
  );

-- --------------------------------------------------------------------
-- 7. BOOKINGS & HISTORY
-- --------------------------------------------------------------------

CREATE POLICY "bookings_select_policy"
  ON bookings FOR SELECT USING (
    customer_id = auth.uid() OR
    worker_id = public.current_worker_id() OR
    federation_id = public.current_federation_id() OR
    public.is_super_admin()
  );

CREATE POLICY "bookings_customer_create"
  ON bookings FOR INSERT WITH CHECK (
    customer_id = auth.uid()
  );

CREATE POLICY "bookings_update_policy"
  ON bookings FOR UPDATE USING (
    customer_id = auth.uid() OR
    worker_id = public.current_worker_id() OR
    federation_id = public.current_federation_id() OR
    public.is_super_admin()
  );

CREATE POLICY "booking_status_history_select"
  ON booking_status_history FOR SELECT USING (
    booking_id IN (SELECT id FROM bookings WHERE customer_id = auth.uid() OR worker_id = public.current_worker_id() OR federation_id = public.current_federation_id()) OR
    public.is_super_admin()
  );

CREATE POLICY "booking_status_history_insert"
  ON booking_status_history FOR INSERT WITH CHECK (
    booking_id IN (SELECT id FROM bookings WHERE customer_id = auth.uid() OR worker_id = public.current_worker_id() OR federation_id = public.current_federation_id()) OR
    public.is_super_admin()
  );

-- --------------------------------------------------------------------
-- 8. JOB REQUESTS & ESTIMATES
-- --------------------------------------------------------------------

CREATE POLICY "job_requests_customer_owner"
  ON job_requests FOR ALL USING (
    customer_id = auth.uid() OR public.is_super_admin()
  );

CREATE POLICY "job_requests_worker_view"
  ON job_requests FOR SELECT USING (
    public.current_worker_id() IS NOT NULL
  );

CREATE POLICY "worker_estimates_access"
  ON worker_estimates FOR ALL USING (
    worker_id = public.current_worker_id() OR
    job_request_id IN (SELECT id FROM job_requests WHERE customer_id = auth.uid()) OR
    public.is_super_admin()
  );

-- --------------------------------------------------------------------
-- 9. INVOICES, ITEMS & PAYMENTS
-- --------------------------------------------------------------------

CREATE POLICY "invoices_select_policy"
  ON invoices FOR SELECT USING (
    customer_id = auth.uid() OR
    federation_id = public.current_federation_id() OR
    booking_id IN (SELECT id FROM bookings WHERE worker_id = public.current_worker_id()) OR
    public.is_super_admin()
  );

CREATE POLICY "invoice_items_select_policy"
  ON invoice_items FOR SELECT USING (
    invoice_id IN (SELECT id FROM invoices WHERE customer_id = auth.uid() OR federation_id = public.current_federation_id() OR booking_id IN (SELECT id FROM bookings WHERE worker_id = public.current_worker_id())) OR
    public.is_super_admin()
  );

CREATE POLICY "payments_select_policy"
  ON payments FOR SELECT USING (
    customer_id = auth.uid() OR
    booking_id IN (SELECT id FROM bookings WHERE worker_id = public.current_worker_id() OR federation_id = public.current_federation_id()) OR
    public.is_super_admin()
  );

-- --------------------------------------------------------------------
-- 10. REVIEWS & COMPLAINTS
-- --------------------------------------------------------------------

CREATE POLICY "reviews_public_read"
  ON reviews FOR SELECT USING (TRUE);

CREATE POLICY "reviews_customer_manage"
  ON reviews FOR ALL USING (
    customer_id = auth.uid() OR public.is_super_admin()
  );

CREATE POLICY "complaints_access_policy"
  ON complaints FOR ALL USING (
    raised_by = auth.uid() OR
    target_profile_id = auth.uid() OR
    booking_id IN (SELECT id FROM bookings WHERE federation_id = public.current_federation_id()) OR
    public.is_super_admin()
  );

-- --------------------------------------------------------------------
-- 11. WELFARE & INSURANCE
-- --------------------------------------------------------------------

CREATE POLICY "welfare_records_access"
  ON welfare_records FOR SELECT USING (
    worker_id = public.current_worker_id() OR
    federation_id = public.current_federation_id() OR
    public.is_super_admin()
  );

CREATE POLICY "insurance_records_access"
  ON insurance_records FOR SELECT USING (
    worker_id = public.current_worker_id() OR
    worker_id IN (SELECT id FROM workers WHERE federation_id = public.current_federation_id()) OR
    public.is_super_admin()
  );

-- --------------------------------------------------------------------
-- 12. NOTIFICATIONS & PROJECTS
-- --------------------------------------------------------------------

CREATE POLICY "notifications_owner_access"
  ON notifications FOR ALL USING (
    profile_id = auth.uid() OR public.is_super_admin()
  );

CREATE POLICY "project_requests_access"
  ON project_requests FOR ALL USING (
    customer_id = auth.uid() OR
    federation_id = public.current_federation_id() OR
    public.is_super_admin()
  );

CREATE POLICY "project_requirements_access"
  ON project_requirements FOR ALL USING (
    project_request_id IN (SELECT id FROM project_requests WHERE customer_id = auth.uid() OR federation_id = public.current_federation_id()) OR
    public.is_super_admin()
  );

CREATE POLICY "project_allocations_access"
  ON project_allocations FOR ALL USING (
    worker_id = public.current_worker_id() OR
    project_request_id IN (SELECT id FROM project_requests WHERE customer_id = auth.uid() OR federation_id = public.current_federation_id()) OR
    public.is_super_admin()
  );
