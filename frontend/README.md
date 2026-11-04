# Hostel Management System — Frontend

The Next.js 16 frontend application for Team 12's Hostel Management System (HMS) at PES University.

## 1. Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 16.4.5 | React framework, App Router, and API proxy rewrites |
| React 19.3.0 | UI component architecture |
| TypeScript 5 | Strict static typing across components, validation, and API contracts |
| Tailwind CSS v4 | Utility-first styling with navy/slate/charcoal theme tokens |
| shadcn/ui & Base UI | Accessible UI primitives |
| Lucide React | Iconography |
| next-themes | Persistent dark and light theme switching |
| Node.js Test Runner + Jiti | Automated component rendering and workflow validation suite |

---

## 2. Project Structure

```text
frontend/
├── public/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── users/
│   │   │       └── page.tsx          # User directory & RBAC role assignment
│   │   ├── allocations/
│   │   │   └── page.tsx              # Room allocations, transfers & vacations
│   │   ├── dashboard/
│   │   │   ├── admin/
│   │   │   │   └── page.tsx          # Administrator dashboard
│   │   │   ├── student/
│   │   │   │   └── page.tsx          # Student dashboard (isolated record view)
│   │   │   ├── warden/
│   │   │   │   └── page.tsx          # Warden operational dashboard
│   │   │   └── page.tsx              # Role-based dashboard hub
│   │   ├── hostels/
│   │   │   └── page.tsx              # Hostel block management
│   │   ├── login/
│   │   │   └── page.tsx              # Session & CSRF sign-in interface
│   │   ├── reports/
│   │   │   └── page.tsx              # Occupancy & program-wise allocation reports
│   │   ├── rooms/
│   │   │   └── page.tsx              # Room inventory & occupancy inspection
│   │   ├── settings/
│   │   │   └── page.tsx              # Demo vs. Live API data source & theme settings
│   │   ├── students/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx          # Student detail & allocation history
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Dedicated student registration page
│   │   │   └── page.tsx              # Student directory & search
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                  # Workspace overview & module links
│   ├── components/
│   │   ├── admin/
│   │   │   └── users-roles-view.tsx
│   │   ├── allocations/
│   │   │   └── allocations-view.tsx
│   │   ├── dashboard/
│   │   │   ├── admin-dashboard-view.tsx
│   │   │   ├── student-dashboard-view.tsx
│   │   │   └── warden-dashboard-view.tsx
│   │   ├── hostels/
│   │   │   └── hostels-view.tsx
│   │   ├── layout/
│   │   │   ├── page-header.tsx
│   │   │   └── stat-card.tsx
│   │   ├── reports/
│   │   │   └── reports-view.tsx
│   │   ├── rooms/
│   │   │   └── rooms-view.tsx
│   │   ├── students/
│   │   │   ├── student-detail-view.tsx
│   │   │   ├── student-form.tsx
│   │   │   └── students-directory-view.tsx
│   │   ├── ui/
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   └── modal.tsx
│   │   ├── hms-shell.tsx
│   │   ├── theme-provider.tsx
│   │   └── theme-toggle.tsx
│   └── lib/
│       ├── api/
│       │   ├── demo-fixtures.ts      # Isolated synthetic fixtures & state transitions
│       │   ├── endpoints.ts          # Centralized /api/v1 endpoint definitions
│       │   ├── errors.ts             # Standardized API error normalization
│       │   ├── hms-provider.tsx      # Unified React context for Demo / Live API modes
│       │   ├── http-client.ts        # Fetch wrapper with session cookies & CSRF
│       │   └── index.ts
│       ├── types/
│       │   ├── hms.ts                # OpenAPI-aligned TypeScript interfaces
│       │   └── index.ts
│       ├── validation/
│       │   ├── hms.ts                # Domain & form validation matching backend rules
│       │   └── index.ts
│       └── utils.ts
├── tests/
│   └── hms.test.mjs                  # Automated dashboard, validation & workflow tests
├── components.json
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── package-lock.json
└── tsconfig.json
```

---

## 3. Installation and Development

### Prerequisites

- Node.js 20.9+ (Node.js 22 LTS or 24 recommended)
- npm

### Setup

Navigate to the `frontend/` directory and install dependencies:

```bash
cd frontend
npm ci
```

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## 4. Environment Configuration

Create a `.env.local` file in `frontend/` only if you need to override defaults (never commit `.env*` files):

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_HMS_DEMO_MODE` | `"true"` | Controls whether the app starts in isolated Demo Fixture mode (`"true"`) or Live Backend API mode (`"false"`). |
| `NEXT_PUBLIC_API_BASE_URL` | `"/api/v1"` | Base path for REST API calls. |
| `BACKEND_ORIGIN` | `"http://127.0.0.1:8000"` | Target Django backend origin used by Next.js same-origin proxy rewrites in `next.config.ts`. |

---

## 5. Available Commands

Run all commands from the `frontend/` directory:

| Command | Description |
|---|---|
| `npm run dev` | Starts the Next.js development server |
| `npm run lint` | Runs ESLint static analysis |
| `npx tsc --noEmit` | Runs TypeScript compiler typechecking |
| `npm test` | Runs the automated frontend test suite (`tests/hms.test.mjs`) |
| `npm run build` | Builds the production Next.js application |
| `npm run start` | Starts the production server |

---

## 6. Dashboard & Operational Route Reference

| Route | Role / Scope | Description |
|---|---|---|
| `/` | All | Campus workspace overview and entry point |
| `/login` | All | Session sign-in (`POST /api/v1/auth/login/`) |
| `/dashboard` | All | Role-based dashboard hub |
| `/dashboard/student` | Student | Personal profile, current room assignment, and allocation history |
| `/dashboard/warden` | Warden / Admin | Operational summary cards, hostel occupancy, room availability, and activity |
| `/dashboard/admin` | Administrator | System-wide metrics, user account summary, and HMS role distribution |
| `/students` | Warden / Admin | Student directory with search, status filter, registration, editing, and deactivation |
| `/students/new` | Warden / Admin | Dedicated student registration form |
| `/students/[id]` | Warden / Admin | Student detail view with current room and allocation history |
| `/hostels` | Warden / Admin | Hostel block management and associated room inspection |
| `/rooms` | Warden / Admin | Room inventory, capacity validation, availability filters, and resident inspection |
| `/allocations` | Warden / Admin | Room allocations, atomic room transfers, and check-out vacations |
| `/reports` | Warden / Admin | Occupancy report and program-wise allocation analytics |
| `/admin/users` | Administrator | User account listing and audited HMS role assignment (`STUDENT`, `WARDEN`, `ADMINISTRATOR`) |
| `/settings` | All | Toggle between Demo Fixtures and Live API mode; theme preferences |

---

## 7. Demo Mode vs. Live Backend Integration (PR #17 / HMS-34)

While backend PR #17 (`HMS-34-django-rest-api-postgresql`) remains open and unmerged:

1. **Explicit Demo Mode (`DEMO DATA` badge):** By default, the frontend runs against an isolated, in-memory synthetic fixture provider (`src/lib/api/demo-fixtures.ts`) so all dashboards, forms, allocations, transfers, vacations, and role assignments can be demonstrated and tested interactively.
2. **Strict Separation:** Demo state is completely isolated from live HTTP calls. When switched to **Live API Mode** (via the top header button, `/settings`, or `NEXT_PUBLIC_HMS_DEMO_MODE=false`), the frontend issues real same-origin requests to `/api/v1/...` with Django session cookies and CSRF tokens, and surfaces genuine connection/validation errors without silently substituting mock records.
3. **Security & Authorization:** Passwords, tokens, and session credentials are never stored in `localStorage`. Role-specific navigation guides the user experience, while backend permission classes (`IsStudentUser`, `IsOwnerStudentOrStaff`, `IsWardenOrAdministrator`, `IsAdministrator`) remain authoritative.

---

## 8. Project Team

**Team 12 — PES University**

| Name | SRN | Role |
|---|---|---|
| Pranav Shashikiran Atreya | PES2UG24CS912 | Team Lead / Frontend |
| Kaushik Balaji | PES2UG24CS220 | Development Lead / Integration |
| Kanishk Kartik | PES2UG24CS213 | Testing / Validation |
| Harshith Manish | PES2UG24CS187 | Security / System Testing |
