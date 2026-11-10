"""Enforce separate statement and branch coverage targets from coverage.py JSON."""

from __future__ import annotations

import json
import sys
from pathlib import Path


def main() -> int:
    report_path = Path(sys.argv[1] if len(sys.argv) > 1 else "coverage.json")
    with report_path.open(encoding="utf-8") as report_file:
        totals = json.load(report_file)["totals"]

    statement_total = totals["num_statements"]
    statements_covered = totals["covered_lines"]
    statements = (
        100.0 * statements_covered / statement_total if statement_total else 100.0
    )
    branches_total = totals.get("num_branches", 0)
    branches_covered = totals.get("covered_branches", 0)
    branches = (
        100.0 * branches_covered / branches_total if branches_total else 100.0
    )

    print(f"Statement coverage: {statements:.2f}% (target: 80.00%)")
    print(f"Branch coverage: {branches:.2f}% (target: 70.00%)")

    failures = []
    if statements < 80:
        failures.append("statement coverage is below 80%")
    if branches < 70:
        failures.append("branch coverage is below 70%")

    if failures:
        print("Coverage target failure: " + "; ".join(failures), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
