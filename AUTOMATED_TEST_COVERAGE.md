# HMS automated test and coverage results

## Scope and environment

This report records the automated test and coverage baseline from this checkout.
The backend is Django/DRF. The frontend is Next.js, React, and TypeScript, and
its current test suite uses Node's built-in `node:test` runner. GitHub Actions
workflows now run the coverage gates and upload the reports.

Backend execution used Python 3.14.4 and Django 6.1.1. The suite was run first
against SQLite, then against PostgreSQL 16 in a disposable Docker container
with temporary storage. The PostgreSQL run used the same relevant environment
as CI (`DJANGO_DEBUG=false`, `SECURE_SSL_REDIRECT=false`, `CONN_MAX_AGE=0`).
Static files were collected before each run. Frontend execution used Node
26.13.0 and npm 11.20.0.

## Commands

Run from the repository root in PowerShell, with the dependencies from
`requirements.txt` installed in `.venv314`:

```powershell
.\.venv314\Scripts\python.exe manage.py collectstatic --noinput
.\.venv314\Scripts\python.exe -m coverage erase
.\.venv314\Scripts\python.exe -m coverage run manage.py test
.\.venv314\Scripts\python.exe -m coverage report
.\.venv314\Scripts\python.exe -m coverage html
.\.venv314\Scripts\python.exe -m coverage xml -o coverage.xml
.\.venv314\Scripts\python.exe -m coverage json -o coverage.json
.\.venv314\Scripts\python.exe scripts/check_coverage.py coverage.json
```

The normal backend test command is `python manage.py test` after static
collection. `.coveragerc` measures application modules in `accounts`,
`allocations`, `api`, `auditlog`, `config`, `hostels`, and `students`; only
migrations and test modules are omitted. The gate separately checks 80% Python
statement and 70% Python branch coverage.

Run from `frontend/`:

```powershell
npm ci
npm test
npm run test:coverage
```

`npm test` runs the suite directly, avoiding the Node worker spawn that was
denied in this environment. `npm run test:coverage` invokes the same tests
under c8 and writes text, HTML, LCOV, and JSON summary reports under
`frontend/coverage/`. Its statement threshold is 70%. It instruments all
`src/**` files. Type-only declarations under `src/lib/types/` are excluded
because they have no runtime statements. Both commands completed successfully
after this runner adjustment.

## Results

| Suite | Tests | Passed | Failed | Skipped | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| Django backend on SQLite | 127 | 126 | 0 | 1 | Pass |
| Django backend on PostgreSQL 16 | 128 | 128 | 0 | 0 | Pass |
| Frontend `node:test` via c8 | 32 | 32 | 0 | 0 | Pass |

The SQLite run skipped
`DatabaseConstraintAndConcurrencyTests.test_concurrent_allocation_capacity_protection`.
That test ran and passed on PostgreSQL 16, along with the database constraint
tests. The additional health check test covers the unexpected database response
branch so the PostgreSQL run also meets the configured branch threshold.

An initial PostgreSQL attempt omitted `SECURE_SSL_REDIRECT=false` while using
`DJANGO_DEBUG=false`, so Django redirected requests to HTTPS and that run failed.
The successful run above used the CI settings and completed all tests.

| Coverage scope | Statements/lines | Branches | Threshold | Status |
| --- | ---: | ---: | ---: | --- |
| Python application, PostgreSQL 16 run | 89.96% | 70.05% | 80% statements, 70% branches | Pass |
| Python application, SQLite run | 89.90% | 70.05% | 80% statements, 70% branches | Pass |
| Frontend source | 71.19% | 61.60% | 70% statements | Pass |

Backend artifacts: `htmlcov/index.html`, `coverage.xml`, and `coverage.json`.
Frontend artifacts: `frontend/coverage/index.html`,
`frontend/coverage/lcov.info`, and `frontend/coverage/coverage-summary.json`.
Coverage is a baseline, not evidence that every integration or requirement
scenario has been exercised.

## SRS traceability and gaps

The source SRS is `12_SRS.pdf`; the existing traceability addendum is
`SPRINT1_TEST_VALIDATION.md`. The Django suites in `accounts/tests.py`,
`students/tests.py`, `hostels/tests.py`, `allocations/tests.py`,
`auditlog/tests.py`, and `api/tests.py` cover authentication and role access,
student CRUD/profile and self access, hostel/room management, allocation,
transfer/vacation and capacity rules, API validation/errors, and audit events.
The additions in this phase extend student/hostel/room view workflows and API
error/permission behavior. Existing allocation and authorization tests should
be retained rather than duplicated.

The existing `SPRINT1_TEST_VALIDATION.md` maps TC-ALLOC-05 to HMS-F-016 and
TC-ROOM-02 to HMS-F-009. Its statement that role profile audit tests do not
exist is stale: `api/tests.py` now includes a role assignment audit test. That
test is evidence of role assignment auditing, but it does not by itself verify
every HMS-SR-005 audit field or credential exclusion, so the requirement remains
partially verified. This phase did not rewrite the historical addendum.

Coverage gaps to prioritize against implemented functionality:

1. Backend branch and workflow gaps in `allocations/forms.py`,
   `allocations/views.py`, allocation and hostel serializers, and
   `accounts/views.py`; add cases only after checking existing tests for
   duplication. PostgreSQL 16 constraint and concurrency scenarios are now
   covered by an executed run.
2. Frontend rendered route wrappers, especially `src/app/api/v1/[...path]/route.ts`
   (currently uncovered), layout and dashboard/management route pages. Exercise
   the existing API proxy against the implemented contract when a backend
   integration environment is available.
3. Frontend action and error states in user/role administration and allocation
   management views, plus uncovered validation and HTTP client branches.
   Existing UI tests mostly render static states; extend them around controls
   and outcomes that the current components actually implement.
4. Complete HMS-SR-005 assertions for actor, timestamp, action, affected record
   and absence of credentials, after checking the current audit model and
   implementation.
5. Verify operational/non-functional SRS requirements with suitable deployed
   or performance/security evidence; unit test coverage percentages do not
   establish those requirements.

Requirement families represented by current tests include HMS-F-001 through
HMS-F-018 (authentication, access control, student/hostel/room operations,
allocations, profile/history and reporting), HMS-SR-002 authorization,
HMS-SR-005 audit behavior, and API error/validation requirements. This is
area-level mapping, not a claim that every SRS acceptance criterion has complete
traceability. Deployment security/performance and unfinished frontend flows
remain deferred pending their actual deliverables and environments.

## Deferred dependencies and integration

- **HMS-34:** PostgreSQL-backed integration and concurrency tests ran against
  PostgreSQL 16 and passed (128 tests, no skips). The disposable database
  container was removed after the run.
- **HMS-32/HMS-33:** Tests are limited to currently implemented frontend
  components and workflows. Tests for unfinished frontend behavior are deferred
  until those components/workflows exist.
- **HMS-35:** Both CI workflows now run the coverage commands and enforce the
  configured thresholds. Backend CI has a PostgreSQL 16 service and uploads
  `htmlcov/`, `coverage.xml`, and `coverage.json`. Frontend CI uploads
  `frontend/coverage/`, including HTML, LCOV, and JSON summary reports.

A GitHub Actions run itself is pending; workflows were syntax-checked locally,
and no commit or push was made.

The clean `npm ci` completed. npm reported four moderate audit findings after
install; dependency remediation was outside this coverage task.
