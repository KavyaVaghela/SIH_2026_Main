# Team Ownership & File Scope Assignment

## 1. Team Directory Matrix

| Role / Scope | Primary Assigned Developer | Owned Directories |
|---|---|---|
| **Authentication & Registration** | **Developer 1** | `features/auth/`, `app/(auth)/` |
| **Super Admin Dashboard** | **Developer 2** | `features/super-admin/`, `app/(dashboard)/super-admin/` |
| **Federation Admin Dashboard** | **Developer 3** | `features/federation-admin/`, `app/(dashboard)/federation-admin/` |
| **Worker Portal & Mobile View** | **Developer 4** | `features/worker/`, `app/(dashboard)/worker/` |
| **Customer Portal & Mobile View**| **Developer 5** | `features/customer/`, `app/(dashboard)/customer/` |
| **Shared Backend & Infrastructure**| **Developer 6** | `constants/`, `types/`, `config/`, `lib/`, `supabase/`, `components/` |

---

## 2. Boundary Rules

1. **Role Boundary Rule**: Developers 1 through 5 MUST stay within their assigned `features/[role]/` and `app/(dashboard)/[role]/` directories.
2. **No Editing Other Role Folders**: A developer working on `features/customer` MUST NOT edit files in `features/worker` or `features/super-admin`.
3. **Shared File Modification**: Shared files (`constants/`, `types/`, `lib/`, `middleware.ts`) can only be modified by **Developer 6** or through a formal Feature Change Proposal approved by Developer 6.

---

## 3. Mandatory Feature Change Proposal Template

Before requesting a change to shared services or database schemas, developers must submit this proposal in their PR description:

```markdown
### Feature Change Proposal
- **Owner**: [Developer Name]
- **Feature Goal**: [Brief description]
- **Database Tables Affected**: [e.g., bookings, payments]
- **Shared Services Affected**: [e.g., BookingService, PaymentService]
- **Dashboards Affected**: [e.g., Customer, Worker]
- **Permissions Required**: [e.g., WORKER, CUSTOMER]
- **State Changes**: [e.g., transition from WORKER_ACCEPTED to ON_THE_WAY]
```
