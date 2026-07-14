# ADR-039: Skip Expensive CI For Non-Runtime Changes

**Status:** Implemented

**Date:** 2026-07-14

**Amends:** [ADR-009](./ADR-009-split-fast-and-browser-verification.md), [ADR-030](./ADR-030-reserve-full-mutation-ci-for-github.md)

## Context

The browser and full mutation jobs run for every pull request and push to `main`. Recent CI measurements showed that the mutation job was the workflow critical path at roughly 109 seconds, including a 73-second mutation step and a 19-second dependency install. Documentation, specs, template update packs, formatter metadata, and agent skill material cannot affect the Worker runtime or its browser and mutation results, yet changes limited to those areas still paid the full cost.

The template needs to preserve strong verification for source and configuration changes. A path classifier therefore must prefer unnecessary work over a false skip whenever a path or commit range is uncertain.

## Decision

The browser and mutation workflow jobs will classify the changed commit range immediately after checkout. When every changed file belongs to an explicit non-runtime allowlist, those jobs skip cache restoration, Node setup, dependency installation, and gate execution. The fast job continues to run.

The classifier treats unknown paths, empty or invalid commit ranges, fetch failures, and classifier errors conservatively by running the expensive gates. Runtime source, package metadata, workflow files, and tool configuration are not in the non-runtime allowlist.

The classifier is a dependency-free Node.js script with focused unit tests in the fast quality gate. Local Agent CI lacks a GitHub event commit range, so it follows the conservative path and continues running the browser job.

## Trigger

The user asked to implement the highest-impact remaining performance direction after CI timing showed expensive gates running for a formatter-only change.

## Consequences

**Positive:**

- Non-runtime-only GitHub runs avoid most browser and mutation job work.
- Source and unknown changes retain the existing browser and full mutation signals.
- The implementation adds no third-party action or package dependency.

**Negative:**

- The non-runtime allowlist must be maintained when repository structure changes.
- GitHub still incurs checkout and browser-container startup before a job can classify its inputs.
- Workflow behavior is more conditional than an always-run job.

**Neutral:**

- The fast quality job remains unconditional.
- Local Agent CI keeps running its browser workflow job because it has no remote event range.

## Alternatives Considered

### Add A Separate Change-Detection Job

This could skip entire downstream jobs, including browser-container startup, but it would serialize expensive jobs behind another runner and make source-change CI slower.

### Split Browser And Mutation Into Separate Workflows

Workflow-level path filters could avoid job startup entirely, but splitting the canonical workflow would complicate local Agent CI and add structure to a lightweight template.

### Use A Third-Party Path-Filter Action

This would provide mature matching behavior but would add another remote action dependency and still require each expensive job to start before classification.

### Keep Every Gate Unconditional

This was operationally simple but spent the full mutation budget on changes that cannot affect mutation results.
