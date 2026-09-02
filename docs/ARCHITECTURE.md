# Cooperative Gig Services Platform - System Architecture

## 1. Overview
The Cooperative Gig Services Platform for Household & Community Services is a digital marketplace owned and operated by worker cooperatives and federations. Built on Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, and Supabase (PostgreSQL), the application enforces strict layer separation, role isolation, and a single source of truth for business logic.

---

## 2. Technology Stack

- **Framework**: Next.js 14 (App Router, ES Modules)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS & shadcn/ui
- **Icons**: Lucide React
- **Form & Validation**: React Hook Form & Zod
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, SSR Cookies, Realtime, Storage)
- **Internationalization**: `lib/i18n` (English, Gujarati, Hindi)

---

## 3. Layered Directory Architecture

```
├── app/
│   ├── (auth)/             # Auth routes (login, register, verify, pending)
│   ├── (dashboard)/        # Role routes (super-admin, federation-admin, worker, customer)
│   ├── api/                # Next.js API route handlers
│   ├── design-system/      # Showcase page for UI primitives
│   └── globals.css         # Design tokens & color variables
├── components/
│   ├── ui/                 # 21 Primitive UI components (button, card, badge, etc.)
│   ├── layout/             # Shell components (role-shell, top-navbar, desktop-sidebar)
│   ├── status/             # Status badges & timeline UI
│   ├── feedback/           # Loading, empty, & error state components
│   ├── data-display/       # Cards, worker profiles, invoices, map components
│   └── navigation/         # Mobile bottom bar & user menu
├── config/                 # Navigation, permissions, service charges, app settings
├── constants/              # Roles, booking states, payment states (SINGLE SOURCE OF TRUTH)
├── features/               # 13 Domain business modules (bookings, matching, pricing, etc.)
├── lib/
│   ├── auth/               # Centralized auth API & RBAC guards
│   ├── errors/             # Custom AppError classes
│   ├── formatters/         # INR currency, date, distance formatters
│   ├── i18n/               # Localization dictionaries (en, gu, hi)
│   ├── supabase/           # Browser, server, and admin Supabase clients
│   └── validation/         # Reusable Zod schemas
├── supabase/
│   ├── functions/          # Edge functions documentation
│   ├── migrations/         # PostgreSQL schema & triggers
│   ├── policies/           # Row Level Security SQL policies
│   ├── seed/               # SQL seed script
│   └── types/              # Generated Database TypeScript definitions
└── types/                  # Canonical domain TypeScript interfaces
```

---

## 4. Architectural Rules

1. **Feature Module Isolation**: Business logic resides exclusively inside `features/[feature-name]/services/`. Role dashboards compose feature modules rather than duplicating logic.
2. **Database Single Source of Truth**: All domain entities map directly to PostgreSQL tables via `supabase/types/database.types.ts` and `@/types`.
3. **Defense in Depth**: Route protection is enforced at both the HTTP/Middleware level and PostgreSQL RLS level.
