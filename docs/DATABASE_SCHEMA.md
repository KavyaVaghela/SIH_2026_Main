# Database Schema Documentation

## 1. Overview
The database uses PostgreSQL managed by Supabase. Identity is anchored to `auth.users`, with extended application profile data stored in `public.profiles`. The database contains 26 core tables, 7 custom ENUM types, automated triggers, spatial indexes, and Row Level Security policies across all tables.

---

## 2. Custom ENUM Types

1. `user_role`: `'SUPER_ADMIN'`, `'FEDERATION_ADMIN'`, `'WORKER'`, `'CUSTOMER'`
2. `worker_status`: `'pending_verification'`, `'verified'`, `'suspended'`
3. `availability_status`: `'available'`, `'busy'`, `'offline'`
4. `booking_status`: `'pending'`, `'assigned'`, `'in_progress'`, `'completed'`, `'cancelled'`
5. `payment_status`: `'unpaid'`, `'paid'`, `'refunded'`, `'failed'`
6. `invoice_status`: `'draft'`, `'issued'`, `'paid'`, `'cancelled'`, `'overdue'`
7. `complaint_status`: `'submitted'`, `'under_review'`, `'resolved'`, `'dismissed'`

---

## 3. Core Tables Summary (26 Tables)

1. `federations`: Cooperative federations and state boards.
2. `profiles`: Extended user accounts referencing `auth.users(id)`.
3. `addresses`: Customer and worker physical addresses.
4. `workers`: Worker profile details, hourly rates, experience, and geolocations.
5. `service_categories`: High-level categories (Electrical, Plumbing, Cleaning).
6. `services`: Specific service catalog items with INR base prices.
7. `skills`: Skill master definitions mapped to categories.
8. `worker_skills`: Junction mapping worker skills and proficiency.
9. `certifications`: Industry certifications (NSDC, State Boards).
10. `worker_certifications`: Worker certificate details and verification status.
11. `worker_availability`: Weekly availability slots per day.
12. `bookings`: Master booking lifecycle record with INR financials.
13. `booking_status_history`: Audit trail for booking status changes.
14. `job_requests`: Custom job requests submitted by customers.
15. `worker_estimates`: Estimates submitted by workers for job requests.
16. `invoices`: Financial invoices issued for bookings.
17. `invoice_items`: Line items for invoices.
18. `payments`: Payment gateway transactions (Razorpay integration).
19. `reviews`: Customer ratings (1-5) and comments.
20. `complaints`: Grievances submitted by customers or workers.
21. `welfare_records`: Cooperative welfare contributions and matching subsidies.
22. `insurance_records`: Worker insurance policy coverage.
23. `notifications`: In-app notification alerts per profile.
24. `project_requests`: Bulk commercial project requests.
25. `project_requirements`: Skill & headcount requirements per project.
26. `project_allocations`: Worker assignments for bulk projects.

---

## 4. Key Constraints & Indexes

- **Spatial Indexes**: `idx_workers_lat_lng` and `idx_addresses_lat_lng` for radius matching.
- **Foreign Key Cascade**: `profiles(id)` cascades on `auth.users(id)` deletion. `bookings` restrict deletion of active `services` and `federations`.
- **Identity Trigger**: `handle_new_user()` automatically inserts a row into `public.profiles` whenever a user registers in `auth.users`.
