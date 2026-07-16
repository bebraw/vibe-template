# ADR-043: Make Local Mutation Testing Opt-In

**Status:** Implemented

**Date:** 2026-07-16

**Supersedes:** [ADR-028](./ADR-028-use-incremental-local-mutation-gate.md)

**Amends:** [ADR-022](./ADR-022-add-mutation-testing-gate.md), [ADR-030](./ADR-030-reserve-full-mutation-ci-for-github.md), [ADR-042](./ADR-042-emit-quality-gate-progress.md)

## Context

The local baseline quality gate runs for every non-documentation change. ADR-028 reduced repeated mutation cost by enabling Stryker incremental mode, but its first run remains a full mutation pass and later runs can still invalidate substantial work. Mutation testing measures assertion strength rather than baseline functional correctness, and the clean GitHub mutation job already protects runtime-relevant changes without trusting local incremental state.

The current source surface keeps local mutation time manageable, but `vibe-template` must also remain a lightweight default for downstream projects whose mutation workload may grow substantially. An unconditional mutation phase therefore creates a scaling cost in the canonical local readiness path.

## Decision

Keep the baseline `npm run quality:gate` focused on deterministic fast checks and browser tests.

Add `npm run quality:gate:deep` as the explicit local path that runs the fast gate, browser tests, and incremental mutation testing in order. Preserve named phase transitions, live child output, fail-fast exit codes, and elapsed-time heartbeats in both modes.

Keep `npm run mutation` as the clean full local command and retain the full GitHub mutation job for runtime-relevant changes. Mutation testing is no longer required by the local readiness baseline.

## Trigger

The user challenged whether an unconditional Stryker phase belongs in the baseline quality gate and approved separating it into an explicit deep check.

## Consequences

**Positive:**

- Routine local readiness checks no longer pay mutation-testing startup or execution cost.
- Downstream projects can keep the template's baseline responsive as their source and test surfaces grow.
- Contributors retain one explicit command for deep local assertion-strength feedback.
- GitHub keeps a clean full mutation signal that does not depend on incremental report state.

**Negative:**

- Contributors who run only the local baseline may discover weak assertions in GitHub instead of before pushing.
- The package exposes one additional quality-gate command.

**Neutral:**

- Stryker configuration, thresholds, reports, and local concurrency remain unchanged.
- Local Agent CI continues to run the fast and browser jobs while skipping the GitHub-only mutation job.

## Alternatives Considered

### Keep Incremental Mutation In The Baseline Gate

This preserves earlier local feedback, but the cold run is still full and the cost scales poorly for a reusable starter.

### Remove Local Mutation Integration Entirely

Contributors could invoke `npm run mutation:incremental` directly, but an explicit deep gate provides a discoverable end-to-end local verification path and preserves the existing progress runner.

### Run Mutation Only For Changed Source Paths Locally

This could reduce work further, but it would add repository-specific change classification around test-only and configuration changes. The explicit deep gate keeps selection inside Stryker's incremental model without adding another wrapper.
