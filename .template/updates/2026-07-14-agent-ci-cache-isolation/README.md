# Isolate Agent CI Job Caches

Use this update when a project runs independent Agent CI jobs concurrently and
depends on its managed `node_modules` warm cache. Agent CI 0.17.1 prevents
parallel jobs from mutating the same writable dependency tree.

## Apply

1. Upgrade the exact `@redwoodjs/agent-ci` dev dependency to `0.17.1` or later.
2. Regenerate the target project's lockfile with its existing package manager.
3. Give one deterministic install step a stable `id`, and select it with
   `--prewarm-through <workflow>:<job>:<step-id>` in the local CI command.
4. Keep the current parallelism and pause/retry behavior.
5. Update capability-kit recipes or manifests that pin an older Agent CI release.
6. Replace documentation that describes parallel jobs sharing one writable
   `node_modules` mount with the isolated per-job dependency-view contract.

## Fallback

If the target project has diverged, update its Agent CI dependency and lockfile
manually, then select its own stable install step for prewarming. Do not add
repo-local install locks or force a single Agent CI job; the fixed release owns
cache preparation and per-job isolation.

## Verify

- `npm run quality:gate`
- `npm run ci:local`

Confirm that independent jobs run concurrently and complete without dependency
tree corruption or cache-race errors.
