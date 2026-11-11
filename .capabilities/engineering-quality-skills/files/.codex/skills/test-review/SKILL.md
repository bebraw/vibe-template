---
name: test-review
description: Review whether changed behavior has meaningful, maintainable regression coverage without demanding tests for trivial or type-only behavior.
license: MIT
metadata:
  source: https://github.com/cniska/skills
  revision: 2c83858f1d801369355a761ce3ba9b492f5c642f
---

# Test Review

Compare changed behavior with existing tests. Look for unguarded branches, errors, boundaries, configuration variants, and public contracts; also identify brittle, duplicative, obsolete, timing-dependent, or implementation-coupled tests.

Check that negative tests reach the intended guard instead of passing because an earlier guard rejects the input. Check isolation from real user homes, inherited configuration, credentials, services, and shared ports or paths; use disposable synthetic fixtures with cleanup, and keep real integrations explicitly opt-in.

Report unexplained skipped or deleted tests, removed assertions, coverage or mutation exclusions, lowered thresholds, and checks moved out of blocking gates as `Restore`, naming the protection lost. Inspect the stated rationale and replacement evidence before flagging a deliberate change.

Flag a missing test only when you can name the concrete bug or regression it would catch. Prefer public behavior, independent expected values, and mocks only at true external boundaries. Do not demand 100% coverage or tests for behavior the type system already guarantees.

Label findings `Restore`, `Must-add`, `Should-add`, `Optional`, or `Remove`. Include source and test locations, the untested behavior or weakened protection, the concrete regression, and a fix direction. Cap required additions to the highest-value cases. If nothing clears the evidence threshold, report "No test findings."
