# ADR-040: Use Full Stryker Concurrency In CI

**Status:** Implemented

**Date:** 2026-07-14

**Amends:** [ADR-029](./ADR-029-use-relative-stryker-concurrency.md), [ADR-030](./ADR-030-reserve-full-mutation-ci-for-github.md)

## Context

ADR-029 set Stryker concurrency to `50%` so local mutation testing scales with the host without monopolizing a developer machine. GitHub Actions inherited that same responsiveness trade-off even though its mutation job is isolated, has no interactive workload to preserve, and was the measured workflow critical path. A recent run spent 73 seconds in the mutation step alone.

A local benchmark of the full mutation suite improved from 14.46 seconds at the configured concurrency to 13.02 seconds at `100%`. Runner topology and contention differ from the development machine, so the remote improvement must be observed rather than assumed to scale linearly.

## Decision

Keep the shared Stryker configuration at `50%` for local commands. Override concurrency only in the GitHub mutation workflow step by running `npm run mutation -- --concurrency 100%`.

The job remains a clean full mutation run. This decision changes worker utilization, not mutation scope, thresholds, test selection, or incremental behavior.

## Trigger

The user asked to implement the CI-specific concurrency direction after mutation timing identified it as the largest code-change bottleneck.

## Consequences

**Positive:**

- The isolated runner can use all available parallelism for the workflow critical path.
- Local development keeps the existing responsiveness-oriented 50% default.
- No dependency, cache, or new workflow job is required.

**Negative:**

- Peak CPU and memory use increase in the GitHub mutation job.
- Actual remote savings depend on runner topology and Stryker workload scaling.

**Neutral:**

- Mutation quality thresholds and full-run semantics remain unchanged.
- Downstream projects can remove the override if their runner memory is constrained.

## Alternatives Considered

### Change The Shared Configuration To 100%

This would also speed some local runs but would replace ADR-029's deliberate balance and could make developer machines less responsive.

### Use A Fixed Worker Count In CI

A fixed count could match one known runner but would encode a machine-size assumption that percentage-based concurrency avoids.

### Keep CI At 50%

This preserved identical local and remote configuration but left isolated runner capacity unused on the measured critical path.
