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

## Python coverage path correction and rerun

The previous `.coveragerc` listed each Django package as a separate coverage source root. Coverage.py therefore emitted repeated basenames such as `__init__.py`, which Sonar could not uniquely map to indexed files. The correction changes the source root to the repository (`source = .`) and omits tests, migrations, tooling, frontend, dependencies and generated directories while retaining the Django application packages.

I validated the corrected configuration against existing local coverage data. Its Cobertura XML contained 61 class entries, paths such as `accounts/views.py`, and zero basename-only paths.

The corrected workflow was then pushed to `kanishk/sonarcloud-validation` and completed successfully in Actions run [42968468818](https://github.com/PESU-HMS-Team12/hostel-management-system/actions/runs/42968468818), commit `da3459cc3980b7bf6473eb6ed271ccfc224092c1`. The run executed 134 Django tests against the PostgreSQL CI service; all passed. Backend coverage was 90.42% statements and 71.01% branches. The frontend ran 32 tests and reported 70.84% statements. Both backend and frontend report artifacts downloaded successfully. Sonar's Python Cobertura sensor parsed `coverage.xml` without the prior unresolved-path error, and the JavaScript/TypeScript sensor analyzed `frontend/coverage/lcov.info`. The SonarCloud analysis report uploaded and the quality gate **passed** for this validation branch.

The branch run verifies that both report inputs are consumed by the scanner and that the path correction fixes the original failure. It does not establish the quality gate result for `main`; that requires a scan of `main` after the fix is merged.

## Coverage baseline

The earlier local baseline is documented in `AUTOMATED_TEST_COVERAGE.md`: Python 89.96% statements and 70.05% branches on PostgreSQL 16, and frontend 71.19% statements. The later CI run above is the current verified result for the validation branch. Sonar issue counts and detailed gate conditions are not included in the supplied scanner log; consult the linked project dashboard for those details.
