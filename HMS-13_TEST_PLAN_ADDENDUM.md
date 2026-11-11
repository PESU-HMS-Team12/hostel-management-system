# HMS-13 — Test Environment, Schedule, Risks and Deliverables Addendum

**Project:** Hostel Management System  
**Team:** 12  
**Purpose:** Supplement the existing `12_STP.pdf` for HMS-13. This addendum preserves the historical environment/schedule notes and now contains the detailed validation cases and execution RTM for the complete SRS baseline. It does not replace or revise the approved STP or SRS.

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

**Historical validation note:** Earlier Sprint 1 documentation marked TC-SEC-05 blocked when role-profile auditing and tests were absent. The current repository adds role assignment audit logging and tests, but HMS-SR-005 remains partially verified: the complete required field set and the exclusion of credentials have not been independently asserted for all critical change types. Current status is in the RTM below.

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

A blocked or partially verified test remains so until its stated prerequisite or missing evidence is supplied. Historical test counts in Sections 1 and 8 of this addendum are preserved as records of their original runs; the current results are in Section 9 onward.

## 8. References

- `12_STP.pdf`, Sections 5–14.
- `12_SRS.pdf`, requirements baseline and Section 8 RTM.
- `SPRINT1_TEST_VALIDATION.md`, current RTM execution addendum and test execution report.
- `requirements.txt` and `config/settings.py`, project dependency and database configuration.

---
**Document note:** This is a supplementary HMS-13 addendum. Keep the original STP and SRS unchanged unless the team approves a controlled revision.

## 9. Current execution environment and results

The current execution evidence supersedes the older run counts above without
deleting their historical record.

| Environment | Configuration and result |
|---|---|
| `B1` backend | Python 3.14.4, Django 6.1.1, PostgreSQL 16 in a disposable Docker container; `DJANGO_DEBUG=false`, `SECURE_SSL_REDIRECT=false`, `CONN_MAX_AGE=0`; synthetic test fixtures; `collectstatic` before tests. Full suite: 128 passed, 0 failed, 0 skipped. |
| `B2` SQLite history | Earlier coverage baseline: 127 tests, 126 passed, 1 skipped (the row-lock concurrency case); not the current PostgreSQL result. |
| `F1` frontend | Node 26.13.0, npm 11.20.0, Next.js 16.4.5, React 19, existing Node `node:test` suite. 32 passed, 0 failed, 0 skipped. |
| `M1` manual/deployment | Current browser and deployed HTTPS environment; synthetic accounts/data only. Not available for execution in this validation run. |

Current coverage reports: backend statement 89.96%, branch 70.05%; frontend
statement 71.19%. Backend reports are `coverage.xml`, `coverage.json`, and
`htmlcov/index.html`; frontend reports are `frontend/coverage/lcov.info`,
`frontend/coverage/coverage-summary.json`, and `frontend/coverage/index.html`.
Full execution details are in `AUTOMATED_TEST_COVERAGE.md`.

## 10. Detailed validation specification

The test IDs below are the existing acceptance-test IDs from the SRS/STP. No
replacement IDs are introduced. Each case specifies a repeatable manual
procedure and maps any existing automated execution. “Manual not executed” is
recorded even when its automated equivalent passed.

### Functional requirements

#### TC-AUTH-01 — Authenticate user

- **Requirement:** HMS-F-001. **Objective:** Accept a valid username or email/password pair and reject invalid credentials before granting protected access.
- **Description / steps:** Create a synthetic Warden account. Submit login once with its username and once with its email; then submit a wrong password and an unknown account. Request a protected page after each attempt.
- **Preconditions / test data:** Account exists, is active and has a Warden role; valid and invalid passwords are synthetic.
- **Environment:** `B1` automated; `M1` for manual replay.
- **Expected result:** Valid credentials create an authenticated session; invalid credentials do not authenticate and return the controlled login error.
- **Verification method:** Django integration test and manual browser replay.
- **Priority:** High. **Required evidence:** Test output for `accounts/tests.py` login tests and `api/tests.py` login tests; redacted response/session evidence for manual replay.
- **Execution status:** Automated equivalent passed in the 128-test PostgreSQL run; manual replay not executed.

#### TC-AUTH-02 — Enforce role and record access

- **Requirement:** HMS-F-002. **Objective:** Verify Student, Warden and Administrator boundaries, including direct requests.
- **Description / steps:** Sign in as a Student and request staff student, hostel, room, allocation and role-management pages/endpoints directly; request another student's detail. Repeat permitted list operations as Warden and Administrator.
- **Preconditions / test data:** Synthetic Student linked to a student record, Warden, Administrator and a second student with a separate allocation.
- **Environment:** `B1`; manual replay in `M1` uses the actual routes shown in `schema.yml` and the Django URL configuration.
- **Expected result:** Student requests are denied or limited to that student's permitted records; authorized staff requests succeed.
- **Verification method:** Django authorization/API tests plus manual direct-URL test.
- **Priority:** High. **Required evidence:** Test output for `accounts/tests.py` `RoleAuthorizationTests` and `api/tests.py` permission tests; status/body evidence for each manual request.
- **Execution status:** Representative automated route/object-permission tests passed; exhaustive manual checks of every protected route not executed. Partial evidence.

#### TC-AUTH-03 — Logout invalidates session

- **Requirement:** HMS-F-003. **Objective:** Verify logout removes authenticated access.
- **Description / steps:** Authenticate a Warden, record that a protected page succeeds, log out, then revisit the page using the same client/session.
- **Preconditions / test data:** Active synthetic Warden account and authenticated session.
- **Environment:** `B1`; manual replay in `M1`.
- **Expected result:** Logout invalidates the session; the subsequent protected request requires authentication.
- **Verification method:** Django session integration test and manual browser replay.
- **Priority:** Medium. **Required evidence:** `accounts/tests.py` and `api/tests.py` logout test output; session/request evidence for manual replay.
- **Execution status:** Automated session tests passed; manual replay not executed.

#### TC-STU-01 — Create student record

- **Requirement:** HMS-F-004. **Objective:** Verify an authorized staff member can create a complete student record.
- **Description / steps:** As Warden, open the student-create form and submit student ID, name, contact, course/program, year and status; retrieve the new record. Repeat with required fields missing and a duplicate ID.
- **Preconditions / test data:** Authenticated Warden; unused synthetic ID such as `VAL-STU-001` and a duplicate of an existing synthetic ID.
- **Environment:** `B1`; manual replay in `M1`.
- **Expected result:** Valid input creates one visible record with submitted values; invalid/duplicate input creates no second record and displays validation feedback.
- **Verification method:** Django view/API integration tests and database assertions.
- **Priority:** High. **Required evidence:** `students/tests.py` `test_student_create_get_validation_and_audit`, `api/tests.py` `test_warden_can_create_student_and_audit_logged`; response/record evidence for manual replay.
- **Execution status:** Automated valid, invalid and audit paths passed; manual replay not executed.

#### TC-STU-02 — Student views own information

- **Requirement:** HMS-F-005. **Objective:** Verify a signed-in Student sees only permitted personal and hostel information tied to the account.
- **Description / steps:** Sign in as a Student linked to record A; view the profile and current allocation. Attempt to change the identifier in a detail/API request to record B.
- **Preconditions / test data:** Two synthetic student records; account A linked only to A; A has an active allocation and B has different hostel/room data.
- **Environment:** `B1`; manual replay in `M1`.
- **Expected result:** A sees A's details and allocation; B's personal/allocation data is not returned. An unallocated Student gets the implemented empty state.
- **Verification method:** Django profile/object-permission integration tests.
- **Priority:** High. **Required evidence:** `accounts/tests.py` own-profile, active-allocation, empty-state and other-student tests; `api/tests.py` current-user tests.
- **Execution status:** Automated owner, current-allocation, empty-state and isolation tests passed; manual replay not executed.

#### TC-STU-03 — Update/deactivate and preserve history

- **Requirement:** HMS-F-006. **Objective:** Verify staff updates and deactivation do not delete allocation history.
- **Description / steps:** Create a Student with one completed allocation. Update contact/course data; deactivate the Student; query the Student and prior allocation after each action. Attempt deactivation with GET and POST.
- **Preconditions / test data:** Authenticated Warden; synthetic Student and historical allocation.
- **Environment:** `B1`; manual replay in `M1`.
- **Expected result:** Valid update persists; only POST deactivates; status changes to inactive and historical allocation remains.
- **Verification method:** Django view/API integration tests and related-record query.
- **Priority:** High. **Required evidence:** `students/tests.py` update/deactivation tests, `api/tests.py` deactivation tests, and allocation-history tests.
- **Execution status:** Automated update, deactivation, method and history-preservation coverage passed; manual replay not executed.

#### TC-STU-04 — Search/filter student records

- **Requirement:** HMS-F-007. **Objective:** Verify an authorized staff member can locate matching records by supported fields and status.
- **Description / steps:** Seed active/inactive students with unique IDs, names and programs. Query the actual student list using ID/name query and status filter, then search for a value with no match.
- **Preconditions / test data:** Authenticated Warden; at least two synthetic Students with distinct fields/statuses.
- **Environment:** `B1`; manual replay in `M1` using the implemented student-list search/filter controls.
- **Expected result:** Matching records are returned and nonmatching records are excluded; a no-match query displays an empty result state.
- **Verification method:** Django list/API tests and manual UI check.
- **Priority:** Medium. **Required evidence:** `students/tests.py` `test_student_list_search_and_status_filters`, `api/tests.py` `test_student_search_and_filter`; no-match response/screenshot for manual evidence.
- **Execution status:** Matching name/program/status paths passed; explicit no-match acceptance path is not asserted by the existing tests. Partial evidence; manual not executed.

#### TC-ROOM-01 — Create/edit hostel records

- **Requirement:** HMS-F-008. **Objective:** Verify authorized staff create and edit hostel name, location and status with unique identity.
- **Description / steps:** Create a hostel with unused ID, name, location and active status; retrieve it; update name/location/status; attempt duplicate ID.
- **Preconditions / test data:** Authenticated Warden and unused/duplicate synthetic hostel IDs.
- **Environment:** `B1`; manual replay in `M1`.
- **Expected result:** Valid hostel data persists and appears in the list; duplicate ID and invalid required fields are rejected.
- **Verification method:** Django view/API integration tests.
- **Priority:** High. **Required evidence:** `hostels/tests.py` `test_hostel_create_validation_duplicate_and_success`, `test_hostel_list_detail_and_update_validation`; `api/tests.py` hostel create/list test.
- **Execution status:** Automated create/list/detail/update/duplicate paths passed; manual replay not executed.

#### TC-ROOM-02 — Create/edit room records

- **Requirement:** HMS-F-009. **Objective:** Verify room attributes and hostel association persist and room number uniqueness is enforced within a hostel.
- **Description / steps:** Create a room with hostel, room number, type, positive capacity and status; retrieve it under that hostel; update supported attributes; attempt duplicate room number and invalid/nonpositive capacity.
- **Preconditions / test data:** Authenticated Warden; active synthetic hostel, unused room number, and duplicate/invalid variants.
- **Environment:** `B1`; manual replay in `M1`.
- **Expected result:** Valid room appears under the selected hostel with configured values; invalid capacity and duplicate number are rejected; Administrator permission is also honored.
- **Verification method:** Django model/view/API integration tests.
- **Priority:** High. **Required evidence:** `hostels/tests.py` room workflow/update/duplicate/capacity tests; `api/tests.py` room creation/constraint tests.
- **Execution status:** Automated valid/invalid, Warden/Administrator and database-constraint paths passed; manual replay not executed.

#### TC-ROOM-03 — Show room availability

- **Requirement:** HMS-F-010. **Objective:** Check occupancy-derived availability labels against active allocation counts and configured capacity.
- **Description / steps:** Create rooms with zero, partial and full active occupancy; request the implemented room-availability view and API; compare labels and occupied counts with the allocation records.
- **Preconditions / test data:** Authenticated staff; rooms at vacant, partially occupied and full states; active allocations only.
- **Environment:** `B1`; manual replay in `M1`.
- **Expected result:** Labels are Vacant, Partially occupied or Full as appropriate; counts match active records.
- **Verification method:** Django integration tests plus manual UI/API comparison.
- **Priority:** High. **Required evidence:** `api/tests.py` `test_create_room_and_availability`, `allocations/tests.py` `test_room_availability_shows_occupancy`, frontend state test; backend full-state assertion and manual screenshots are still needed.
- **Execution status:** Vacant and partially occupied paths are evidenced; the full-state label is not asserted against the backend endpoint in the current suite. Partial evidence; manual not executed.

#### TC-ROOM-04 — Prevent over-capacity allocation

- **Requirement:** HMS-F-011. **Objective:** Verify allocation is rejected when active occupancy equals room capacity and no extra allocation is created.
- **Description / steps:** Fill a synthetic one-bed room, attempt a second allocation, then query active allocations and room occupancy. Repeat with concurrent requests in PostgreSQL.
- **Preconditions / test data:** Active Warden; active eligible Students; room at configured capacity.
- **Environment:** `B1` PostgreSQL 16; manual replay in `M1`.
- **Expected result:** Rejected allocation has no partial record; occupancy never exceeds capacity.
- **Verification method:** Django API, database constraint and concurrency integration tests.
- **Priority:** High. **Required evidence:** `allocations/tests.py` capacity test; `api/tests.py` `test_cannot_exceed_room_capacity`, database constraint tests and `test_concurrent_allocation_capacity_protection`.
- **Execution status:** Automated capacity, constraint and concurrent PostgreSQL tests passed; manual replay not executed.

#### TC-ALLOC-01 — Allocate eligible student

- **Requirement:** HMS-F-012. **Objective:** Verify staff can create an active allocation for an active eligible Student in an available room.
- **Description / steps:** Submit the implemented allocation create form/API with student, room, allocation date and check-in date; retrieve allocation and occupancy.
- **Preconditions / test data:** Active Student with no active allocation; active available room with capacity; authenticated Warden.
- **Environment:** `B1`; manual replay in `M1`.
- **Expected result:** Exactly one active allocation stores the supplied date and occupancy increases by one.
- **Verification method:** Django API/view integration and database assertions.
- **Priority:** High. **Required evidence:** `api/tests.py` `test_create_allocation_success`, `allocations/tests.py` `test_warden_can_create_allocation`, frontend allocation workflow test.
- **Execution status:** Automated successful creation/audit/occupancy paths passed; manual replay not executed.

#### TC-ALLOC-02 — Prevent duplicate active allocation

- **Requirement:** HMS-F-013. **Objective:** Ensure a Student cannot hold two active allocations simultaneously.
- **Description / steps:** Create one active allocation; attempt a second allocation for the same Student in another room; inspect database records.
- **Preconditions / test data:** Active Student already allocated; second available room; authenticated Warden.
- **Environment:** `B1` PostgreSQL 16; manual replay in `M1`.
- **Expected result:** Second request is rejected; the original remains active and no duplicate active row exists.
- **Verification method:** Django API, database uniqueness and concurrency tests.
- **Priority:** High. **Required evidence:** `allocations/tests.py` `test_student_cannot_have_two_active_allocations`, `api/tests.py` duplicate-active constraint and concurrency tests.
- **Execution status:** Automated PostgreSQL suite passed these checks; manual replay not executed.

#### TC-ALLOC-03 — Transfer student between rooms

- **Requirement:** HMS-F-014. **Objective:** Verify an authorized transfer closes the prior active allocation and creates a new one atomically.
- **Description / steps:** Start with an active allocation; request transfer to an available destination room using the actual transfer operation; inspect both rows and occupancy; repeat with a full destination.
- **Preconditions / test data:** Warden; active Student/allocation; source and destination rooms with valid capacity.
- **Environment:** `B1`; manual replay in `M1` using the implemented transfer form/API.
- **Expected result:** Success closes old allocation on transfer date and creates a new active destination allocation; failed destination validation leaves the original active record unchanged.
- **Verification method:** Django integration tests and database assertions.
- **Priority:** High. **Required evidence:** `allocations/tests.py` transfer success/full-room tests, `api/tests.py` `test_transfer_allocation`, frontend allocation workflow test.
- **Execution status:** Automated success, rejection and history paths passed; manual replay not executed.

#### TC-ALLOC-04 — Vacate allocation

- **Requirement:** HMS-F-015. **Objective:** Verify staff can record a valid checkout date and end an active allocation.
- **Description / steps:** Vacate an active Student allocation with a valid checkout date; inspect status, date and room occupancy; retry with checkout before check-in.
- **Preconditions / test data:** Warden; active allocation with a known check-in date.
- **Environment:** `B1`; manual replay in `M1`.
- **Expected result:** Valid request stores the end date and removes the active occupancy; invalid date is rejected without changing the allocation.
- **Verification method:** Django view/API integration tests.
- **Priority:** High. **Required evidence:** `allocations/tests.py` vacate/date-boundary tests, `api/tests.py` `test_vacate_allocation`, frontend workflow test.
- **Execution status:** Automated valid and invalid date paths passed; manual replay not executed.

#### TC-ALLOC-05 — View current allocation

- **Requirement:** HMS-F-016. **Objective:** Confirm Student and authorized staff views reflect the active allocation and role permissions.
- **Description / steps:** As an allocated Student, inspect current hostel, room, allocation/check-in dates and status; repeat with an unallocated Student and a staff account; try to access another Student's details.
- **Preconditions / test data:** Synthetic allocated and unallocated Students, current allocation and distinct account links.
- **Environment:** `B1`; manual replay in `M1`.
- **Expected result:** Displayed fields match the active record; completed allocations are not shown as current; cross-student data is denied.
- **Verification method:** Django profile/API integration tests and manual role replay.
- **Priority:** High. **Required evidence:** `SPRINT1_TEST_VALIDATION.md` historical TC-ALLOC-05 evidence; `accounts/tests.py` profile tests; `api/tests.py` current-user tests.
- **Execution status:** Mapped automated profile/current-user tests passed; manual staff/Student replay not executed.

#### TC-ALLOC-06 — View allocation history

- **Requirement:** HMS-F-017. **Objective:** Verify authorized staff can see previous rooms and allocation start/end dates after transfer or vacate.
- **Description / steps:** Create a Student history with two rooms, one completed and one active allocation; open history with all/active/completed filters; check dates and ordering.
- **Preconditions / test data:** Warden; one Student with synthetic completed and active allocation records.
- **Environment:** `B1`; manual replay in `M1`.
- **Expected result:** Historical rows remain visible with their rooms and dates and use consistent chronological ordering.
- **Verification method:** Django integration test and manual table comparison.
- **Priority:** Medium. **Required evidence:** `allocations/tests.py` allocation history search and active/completed/all filter tests; explicit ordered-result assertion is absent.
- **Execution status:** Automated filtering/preservation paths passed; ordering criterion lacks direct assertion. Partial evidence; manual not executed.

#### TC-REPORT-01 — Occupancy summary

- **Requirement:** HMS-F-018. **Objective:** Check authorized staff summary counts against active allocations and room capacities.
- **Description / steps:** Seed multiple rooms and active/completed allocations; request occupancy summary; independently count active rows by room/hostel and compare totals.
- **Preconditions / test data:** Warden; synthetic hostels, rooms with varied capacity/occupancy and completed history.
- **Environment:** `B1`; manual replay in `M1`.
- **Expected result:** Report is read-only and its active occupancy/capacity counts match the underlying records.
- **Verification method:** Django API integration and manual data comparison.
- **Priority:** Medium. **Required evidence:** `api/tests.py` `ReportsAPITests.test_occupancy_report` and `test_allocation_report`; frontend reports rendering test.
- **Execution status:** Automated report totals passed; manual multi-room comparison not executed.

### Non-functional requirements

#### TC-NFR-01 — Performance target

- **Requirement:** HMS-NF-001. **Objective:** Measure the SRS p95 response-time target.
- **Description / steps:** On the evaluation deployment, run at least 50 authenticated ordinary requests for representative dashboard, student lookup and room lookup workflows; exclude downloads; record each duration and calculate p95.
- **Preconditions / test data:** Stable deployment, authenticated synthetic staff account, representative synthetic records, approved load/measurement tool.
- **Environment:** `M1` performance environment; tool and load profile must be agreed before execution.
- **Expected result:** p95 for ordinary authenticated page requests is at most 2 seconds.
- **Verification method:** Performance/system measurement with timestamped raw results.
- **Priority:** High. **Required evidence:** Raw request timing data, calculation and environment/load description.
- **Execution status:** Not executed; no performance run/evidence exists. **N.**

#### TC-NFR-02 — Availability target

- **Requirement:** HMS-NF-002. **Objective:** Measure service availability over the evaluation period.
- **Description / steps:** Record successful/failed service probes over the agreed evaluation window; exclude planned maintenance and calculate availability using the agreed denominator.
- **Preconditions / test data:** Deployed service with monitoring/log retention and approved evaluation window.
- **Environment:** `M1` production-like deployment.
- **Expected result:** Availability is at least 99% for the evaluation period, excluding planned maintenance.
- **Verification method:** Availability log/uptime review.
- **Priority:** Medium. **Required evidence:** Timestamped uptime log and excluded-maintenance record.
- **Execution status:** Not executed; no evaluation-period availability log exists. **N.**

#### TC-NFR-03 — Allocation data integrity

- **Requirement:** HMS-NF-003. **Objective:** Check one-active-allocation and room-capacity invariants after normal and concurrent allocation operations.
- **Description / steps:** Run allocate/duplicate/full-room/transfer/vacate cases; query active allocations grouped by Student and Room; confirm zero violations.
- **Preconditions / test data:** PostgreSQL 16 test database; synthetic Students/rooms covering empty, partial and full capacity.
- **Environment:** `B1` PostgreSQL 16.
- **Expected result:** No Student has more than one active allocation and no room is over capacity after the suite.
- **Verification method:** Django constraint/concurrency integration suite plus independent post-run integrity queries.
- **Priority:** High. **Required evidence:** `api/tests.py` database constraint/concurrency tests and saved post-run integrity query output.
- **Execution status:** Constraints and concurrent protection passed in 128 tests; no separate full-database post-run invariant query was saved. Partial evidence.

#### TC-NFR-04 — 128 px workflow usability

- **Requirement:** HMS-NF-004. **Objective:** Check primary workflows fit a 1280 px desktop viewport without horizontal overflow.
- **Description / steps:** In a current desktop browser set viewport to 1280 px; complete login, student lookup, room lookup and allocation; inspect document and major content containers for horizontal overflow.
- **Preconditions / test data:** Stable frontend/backend, role accounts and synthetic records.
- **Environment:** `M1`, current Chrome/Edge/Firefox at 1280 px.
- **Expected result:** Workflows complete and no horizontal scrolling/layout overflow occurs.
- **Verification method:** Manual browser usability/system test.
- **Priority:** Medium. **Required evidence:** Browser/version, viewport, screenshots or recording for each workflow.
- **Execution status:** Not executed; SSR/component tests do not establish viewport behavior. **N.**

#### TC-NFR-05 — Maintainable architecture

- **Requirement:** HMS-NF-005. **Objective:** Review separation of presentation, application/business and data-access responsibilities.
- **Description / steps:** Review Django models/forms/views/templates/configuration and API serializers/views, then frontend app routes/components/API libraries; record any boundary violations and reviewers.
- **Preconditions / test data:** Current checked-out source and SAD sections 3–4.
- **Environment:** Repository review; no runtime environment required.
- **Expected result:** Responsibilities are reasonably separated into models/data, views/controllers, templates/UI, forms and configuration as described by the SAD.
- **Verification method:** Manual architecture/code review.
- **Priority:** Medium. **Required evidence:** Dated review checklist, file references and reviewer disposition.
- **Execution status:** Structure review found the expected Django modules and frontend route/component/API separation; an independent signed review/checklist is absent. Partial evidence.

#### TC-NFR-06 — Controlled errors

- **Requirement:** HMS-NF-006. **Objective:** Verify invalid input, missing records and unauthorized requests yield safe controlled responses in production-like settings.
- **Description / steps:** Submit invalid student/room/allocation data, request missing IDs and protected resources anonymously/as Student with `DEBUG=false`; inspect response code/body for raw stack traces.
- **Preconditions / test data:** Production-like test settings, synthetic records, anonymous/Student/Warden accounts.
- **Environment:** `B1` for Django negative tests; deployed-like configuration for traceback inspection.
- **Expected result:** Controlled validation/not-found/authorization responses; no traceback/debug page exposed.
- **Verification method:** Django integration/negative tests plus response-body inspection.
- **Priority:** High. **Required evidence:** `api/tests.py` structured-error and permission tests, missing-record tests, redacted production-like response capture.
- **Execution status:** Structured API errors, invalid input, permissions and missing records passed; no explicit traceback-body assertion is present. Partial evidence.

#### TC-NFR-07 — Labels and keyboard access

- **Requirement:** HMS-NF-007. **Objective:** Audit labels, visible validation messages and keyboard operation for all core forms/navigation.
- **Description / steps:** Keyboard-only traverse login, student, room and allocation forms/navigation; check associated labels, focus order/visibility, validation messages and submit/error controls.
- **Preconditions / test data:** Stable frontend with each core role/workflow reachable.
- **Environment:** `M1`, current desktop browser and keyboard; use the STP accessibility checklist.
- **Expected result:** All core controls have labels, validation is visible and workflows can be completed by keyboard.
- **Verification method:** Manual accessibility checklist; automated UI rendering tests are supporting evidence only.
- **Priority:** Medium. **Required evidence:** Completed checklist and screenshots/recording for each core form.
- **Execution status:** Frontend tests render representative forms and validation states; no keyboard/accessibility audit was executed. Partial evidence.

### Security requirements

#### TC-SEC-01 — Password hashes

- **Requirement:** HMS-SR-001. **Objective:** Verify passwords are stored only as one-way hashes and authentication still works.
- **Description / steps:** Inspect user creation and password-hasher configuration; create a synthetic account; compare the stored password field to the supplied value and use framework `check_password` plus login.
- **Preconditions / test data:** Synthetic account and known nonproduction password; DB inspection access.
- **Environment:** `B1` test database; never use production credentials.
- **Expected result:** Stored value is a framework-approved encoded hash, differs from plaintext, and validates through `check_password`; login succeeds only for the known password.
- **Verification method:** Code/configuration review and database/authentication test.
- **Priority:** High. **Required evidence:** Django user creation paths (`create_user`), `accounts/tests.py` auth tests, `api/tests.py` bootstrap password check; redacted stored hash prefix and equality result.
- **Execution status:** Django `create_user` paths and default hashing behavior reviewed; `test_bootstrap_admin_provisions_active_administrator_without_superuser` and auth tests passed. Evidence supports the stated framework hash behavior; no production account inspected. **A** for the test environment only.

#### TC-SEC-02 — Direct URL authorization

- **Requirement:** HMS-SR-002. **Objective:** Verify protected staff endpoints reject unauthorized direct requests, not only hidden UI controls.
- **Description / steps:** Use Student credentials to directly request representative staff student, hostel, room, allocation, reports and role routes/API operations; record status and ensure no protected data is returned.
- **Preconditions / test data:** Student plus Warden/Administrator fixtures; routes from Django URLs and `schema.yml`.
- **Environment:** `B1`; manual replay in `M1`.
- **Expected result:** Each unauthorized direct request is denied and does not disclose protected data.
- **Verification method:** API permission and view integration tests plus exhaustive manual route matrix.
- **Priority:** High. **Required evidence:** `accounts/tests.py` and `api/tests.py` representative role tests; route-by-route manual results.
- **Execution status:** Representative direct route/object/API tests passed; every protected operation has not been enumerated and manually verified. Partial evidence.

#### TC-SEC-03 — 30-minute inactivity timeout

- **Requirement:** HMS-SR-003. **Objective:** Verify an idle authenticated session requires reauthentication after 30 minutes in deployed configuration.
- **Description / steps:** Authenticate, record time, perform no requests for at least 30 minutes, then request a protected page and `/api/v1/auth/me/`.
- **Preconditions / test data:** Deployed-like session settings and synthetic account; synchronized clock.
- **Environment:** `M1`; not substituted by a unit-only timeout check.
- **Expected result:** Protected access requires reauthentication after inactivity.
- **Verification method:** Manual time-based security/system test.
- **Priority:** Medium. **Required evidence:** Session settings, timestamps and post-idle HTTP result.
- **Execution status:** `SESSION_COOKIE_AGE=1800`, `SESSION_SAVE_EVERY_REQUEST=True` and settings test passed; the 30-minute idle experiment was not performed. Partial evidence.

#### TC-SEC-04 — HTTPS and secure cookies

- **Requirement:** HMS-SR-004. **Objective:** Verify authenticated deployment traffic uses HTTPS and session cookies are Secure.
- **Description / steps:** In deployed HTTPS environment authenticate and inspect redirect, TLS URL and `Set-Cookie` attributes for the session cookie; verify HTTP is redirected where configured.
- **Preconditions / test data:** Deployed TLS endpoint and synthetic account.
- **Environment:** `M1` HTTPS deployment.
- **Expected result:** Authenticated traffic is HTTPS and session cookie is marked Secure with deployment settings.
- **Verification method:** Manual security/configuration test.
- **Priority:** High. **Required evidence:** Redacted response headers, TLS endpoint and effective settings.
- **Execution status:** Source config defaults secure redirect/session/CSRF cookies on when `DEBUG=false`; deployment HTTPS and Set-Cookie evidence were not collected. Partial evidence.

#### TC-SEC-05 — Audit critical changes safely

- **Requirement:** HMS-SR-005. **Objective:** Verify audit records contain timestamp, actor, action, affected record ID for student, room, allocation and role changes and no password values.
- **Description / steps:** Perform create/update/deactivate, room change, allocate/transfer/vacate and role change with synthetic credentials; query each audit record and inspect serialized/logged data for required fields and absence of credentials.
- **Preconditions / test data:** Warden/Administrator accounts; synthetic Student/hostel/room/allocation; unique synthetic password.
- **Environment:** `B1`; manual DB/audit review in `M1` if deployed.
- **Expected result:** Every critical event is attributable and has required metadata; plaintext password/credential values are absent.
- **Verification method:** Django audit integration tests plus audit-row/content inspection.
- **Priority:** High. **Required evidence:** `students/tests.py`, `hostels/tests.py`, `allocations/tests.py`, `api/tests.py` role audit tests; redacted audit rows covering required fields and secret scan.
- **Execution status:** Automated audit creation for several student/room/allocation/role operations passed. Complete required-field assertion across every action and credential-exclusion check are missing. Partial evidence.

## 11. Requirements Traceability Matrix (RTM)

Requirement wording and IDs below are copied from `12_SRS.pdf` Version 1.0,
Sections 4–5.1.2 (pages 6–12). SAD references follow the design traceability
in `12_SAD.pdf` Section 3.8. Manual case IDs are the existing SRS/STP IDs and
refer to the manual procedures in Section 10. Where automation maps to the same
acceptance case, the existing ID is reused rather than creating a duplicate.

For this task, statuses use the requested meanings: **N** = no supporting
verification evidence; **P** = partial evidence/incomplete acceptance; **A** =
sufficient successful execution evidence for the stated acceptance criteria.
This is deliberately different from the shorthand in the original STP/SRS RTM,
where P meant “Passed”; the approved SRS itself is not changed.

| Requirement ID | Original SRS requirement | SAD reference | Manual test case ID | Automated test case ID / actual test mapping | Verification method | Expected result | Actual result / supporting evidence | Status |
|---|---|---|---|---|---|---|---|---|
| HMS-F-001 | The system shall authenticate users using a unique username/email and password before granting access to protected functions. | DS-AUTH-01 Authentication & Authorization | TC-AUTH-01 | TC-AUTH-01: `accounts/tests.py` login tests; `api/tests.py` login/CSRF tests | Auth integration | Valid session; invalid credentials rejected | Passed in PostgreSQL suite; see files/methods above and 128-test run | A |
| HMS-F-002 | The system shall restrict functions and records according to the user role (Student, Warden, Administrator). | DS-AUTH-01 | TC-AUTH-02 | TC-AUTH-02: `accounts/tests.py` role tests; `api/tests.py` permission/object ownership tests | Authorization integration | Student cannot access representative staff functions or unrelated student records | Representative direct views/API/object permission tests passed; every staff endpoint not individually exercised | A |
| HMS-F-003 | The system shall provide logout that invalidates the active authenticated session. | DS-AUTH-01 | TC-AUTH-03 | TC-AUTH-03: `accounts/tests.py::test_logout_invalidates_session`; `api/tests.py` logout test | Session integration | Post-logout protected request requires authentication | Both logout/session tests passed in 128-test PostgreSQL suite | A |
| HMS-F-004 | The system shall allow authorized staff to create a student record containing at minimum student ID, name, contact details, course/program, year, and status. | DS-STU-01 Student Management | TC-STU-01 | TC-STU-01: `students/tests.py::test_student_create_get_validation_and_audit`; `api/tests.py::test_warden_can_create_student_and_audit_logged` | CRUD integration | Complete unique record persists and appears to staff | Valid and invalid create tests passed on PostgreSQL | A |
| HMS-F-005 | The system shall allow a student to view permitted personal and hostel information associated with the logged-in student account. | DS-STU-01 | TC-STU-02 | TC-STU-02: `accounts/tests.py` own-profile/current-allocation/isolation tests; `api/tests.py` current-user tests | Role/object-access integration | Student sees own permitted profile/allocation only | Own, unallocated, active allocation and other-student isolation tests passed | A |
| HMS-F-006 | The system shall allow authorized staff to update and deactivate student records without deleting historical allocation records. | DS-STU-01 | TC-STU-03 | TC-STU-03: `students/tests.py` update/deactivation workflow; `api/tests.py` deactivation; `allocations/tests.py` history tests | CRUD/data-integrity integration | Changes persist; deactivation preserves allocations | Update/deactivate and history regression tests passed | A |
| HMS-F-007 | The system shall allow authorized staff to search and filter student records using supported fields such as student ID or name. | DS-STU-01 | TC-STU-04 | TC-STU-04: `students/tests.py::test_student_list_search_and_status_filters`; `api/tests.py::test_student_search_and_filter` | Search/filter integration | Only matches returned; no-match result handled | Name/program/status matching passed; no-match acceptance assertion absent | P |
| HMS-F-008 | The system shall allow authorized staff to create and edit hostel records including hostel name, block/location, and status. | DS-ROOM-01 Hostel & Room | TC-ROOM-01 | TC-ROOM-01: `hostels/tests.py` hostel create/list/detail/update tests; `api/tests.py` hostel list/create | CRUD integration | Valid unique hostel is visible with updated fields | Create, duplicate validation, detail and update tests passed | A |
| HMS-F-009 | The system shall allow authorized staff to create and edit room records containing hostel, room number, room type, capacity, and status. | DS-ROOM-01 | TC-ROOM-02 | TC-ROOM-02: `hostels/tests.py` room workflow/update/capacity tests; `api/tests.py` room and DB constraint tests | CRUD/database integration | Room belongs to chosen hostel with configured valid fields | Warden/Admin, capacity, uniqueness and database constraint tests passed | A |
| HMS-F-010 | The system shall display room availability as vacant, partially occupied, or full based on active allocations and configured capacity. | DS-ROOM-01 | TC-ROOM-03 | TC-ROOM-03: `api/tests.py::test_create_room_and_availability`; `allocations/tests.py::test_room_availability_shows_occupancy`; frontend availability-state test | UI/API integration | Label and occupied count agree with active allocations/capacity | Vacant and partial backend cases passed; full label lacks direct backend assertion | P |
| HMS-F-011 | The system shall prevent allocation of a room when its active occupancy has reached configured capacity. | DS-ROOM-01 (capacity rule) | TC-ROOM-04 | TC-ROOM-04: `allocations/tests.py::test_room_capacity_cannot_be_exceeded`; `api/tests.py` capacity, DB constraint and concurrency tests | PostgreSQL integration/concurrency | Full room rejects write; occupancy remains within capacity | All capacity/constraint/concurrency tests passed on PostgreSQL 16 | A |
| HMS-F-012 | The system shall allow authorized staff to allocate an eligible student to an available room and store the allocation date and active status. | DS-ALLOC-01 Allocation Management | TC-ALLOC-01 | TC-ALLOC-01: `api/tests.py::test_create_allocation_success`; `allocations/tests.py::test_warden_can_create_allocation` | CRUD/business-rule integration | One active dated allocation; occupancy +1 | API and staff creation/audit tests passed | A |
| HMS-F-013 | The system shall prevent a student from having more than one active room allocation at the same time. | DS-ALLOC-01 | TC-ALLOC-02 | TC-ALLOC-02: `allocations/tests.py::test_student_cannot_have_two_active_allocations`; `api/tests.py` unique-active and concurrency tests | PostgreSQL integrity/concurrency | Second active allocation rejected; original preserved | DB constraint and concurrent allocation tests passed on PostgreSQL 16 | A |
| HMS-F-014 | The system shall allow authorized staff to transfer a student from one room to another while closing the previous active allocation and creating the new active allocation. | DS-ALLOC-01 | TC-ALLOC-03 | TC-ALLOC-03: `allocations/tests.py::test_warden_can_transfer_active_allocation`; `api/tests.py::test_transfer_allocation` | Transactional integration | Old row closes, new row active, capacity valid | Success and full-destination rollback tests passed | A |
| HMS-F-015 | The system shall allow authorized staff to vacate a student allocation by recording the checkout/end date and changing the allocation to inactive. | DS-ALLOC-01 | TC-ALLOC-04 | TC-ALLOC-04: `allocations/tests.py` vacate/date tests; `api/tests.py::test_vacate_allocation` | Integration | End date stored; active occupancy decreases | Valid/invalid checkout tests passed | A |
| HMS-F-016 | The system shall allow students and authorized staff to view the current room allocation details, including hostel, room number, allocation date, and allocation status, according to role permissions. | DS-ALLOC-01 | TC-ALLOC-05 | TC-ALLOC-05: `accounts/tests.py` profile/current allocation tests; `api/tests.py` current-user tests | Role/UI/API integration | Displayed active allocation matches record and role | Existing historical TC-ALLOC-05 mapped tests and current automated profile/API tests passed | A |
| HMS-F-017 | The system shall allow authorized staff to view a student’s allocation history, including previous rooms and allocation start/end dates. | DS-ALLOC-01 | TC-ALLOC-06 | TC-ALLOC-06: `allocations/tests.py` history search/active/completed/all tests | History integration | Previous room/date records persist and ordering is consistent | History filtering and presence tests passed; ordering not directly asserted | P |
| HMS-F-018 | The system shall provide an authorized staff view summarizing hostel room occupancy and current allocation counts. | DS-REPORT-01 Reporting & Availability | TC-REPORT-01 | TC-REPORT-01: `api/tests.py::ReportsAPITests.test_occupancy_report`, `test_allocation_report`; frontend reports view test | Report integration | Summary totals equal active allocations grouped by hostel/room | API report totals and frontend rendering tests passed | A |
| HMS-NF-001 | For normal project test load, 95% of ordinary authenticated page requests shall complete within 2 seconds, excluding file downloads. | DS-NFR-01 Cross-cutting quality | TC-NFR-01 | — (no performance/load test exists) | Performance/system measurement | At least 50 requests; p95 ≤ 2 s | No timing run/report exists | N |
| HMS-NF-002 | The deployed system shall achieve at least 99% availability during the evaluation period, excluding planned maintenance. | DS-NFR-01 | TC-NFR-02 | — (no uptime monitor/report exists) | Reliability/operational observation | Availability ≥99% excluding planned maintenance | No evaluation-period uptime log exists | N |
| HMS-NF-003 | The application shall preserve consistent allocation data so that no student has more than one active allocation and no room exceeds configured capacity. | DS-NFR-01 / DS-ALLOC-01 | TC-NFR-03 | TC-NFR-03: PostgreSQL constraint/concurrency tests; allocation tests | Data-integrity integration | Zero duplicate-active or over-capacity violations after tests | Constraints and concurrency pass; separate saved global invariant query absent | P |
| HMS-NF-004 | The primary student and staff workflows shall be usable through a current desktop browser without horizontal scrolling at a viewport width of 1280 px. | DS-NFR-01 / Browser Client | TC-NFR-04 | — (SSR rendering tests do not test viewport overflow) | Usability/system test | Core workflows complete at 1280 px with no horizontal overflow | No 1280 px browser run or screenshot evidence | N |
| HMS-NF-005 | The application code shall be organized into clear presentation, application/business, and data-access responsibilities using the selected project framework. | DS-NFR-01 / SAD 3.3–3.5 | TC-NFR-05 | — (manual review; not a runtime automated case) | Architecture/code review | Reasonable separation of models/data, views, templates/UI, forms and configuration | Repository structure shows these boundaries; independent signed review/checklist absent | P |
| HMS-NF-006 | The system shall return a controlled error response for invalid input, missing records, and unauthorized access without exposing stack traces to end users in production-like settings. | DS-NFR-01 / error handling SAD 4.4 | TC-NFR-06 | TC-NFR-06: `api/tests.py` structured errors, missing record and permissions tests | Negative/system test | Safe controlled responses and no production traceback | Negative/error cases passed; explicit traceback-body assertion absent | P |
| HMS-NF-007 | The user interface shall provide labels, visible validation messages, and keyboard-accessible form controls for all core student, room, and allocation workflows. | DS-NFR-01 / Browser Client SAD 4.5 | TC-NFR-07 | TC-NFR-07: frontend form/render and validation tests (partial) | Accessibility/usability checklist | Labels, visible validation and keyboard access across core workflows | Representative rendering/validation tests pass; keyboard audit not executed | P |
| HMS-SR-001 | The system shall store user passwords only as one-way password hashes using the selected framework’s approved password-hashing mechanism; plaintext passwords shall not be stored. | DS-SEC-01 Authentication & Session Security | TC-SEC-01 | TC-SEC-01: `api/tests.py::test_bootstrap_admin_provisions_active_administrator_without_superuser`; login tests | Security code/config review + auth test | Stored hash is not plaintext and verifies through framework check | Django `create_user` paths/default hashing reviewed; `check_password` and login tests passed | A |
| HMS-SR-002 | The system shall enforce role-based authorization on every protected staff function and shall reject unauthorized direct URL access. | DS-SEC-01 | TC-SEC-02 | TC-SEC-02: `accounts/tests.py` representative route checks; `api/tests.py` permission tests | Security/authorization test | Every unauthorized direct request denied without protected data | Representative routes/object/API permissions pass; full endpoint matrix is not executed | P |
| HMS-SR-003 | The system shall terminate or require re-authentication after 30 minutes of inactivity for authenticated sessions in the deployed configuration. | DS-SEC-01 | TC-SEC-03 | TC-SEC-03: `accounts/tests.py::test_session_timeout_is_configured` | Configuration test + time-based security test | After 30 minutes idle, protected request requires reauthentication | Config 1800 seconds and rolling session test pass; no 30-minute idle run/deployment evidence | P |
| HMS-SR-004 | The deployed system shall use HTTPS for authenticated traffic and shall enable secure session/cookie settings appropriate to HTTPS deployment. | DS-SEC-02 Deployment Security | TC-SEC-04 | — (deployment HTTPS/cookie capture not in automated suite) | Deployment security inspection | HTTPS enforced and session cookie marked Secure | Source defaults secure settings when `DEBUG=false`; no deployed TLS/header evidence | P |
| HMS-SR-005 | The system shall record timestamp, user identity, action type, and affected record identifier for critical student, room, allocation, and role changes; passwords shall never be recorded in audit data. | DS-AUDIT-01 Audit Logging | TC-SEC-05 | TC-SEC-05: student/room/allocation/role audit tests in Django suites | Security/audit integration and content review | Required metadata present for each critical operation; no password values | Several create/update/transfer/vacate/role audit events pass; complete fields/action matrix and secret-exclusion review absent | P |

### RTM completeness and status summary

- Functional baseline: all HMS-F-001–HMS-F-018 appear once (18).
- Non-functional baseline: all HMS-NF-001–HMS-NF-007 appear once (7).
- Security baseline: all HMS-SR-001–HMS-SR-005 appear once (5).
- Total unique baseline requirements: **30**. No requirement ID is added, omitted or duplicated.
- Status counts: **A = 16**, **P = 11**, **N = 3**.
- The three N requirements are NF-001 performance, NF-002 availability and NF-004 viewport usability because no criterion-level execution evidence exists. The P rows state the missing acceptance evidence explicitly. A denotes only the listed tested acceptance criteria, not broader deployment/security acceptance.
