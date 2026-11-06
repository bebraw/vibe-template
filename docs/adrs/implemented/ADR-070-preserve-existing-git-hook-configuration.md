# ADR-070: Preserve Existing Git Hook Configuration

**Status:** Implemented

**Date:** 2026-11-06

## Context

[ADR-014](./ADR-014-run-the-fast-gate-on-pre-push.md) chose a repo-managed pre-push hook configured during installation. An existing local or inherited `core.hooksPath` can belong to another hook manager. Replacing it silently disables that manager's hooks.

## Decision

Configure `.githooks` automatically when no different `core.hooksPath` is configured. Preserve a different configured path, warn that the repo-managed hook is not enabled, and leave integration to the contributor. When enabled, the hook runs the affected-file guardrails. On a first push to a new remote branch, those guardrails consider the tracked files in the pushed tree because the remote provides no prior branch commit for a safe narrow diff. They reject a different checked-out commit or missing tracked workspace files because checks cannot safely validate those paths from the current workspace.

## Trigger

A review of clone and installation behavior found that `npm install` overwrote an existing hook path and that a first push could omit earlier commits from the affected-file set.

## Consequences

**Positive:**

- Installation preserves existing hook managers and reports when the template's hook needs integration.
- First pushes check more than the tip commit without assuming a particular remote default branch.

**Negative:**

- Existing hook configurations need explicit integration to run the template's pre-push checks.
- First pushes can run more checks than a reliable base comparison would require.

**Neutral:**

- Full readiness gates and CI remain independent of the local hook.

## Alternatives Considered

### Overwrite or Automatically Chain Existing Hooks

Overwriting disables existing checks; automatic chaining assumes unknown hook-manager behavior and ownership.

### Infer a Base Branch for First Pushes

A remote default branch may be absent, stale, or unrelated. Considering the tracked tree avoids relying on an unverified base.
