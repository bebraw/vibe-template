# ADR-044: Vendor Engineering Quality Skills

**Status:** Implemented

**Date:** 2026-07-22

## Context

The template already includes broad review, security, and simplification guidance, but it lacks dedicated workflows for proving logic defects with concrete triggers, evaluating whether tests guard meaningful regressions, and debugging failures from reproduction through regression coverage.

The public `cniska/skills` collection provides concise skills for these gaps. Importing the whole collection would duplicate existing template capabilities and introduce conflicting spec, AGENTS.md, review, and deprecation conventions.

## Decision

Vendor only `correctness-review`, `test-review`, and `debug` from `cniska/skills` revision `7d79c7754f2b9d656f7db7b9ecefcb7532b6d256` under `.codex/skills/`.

Preserve the upstream MIT license and record the source repository and reviewed revision in each skill's metadata. Adapt the debug skill's design-level escape hatch to return to explicit planning instead of assuming a `/plan` skill is installed.

Expose the same reviewed files through the `engineering-quality-skills` capability kit so downstream projects can adopt the three workflows without inheriting unrelated template structure or runtime dependencies.

## Trigger

The user asked to adopt the reviewed skills and expose them as reusable capabilities to consumers of `vibe-template`.

## Consequences

**Positive:**

- Review findings gain a concrete evidence threshold based on triggering inputs and observable wrong results.
- Test review focuses on meaningful regression protection instead of raw coverage volume.
- Debugging gains a repeatable stop-the-line and regression-test workflow.
- Downstream projects can adopt the skills as one dependency-free capability kit.

**Negative:**

- Vendored copies can drift from upstream and from the capability-kit copies.
- Future upstream updates require deliberate review rather than automatic synchronization.

**Neutral:**

- The existing broad `review` skill remains the default merge-readiness workflow.
- The imported skills add agent guidance only; they do not change runtime behavior or package dependencies.

## Alternatives Considered

### Install The Entire Upstream Collection

This was rejected because most upstream skills duplicate current project-local capabilities, while several encode conventions that conflict with the template's ASDLC specs and authorization boundaries.

### Reference Upstream Skills Without Vendoring

This was rejected because consumers need a reviewable, pinned capability that remains available when upstream content changes.

### Fold The Guidance Into The Existing Review Skill

This would avoid three new skill entry points, but it would make the broad review workflow heavier and prevent users from invoking the focused lenses independently.
