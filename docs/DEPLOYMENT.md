# Deployment & Environment Configuration Guide

## 1. Environment Variables (`.env.example`)

Ensure the following variables are configured in `.env.local` and your deployment host (Vercel):

```env
# Client Accessible Variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_MAP_API_KEY=your-map-api-key

# Server Secrets (NEVER EXPOSE TO CLIENT)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

---

## 2. Supabase Migration Execution

Apply database migrations in order:

```bash
npx supabase db push
```

Migration execution sequence:
1. `supabase/migrations/00001_initial_schema.sql` (Tables & Indexes)
2. `supabase/migrations/00002_triggers_and_functions.sql` (Triggers & Auth User Handler)
3. `supabase/policies/rls_policies.sql` (Row Level Security Policies)
4. `supabase/seed/seed.sql` (Initial Seed Data)

---

## 3. Production Build & Verification

```bash
npm run lint
npm run build
npm run start
```
