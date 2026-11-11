# SonarQube Cloud Static Analysis Status

## Scope

This report records the repository configuration and the evidence available
for SonarQube Cloud analysis. It does not claim that a Cloud scan was executed.

## Configured analysis

- Configuration: `sonar-project.properties`.
- Organization/project keys: `pesu-hms-team12` /
  `PESU-HMS-Team12_hostel-management-system`, retained from existing repository
  configuration. They have not been verified against an accessible Cloud
  account in this task.
- Source scope: Django application packages and `frontend/src`.
- Test scope: Django test modules and `frontend/tests`.
- Coverage inputs: `coverage.xml` for Python and
  `frontend/coverage/lcov.info` for JavaScript/TypeScript.
- CI configuration: `.github/workflows/ci.yml` downloads backend and frontend
  coverage artifacts before invoking `SonarSource/sonarqube-scan-action@v8.3.0`.
  The scanner waits for the quality gate and requires `SONAR_TOKEN`.
- Generated/dependency artifacts and Django migration history are excluded;
  project-owned application source is retained.

## Local validation and Cloud results

The repository's documented local validations are Python `manage.py check`,
the backend Django test suite under coverage, TypeScript `npx tsc --noEmit`,
ESLint, frontend tests under c8, and the Next.js production build. These checks
are not a SonarQube analysis and do not provide Sonar issue counts.

No SonarQube Cloud scan was executed in this task: authenticated account/project
access and a `SONAR_TOKEN` value were unavailable for verification. Therefore:

| Measure | Result |
| --- | --- |
| Sonar bugs | Unavailable — analysis not run |
| Sonar vulnerabilities | Unavailable — analysis not run |
| Security hotspots and review status | Unavailable — analysis not run |
| Code smells / maintainability rating | Unavailable — analysis not run |
| Duplication | Unavailable — analysis not run |
| Coverage imported by Sonar | Not verified; local coverage reports are documented in `AUTOMATED_TEST_COVERAGE.md` |
| Quality gate outcome | Unavailable — analysis not run |

The workflow's Sonar job is configured, but a successful Cloud scan depends on
valid project binding/keys and the `SONAR_TOKEN` repository secret. Workflow
configuration is not evidence of a successful scan.

## Setup required before first Cloud result

1. Import/bind this GitHub repository in SonarQube Cloud and verify the
   organization and project keys against the account.
2. Configure the intended Quality Gate and new-code definition in the Cloud
   project. The repository configuration makes CI wait for the resulting gate;
   gate assignment is an account-level setting.
3. Add a valid `SONAR_TOKEN` in GitHub repository Actions secrets.
4. Run the workflow and retain its scanner log and Cloud analysis link. Record
   issue counts and the gate result only from that completed analysis.

## Coverage baseline

The separately executed local coverage baseline is in
`AUTOMATED_TEST_COVERAGE.md`: Python 89.96% statements and 70.05% branches on
PostgreSQL 16, and frontend 71.19% statements. Those values are local
coverage.py/c8 measurements; they should not be represented as imported Sonar
coverage until a Cloud analysis confirms the import.
