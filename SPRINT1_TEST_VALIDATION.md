# Sprint 1 Test Validation and Traceability Update

## Requirements Traceability Matrix update

This addendum updates the relevant rows in the RTM embedded in Section 8 of
`12_SRS.pdf`. It keeps the SRS requirement IDs and test case IDs and adds the
execution evidence required for this validation.

| Requirement ID | Requirement description | Test case ID | Verification method | Expected result | Actual result | Status |
| --- | --- | --- | --- | --- | --- | --- |
| HMS-F-016 | View current allocation | TC-ALLOC-05 | Django integration tests: `test_student_profile_displays_current_allocation`, `test_student_can_view_own_profile`, `test_student_profile_does_not_show_completed_allocation_as_current`, `test_student_profile_does_not_show_another_students_allocation` | A student sees their own active hostel, room, allocation date and status; an unallocated student sees the empty state; another student's allocation is not exposed. | All mapped tests passed. | Pass |
| HMS-F-009 | Manage room records | TC-ROOM-02 | Django integration tests: `test_warden_can_edit_room_and_update_is_audited`, `test_administrator_can_edit_room`, `test_student_cannot_edit_room`, `test_zero_capacity_is_rejected`, `test_duplicate_room_number_in_same_hostel_is_rejected`, `test_capacity_cannot_be_reduced_below_active_occupancy`, `test_capacity_cannot_be_reduced_below_positive_active_occupancy`, `test_room_edit_preserves_existing_allocation_history` | Warden/Administrator can edit; unauthorized users are denied; invalid capacity and duplicate room number are rejected; capacity cannot go below active occupancy; allocation history remains intact. | All mapped tests passed. | Pass |
| HMS-SR-005 | Audit logging | TC-SEC-05 | Role profile creation/update audit integration tests; inspect audit rows for actor, timestamp, action, affected record and credentials | Role creation and role changes are logged with the required fields; passwords and credentials are absent. | Role profile save has no audit integration, and no role-change audit tests exist. Validation is blocked pending implementation. | Blocked |

## Test execution report

- **Environment:** Existing `venv`; Python 3.11; Django 6.1.1; SQLite, as configured in `config/settings.py`.
- **Commands:** `python manage.py check`; `python manage.py test accounts students hostels allocations auditlog`; `python manage.py test`.
- **Results:** System check passed. Targeted suite: 59 tests passed, 0 failed. Full suite: 59 tests passed, 0 failed.
- **Blocked tests:** TC-SEC-05 role profile creation and role change audit validation, pending role audit implementation. No test was added for absent integration.
- **Coverage:** `coverage.py` is not installed in the existing environment. No code coverage percentage is available. It was not added as a dependency because the repository has no development dependency or coverage configuration.
- **Branch coverage:** Not available; coverage tooling is absent.
- **Static analysis:** `.github/workflows` configures `manage.py check` and `manage.py test`; both passed. No separate lint or static analysis tool is configured or installed.
- **Remaining defect:** Role profile creation/role changes do not produce audit records, so HMS-SR-005 remains unverified for this Sprint 1 scope. Role auditing must also be checked for actor, timestamp, action, affected record and credential exclusion after integration.

## Files changed

- `accounts/tests.py`: adds regression coverage that a student profile does not expose another student's allocation.
- `hostels/tests.py`: adds Administrator permission, zero capacity, positive capacity below occupancy, and allocation-history preservation tests.
- `SPRINT1_TEST_VALIDATION.md`: records the RTM execution update and test evidence without rewriting the SRS or STP.

Suggested commit message: `test: validate Sprint 1 allocation and room fixes`
