# Parallel Git Development Guidelines & Governance Rules

## 1. Core Principles
To ensure seamless, conflict-free parallel development across 6 developers, all team members must strictly adhere to the following governance rules:

---

## 2. Eight Mandatory Governance Rules

1. **No Business Logic Duplication**: Shared business rules, matching, pricing formulas, and payment processing must be consumed from `features/*/services/`. Developers MUST NOT write custom pricing or state transition logic in dashboard components.
2. **State Names are Immutable**: Booking lifecycle states (`REQUEST_SENT`, `WORKER_REVIEWING`, `BOOKING_CONFIRMED`, etc.) and role names (`SUPER_ADMIN`, `FEDERATION_ADMIN`, `WORKER`, `CUSTOMER`) are canonical string constants in `@/constants`. Developers cannot rename, add, or alter state strings independently.
3. **Database Schema Coordination**: Schema changes, new tables, or RLS policy updates must be coordinated through **Developer 6 (Integration Lead)** and submitted via a Feature Change Proposal.
4. **Mandatory UI Primitive Reuse**: Always reuse primitive components from `components/ui/` (`Button`, `Card`, `Badge`, `Input`, `Dialog`, etc.). Writing redundant custom Tailwind buttons or forms is forbidden.
5. **Role Directory Boundaries**: Role developers must restrict their edits to their assigned directories (e.g. Developer 5 edits only `features/customer` and `app/(dashboard)/customer`). Never modify code in another developer's role directory.
6. **No Casual Editing of Shared Files**: Shared infrastructure (`constants/`, `types/`, `lib/`, `middleware.ts`, `components/ui/`) is locked. Modifications require a PR review and approval from Developer 6.
7. **Strict PR Workflow**: All code changes must be submitted via Git feature branches (`feature/auth`, `feature/customer`, etc.) targeting `develop`. Pushing directly to `main` or `develop` is strictly blocked.
8. **Single Integration Conflict Owner**: **Developer 6** is the sole designated authority responsible for resolving merge conflicts on shared files during PR integrations into `develop`.

---

## 3. Code Standards & Linting

- All code must compile cleanly under TypeScript strict mode.
- Run `npm run lint` before creating any PR. Zero ESLint warnings or errors permitted.
- Use `useTranslation()` from `@/lib/i18n` for user-facing UI text. Do NOT hardcode UI text.
- Use `formatINR` from `@/lib/formatters` for currency display. Do NOT write manual `"Rs."` strings.
