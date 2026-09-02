# Parallel Git Workflow & CI/CD Guidelines

## 1. Branch Strategy

The project uses a structured multi-branch workflow for parallel development across 6 developers:

- `main`: Production-ready, stable codebase.
- `develop`: Shared integration branch for active development.
- Feature Branches:
  - `feature/auth` (Developer 1)
  - `feature/super-admin` (Developer 2)
  - `feature/federation-admin` (Developer 3)
  - `feature/worker` (Developer 4)
  - `feature/customer` (Developer 5)
  - `feature/shared-backend` (Developer 6)

---

## 2. Pull Request (PR) Process

1. **Create Branch**: Always branch out from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-role
   ```
2. **Commit Standard**: Write meaningful commit messages: `feat(customer): add booking request form`.
3. **Pre-PR Verification**: Run mandatory verification scripts locally:
   ```bash
   npm run lint
   npm run build
   ```
4. **Submit PR**: Open PR targeting `develop`.
5. **Code Review**: At least one peer review required. Shared infrastructure changes must be approved by **Developer 6 (Integration Lead)**.

---

## 3. Merge & Conflict Resolution Rules

- **Integration Lead Ownership**: **Developer 6** is the sole authorized team member to resolve merge conflicts in shared files (`constants/`, `types/`, `lib/`, `components/ui/`, `middleware.ts`).
- **No Direct Push to Main/Develop**: All pushes to `main` and `develop` are blocked.
