---
ruleSchema: 1
rules:
  - id: local-ci-readiness
    replaces: ADR-025
    cases:
      github-actions-workflows: required
      package-or-installation: required
      build-or-container: required
      browser-ci: required
      explicit-full-readiness: required
      otherwise: may-skip
    evidence: AGENTS.md#verification
---

# ADR-046: Scope Local Agent CI to Workflow-Sensitive Changes

**Status:** Implemented

**Date:** 2026-07-31

**Supersedes:** [ADR-025](./ADR-025-skip-agent-ci-for-docs-only-changes.md)

**Amends:** [ADR-019](./ADR-019-tighten-agent-workflow-guardrails.md)

**Amended by:** [ADR-053](./ADR-053-adopt-local-ci-canonical-interface.md)

## Context

The template currently requires both `npm run quality:gate` and `npm run ci:local` before every non-documentation change is ready. The quality gate already runs the deterministic fast and browser checks directly. Agent CI adds a distinct clean-container signal by replaying `.github/workflows/ci.yml`, but it also requires Docker, prewarms dependencies, and repeats much of the same verification.

That extra signal is most valuable when a change can affect workflow interpretation, clean installation, runner or container behavior, or browser CI. Requiring it for every small source, test, or tooling edit makes the local readiness path heavier without adding equivalent confidence.

## Decision

Keep `npm run quality:gate` as the readiness baseline for non-documentation changes.

Require `npm run ci:local` when a change touches:

- GitHub Actions workflows
- package metadata or dependency installation behavior
- build or container setup
- browser CI setup
- an explicit full PR or release readiness check

Ordinary source, test, tooling, and documentation changes may skip Agent CI when they do not cross one of those workflow-sensitive boundaries. Documentation-only changes should use the smallest relevant checks unless they alter executable instructions or workflow contracts.

Agent CI remains the preferred local workflow replay before relying on remote GitHub Actions when it is required.

## Trigger

The user asked whether Agent CI still provides enough value in this lightweight template and approved narrowing its required use while retaining it for the boundaries where its containerized workflow replay is distinct.

## Consequences

**Positive:**

- Routine readiness avoids Docker startup, dependency prewarming, and duplicated verification when those checks add little distinct confidence.
- Workflow, installation, container, and browser CI changes retain a local replay of the actual GitHub Actions workflow.
- The template keeps Agent CI's structured progress and pause-and-retry behavior for full readiness work.

**Negative:**

- Contributors must classify whether a change crosses a workflow-sensitive boundary.
- Some ordinary changes may encounter a Linux- or clean-install-specific failure only in remote CI.

**Neutral:**

- Agent CI remains pinned and available through the existing package scripts.
- Remote GitHub Actions and the GitHub-only full mutation job are unchanged.
- `npm run quality:gate` continues to run fast and browser verification locally.

## Alternatives Considered

### Keep Agent CI Mandatory for Every Non-Documentation Change

This maximizes local workflow replay, but repeats the baseline checks and imposes Docker and prewarming cost even when a change cannot affect workflow-sensitive behavior.

### Remove Agent CI

This would simplify setup and dependency maintenance, but it would discard the local clean-container replay that is especially valuable because the workflow itself is part of the reusable template.

### Require Agent CI Only for Workflow File Changes

This is simpler to classify, but it misses dependency, installation, build, container, and browser CI changes that can fail only in the workflow environment.
