# Hostel Management System (HMS)

## Team 12

A comprehensive web-based Hostel Management System for managing students, hostels, rooms, room allocations, transfers, vacations, allocation history, and occupancy reports.

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

---

## Architecture & Technology Stack

- **Backend Framework:** Django 6.1.1 & Django REST Framework 3.18
- **Language / Runtime:** Python 3.12 / 3.13
- **Primary Database:** PostgreSQL (production / CI) with seamless SQLite fallback for local development
- **API Specification:** OpenAPI 3.0 via `drf-spectacular`
- **Authentication:** Server-side Django Session Authentication with rolling 30-minute inactivity timeout, secure cookies, and CSRF protection
- **CORS Support:** `django-cors-headers` configured for frontend decoupling (Next.js)

---

## Environment Variables & Configuration

The application is configured using Twelve-Factor environment variables:

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

---

## Local Development Setup

### 1. Clone & Set Up Virtual Environment

```bash
git clone https://github.com/PESU-HMS-Team12/hostel-management-system.git
cd hostel-management-system

python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure Database & Run Migrations

To use local SQLite:
```bash
python manage.py migrate
```

To use PostgreSQL locally:
```bash
export DATABASE_URL="postgresql://postgres:password@localhost:5432/hms_db"
python manage.py migrate
```

### 3. Run the Development Server

```bash
python manage.py runserver
```

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

#### 2. Authentication
- `POST /api/v1/auth/login/` — Authenticate via username or email; initiates server-side session
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
- `GET /api/v1/admin/users/` — List all user accounts and their assigned HMS roles
- `POST /api/v1/admin/roles/` — Assign or update role profile (audited without logging credentials)

#### 7. Reports (Staff)
- `GET /api/v1/reports/occupancy/` — Aggregated bed capacity, occupancy counts, and utilization rates
- `GET /api/v1/reports/allocations/` — Summary of active vs. completed allocations and course distribution

---

## Testing & Quality Assurance

### Run Unit and Integration Tests

```bash
# Run all tests (baseline + API)
python manage.py test

# Run API test suite only
python manage.py test api

# Check system configuration
python manage.py check

# Verify migration integrity
python manage.py makemigrations --check --dry-run
```

### Run Tests with Coverage

```bash
coverage run -m manage test
coverage report
coverage xml -o coverage.xml
```
