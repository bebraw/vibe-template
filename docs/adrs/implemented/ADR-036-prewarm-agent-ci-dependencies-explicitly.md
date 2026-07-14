# ADR-036: Prewarm Agent CI Dependencies Explicitly

**Status:** Implemented

**Date:** 2026-07-14

**Amends:** [ADR-031](./ADR-031-use-agent-ci-warm-cache-serialization.md)

## Context

Agent CI 0.17.1 fixes parallel cache races by giving every job a private
writable `node_modules` view. On a cold run, independent npm jobs otherwise run
their install steps separately. Agent CI 0.17.0 also introduced explicit
prewarming through a selected workflow step so a disposable job can prepare the
dependency tree before parallel jobs start.

The template has three install-bearing CI jobs and intentionally runs the fast
and browser jobs concurrently during local Agent CI. Repeating the same cold
`npm ci` work is safe but wastes time and network traffic.

## Decision

The canonical `ci:local` script will select
`.github/workflows/ci.yml:quality-fast:install` with `--prewarm-through`.
The selected fast-job install step will keep the stable `install` id and plain
`npm ci` command.

Agent CI will run through that step in a disposable prewarm job before starting
parallel workflow jobs. Each real job will still receive a private writable
dependency view, so jobs cannot race by mutating the same tree.

## Trigger

The Agent CI 0.17.1 upgrade exposed the new cold-parallel-install diagnostic
and provided the cache-isolation fix requested by the user.

## Consequences

**Positive:**

- Parallel jobs no longer share one writable dependency tree.
- Cold local runs prepare dependencies once instead of repeating equivalent
  installs in every parallel job.
- The prewarm boundary is explicit and visible in the package script and
  workflow step id.

**Negative:**

- Renaming the workflow, job, or install step id requires updating the selector.
- Local CI performs the prewarm phase before useful jobs begin.

**Neutral:**

- Remote GitHub Actions still runs each job's plain `npm ci` step normally.
- The local retry, concurrency, and structured progress contracts do not change.

## Alternatives Considered

### Keep Cold Private Installs

This is safe with Agent CI 0.17.1, but it repeats equivalent dependency work
and leaves an actionable diagnostic on every cold local run.

### Restore A Shared Writable `node_modules` Mount

This was rejected because it reintroduces the cross-job mutation race fixed by
Agent CI 0.17.1.

### Add A Repository-Local Install Lock

This was rejected for the same reasons recorded in ADR-031: cache coordination
belongs to Agent CI, not a template-specific wrapper.
