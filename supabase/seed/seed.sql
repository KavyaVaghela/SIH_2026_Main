-- ====================================================================
-- COOPERATIVE GIG SERVICES PLATFORM - SEED DATA SCRIPT
-- File: supabase/seed/seed.sql
-- ====================================================================

-- 1. SEED FEDERATIONS
INSERT INTO federations (id, name, code, gst_number, registration_number, state, city, address, contact_email, contact_phone)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Pune Household Workers Service Cooperative', 'FED-PUNE-01', '27AAACP1234A1Z1', 'REG/MH/PUNE/2024/001', 'Maharashtra', 'Pune', '102 Cooperative Bhawan, Shivajinagar, Pune', 'contact@puneworkers.coop', '+919822000001'),
  ('a0000000-0000-0000-0000-000000000002', 'Mumbai Seva Women Gig Workers Cooperative', 'FED-MUM-02', '27AAACM5678B1Z2', 'REG/MH/MUM/2024/002', 'Maharashtra', 'Mumbai', '405 Seva Towers, Dadar West, Mumbai', 'info@mumbaiseva.coop', '+919822000002');

-- 2. SEED SERVICE CATEGORIES
INSERT INTO service_categories (id, name, description, icon_name)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Electrical & Wiring', 'Home electrical repairs, main switchboards, wiring, and appliance installation', 'Zap'),
  ('c0000000-0000-0000-0000-000000000002', 'Plumbing & Drainage', 'Tap repairs, pipe leakage, water tank cleaning, and bathroom fitting', 'Droplet'),
  ('c0000000-0000-0000-0000-000000000003', 'Deep House Cleaning', 'Full house sanitization, kitchen deep clean, sofa & mattress shampooing', 'Sparkles'),
  ('c0000000-0000-0000-0000-000000000004', 'Appliance Servicing', 'AC gas refill, refrigerator maintenance, washing machine repair', 'Wrench');

-- 3. SEED SERVICES
INSERT INTO services (id, category_id, title, description, base_price, price_unit)
VALUES
  ('s0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Full Room Electrical Repair & Wiring', 'Diagnostic and replacement of faulty switches and sockets.', 350.00, 'per_hour'),
  ('s0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Pipeline Leakage & Tap Replacement', 'Fixing pipe leaks, installing new bib taps or mixer valves.', 400.00, 'per_hour'),
  ('s0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'Full 2BHK Deep Cleaning', 'Complete sanitization, floor scrubbing, and window cleaning.', 1800.00, 'per_service'),
  ('s0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'Split AC Servicing & Filter Wash', 'Chemical cleaning of AC filters, coil inspection, and gas test.', 500.00, 'per_service');

-- 4. SEED SKILLS
INSERT INTO skills (id, name, description, category_id)
VALUES
  ('sk000000-0000-0000-0000-000000000001', 'Main Switchboard Repair', 'Expertise in 3-phase switchboard and MCB installations', 'c0000000-0000-0000-0000-000000000001'),
  ('sk000000-0000-0000-0000-000000000002', 'Concealed Pipe Fitting', 'Leakage detection and concealed CPVC/PVC fitting', 'c0000000-0000-0000-0000-000000000002'),
  ('sk000000-0000-0000-0000-000000000003', 'Kitchen Degreasing & Sanitization', 'High-pressure steam cleaning and oil stain removal', 'c0000000-0000-0000-0000-000000000003');

-- 5. SEED CERTIFICATIONS
INSERT INTO certifications (id, title, issuing_body, validity_months)
VALUES
  ('crt00000-0000-0000-0000-000000000001', 'National Skill Development Electrical Certification', 'NSDC India', 36),
  ('crt00000-0000-0000-0000-000000000002', 'Cooperative Hygiene & Safety Standard', 'Maharashtra State Cooperative Board', 24);
