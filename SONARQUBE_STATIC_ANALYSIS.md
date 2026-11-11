# SonarQube Cloud Static Analysis Status

## Scope and configuration

- Configuration: `sonar-project.properties`.
- Organization/project keys: `pesu-hms-team12` / `PESU-HMS-Team12_hostel-management-system`, confirmed by the project owner and accepted by the executed scanner.
- The scanner reported the GitHub ALM binding as `BOUND`.
- Source scope: Django application packages and `frontend/src`.
- Test scope: Django test modules and `frontend/tests`.
- Coverage inputs: `coverage.xml` for Python and `frontend/coverage/lcov.info` for JavaScript/TypeScript.
- CI configuration: `.github/workflows/ci.yml` downloads both reports before `SonarSource/sonarqube-scan-action@v8.3.0`; the token is referenced as `${{ secrets.SONAR_TOKEN }}` and its value was not accessed.
- Generated/dependency artifacts and Django migration history are excluded; project-owned application source is retained.

## First Cloud analysis

The supplied GitHub Actions log shows SonarScanner CLI 8.1.0.6389 on `main`, analyzing commit `b01d6369723ffada0bee3b65d2ceb2f1f8f2cd81`. It detected five languages and indexed 137 files; Python analysis covered 67 source files.

- The Python Cobertura sensor parsed `coverage.xml`, but could not resolve 7 file paths because entries such as `__init__.py` were ambiguous across the package source roots. Coverage measures for those paths were ignored.
- The JavaScript/TypeScript coverage sensor opened `frontend/coverage/lcov.info` and completed. The supplied log does not show its imported percentage.
- The analysis report uploaded, but the quality gate **failed**. The supplied scanner log does not identify the individual failed conditions.
- Sonar bugs, vulnerabilities, hotspots, code smells, maintainability rating and duplication counts are not present in the supplied log; they require project dashboard access.

Dashboard from the scanner log: <https://sonarcloud.io/dashboard?id=PESU-HMS-Team12_hostel-management-system&branch=main>.

## Python coverage path correction

The previous `.coveragerc` listed each Django package as a separate coverage source root. Coverage.py therefore emitted repeated basenames such as `__init__.py`, which Sonar could not uniquely map to indexed files. The correction changes the source root to the repository (`source = .`) and omits tests, migrations, tooling, frontend, dependencies and generated directories while retaining the Django application packages.

I validated the corrected configuration against existing local coverage data. Its Cobertura XML contained 61 class entries, paths such as `accounts/views.py`, and zero basename-only paths. This validates the report path shape only; it does not represent a new test execution or a successful Sonar import. A subsequent CI analysis must confirm the fix and reevaluate the quality gate.

## Coverage baseline

The separately executed local baseline is documented in `AUTOMATED_TEST_COVERAGE.md`: Python 89.96% statements and 70.05% branches on PostgreSQL 16, and frontend 71.19% statements. These local coverage.py/c8 results should not be represented as successfully imported Sonar coverage. The first Sonar analysis partially resolved Python coverage and read the frontend LCOV input; import confirmation for corrected Python paths and the quality gate are pending another scan.
