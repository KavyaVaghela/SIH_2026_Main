-- ====================================================================
-- COOPERATIVE GIG SERVICES PLATFORM - ROW LEVEL SECURITY (RLS) POLICIES
-- File: supabase/policies/rls_policies.sql
-- Description: Centralized security policies enforcing strict role access.
-- ====================================================================

-- Enable RLS on all 26 public tables
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

-- ====================================================================
-- 1. PUBLIC READ ACCESS (Service Catalog & Skills)
-- ====================================================================

CREATE POLICY "Public Read Service Categories"
  ON service_categories FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public Read Services"
  ON services FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public Read Skills Master"
  ON skills FOR SELECT USING (TRUE);

CREATE POLICY "Public Read Certifications Master"
  ON certifications FOR SELECT USING (TRUE);

-- ====================================================================
-- 2. PROFILE & ADDRESS POLICIES
-- ====================================================================

CREATE POLICY "Profiles self view"
  ON profiles FOR SELECT USING (TRUE);

CREATE POLICY "Profiles self update"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Addresses owner full access"
  ON addresses FOR ALL USING (profile_id = auth.uid());

-- ====================================================================
-- 3. WORKER & FEDERATION POLICIES
-- ====================================================================

CREATE POLICY "Anyone can view verified workers"
  ON workers FOR SELECT USING (status = 'verified');

CREATE POLICY "Workers manage own profile"
  ON workers FOR ALL USING (profile_id = auth.uid());

CREATE POLICY "Federation Admin manages federation workers"
  ON workers FOR ALL USING (
    federation_id IN (
      SELECT f.id FROM federations f
      JOIN profiles p ON p.id = auth.uid()
      WHERE p.role = 'FEDERATION_ADMIN'
    )
  );

-- ====================================================================
-- 4. BOOKING & INVOICE POLICIES
-- ====================================================================

CREATE POLICY "Customers manage own bookings"
  ON bookings FOR ALL USING (customer_id = auth.uid());

CREATE POLICY "Workers view assigned bookings"
  ON bookings FOR SELECT USING (
    worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Invoices owner & worker access"
  ON invoices FOR SELECT USING (
    customer_id = auth.uid() OR
    booking_id IN (
      SELECT id FROM bookings WHERE worker_id IN (
        SELECT id FROM workers WHERE profile_id = auth.uid()
      )
    )
  );

-- ====================================================================
-- 5. NOTIFICATION & REVIEWS POLICIES
-- ====================================================================

CREATE POLICY "Notifications owner access"
  ON notifications FOR ALL USING (profile_id = auth.uid());

CREATE POLICY "Reviews owner access"
  ON reviews FOR ALL USING (customer_id = auth.uid());

CREATE POLICY "Public read reviews"
  ON reviews FOR SELECT USING (TRUE);

-- ====================================================================
-- 6. SUPER ADMIN PLATFORM OVERRIDE
-- ====================================================================

CREATE POLICY "Super Admin Full Access Profiles"
  ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
  );

CREATE POLICY "Super Admin Full Access Federations"
  ON federations FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
  );
