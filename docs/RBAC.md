# Role-Based Access Control (RBAC) & Security Policy

## 1. Platform Roles
The system enforces exactly four platform roles. No derived or custom roles are permitted:

1. **`SUPER_ADMIN`**: State-level system administrators. Full read/write access across all cooperatives, federations, workers, bookings, and audit logs.
2. **`FEDERATION_ADMIN`**: Cooperative federation managers. Access restricted to workers, bookings, welfare funds, and complaints within their assigned `federation_id`.
3. **`WORKER`**: Cooperative gig workers. Access restricted to their own worker profile, schedule, assigned bookings, reviews, and welfare fund records.
4. **`CUSTOMER`**: Household & business customers. Access restricted to their own customer profile, saved addresses, created bookings, invoices, reviews, and complaints.

---

## 2. Next.js Middleware Route Protection (`middleware.ts`)

Next.js App Router Middleware guards routes automatically:

- `/super-admin/*` ➔ Restricted strictly to `SUPER_ADMIN`.
- `/federation-admin/*` ➔ Restricted to `FEDERATION_ADMIN` and `SUPER_ADMIN`.
- `/worker/*` ➔ Restricted to `WORKER` and `SUPER_ADMIN`.
- `/customer/*` ➔ Restricted to `CUSTOMER` and `SUPER_ADMIN`.

**Cross-Role Access Blocked**: `CUSTOMER` accessing `/worker` or `/super-admin` is redirected to `/customer`.

---

## 3. Database RLS Strategy (`supabase/policies/rls_policies.sql`)

Security is enforced independently at the PostgreSQL layer via Row Level Security (RLS):

- `auth.uid() = profile_id` for individual user records.
- `federation_id` matching for federation admin queries.
- Public read access permitted only for active service categories (`is_active = TRUE`) and verified workers (`status = 'verified'`).
