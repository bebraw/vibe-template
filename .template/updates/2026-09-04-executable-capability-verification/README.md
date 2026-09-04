# Verify Executable Capability Kits

Use this update when a template-derived project maintains copyable Workers capability kits but its normal tests do not prove those kits work after adoption.

## Apply

1. Read ADR-056 and the current capability-kit spec.
2. Copy `scripts/verify-capability-kits.mjs` and its Node test, then adapt the fixture definitions to the executable kits the target maintains.
3. Add `capabilities:verify` to package scripts and the baseline quality gate. Add an explicit CI step when the remote workflow does not invoke the baseline gate.
4. Ensure every copied test dependency is pinned in its kit manifest. Do not let root dependencies satisfy a kit implicitly.
5. Keep materialized Workers in operating-system temporary directories and remove them after both success and failure.
6. Apply `patch.diff` or record the same global constraint in the target's architecture documentation.

## Fallback

If the target already has fixture or example-project tests, extend that established harness instead of adding a parallel verifier. Preserve independent dependency installation and generated binding checks.

## Verify

- `node --test scripts/verify-capability-kits.test.mjs`
- `npm run capabilities:verify`
- `npm run quality:gate`
- `npm run ci:local`
