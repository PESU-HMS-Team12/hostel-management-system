# Hostel Management System (HMS)

## Team 12

A comprehensive web-based Hostel Management System for managing students, hostels, rooms, room allocations, transfers, vacations, allocation history, student self-registration with administrator approval, and occupancy reports.

### Team Members & Roles

- **Pranav Shashikiran Atreya** (PES2UG24CS912) — Team Lead / Full-Stack Developer
- **Kaushik Balaji** (PES2UG24CS220) — Technical Lead / Full-Stack Developer
- **Kanishk Kartik** (PES2UG24CS213) — Developer / Test Engineer
- **Harshith Manish** (PES2UG24CS187) — Developer / Test Engineer

### Project Links & Documentation

- **Jira Scrum Board:** [HMS Jira Project](https://pranavatreya.atlassian.net/jira/software/projects/HMS/boards/36/backlog?epics=visible&atlOrigin=eyJpIjoiZjc3ZDQ0Mzk2NjRiNGU0YjhhNTQxN2FhOTkxODdhOTUiLCJwIjoiaiJ9)
- **GitHub Organization:** [PESU-HMS-Team12](https://github.com/PESU-HMS-Team12)
- [Software Requirements Specification (SRS)](12_SRS.pdf)
- [Software Test Plan (STP)](12_STP.pdf)
- [HMS-13 Test Plan Addendum](HMS-13_TEST_PLAN_ADDENDUM.md)
- [Sprint 1 Test Validation](SPRINT1_TEST_VALIDATION.md)
- [Automated Test and Coverage Results](AUTOMATED_TEST_COVERAGE.md)
- [SonarQube Cloud Static Analysis Status](SONARQUBE_STATIC_ANALYSIS.md)

---

## Architecture & Technology Stack

- **Backend Framework:** Django 6.1.1 & Django REST Framework 3.18
- **Frontend Framework:** Next.js 16.4.5 (App Router), React 19, TypeScript 5, Tailwind CSS v4, shadcn/ui (`frontend/`)
- **Language / Runtime:** Python 3.12 / 3.13 & Node.js 22 LTS
- **Primary Database:** PostgreSQL (production / CI) with seamless SQLite fallback for local development
- **API Specification:** OpenAPI 3.0 via `drf-spectacular` (`schema.yml`)
- **Authentication:** Server-side Django Session Authentication with rolling 30-minute inactivity timeout, secure HTTP-only cookies, and CSRF protection
- **CORS & Proxy Support:** `django-cors-headers` + Next.js same-origin `/api/v1/*` rewrites

---

## Environment Variables & Configuration

The application is configured using Twelve-Factor environment variables:

### Backend Environment Variables

| Variable | Description | Default (Development) |
|---|---|---|
| `DJANGO_DEBUG` | Enable debug mode (`true`/`false`) | `true` |
| `DJANGO_SECRET_KEY` | Django secret key (required in production) | `local-development-only-not-for-production` |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hostnames | `localhost,127.0.0.1` |
| `DATABASE_URL` | PostgreSQL connection URL (e.g. `postgresql://user:pass@host:5432/dbname`) | `sqlite:///BASE_DIR/db.sqlite3` |
| `POSTGRES_DB` | Database name (alternative to `DATABASE_URL`) | `None` |
| `POSTGRES_USER` | PostgreSQL username | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `""` |
| `POSTGRES_HOST` | PostgreSQL hostname | `localhost` |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated CORS origins (e.g. `http://localhost:3000`) | Regex matching localhost/127.0.0.1 |
| `CSRF_TRUSTED_ORIGINS` | Comma-separated CSRF trusted origins | `http://localhost:3000,http://127.0.0.1:3000` |
| `SECURE_SSL_REDIRECT` | Toggle HTTPS redirect (`true`/`false`) | `false` in dev/CI, `true` when `DEBUG=false` |
| `CONN_MAX_AGE` | Persistent DB connection timeout (seconds) | `600` in prod, `0` in test runs |
| `HMS_BOOTSTRAP_ADMIN_PASSWORD` | Password used by `python manage.py bootstrap_admin` when `--password` is omitted | `None` |

### Frontend Environment Variables (`frontend/.env.local`)

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for HMS REST API requests | `"/api/v1"` |
| `BACKEND_ORIGIN` | Target Django backend origin for Next.js `/api/v1/*` proxy rewrites | `"http://127.0.0.1:8000"` |
| `NEXT_PUBLIC_HMS_DEMO_MODE` | Opt-in in-memory demo fixture mode (`"true"` / `"false"`) | `"false"` (Live API mode default) |

---

## Local Development Setup (Backend + Frontend)

### 1. Clone & Set Up Python Backend

```bash
git clone https://github.com/PESU-HMS-Team12/hostel-management-system.git
cd hostel-management-system

python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
```

### 2. First-Administrator Bootstrap Procedure (Trusted Server-Side Provisioning)

Because approving student registrations and assigning `WARDEN` or `ADMINISTRATOR` roles requires an authenticated Administrator (`IsAdministrator`), the initial Administrator account is provisioned through a trusted server-side Django management command (`bootstrap_admin`). Public self-registration for `WARDEN` or `ADMINISTRATOR` roles is strictly prohibited.

Run the following command on the backend host:

```bash
# Option A: Supply password via environment variable (recommended for production/CI)
export HMS_BOOTSTRAP_ADMIN_PASSWORD="YourStrongAdminPassword!2026"
python manage.py bootstrap_admin \
  --username admin.pesu \
  --email admin.hms@pes.edu \
  --first-name Chief \
  --last-name Administrator

# Option B: Supply password via CLI flag (local development)
python manage.py bootstrap_admin \
  --username admin.pesu \
  --email admin.hms@pes.edu \
  --password "YourStrongAdminPassword!2026"
```

This command atomically creates (or updates) the Django `User` (`is_active=True`, `is_staff=True`, `is_superuser=True`), links a `RoleProfile(role="ADMINISTRATOR", student=None)`, and records an `AuditLog` entry.

### 3. Start the Backend & Frontend Servers

**Terminal 1 — Django REST API (`http://127.0.0.1:8000`):**
```bash
python manage.py runserver
```

**Terminal 2 — Next.js Frontend (`http://localhost:3000`):**
```bash
cd frontend
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated visitors are directed to `/login`.

---

## REST API Specification (`/api/v1/`)

### Interactive API Documentation

- **Swagger UI:** [http://localhost:8000/api/v1/docs/](http://localhost:8000/api/v1/docs/)
- **Redoc UI:** [http://localhost:8000/api/v1/redoc/](http://localhost:8000/api/v1/redoc/)
- **Raw OpenAPI 3.0 Schema (YAML):** [http://localhost:8000/api/v1/schema/](http://localhost:8000/api/v1/schema/)

### Endpoints Overview

#### 1. System Health & CSRF
- `GET /api/v1/health/` — Service readiness probe and database health check (AllowAny)
- `GET /api/v1/auth/csrf/` — Sets and returns CSRF cookie/token for SPA clients (AllowAny)

#### 2. Authentication & Student Self-Registration
- `POST /api/v1/auth/login/` — Authenticate via username or email; initiates server-side session
- `POST /api/v1/auth/signup/` — Public CSRF-protected student self-registration; verifies active `Student` record (`student_id` + matching `contact`), creates pending (`is_active=False`) `User` + `RoleProfile(role=STUDENT)`, and logs to `AuditLog`
- `POST /api/v1/auth/logout/` — Flushes server-side session and invalidates cookies (Authenticated)
- `GET /api/v1/auth/me/` — Returns current authenticated user, role, and active allocation (Authenticated)

#### 3. Student Management (Staff / Student Object Access)
- `GET /api/v1/students/` — List students with optional `q` search and `status` filter (Staff)
- `POST /api/v1/students/` — Create new student record (Staff)
- `GET /api/v1/students/{id}/` — Retrieve student details (Staff or owner Student)
- `PUT / PATCH /api/v1/students/{id}/` — Update student record (Staff)
- `POST /api/v1/students/{id}/deactivate/` — Deactivate student (Staff)

#### 4. Hostel & Room Management (Staff)
- `GET /api/v1/hostels/` — List hostels
- `POST /api/v1/hostels/` — Create hostel
- `GET /api/v1/hostels/{id}/` — Retrieve hostel details
- `PUT / PATCH /api/v1/hostels/{id}/` — Update hostel
- `GET /api/v1/rooms/` — List rooms with real-time occupancy counts
- `POST /api/v1/rooms/` — Create room (enforces positive capacity)
- `GET /api/v1/rooms/availability/` — Real-time availability status for all active rooms
- `GET /api/v1/rooms/{id}/occupancy/` — Room metadata alongside active resident allocations

#### 5. Allocations (Staff / Student Object Access)
- `GET /api/v1/allocations/` — List allocations with `status` filter (`active`, `completed`, `all`) and `q` search
- `POST /api/v1/allocations/` — Create allocation (atomic, row-locked via `select_for_update()`)
- `POST /api/v1/allocations/{id}/transfer/` — Atomically transfer student to new room
- `POST /api/v1/allocations/{id}/vacate/` — Atomically check out and vacate student

#### 6. Administration (Administrator Only)
- `GET /api/v1/admin/users/` — List all user accounts (including pending `is_active=False` registrations) and their assigned HMS roles
- `POST /api/v1/admin/users/{user_id}/approve/` — Approve and activate a pending user registration (audited)
- `POST /api/v1/admin/roles/` — Assign or update role profile (audited without logging credentials)

#### 7. Reports (Staff)
- `GET /api/v1/reports/occupancy/` — Aggregated bed capacity, occupancy counts, and utilization rates
- `GET /api/v1/reports/allocations/` — Summary of active vs. completed allocations and course distribution

---

## Testing & Quality Assurance

The current executed test results and SRS traceability are documented in
[`AUTOMATED_TEST_COVERAGE.md`](AUTOMATED_TEST_COVERAGE.md) and the complete
30-requirement RTM in [`HMS-13_TEST_PLAN_ADDENDUM.md`](HMS-13_TEST_PLAN_ADDENDUM.md).

### Backend Verification

```bash
python manage.py collectstatic --noinput
python manage.py makemigrations --check --dry-run
python -m coverage erase
python -m coverage run manage.py test
python -m coverage report
python -m coverage html
python -m coverage xml -o coverage.xml
python -m coverage json -o coverage.json
python scripts/check_coverage.py coverage.json
```

### Frontend Verification

```bash
cd frontend
npm ci
npm run lint
npx tsc --noEmit
npm run test:coverage
npm run build
```

Backend thresholds are 80% statements and 70% branches. Frontend statement
coverage threshold is 70%. Reports are written to `htmlcov/`, `coverage.xml`,
`coverage.json`, and `frontend/coverage/` (HTML, LCOV, and JSON summary).

---

## CI/CD Pipeline & Code Quality

The repository implements an automated GitHub Actions CI/CD workflow defined in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) that triggers on pushes to `main`, `HMS-*`, and pull requests targeting `main`.

### 1. Backend CI & Quality Analysis (`backend`)
- **Runtime:** Python 3.12 on `ubuntu-latest`.
- **Database Service:** Managed `postgres:16-alpine` service container on port 5432 with `pg_isready` healthcheck.
- **Automated Verification Pipeline:**
  1. Installs dependencies from `requirements.txt` with pip caching.
  2. Runs Django system checks (`python manage.py check`).
  3. Verifies migration consistency (`python manage.py makemigrations --check --dry-run`).
  4. Applies migrations to PostgreSQL (`python manage.py migrate`).
  5. Validates OpenAPI 3.0 schema generation (`python manage.py spectacular --validate --file schema.yml`).
  6. Collects static assets (`python manage.py collectstatic --noinput`).
  7. Runs the Django suite against PostgreSQL under `coverage.py` and enforces statement/branch thresholds.
  8. Uploads HTML, XML, and JSON coverage reports as `backend-coverage-report`.

### 2. Frontend CI (`frontend`)
- **Status:** **Active** (integrated with Next.js 16 frontend in `frontend/`).
- **Workflow:** Runs on Node.js 22 LTS with `npm` dependency caching, executing `npm ci`, ESLint (`npm run lint`), TypeScript verification (`npx tsc --noEmit`), tests with the 70% coverage gate (`npm run test:coverage`), uploads HTML/LCOV/JSON reports, and builds Next.js.

### 3. SonarCloud Code Analysis
- **Organization:** `pesu-hms-team12`
- **Project Key:** `PESU-HMS-Team12_hostel-management-system`
- **Configuration:** [`sonar-project.properties`](sonar-project.properties)
- **CI:** The SonarCloud job is configured after backend and frontend report artifacts are available. Its first scan requires a valid `SONAR_TOKEN` secret and verified organization/project keys; no successful Cloud analysis is claimed yet. See [`SONARQUBE_STATIC_ANALYSIS.md`](SONARQUBE_STATIC_ANALYSIS.md).

---

## Containerized Deployment (Docker)

The application stack is containerized with multi-stage Docker builds and orchestrated with Docker Compose.

### Local Container Execution

```bash
# 1. Build and start PostgreSQL and Django backend in the background
docker compose up -d --build

# 2. Verify container status and healthchecks
docker compose ps

# 3. Verify backend health probe
curl -f http://localhost:8000/api/v1/health/

# 4. View application logs
docker compose logs -f web

# 5. Stop and clean up containers
docker compose down
```

For complete deployment runbooks, zero-downtime migration strategies, same-origin `/api/` routing architecture, and rollback procedures, see the comprehensive [Deployment & Operations Manual (DEPLOYMENT.md)](DEPLOYMENT.md).
