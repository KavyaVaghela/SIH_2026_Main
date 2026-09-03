-- ====================================================================
-- COOPERATIVE GIG SERVICES PLATFORM - INITIAL DATABASE SCHEMA
-- Migration: 00001_initial_schema.sql
-- Description: Core ENUMs, 26 relational tables, constraints, and indexes.
-- Uses PostgreSQL built-in gen_random_uuid() for primary key generation.
-- ====================================================================

-- ====================================================================
-- 1. CUSTOM ENUM TYPES
-- ====================================================================

CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN',
  'FEDERATION_ADMIN',
  'WORKER',
  'CUSTOMER'
);

CREATE TYPE worker_account_status AS ENUM (
  'ACTIVE',
  'DEACTIVATED'
);

CREATE TYPE worker_availability_status AS ENUM (
  'AVAILABLE',
  'BUSY',
  'UNAVAILABLE'
);

CREATE TYPE worker_verification_status AS ENUM (
  'pending_verification',
  'verified',
  'suspended'
);

CREATE TYPE booking_status AS ENUM (
  'REQUEST_SENT',
  'WORKER_REVIEWING',
  'WORKER_INTERESTED',
  'CUSTOMER_CONFIRMATION_PENDING',
  'BOOKING_CONFIRMED',
  'WORKER_ACCEPTED',
  'ON_THE_WAY',
  'ARRIVED',
  'OTP_VERIFIED',
  'SERVICE_STARTED',
  'SERVICE_COMPLETED',
  'BILL_GENERATED',
  'PAYMENT_PENDING',
  'PAYMENT_RECEIVED',
  'BOOKING_COMPLETED',
  'CANCELLED'
);

CREATE TYPE payment_status AS ENUM (
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED'
);

CREATE TYPE invoice_status AS ENUM (
  'draft',
  'issued',
  'paid',
  'cancelled',
  'overdue'
);

CREATE TYPE complaint_status AS ENUM (
  'OPEN',
  'IN_REVIEW',
  'RESOLVED'
);

CREATE TYPE application_status AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE certification_status AS ENUM (
  'VERIFIED',
  'EXPIRING_SOON',
  'EXPIRED'
);

-- ====================================================================
-- 2. CORE RELATIONAL TABLES (26 TABLES)
-- ====================================================================

-- 1. FEDERATIONS (Cooperative Federation Units)
CREATE TABLE federations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  gst_number VARCHAR(20) UNIQUE,
  registration_number VARCHAR(100) NOT NULL UNIQUE,
  state VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  service_region TEXT,
  official_documents JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PROFILES (Extended Identity referencing Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'CUSTOMER',
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ADDRESSES (Geocoded Locations)
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL DEFAULT 'Home',
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. WORKERS (Worker Profile & Cooperative Association)
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  federation_id UUID NOT NULL REFERENCES federations(id) ON DELETE RESTRICT,
  account_status worker_account_status NOT NULL DEFAULT 'ACTIVE',
  availability_status worker_availability_status NOT NULL DEFAULT 'UNAVAILABLE',
  verification_status worker_verification_status NOT NULL DEFAULT 'pending_verification',
  profession VARCHAR(100),
  hourly_rate NUMERIC(10, 2) NOT NULL CHECK (hourly_rate >= 0),
  experience_years INTEGER NOT NULL DEFAULT 0 CHECK (experience_years >= 0),
  service_radius_km NUMERIC(5, 2) NOT NULL DEFAULT 15.00 CHECK (service_radius_km > 0),
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_latitude DOUBLE PRECISION,
  current_longitude DOUBLE PRECISION,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SERVICE CATEGORIES
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_name VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. SERVICES (Master Service Catalog)
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE RESTRICT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  base_price NUMERIC(10, 2) NOT NULL CHECK (base_price >= 0),
  minimum_visit_charge NUMERIC(10, 2) NOT NULL DEFAULT 200.00 CHECK (minimum_visit_charge >= 0),
  price_unit VARCHAR(50) NOT NULL DEFAULT 'per_hour',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. SKILLS
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. WORKER SKILLS (Bridge)
CREATE TABLE worker_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
  proficiency_level VARCHAR(50) NOT NULL DEFAULT 'intermediate',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_worker_skill UNIQUE (worker_id, skill_id)
);

-- 9. CERTIFICATIONS
CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  issuing_body VARCHAR(255) NOT NULL,
  validity_months INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. WORKER CERTIFICATIONS
CREATE TABLE worker_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  certification_id UUID NOT NULL REFERENCES certifications(id) ON DELETE RESTRICT,
  certificate_number VARCHAR(100),
  issue_date DATE NOT NULL,
  expiry_date DATE,
  status certification_status NOT NULL DEFAULT 'VERIFIED',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_worker_cert UNIQUE (worker_id, certification_id)
);

-- 11. WORKER AVAILABILITY (Recurring Weekly Schedule)
CREATE TABLE worker_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_time_order CHECK (end_time > start_time)
);

-- 12. BOOKINGS (Core Service Bookings)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  federation_id UUID NOT NULL REFERENCES federations(id) ON DELETE RESTRICT,
  address_id UUID NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,
  status booking_status NOT NULL DEFAULT 'REQUEST_SENT',
  problem_description TEXT,
  problem_photo_url TEXT,
  otp_code VARCHAR(6),
  scheduled_start_at TIMESTAMPTZ NOT NULL,
  scheduled_end_at TIMESTAMPTZ NOT NULL,
  actual_start_at TIMESTAMPTZ,
  actual_end_at TIMESTAMPTZ,
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  platform_fee NUMERIC(10, 2) NOT NULL CHECK (platform_fee >= 0),
  worker_earnings NUMERIC(10, 2) NOT NULL CHECK (worker_earnings >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. BOOKING STATUS HISTORY (Audit Trail)
CREATE TABLE booking_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  previous_status booking_status,
  new_status booking_status NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. JOB REQUESTS (Custom Customer Job Requests)
CREATE TABLE job_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  preferred_schedule TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. WORKER ESTIMATES
CREATE TABLE worker_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_request_id UUID NOT NULL REFERENCES job_requests(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  estimated_amount NUMERIC(10, 2) NOT NULL CHECK (estimated_amount >= 0),
  estimated_hours NUMERIC(5, 2),
  notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. INVOICES
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  federation_id UUID NOT NULL REFERENCES federations(id) ON DELETE RESTRICT,
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  platform_fee NUMERIC(10, 2) NOT NULL CHECK (platform_fee >= 0),
  tax_amount NUMERIC(10, 2) NOT NULL CHECK (tax_amount >= 0),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  status invoice_status NOT NULL DEFAULT 'issued',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. INVOICE ITEMS
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. PAYMENTS
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number VARCHAR(50) NOT NULL UNIQUE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  gateway_provider VARCHAR(50) NOT NULL DEFAULT 'razorpay',
  gateway_order_id VARCHAR(100),
  gateway_payment_id VARCHAR(100),
  status payment_status NOT NULL DEFAULT 'PENDING',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. REVIEWS
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. COMPLAINTS (Dispute & Grievance Tracking)
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_number VARCHAR(50) NOT NULL UNIQUE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  raised_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  status complaint_status NOT NULL DEFAULT 'OPEN',
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. WELFARE RECORDS (Worker Cooperative Welfare Fund)
CREATE TABLE welfare_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  federation_id UUID NOT NULL REFERENCES federations(id) ON DELETE RESTRICT,
  fund_type VARCHAR(100) NOT NULL DEFAULT 'health_and_pension',
  contribution_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (contribution_amount >= 0),
  subsidy_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (subsidy_amount >= 0),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. INSURANCE RECORDS
CREATE TABLE insurance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  policy_number VARCHAR(100) NOT NULL UNIQUE,
  provider_name VARCHAR(255) NOT NULL,
  coverage_amount NUMERIC(12, 2) NOT NULL CHECK (coverage_amount > 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 24. PROJECT REQUESTS (Community & Bulk Gig Projects)
CREATE TABLE project_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  federation_id UUID NOT NULL REFERENCES federations(id) ON DELETE RESTRICT,
  project_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  total_budget NUMERIC(12, 2) CHECK (total_budget >= 0),
  status VARCHAR(50) NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 25. PROJECT REQUIREMENTS
CREATE TABLE project_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_request_id UUID NOT NULL REFERENCES project_requests(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
  required_workers_count INTEGER NOT NULL DEFAULT 1 CHECK (required_workers_count > 0),
  estimated_duration_days INTEGER CHECK (estimated_duration_days > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 26. PROJECT ALLOCATIONS
CREATE TABLE project_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_request_id UUID NOT NULL REFERENCES project_requests(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES project_requirements(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE RESTRICT,
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(50) NOT NULL DEFAULT 'assigned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 3. INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ====================================================================

-- Profiles & Location Filtering Indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_addresses_profile_id ON addresses(profile_id);
CREATE INDEX idx_addresses_lat_lng ON addresses(latitude, longitude);

-- Worker Lookup Indexes
CREATE INDEX idx_workers_federation_id ON workers(federation_id);
CREATE INDEX idx_workers_account_status ON workers(account_status);
CREATE INDEX idx_workers_availability_status ON workers(availability_status);
CREATE INDEX idx_workers_verification_status ON workers(verification_status);
CREATE INDEX idx_workers_lat_lng ON workers(current_latitude, current_longitude);

-- Service & Skill Lookup Indexes
CREATE INDEX idx_services_category_id ON services(category_id, is_active);
CREATE INDEX idx_worker_skills_worker ON worker_skills(worker_id);
CREATE INDEX idx_worker_skills_skill ON worker_skills(skill_id);

-- Booking Lookup Indexes
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_worker_id ON bookings(worker_id);
CREATE INDEX idx_bookings_federation_id ON bookings(federation_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_scheduled ON bookings(scheduled_start_at);

-- Invoice & Payment Indexes
CREATE INDEX idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id, status);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Notification, Complaint, & Project Indexes
CREATE INDEX idx_notifications_unread ON notifications(profile_id, is_read);
CREATE INDEX idx_complaints_raised_by ON complaints(raised_by, status);
CREATE INDEX idx_project_requests_status ON project_requests(status);
