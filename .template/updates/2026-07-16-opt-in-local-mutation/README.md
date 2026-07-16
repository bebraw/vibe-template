# Make Local Mutation Testing Opt-In

Use this update when a project's baseline local quality gate unconditionally runs Stryker and mutation cost is growing faster than the normal readiness loop should.

## Apply

1. Remove incremental mutation from the default `quality:gate` phase list.
2. Add `quality:gate:deep` as an explicit command that appends incremental mutation to the baseline fast and browser checks.
3. Keep the clean full mutation command in GitHub or the target project's remote CI for runtime-relevant changes.
4. Update quality-gate tests so the baseline and deep phase lists are both explicit.
5. Document that local mutation feedback is optional while the remote full mutation signal remains required.

## Fallback

If the target project does not have a reusable quality-gate runner, define `quality:gate:deep` as `npm run quality:gate && npm run mutation:incremental`. Preserve the target project's existing package manager and script names.

If remote CI does not run a clean full mutation pass, keep mutation testing in the baseline until another required clean signal protects the main branch.

## Verify

- `npm run test:tooling`
- `npm run quality:gate`
- `npm run quality:gate:deep`
- `npm run ci:local`

Confirm that the baseline gate stops after browser tests, the deep gate adds incremental mutation, and remote CI still uses the clean full mutation command.
