# Skip Expensive CI For Non-Runtime Changes

Use this update when browser and mutation jobs consume substantial time for changes that cannot affect runtime verification.

## Apply

1. Add the dependency-free changed-path classifier and its focused tests.
2. Run the classifier immediately after checkout in browser and mutation jobs.
3. Guard cache restoration, runtime setup, dependency installation, and gate execution with its `run_expensive` output.
4. Keep the fast job unconditional.
5. Adapt the non-runtime allowlist to paths that are genuinely documentation or agent context in the target repository.

## Fallback

If the target CI cannot provide base and head commit SHAs, keep the expensive gates unconditional. The classifier intentionally runs them when the range is unavailable or invalid.

## Verify

- `npm run test:tooling`
- Test the classifier with both a non-runtime-only range and a source change.
- Run the target project's full quality gate and local CI workflow.
