# Hostel Management System — Frontend

The Next.js 16 frontend application for Team 12's Hostel Management System (HMS) at PES University.

## 1. Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 16.4.5 | React framework, App Router, and `/api/v1/*` proxy rewrites |
| React 19.3.0 | UI component architecture |
| TypeScript 5 | Strict static typing across components, validation, and API contracts |
| Tailwind CSS v4 | Utility-first styling with navy/slate/charcoal theme tokens |
| shadcn/ui & Base UI | Accessible UI primitives |
| Lucide React | Iconography |
| next-themes | Persistent dark and light theme switching |
| Node.js Test Runner + Jiti | Automated component rendering, auth, RBAC & workflow validation suite |

---

## 2. Environment Variables

Create `frontend/.env.local` only if overriding defaults (do not commit `.env*` files):

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `"/api/v1"` | Base URL for HMS REST API requests. |
| `BACKEND_ORIGIN` | `"http://127.0.0.1:8000"` | Target Django backend origin used by Next.js `/api/v1/*` proxy rewrites in `next.config.ts`. |
| `NEXT_PUBLIC_HMS_DEMO_MODE` | `"false"` | Live API Mode is the default (`"false"`). Set to `"true"` only for offline/isolated demo fixture testing. |

---

## 3. Running Locally with the Django Backend

1. **Start the Django Backend (`http://127.0.0.1:8000`)** from the repository root:
   ```bash
   python manage.py migrate
   python manage.py bootstrap_admin --username admin.pesu --email admin.hms@pes.edu --password "AdminBootstrapPass!2026"
   python manage.py runserver
   ```
2. **Start the Next.js Frontend (`http://localhost:3000`)** from `frontend/`:
   ```bash
   cd frontend
   npm ci
   npm run dev
   ```

---

## 4. Authentication, Student Self-Registration & Role-Based Access

- **Unauthenticated Routes (`/login`, `/signup`):**
  - Rendered using the standalone `AuthShell` layout without any authenticated sidebar, navigation links, or role labels.
  - `/login` authenticates against `POST /api/v1/auth/login/` using Django session cookies and CSRF tokens (`GET /api/v1/auth/csrf/`) and redirects to `/dashboard/student`, `/dashboard/warden`, or `/dashboard/admin` based on the authenticated user's role.
  - `/signup` allows active students already enrolled in the university `Student` table to self-register (`POST /api/v1/auth/signup/`) by verifying their `student_id` and registered `contact` number. Newly registered accounts are created with `is_active = False` and display:
    > *"Your account registration has been submitted and is awaiting hostel administration approval."*
- **Administrator Account Approval (`/admin/users`):**
  - Administrators can inspect pending registrations (`is_active === false`), approve them via `POST /api/v1/admin/users/{id}/approve/`, and assign `STUDENT`, `WARDEN`, or `ADMINISTRATOR` roles via `POST /api/v1/admin/roles/`.
- **Role-Based Route Guards (`HmsShell`):**
  - `STUDENT`: Restricted strictly to `/dashboard/student` (own profile, current accommodation, and allocation history).
  - `WARDEN`: Access to `/dashboard/warden`, `/students`, `/students/new`, `/students/[id]`, `/hostels`, `/rooms`, `/allocations`, `/reports`, and `/settings`. Blocked from `/admin/users` and `/dashboard/admin`.
  - `ADMINISTRATOR`: Access to `/dashboard/admin`, `/admin/users`, and all Warden operational modules.

---

## 5. Verification Commands

Run from `frontend/`:

```bash
npm ci
npm run lint
npx tsc --noEmit
npm test
npm run build
npm audit --audit-level=moderate
```
