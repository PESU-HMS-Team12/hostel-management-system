# Hostel Management System (HMS) — Deployment & Operations Manual

**Document Version:** 1.0  
**Project:** Hostel Management System (Team 12)  
**Task Reference:** HMS-35

---

## 1. Overview & Architecture

The HMS production stack is composed of decoupled, containerized services:

1. **Backend API Service (`web`):**
   - Django 6.1.1 + Django REST Framework 3.18
   - Production WSGI Server: `gunicorn` with 3 worker processes
   - Static File Serving: `whitenoise` with compressed manifest storage
   - Built-in Health Check: `GET /api/v1/health/`
2. **Database Service (`postgres`):**
   - PostgreSQL 16 (Alpine)
   - Persistent volume storage: `postgres_data`
   - Healthcheck: `pg_isready`
3. **Frontend Service (`frontend`):**
   - Next.js application (developed in coordination with team members in a dedicated branch)
   - Communicates with the backend via `/api/v1/` endpoints with session cookies and CSRF tokens.

---

## 2. Environment Variables & Secrets Reference

Never commit `.env` or production secrets into source control. Store secrets in GitHub Actions Secrets, container environment configurations, or platform secret managers (e.g., Railway, Render, AWS Secrets Manager).

| Variable Name | Environment | Required | Description |
|---|---|---|---|
| `DJANGO_DEBUG` | Production | Yes | Must be set to `false` in production. |
| `DJANGO_SECRET_KEY` | Production | Yes | A cryptographically secure random 50+ character string. |
| `ALLOWED_HOSTS` | Production | Yes | Comma-separated domain names / IPs (e.g., `hms.pes.edu,api.hms.pes.edu`). |
| `DATABASE_URL` | Production | Yes | PostgreSQL connection string (`postgresql://user:pass@host:5432/dbname`). |
| `CORS_ALLOWED_ORIGINS` | Production | Yes | Comma-separated list of allowed frontend origins (e.g., `https://hms.pes.edu`). |
| `CSRF_TRUSTED_ORIGINS` | Production | Yes | Comma-separated list of trusted CSRF origins (e.g., `https://hms.pes.edu`). |
| `SONAR_TOKEN` | CI/CD | Yes | SonarCloud project token stored in GitHub Secrets. |

---

## 3. Production Security Hardening

When `DJANGO_DEBUG=false`, the following security flags are automatically active:

1. **HTTPS Enforcement:** `SECURE_SSL_REDIRECT = True` redirects all HTTP traffic to HTTPS.
2. **Secure Cookies:**
   - `SESSION_COOKIE_SECURE = True`
   - `CSRF_COOKIE_SECURE = True`
   - `SESSION_COOKIE_HTTPONLY = True` (mitigates XSS cookie theft)
   - `SESSION_COOKIE_SAMESITE = "Lax"` (mitigates CSRF)
3. **Session Timeout:**
   - `SESSION_COOKIE_AGE = 1800` (strictly enforces 30-minute rolling inactivity timeout).
   - `SESSION_SAVE_EVERY_REQUEST = True`.
4. **Least-Privilege Execution:**
   - The production container runs under non-root user `hmsuser` (UID/GID created in `Dockerfile`).

---

## 4. Deployment Procedure

### 4.1 Automated CI/CD Pipeline

Every push and pull request triggers `.github/workflows/ci.yml`:
1. Launches a PostgreSQL 16 container.
2. Installs dependencies and runs `python manage.py check`.
3. Verifies migration consistency via `python manage.py makemigrations --check --dry-run`.
4. Applies migrations to PostgreSQL.
5. Validates OpenAPI 3.0 schema generation.
6. Runs the entire 97-test suite under `coverage.py` against PostgreSQL.
7. Generates and uploads `coverage.xml`.
8. Executes SonarCloud quality analysis.
9. Automatically tests the Next.js frontend when merged.

### 4.2 Safe Database Migration Strategy

To avoid downtime or schema lockouts during deployment:

1. **Step 1 — Pre-deployment Migration:**
   Before routing traffic to new container instances, run database migrations in an ephemeral migration container:
   ```bash
   docker compose run --rm web python manage.py migrate --noinput
   ```
2. **Step 2 — Roll out New Web Containers:**
   Start the updated application containers.
   ```bash
   docker compose up -d --build
   ```
3. **Step 3 — Verify Health Probe:**
   Verify that the health check returns HTTP 200:
   ```bash
   curl -f http://localhost:8000/api/v1/health/
   ```

---

## 5. Health Check Verification

The service provides a dedicated JSON health endpoint:

- **Endpoint:** `GET /api/v1/health/`
- **Authentication:** None (`AllowAny`)
- **Success Response (HTTP 200):**
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-11-05T00:30:00.000000+00:00",
    "services": {
      "database": "operational"
    }
  }
  ```
- **Failure Response (HTTP 503):** Returned if PostgreSQL connectivity is lost or times out.

---

## 6. Rollback Protocol

If a deployment fails health checks or exhibits regressions in production:

1. **Instant Container Revert:**
   Re-deploy the previous tagged release or Docker image:
   ```bash
   docker compose down
   git checkout <PREVIOUS_STABLE_TAG_OR_COMMIT>
   docker compose up -d --build
   ```
2. **Database Migration Reversal (if applicable):**
   If a migration must be reverted, inspect the current migration graph:
   ```bash
   python manage.py showmigrations
   ```
   Revert to the previous migration for the affected app:
   ```bash
   python manage.py migrate <app_name> <previous_migration_name>
   ```
3. **Verification:**
   Probe `/api/v1/health/` and run smoke tests against authentication and allocation endpoints.

---

## 7. Branch Protection & Quality Gate Configuration

To guarantee code quality and prevent unauthorized direct pushes to `main`:

### 7.1 Required Branch Protection Rules for `main`

Navigate to **GitHub Repository Settings > Branches > Add branch protection rule**:

1. **Branch name pattern:** `main`
2. **Protect matching branches:**
   - [x] **Require a pull request before merging**
     - Required approvals: `1`
     - Dismiss stale pull request approvals when new commits are pushed
   - [x] **Require status checks to pass before merging**
     - Require branches to be up to date before merging
     - **Required Status Checks:**
       - `Backend CI & Quality Analysis`
       - `Frontend CI (Next.js Detection)`
       - `SonarCloud Code Analysis`
   - [x] **Require conversation resolution before merging**
   - [x] **Do not allow bypassing the above settings**

### 7.2 SonarCloud Quality Gate Configuration

1. In the SonarCloud project dashboard (`pesu-hms-team12`):
   - Set Quality Gate to **Sonar way** or custom project gate.
   - Enforce:
     - **Coverage on New Code:** >= 80%
     - **Duplicated Lines on New Code:** < 3%
     - **Maintainability Rating:** A
     - **Reliability Rating:** A
     - **Security Rating:** A
     - **Security Hotspots Reviewed:** 100%
2. Store the SonarCloud organization token as a GitHub Actions secret:
   - Name: `SONAR_TOKEN`
   - Location: **GitHub > Settings > Secrets and variables > Actions > New repository secret**.
