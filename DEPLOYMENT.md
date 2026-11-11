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

## 2. Same-Origin `/api/` Ingress Architecture

To guarantee maximum security and cross-browser cookie compatibility, the Next.js frontend and Django backend communicate through a **same-origin `/api/` routing pattern**:

### 2.1 Architectural Benefits
1. **First-Party Cookie Isolation:** Session cookies (`sessionid`) and CSRF tokens (`csrftoken`) remain strictly first-party (`SameSite=Lax`). They are never blocked by third-party cookie restrictions in modern browsers (e.g., Safari ITP, Chrome Privacy Sandbox).
2. **Zero Pre-Flight Latency:** Eliminates browser HTTP `OPTIONS` pre-flight round-trips for mutating API requests (`POST`, `PUT`, `DELETE`).
3. **Simplified Ingress:** The browser communicates exclusively with a single origin (e.g., `https://hms.pes.edu`), removing external cross-origin exposure.

### 2.2 Next.js Server-Side Rewrites (`next.config.js`)
When running decoupled services under container orchestration, Next.js proxies client calls from `/api/*` to the Django backend container:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.INTERNAL_API_URL || 'http://web:8000'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
```

### 2.3 Production Reverse-Proxy Ingress Pattern (Nginx Gateway)
For single-host SSL termination, route path prefixes as follows:

```nginx
upstream django_backend {
    server web:8000;
}

upstream nextjs_frontend {
    server frontend:3000;
}

server {
    listen 443 ssl http2;
    server_name hms.pes.edu;

    ssl_certificate     /etc/ssl/certs/hms.crt;
    ssl_certificate_key /etc/ssl/private/hms.key;

    # Backend API & static assets
    location /api/ {
        proxy_pass http://django_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Next.js frontend pages and assets
    location / {
        proxy_pass http://nextjs_frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 3. Environment Variables & Secrets Reference

Never commit `.env` or production secrets into source control. Store secrets in GitHub Actions Secrets, container environment configurations, or platform secret managers (e.g., Railway, Render, AWS Secrets Manager).

| Variable Name | Environment | Required | Description |
|---|---|---|---|
| `DJANGO_DEBUG` | Production | Yes | Must be set to `false` in production. |
| `DJANGO_SECRET_KEY` | Production | Yes | A cryptographically secure random 50+ character string. |
| `ALLOWED_HOSTS` | Production | Yes | Comma-separated domain names / IPs (e.g., `hms.pes.edu,api.hms.pes.edu`). |
| `DATABASE_URL` | Production | Yes | PostgreSQL connection string (`postgresql://user:pass@host:5432/dbname`). |
| `CORS_ALLOWED_ORIGINS` | Production | Yes | Comma-separated list of allowed frontend origins (e.g., `https://hms.pes.edu`). |
| `CSRF_TRUSTED_ORIGINS` | Production | Yes | Comma-separated list of trusted CSRF origins (e.g., `https://hms.pes.edu`). |
| `SECURE_SSL_REDIRECT` | Production / CI | No | Toggles HTTPS redirect. Defaults to `true` when `DEBUG=false`; set to `false` in CI test environments. |
| `CONN_MAX_AGE` | Production / CI | No | Persistent DB connection timeout (seconds). Defaults to `600` in production, `0` in test runs. |
| `INTERNAL_API_URL` | Frontend Container | No | Container-to-container backend endpoint for Next.js rewrites (`http://web:8000`). |
| `NEXT_PUBLIC_API_URL` | Frontend Client | No | Relative API base URL for browser calls (`/api/v1`). |
| `SONAR_TOKEN` | CI/CD | Required to run SonarCloud job | SonarCloud token stored in GitHub Actions Secrets; setup and first analysis remain to be verified. |

---

## 4. Production Security Hardening

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

## 5. Deployment Procedure

### 5.1 Automated CI/CD Pipeline

Every push and pull request triggers `.github/workflows/ci.yml`:
1. Launches a PostgreSQL 16 container.
2. Installs dependencies and runs `python manage.py check`.
3. Verifies migration consistency via `python manage.py makemigrations --check --dry-run`.
4. Applies migrations to PostgreSQL.
5. Validates OpenAPI 3.0 schema generation.
6. Runs Django tests under `coverage.py` against PostgreSQL and enforces 80% statement and 70% branch coverage.
7. Generates and uploads HTML, XML, and JSON backend coverage reports.
8. Runs frontend tests with a 70% statement-coverage gate and uploads HTML, LCOV, and JSON summary reports.
9. The configured SonarCloud job downloads both coverage artifacts and waits for the Cloud quality gate; it requires `SONAR_TOKEN` and a valid imported project.

### 5.2 Safe Database Migration Strategy

To avoid downtime or schema lockouts during deployment:

1. **Step 1 — Pre-deployment Database Backup:**
   Create an immediate SQL dump of the database prior to applying schema migrations. The `-T` flag is essential to disable pseudo-TTY allocation and prevent SQL stream corruption:
   ```bash
   # Ensure backup directory exists
   mkdir -p backups

   # Linux / macOS / Bash:
   docker compose exec -T postgres pg_dump -U ${POSTGRES_USER:-hms_admin} ${POSTGRES_DB:-hms_production} > backups/hms_backup_$(date +%Y%m%d_%H%M%S).sql

   # Windows PowerShell:
   # docker compose exec -T postgres pg_dump -U hms_admin hms_production > backups/hms_backup.sql
   ```

2. **Step 2 — Pre-deployment Migration Execution:**
   Before routing traffic to new container instances, run database migrations in an ephemeral migration container:
   ```bash
   docker compose run --rm web python manage.py migrate --noinput
   ```

3. **Step 3 — Roll out Application Containers:**
   Start or update the running application containers:
   ```bash
   docker compose up -d --build
   ```

4. **Step 4 — Verify Health Probes:**
   Verify that both PostgreSQL and the backend API report healthy:
   ```bash
   # Check container status
   docker compose ps

   # Probe backend JSON health check
   curl -f http://localhost:8000/api/v1/health/
   ```

---

## 6. Health Check Verification

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

## 7. Rollback Protocol

If a deployment fails health checks or exhibits regressions in production:

1. **Step 1 — Instant Container Revert:**
   Re-deploy the previous tagged release or Docker image:
   ```bash
   docker compose down
   git checkout <PREVIOUS_STABLE_TAG_OR_COMMIT>
   docker compose up -d --build
   ```

2. **Step 2 — Database Migration Reversal (if applicable):**
   If a migration must be reverted, inspect the current migration graph inside the application container:
   ```bash
   docker compose run --rm web python manage.py showmigrations
   ```
   Revert to the previous migration for the affected app:
   ```bash
   docker compose run --rm web python manage.py migrate <app_name> <previous_migration_name>
   ```

3. **Step 3 — Database Full State Restore (Emergency Recovery):**
   If a migration or data corruption cannot be cleanly reverted, restore the pre-deployment snapshot:
   ```bash
   # Linux / macOS / Bash:
   docker compose exec -T postgres psql -U ${POSTGRES_USER:-hms_admin} ${POSTGRES_DB:-hms_production} < backups/hms_backup_<timestamp>.sql

   # Windows PowerShell:
   # Get-Content backups/hms_backup.sql | docker compose exec -T postgres psql -U hms_admin hms_production
   ```

4. **Step 4 — Verification:**
   Probe `/api/v1/health/` and run smoke tests against authentication and allocation endpoints:
   ```bash
   curl -f http://localhost:8000/api/v1/health/
   ```

---

## 8. Branch Protection & Quality Gate Configuration

To guarantee code quality and prevent unauthorized direct pushes to `main`:

### 8.1 Required Branch Protection Rules for `main`

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
       - `Frontend CI (Next.js 16)`
       - `SonarCloud Code Analysis`
   - [x] **Require conversation resolution before merging**
   - [x] **Do not allow bypassing the above settings**

### 8.2 SonarCloud Quality Gate Configuration

1. In the SonarCloud project dashboard (`pesu-hms-team12`):
   - Set Quality Gate to **Sonar way** or custom project gate.
   - Enforce:
   - **Coverage on New Code:** >= 80%
   - **Duplicated Lines on New Code:** <= 3.0%
     - **Maintainability Rating:** A
     - **Reliability Rating:** A
     - **Security Rating:** A
     - **Security Hotspots Reviewed:** 100%
2. Store the SonarCloud organization token as a GitHub Actions secret:
   - Name: `SONAR_TOKEN`
   - Location: **GitHub > Settings > Secrets and variables > Actions > New repository secret**.

The repository's prior organization and project keys are retained in
`sonar-project.properties`, but account access was unavailable for this
configuration task. Verify those keys, bind/import the GitHub repository in
SonarQube Cloud, assign the gate, and add the secret before treating analysis as
active. See `SONARQUBE_STATIC_ANALYSIS.md` for current evidence and setup status.
