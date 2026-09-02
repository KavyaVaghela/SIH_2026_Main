# Team Onboarding & Handoff Guide

Welcome to the **Cooperative Gig Services Platform for Household & Community Services** engineering team. This handbook is the definitive guide for setting up your local development environment and contributing safely to the repository.

---

## 1. How to Clone the Repository

```bash
git clone https://github.com/your-org/SIH_2026_Main.git
cd SIH_2026_Main
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Environment Setup

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your local configuration values in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_MAP_API_KEY=your-map-api-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

> **WARNING**: `SUPABASE_SERVICE_ROLE_KEY` is a secret. Never expose or commit this key to client components or public Git branches!

---

## 4. Supabase Setup

Push database migrations and seed default data to your Supabase instance:

```bash
# Push SQL migrations
npx supabase db push

# (Optional) Seed default categories, skills, and federations
npx supabase db reset
```

---

## 5. Running the Local Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
To inspect the shared Design System component showcase, visit [http://localhost:3000/design-system](http://localhost:3000/design-system).

---

## 6. Git Branching Strategy

Each developer works on a dedicated role feature branch:

| Developer | Role Subsystem | Assigned Git Branch |
|---|---|---|
| **Developer 1** | Auth & Registration | `feature/auth` |
| **Developer 2** | Super Admin Dashboard | `feature/super-admin` |
| **Developer 3** | Federation Admin Dashboard | `feature/federation-admin` |
| **Developer 4** | Worker Portal & Mobile View | `feature/worker` |
| **Developer 5** | Customer Portal & Mobile View | `feature/customer` |
| **Developer 6** | Shared Infrastructure & Backend | `feature/shared-backend` |

Create your branch from `develop`:
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-assigned-branch
```

---

## 7. Ownership & Folder Boundaries

- **Developer 1**: Edit ONLY `features/auth/` and `app/(auth)/`.
- **Developer 2**: Edit ONLY `features/super-admin/` and `app/(dashboard)/super-admin/`.
- **Developer 3**: Edit ONLY `features/federation-admin/` and `app/(dashboard)/federation-admin/`.
- **Developer 4**: Edit ONLY `features/worker/` and `app/(dashboard)/worker/`.
- **Developer 5**: Edit ONLY `features/customer/` and `app/(dashboard)/customer/`.
- **Developer 6**: Manages shared modules (`constants/`, `types/`, `config/`, `lib/`, `supabase/`, `components/ui/`).

---

## 8. Coding Standards & Mandatory Rules

1. **No Logic Duplication**: Use shared domain services from `features/*/services/`. Do not write inline price or state logic.
2. **Reuse UI Primitives**: Import components from `@/components/ui` (`Button`, `Card`, `Badge`, `Input`, `Dialog`, etc.).
3. **No Hardcoded UI Strings**: Use `useTranslation()` from `@/lib/i18n`.
4. **No Manual Currency Formatting**: Always use `formatINR()` from `@/lib/formatters`.
5. **No Custom State Names**: Use `@/constants` (`USER_ROLES`, `BOOKING_STATUS`, `PAYMENT_STATUS`).

---

## 9. Pull Request (PR) Rules

Before creating a PR targeting `develop`:
1. Run local verification:
   ```bash
   npm run lint
   npm run build
   ```
2. Both commands MUST pass with **0 errors**.
3. Fill out the **Feature Change Proposal** template if modifying shared APIs or database schemas.

---

## 10. Contact for Shared Changes

For any changes to shared constants, database tables, or middleware route protection, contact **Developer 6 (Shared Infrastructure & Integration Lead)**.
