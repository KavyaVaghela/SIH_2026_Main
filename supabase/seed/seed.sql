-- ====================================================================
-- COOPERATIVE GIG SERVICES PLATFORM - COMPLETE DEVELOPMENT SEED SCRIPT
-- File: supabase/seed/seed.sql
-- Description: Population script for core entities across all 26 relational tables.
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. SEED FEDERATIONS
-- --------------------------------------------------------------------
INSERT INTO federations (id, name, code, gst_number, registration_number, state, city, address, contact_email, contact_phone, is_active)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Gujarat Labour Cooperative Federation', 'FED-GJ-AHM-01', '24AAACG1234A1Z1', 'REG/GJ/AHM/2024/001', 'Gujarat', 'Ahmedabad', '101 Cooperative Bhawan, Satellite, Ahmedabad', 'contact@gujaratworkers.coop', '+919825000001', true),
  ('a0000000-0000-0000-0000-000000000002', 'Ahmedabad Skilled Workers Federation', 'FED-GJ-AHM-02', '24AAACA5678B1Z2', 'REG/GJ/AHM/2024/002', 'Gujarat', 'Ahmedabad', '302 Seva Sadan, Navrangpura, Ahmedabad', 'info@ahmworkers.coop', '+919825000002', true),
  ('a0000000-0000-0000-0000-000000000003', 'Pune Household Workers Service Cooperative', 'FED-PUNE-01', '27AAACP1234A1Z1', 'REG/MH/PUNE/2024/001', 'Maharashtra', 'Pune', '102 Cooperative Bhawan, Shivajinagar, Pune', 'contact@puneworkers.coop', '+919822000001', true),
  ('a0000000-0000-0000-0000-000000000004', 'Mumbai Seva Women Gig Workers Cooperative', 'FED-MUM-02', '27AAACM5678B1Z2', 'REG/MH/MUM/2024/002', 'Maharashtra', 'Mumbai', '405 Seva Towers, Dadar West, Mumbai', 'info@mumbaiseva.coop', '+919822000002', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  state = EXCLUDED.state,
  city = EXCLUDED.city,
  address = EXCLUDED.address,
  contact_email = EXCLUDED.contact_email;

-- --------------------------------------------------------------------
-- 2. SEED SERVICE CATEGORIES (8 Core Categories)
-- --------------------------------------------------------------------
INSERT INTO service_categories (id, name, description, icon_name, is_active)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Electrical & Wiring', 'Home electrical repairs, main switchboards, wiring, and appliance installation', 'Zap', true),
  ('c0000000-0000-0000-0000-000000000002', 'Plumbing & Drainage', 'Tap repairs, pipe leakage, water tank cleaning, and bathroom fitting', 'Droplet', true),
  ('c0000000-0000-0000-0000-000000000003', 'Deep House Cleaning', 'Full house sanitization, kitchen deep clean, sofa & mattress shampooing', 'Sparkles', true),
  ('c0000000-0000-0000-0000-000000000004', 'Appliance Servicing', 'AC gas refill, refrigerator maintenance, washing machine repair', 'Wrench', true),
  ('c0000000-0000-0000-0000-000000000005', 'Carpentry & Woodwork', 'Furniture assembly, door locks, cabinet and bed repairs', 'Hammer', true),
  ('c0000000-0000-0000-0000-000000000006', 'Wall Painting & Damp Proofing', 'Interior wall touch-ups, full room repainting, moisture primer application', 'Paintbrush', true),
  ('c0000000-0000-0000-0000-000000000007', 'Gardening & Lawn Care', 'Balcony garden setup, plant repotting, organic pest treatment, lawn mowing', 'Trees', true),
  ('c0000000-0000-0000-0000-000000000008', 'Professional Chauffeur & Driver', 'Verified personal drivers for daily city commute and outstation travel', 'Car', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  is_active = EXCLUDED.is_active;

-- --------------------------------------------------------------------
-- 3. SEED SERVICES (Specific Works for Every Category)
-- --------------------------------------------------------------------
INSERT INTO services (id, category_id, title, description, base_price, minimum_visit_charge, price_unit, is_active)
VALUES
  -- PLUMBING
  ('s0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Tap Repair & Valve Replacement', 'Fixing dripping taps, replacing mixer valves, and washer fitting.', 250.00, 200.00, 'per_service', true),
  ('s0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Pipeline Leakage & Joint Fix', 'Fixing concealed pipe leaks, installing CPVC/PVC clamps and sealant.', 400.00, 250.00, 'per_hour', true),
  ('s0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'Drainage Blockage & Pipe Unclogging', 'Clearing clogged sink traps, gully traps, and main bathroom drains.', 350.00, 200.00, 'per_service', true),
  ('s0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'Bathroom Sanitary Fixture Installation', 'Installing wall-hung basins, showers, health faucets, and flush tanks.', 500.00, 300.00, 'per_service', true),
  ('s0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'Kitchen Sink & Trap Maintenance', 'Sink waste coupling, bottle trap replacement, and dishwasher inlet setup.', 300.00, 200.00, 'per_service', true),
  ('s0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002', 'Toilet Commode Fitting & Repair', 'Western/Indian commode seat fitting, flush valve overhaul, and wax seal fix.', 450.00, 250.00, 'per_service', true),
  ('s0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000002', 'Overhead Water Tank & Main Line Servicing', 'Tank cleaning, float valve replacement, and booster pump connection.', 800.00, 500.00, 'per_service', true),

  -- ELECTRICAL
  ('s0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000001', 'Switchboard Repair & Socket Replacement', 'Replacing burnt switches, modular sockets, and earthing checks.', 300.00, 200.00, 'per_service', true),
  ('s0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000001', 'Ceiling Fan & Exhaust Fan Installation', 'Assembly and mounting of ceiling fans, wall fans, and kitchen exhaust units.', 250.00, 200.00, 'per_service', true),
  ('s0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000001', 'Light Fixture & Chandelier Fitting', 'Mounting LED battens, decorative hanging lights, and outdoor floodlights.', 350.00, 200.00, 'per_service', true),
  ('s0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000001', 'MCB & Main Breaker Box Repair', 'Diagnosing breaker tripping, replacing MCB/ELCB, and phase balancing.', 450.00, 250.00, 'per_service', true),
  ('s0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000001', 'Emergency Short Circuit Troubleshooting', 'Tracing hidden short circuits, wire burnouts, and restoring power supply.', 600.00, 350.00, 'per_hour', true),
  ('s0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000001', 'Full Room Electrical Wiring', 'Concealed channel chasing, wire pulling, and distribution board setup.', 1200.00, 500.00, 'per_room', true),

  -- CARPENTRY
  ('s0000000-0000-0000-0000-000000000020', 'c0000000-0000-0000-0000-000000000005', 'Door Lock & Handle Fitting', 'Replacing mortise locks, night latches, handles, and cylinder keys.', 300.00, 200.00, 'per_service', true),
  ('s0000000-0000-0000-0000-000000000021', 'c0000000-0000-0000-0000-000000000005', 'Door Hinges & Trimming Repair', 'Adjusting sagging wooden doors, trimming bottoms, and hinge alignment.', 350.00, 200.00, 'per_service', true),
  ('s0000000-0000-0000-0000-000000000022', 'c0000000-0000-0000-0000-000000000005', 'Furniture Assembly & Dismantling', 'Assembling flat-pack beds, wardrobes, study tables, and TV units.', 600.00, 300.00, 'per_service', true),
  ('s0000000-0000-0000-0000-000000000023', 'c0000000-0000-0000-0000-000000000005', 'Modular Kitchen Cabinet & Hinge Fix', 'Replacing soft-close hydraulic hinges, drawer channels, and handles.', 450.00, 250.00, 'per_service', true),

  -- PAINTING
  ('s0000000-0000-0000-0000-000000000030', 'c0000000-0000-0000-0000-000000000006', 'Wall Crack Putty & Touch-up', 'Filling hairline cracks, plaster sanding, and single wall paint touch-up.', 500.00, 300.00, 'per_wall', true),
  ('s0000000-0000-0000-0000-000000000031', 'c0000000-0000-0000-0000-000000000006', 'Full Room Interior Painting', 'Two coats of premium emulsion, ceiling painting, and floor protection.', 2500.00, 1500.00, 'per_room', true),
  ('s0000000-0000-0000-0000-000000000032', 'c0000000-0000-0000-0000-000000000006', 'Damp Proofing & Water Primer Coating', 'Anti-fungal primer coat, seepage seal application on affected inner walls.', 900.00, 500.00, 'per_service', true),

  -- CLEANING
  ('s0000000-0000-0000-0000-000000000040', 'c0000000-0000-0000-0000-000000000003', 'Full 2BHK Deep Cleaning', 'Complete house sanitization, floor scrubbing, window cleaning, balcony wash.', 1800.00, 1500.00, 'per_service', true),
  ('s0000000-0000-0000-0000-000000000041', 'c0000000-0000-0000-0000-000000000003', 'Kitchen Steam Degreasing & Cabinet Clean', 'High-pressure steam cleaning of oil stains, chimney exterior, and cabinets.', 900.00, 600.00, 'per_service', true),
  ('s0000000-0000-0000-0000-000000000042', 'c0000000-0000-0000-0000-000000000003', 'Bathroom Tile & Sanitary Descaling', 'Acid-free tile scrubbing, tap shine polish, and hard water stain removal.', 600.00, 400.00, 'per_service', true),
  ('s0000000-0000-0000-0000-000000000043', 'c0000000-0000-0000-0000-000000000003', 'Sofa & Mattress Shampoo Vacuuming', 'Injection-extraction fabric deep cleaning, stain removal, and sanitization.', 750.00, 500.00, 'per_service', true),

  -- APPLIANCE REPAIR
  ('s0000000-0000-0000-0000-000000000050', 'c0000000-0000-0000-0000-000000000004', 'Split AC Servicing & Chemical Coil Wash', 'Chemical wash of indoor/outdoor coils, filter clean, drain flush, gas test.', 500.00, 350.00, 'per_service', true),
  ('s0000000-0000-0000-0000-000000000051', 'c0000000-0000-0000-0000-000000000004', 'Refrigerator Cooling Diagnosis & Gas Refill', 'Thermostat testing, relay replacement, and R134a/R600a gas top-up.', 650.00, 400.00, 'per_service', true),
  ('s0000000-0000-0000-0000-000000000052', 'c0000000-0000-0000-0000-000000000004', 'Washing Machine Belt & Drum Repair', 'Front/Top load washing machine spin motor fix, belt replacement, and drain valve.', 550.00, 350.00, 'per_service', true),
  ('s0000000-0000-0000-0000-000000000053', 'c0000000-0000-0000-0000-000000000004', 'Geyser Heating Element Replacement', 'Thermostat test, heating coil descaling, and safety valve replacement.', 450.00, 300.00, 'per_service', true),

  -- GARDENING
  ('s0000000-0000-0000-0000-000000000060', 'c0000000-0000-0000-0000-000000000007', 'Lawn Mowing & Hedge Pruning', 'Trimming overgrown grass, shaping garden hedges, and green waste disposal.', 450.00, 300.00, 'per_service', true),
  ('s0000000-0000-0000-0000-000000000061', 'c0000000-0000-0000-0000-000000000007', 'Plant Repotting & Organic Manure Care', 'Soil loosening, organic compost mixing, and repotting potted plants.', 400.00, 250.00, 'per_service', true),

  -- DRIVER SERVICES
  ('s0000000-0000-0000-0000-000000000070', 'c0000000-0000-0000-0000-000000000008', 'Local City Chauffeur (Hourly Duty)', 'Experienced driver for manual/automatic vehicles within city limits.', 350.00, 250.00, 'per_hour', true),
  ('s0000000-0000-0000-0000-000000000071', 'c0000000-0000-0000-0000-000000000008', 'Outstation Trip Chauffeur (Per Day)', 'Police-verified outstation driver for multi-day intercity travel.', 1500.00, 1000.00, 'per_day', true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  minimum_visit_charge = EXCLUDED.minimum_visit_charge,
  is_active = EXCLUDED.is_active;

-- --------------------------------------------------------------------
-- 4. SEED SKILLS
-- --------------------------------------------------------------------
INSERT INTO skills (id, name, description, category_id)
VALUES
  ('sk000000-0000-0000-0000-000000000001', 'Main Switchboard Repair', 'Expertise in 3-phase switchboard and MCB installations', 'c0000000-0000-0000-0000-000000000001'),
  ('sk000000-0000-0000-0000-000000000002', 'Concealed Pipe Fitting', 'Leakage detection and concealed CPVC/PVC fitting', 'c0000000-0000-0000-0000-000000000002'),
  ('sk000000-0000-0000-0000-000000000003', 'Kitchen Degreasing & Sanitization', 'High-pressure steam cleaning and oil stain removal', 'c0000000-0000-0000-0000-000000000003'),
  ('sk000000-0000-0000-0000-000000000004', 'Tap Repair & Washer Fitting', 'Precision tap cartridge and bib cock repair', 'c0000000-0000-0000-0000-000000000002'),
  ('sk000000-0000-0000-0000-000000000005', 'Wall Putty & Moisture Seal', 'Surface preparation and damp-proof primer coating', 'c0000000-0000-0000-0000-000000000006'),
  ('sk000000-0000-0000-0000-000000000006', 'AC Gas Charging & Leak Fix', 'HVAC vacuum test, coil wash, and refrigerant refill', 'c0000000-0000-0000-0000-000000000004'),
  ('sk000000-0000-0000-0000-000000000007', 'Furniture Assembly', 'Assembly of modular wooden beds, wardrobes, and cabinets', 'c0000000-0000-0000-0000-000000000005')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- --------------------------------------------------------------------
-- 5. SEED CERTIFICATIONS
-- --------------------------------------------------------------------
INSERT INTO certifications (id, title, issuing_body, validity_months)
VALUES
  ('crt00000-0000-0000-0000-000000000001', 'National Skill Development Electrical Certification', 'NSDC India', 36),
  ('crt00000-0000-0000-0000-000000000002', 'Cooperative Trade Hygiene & Safety Standard', 'Gujarat State Cooperative Board', 24)
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------
-- 6. SEED AUTH USERS (Controlled Development Test Accounts)
-- --------------------------------------------------------------------
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES
  -- 1. Customer: Prince Patel
  (
    'a0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'customer@example.com',
    '$2a$10$wE0v2XQ2sP0U2V7g/mDq0.3a5Z4jY6xX7Y8Z9a0b1c2d3e4f5g6h',
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Prince Patel","role":"CUSTOMER"}',
    NOW(),
    NOW()
  ),
  -- 2. Worker 1: Ravi Patel (Primary Plumbing Worker)
  (
    'b0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'worker@example.com',
    '$2a$10$wE0v2XQ2sP0U2V7g/mDq0.3a5Z4jY6xX7Y8Z9a0b1c2d3e4f5g6h',
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Ravi Patel","role":"WORKER"}',
    NOW(),
    NOW()
  ),
  -- 3. Worker 2: Hitesh Solanki (Second Plumbing Worker for Ranking)
  (
    'b0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'hitesh.solanki@example.com',
    '$2a$10$wE0v2XQ2sP0U2V7g/mDq0.3a5Z4jY6xX7Y8Z9a0b1c2d3e4f5g6h',
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Hitesh Solanki","role":"WORKER"}',
    NOW(),
    NOW()
  ),
  -- 4. Worker 3: Sanjay Parmar (Painting Worker)
  (
    'b0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'sanjay.parmar@example.com',
    '$2a$10$wE0v2XQ2sP0U2V7g/mDq0.3a5Z4jY6xX7Y8Z9a0b1c2d3e4f5g6h',
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Sanjay Parmar","role":"WORKER"}',
    NOW(),
    NOW()
  ),
  -- 5. Worker 4: Sunita Sharma (Cleaning Worker)
  (
    'b0000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'sunita.sharma@example.com',
    '$2a$10$wE0v2XQ2sP0U2V7g/mDq0.3a5Z4jY6xX7Y8Z9a0b1c2d3e4f5g6h',
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Sunita Sharma","role":"WORKER"}',
    NOW(),
    NOW()
  ),
  -- 6. Federation Admin: Vikram Shah
  (
    'f0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'federation@example.com',
    '$2a$10$wE0v2XQ2sP0U2V7g/mDq0.3a5Z4jY6xX7Y8Z9a0b1c2d3e4f5g6h',
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Vikram Shah","role":"FEDERATION_ADMIN"}',
    NOW(),
    NOW()
  ),
  -- 7. Super Admin: System Administrator
  (
    's0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@example.com',
    '$2a$10$wE0v2XQ2sP0U2V7g/mDq0.3a5Z4jY6xX7Y8Z9a0b1c2d3e4f5g6h',
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"System Administrator","role":"SUPER_ADMIN"}',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- --------------------------------------------------------------------
-- 7. SEED PROFILES
-- --------------------------------------------------------------------
INSERT INTO profiles (id, role, full_name, phone, email, is_active)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'CUSTOMER', 'Prince Patel', '+919876543210', 'customer@example.com', true),
  ('b0000000-0000-0000-0000-000000000001', 'WORKER', 'Ravi Patel', '+919825011021', 'worker@example.com', true),
  ('b0000000-0000-0000-0000-000000000002', 'WORKER', 'Hitesh Solanki', '+919898044512', 'hitesh.solanki@example.com', true),
  ('b0000000-0000-0000-0000-000000000003', 'WORKER', 'Sanjay Parmar', '+919898177632', 'sanjay.parmar@example.com', true),
  ('b0000000-0000-0000-0000-000000000004', 'WORKER', 'Sunita Sharma', '+919723011988', 'sunita.sharma@example.com', true),
  ('f0000000-0000-0000-0000-000000000001', 'FEDERATION_ADMIN', 'Vikram Shah', '+919825000001', 'federation@example.com', true),
  ('s0000000-0000-0000-0000-000000000001', 'SUPER_ADMIN', 'System Administrator', '+919800000000', 'admin@example.com', true)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  is_active = EXCLUDED.is_active;

-- --------------------------------------------------------------------
-- 8. SEED CUSTOMER ADDRESSES (Prince Patel - 2 Locations)
-- --------------------------------------------------------------------
INSERT INTO addresses (id, profile_id, title, address_line1, address_line2, city, state, postal_code, latitude, longitude, is_default)
VALUES
  (
    'addr0000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Home',
    'B-302 Satellite Towers',
    'Near Iscon Cross Road',
    'Ahmedabad',
    'Gujarat',
    '380015',
    23.0300,
    72.5178,
    true
  ),
  (
    'addr0000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Office',
    'Suite 804, Pinnacle Business Park',
    'SG Highway, Prahlad Nagar',
    'Ahmedabad',
    'Gujarat',
    '380051',
    23.0140,
    72.5080,
    false
  )
ON CONFLICT (id) DO UPDATE SET
  profile_id = EXCLUDED.profile_id,
  address_line1 = EXCLUDED.address_line1,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  postal_code = EXCLUDED.postal_code,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  is_default = EXCLUDED.is_default;

-- --------------------------------------------------------------------
-- 9. SEED WORKERS (4 Active Verified Trade Workers)
-- --------------------------------------------------------------------
INSERT INTO workers (
  id, profile_id, federation_id, account_status, availability_status, verification_status,
  profession, hourly_rate, experience_years, service_radius_km, current_latitude, current_longitude
)
VALUES
  -- 1. Ravi Patel (Plumbing)
  (
    'w0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'ACTIVE',
    'AVAILABLE',
    'verified',
    'Plumbing',
    350.00,
    7,
    15.00,
    23.0325,
    72.5205
  ),
  -- 2. Hitesh Solanki (Plumbing Senior)
  (
    'w0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'ACTIVE',
    'AVAILABLE',
    'verified',
    'Plumbing',
    400.00,
    12,
    15.00,
    23.0380,
    72.5590
  ),
  -- 3. Sanjay Parmar (Painting)
  (
    'w0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'ACTIVE',
    'AVAILABLE',
    'verified',
    'Wall Painting & Damp Proofing',
    500.00,
    9,
    15.00,
    23.0340,
    72.4640
  ),
  -- 4. Sunita Sharma (Cleaning)
  (
    'w0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'ACTIVE',
    'AVAILABLE',
    'verified',
    'Deep House Cleaning',
    450.00,
    6,
    15.00,
    23.0300,
    72.5180
  )
ON CONFLICT (id) DO UPDATE SET
  profile_id = EXCLUDED.profile_id,
  federation_id = EXCLUDED.federation_id,
  account_status = EXCLUDED.account_status,
  availability_status = EXCLUDED.availability_status,
  verification_status = EXCLUDED.verification_status,
  profession = EXCLUDED.profession,
  hourly_rate = EXCLUDED.hourly_rate,
  experience_years = EXCLUDED.experience_years,
  current_latitude = EXCLUDED.current_latitude,
  current_longitude = EXCLUDED.current_longitude;

-- --------------------------------------------------------------------
-- 10. SEED WORKER SKILLS (Bridge Relationships)
-- --------------------------------------------------------------------
INSERT INTO worker_skills (id, worker_id, skill_id, proficiency_level)
VALUES
  ('ws000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000001', 'sk000000-0000-0000-0000-000000000002', 'master'),
  ('ws000000-0000-0000-0000-000000000002', 'w0000000-0000-0000-0000-000000000001', 'sk000000-0000-0000-0000-000000000004', 'master'),
  ('ws000000-0000-0000-0000-000000000003', 'w0000000-0000-0000-0000-000000000002', 'sk000000-0000-0000-0000-000000000002', 'expert'),
  ('ws000000-0000-0000-0000-000000000004', 'w0000000-0000-0000-0000-000000000003', 'sk000000-0000-0000-0000-000000000005', 'master'),
  ('ws000000-0000-0000-0000-000000000005', 'w0000000-0000-0000-0000-000000000004', 'sk000000-0000-0000-0000-000000000003', 'expert')
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------
-- 11. SEED WORKER AVAILABILITY (Weekly Schedules 08:00 - 20:00)
-- --------------------------------------------------------------------
INSERT INTO worker_availability (id, worker_id, day_of_week, start_time, end_time, is_available)
VALUES
  -- Ravi Patel (w1)
  ('wa000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000001', 0, '08:00:00', '20:00:00', true),
  ('wa000000-0000-0000-0000-000000000002', 'w0000000-0000-0000-0000-000000000001', 1, '08:00:00', '20:00:00', true),
  ('wa000000-0000-0000-0000-000000000003', 'w0000000-0000-0000-0000-000000000001', 2, '08:00:00', '20:00:00', true),
  ('wa000000-0000-0000-0000-000000000004', 'w0000000-0000-0000-0000-000000000001', 3, '08:00:00', '20:00:00', true),
  ('wa000000-0000-0000-0000-000000000005', 'w0000000-0000-0000-0000-000000000001', 4, '08:00:00', '20:00:00', true),
  ('wa000000-0000-0000-0000-000000000006', 'w0000000-0000-0000-0000-000000000001', 5, '08:00:00', '20:00:00', true),
  ('wa000000-0000-0000-0000-000000000007', 'w0000000-0000-0000-0000-000000000001', 6, '08:00:00', '20:00:00', true),

  -- Hitesh Solanki (w2)
  ('wa000000-0000-0000-0000-000000000011', 'w0000000-0000-0000-0000-000000000002', 0, '08:00:00', '20:00:00', true),
  ('wa000000-0000-0000-0000-000000000012', 'w0000000-0000-0000-0000-000000000002', 1, '08:00:00', '20:00:00', true),
  ('wa000000-0000-0000-0000-000000000013', 'w0000000-0000-0000-0000-000000000002', 2, '08:00:00', '20:00:00', true),
  ('wa000000-0000-0000-0000-000000000014', 'w0000000-0000-0000-0000-000000000002', 3, '08:00:00', '20:00:00', true),
  ('wa000000-0000-0000-0000-000000000015', 'w0000000-0000-0000-0000-000000000002', 4, '08:00:00', '20:00:00', true),
  ('wa000000-0000-0000-0000-000000000016', 'w0000000-0000-0000-0000-000000000002', 5, '08:00:00', '20:00:00', true),
  ('wa000000-0000-0000-0000-000000000017', 'w0000000-0000-0000-0000-000000000002', 6, '08:00:00', '20:00:00', true)
ON CONFLICT (id) DO NOTHING;
