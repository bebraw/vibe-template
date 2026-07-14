# Use Full Stryker Concurrency In CI

Use this update when a dedicated mutation job inherits a local responsiveness limit even though the CI runner has no competing interactive workload.

## Apply

1. Keep the shared Stryker configuration at its local-friendly percentage.
2. Pass `--concurrency 100%` only from the isolated CI mutation step.
3. Keep the job on full mutation mode; do not substitute incremental results.
4. Observe runner memory and duration after landing the change.

## Fallback

Remove the workflow override if the target runner becomes memory constrained. Prefer another percentage over a fixed worker count so the workflow remains portable across runner sizes.

## Verify

- `npm run mutation -- --concurrency 100%`
- The target project's full quality gate
- At least one remote mutation run for real runner timing
