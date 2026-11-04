# HMS-13 — Test Environment, Schedule, Risks and Deliverables Addendum

**Project:** Hostel Management System  
**Team:** 12  
**Purpose:** Supplement the existing `12_STP.pdf` for HMS-13. This addendum records the verified local test environment and clarifies the planning information already defined in the Software Test Plan (STP). It does not replace the STP or the SRS.

## 1. Test Environment

### 1.1 Verified local environment

| Item | Verified configuration |
|---|---|
| Operating system | macOS 26.7.1 (Build 25G313) |
| Python | 3.12.4 |
| Django | 6.1.1 |
| Database | SQLite (`django.db.backends.sqlite3`) |
| Python environment | Project virtual environment (`venv`) |
| Dependency manifest | `requirements.txt` |
| Test runner | Django built-in test runner |
| Project validation | `python manage.py check` |

The dependency manifest contains Django and its installed runtime dependencies. No separate coverage or linting tool is declared in `requirements.txt`.

### 1.2 Test execution evidence from this environment

| Command | Result |
|---|---|
| `python manage.py check` | Passed; no system-check issues |
| `python manage.py test accounts students hostels allocations auditlog` | 59 tests passed, 0 failed |
| `python manage.py test` | 59 tests passed, 0 failed |

The full test run completed in 9.529 seconds. The targeted app test run completed in 10.414 seconds. Django created and destroyed a test database for each run.

**Environment distinction:** `SPRINT1_TEST_VALIDATION.md` records an earlier execution environment of Python 3.11, Django 6.1.1 and SQLite. The results above are a separate local execution on macOS with Python 3.12.4. These environments should not be represented as the same run.

### 1.3 Test data and configuration

Use synthetic student, hostel, room, allocation, role and audit records. Do not use real personal data. Configure Student, Warden and Administrator test accounts as required by the STP. Local testing uses the configured SQLite database; deployed HTTPS and secure-cookie checks must be performed against the deployed HTTPS configuration, not inferred from local HTTP testing.

## 2. Test Schedule

The STP's schedule is milestone/event-based rather than a calendar with institution-assigned deadlines. Retain that approach unless the team receives confirmed dates.

| Activity | Timing / trigger | Output |
|---|---|---|
| Test case design | STP records 15-09-2026 to 16-09-2026 | Test cases mapped to SRS requirements |
| Test environment setup | After a stable project build is available | Ready environment and synthetic test data |
| Test execution | Once environment, build and test data are ready | Execution results and evidence |
| Functional and integration testing | After each stable build or module completion | Execution records and defect reports |
| Regression testing | After defect fixes and before acceptance | Retest and regression results |
| Security validation | After the relevant security functionality is implemented and deployed configuration is available | Security validation evidence |
| UAT / acceptance testing | After high-priority functional requirements pass system testing | UAT results and acceptance status |
| Final test summary | After execution and closure or approved disposition of critical defects | Final Test Summary Report |

The dates in this table are planning information from the STP, not confirmed institutional deadlines. The team should add calendar dates only when they are agreed.

## 3. Risks and Mitigation

The following risks and mitigations are retained from the STP and applied to execution:

| Risk | Impact | Mitigation |
|---|---|---|
| Stable build delivered late | High | Prepare tests in parallel with development and request early smoke builds. |
| Test environment/configuration issues | Medium | Document setup, keep a reproducible local environment and maintain a backup test configuration. |
| Allocation logic defects causing inconsistent data | High | Use atomic allocation/transfer tests, boundary cases, database integrity checks and regression tests. |
| Insufficient representative test data | Medium | Prepare synthetic students and rooms at 0%, partial and 100% occupancy, including historical allocations. |
| Security configuration differs between local and deployed environments | High | Perform security validation against the deployment configuration and record the exact configuration tested. |
| Defect fixes change previously working functions | Medium | Run the affected regression suite after each significant fix. |

**Current validation issue:** The validation addendum reports TC-SEC-05 (HMS-SR-005 audit logging) as blocked because role-profile save has no audit integration and role-change audit tests are absent. This remains an open validation item; the 59 passing tests do not establish that TC-SEC-05 has passed.

## 4. Assumptions and Dependencies

### 4.1 Assumptions

- The implemented application uses a technology stack permitted by the SRS; the current repository uses Django.
- Synthetic test data and test accounts are available before execution.
- The selected framework and database dependencies can be installed in the test environment.
- HTTPS can be enabled for deployed security validation.
- System clock, database and application timestamps are sufficiently synchronized for audit-log validation.
- The SRS remains the requirements baseline unless a documented change is approved.

### 4.2 Dependencies

- A stable application build and applied database migrations.
- Installed project dependencies and a functioning Django environment.
- Synthetic data and configured Student, Warden and Administrator accounts.
- Completed authentication, authorization, student, hostel, room and allocation workflows for their dependent tests.
- A deployed HTTPS environment for HTTPS and secure-cookie validation.
- Implemented audit logging before TC-SEC-05 can be executed to a pass/fail conclusion.

## 5. Responsibilities

Responsibilities remain as assigned in Section 9 of the existing STP:

| Role | Team member | Responsibility |
|---|---|---|
| QA Lead / Team Lead | Pranav Shashikiran Atreya | Lead test planning and coordination, review functional and integration test cases, maintain SRS-to-test traceability, coordinate defect analysis, and oversee final system and acceptance testing. |
| Development Lead / Integration Engineer | Kaushik Balaji | Coordinate application development and module integration, prepare stable builds, perform integration testing, analyze and resolve implementation defects, and support regression testing after fixes. |
| Test Engineer / Validation Engineer | Kanishk Kartik | Develop and execute functional, boundary, negative and data-validation test cases; verify student/room/allocation workflows; analyze failed cases; and perform defect retesting and regression checks. |
| Security & System Test Engineer | Harshith Manish | Conduct security and authorization validation, test role-based access and session handling, perform system-level and performance-oriented testing, verify error handling and data integrity, and document security/test evidence. |

## 6. Test Deliverables

The planned deliverables remain those in Section 8 of the STP:

- Software Test Plan.
- Detailed test cases covering SRS requirements.
- Synthetic test data and test accounts.
- Test execution log/results with Pass/Fail/Blocked status and evidence.
- Defect reports with severity, reproducibility, requirement ID and test-case reference.
- Security validation evidence for HMS-SR-001 through HMS-SR-005.
- Updated Requirements Traceability Matrix (RTM).
- Final Test Summary Report and acceptance/sign-off record.

## 7. Entry and Exit Criteria

### Entry criteria

- A stable build is available and can be started in the test environment.
- Database schema and migrations are applied and representative test data is available.
- Required Student, Warden and Administrator test accounts are configured.
- The selected application stack and dependencies are installed and the application is reachable.
- Test cases and expected results have been reviewed.

### Exit criteria

- 100% of planned test cases are executed.
- No Critical defects remain open in authentication, authorization, student-data handling, room-capacity enforcement or allocation integrity.
- All High-priority functional requirements pass their acceptance tests or have a documented approved deviation.
- All five security requirements have been executed and have satisfactory results.
- Non-functional requirements have measurable evidence or documented evaluation results.
- RTM coverage reaches 100% of SRS requirements with final status updated after execution.

A blocked test must remain marked **Blocked** until its prerequisite is available and it is executed. Passing the current 59-test suite does not waive the outstanding TC-SEC-05 validation.

## 8. References

- `12_STP.pdf`, Sections 5–14.
- `12_SRS.pdf`, requirements baseline and Section 8 RTM.
- `SPRINT1_TEST_VALIDATION.md`, current RTM execution addendum and test execution report.
- `requirements.txt` and `config/settings.py`, project dependency and database configuration.

---
**Document note:** This is a supplementary HMS-13 addendum. Keep the original STP and SRS unchanged unless the team approves a controlled revision.
