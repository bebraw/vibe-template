# ADR-038: Scope Prettier to Project-Owned Files

**Status:** Implemented

**Date:** 2026-07-14

## Context

The repository contains roughly one thousand tracked files, most of which are
Markdown. Large skill reference trees are vendored under `.codex/skills/` and
duplicated for GitHub under `.github/skills/`.

A full Prettier check took about 4.56 seconds locally, with Markdown accounting
for about 4.08 seconds. Checking the repository while excluding the duplicated
GitHub skill tree and vendored Codex reference trees took about 0.70 seconds.
Application code and configuration accounted for only about 0.19 seconds.

The formatter should continue protecting project-owned code, skill entry
points, specs, ADRs, and documentation without repeatedly processing
externally maintained reference copies.

## Decision

Add `.github/skills/` and `.codex/skills/**/references/` to
`.prettierignore`.

Keep project-owned `.codex/skills/*/SKILL.md` entry points and the rest of the
repository documentation in the Prettier baseline. Keep Prettier as the single
formatter rather than splitting code and Markdown across different tools.

## Trigger

The user asked where formatter performance could improve, accepted the
recommendation to narrow Prettier's scope, and requested implementation.

## Consequences

**Positive:**

- Cold formatting checks avoid most of the repository's vendored Markdown
  workload.
- The fast gate retains one formatter and one formatting contract.
- Project-owned documentation remains protected by deterministic formatting.

**Negative:**

- Formatting issues inside excluded skill copies will not fail the project
  quality gate.
- Contributors updating vendored skill references must rely on their upstream
  formatting rather than this repository's Prettier configuration.

**Neutral:**

- The ignored files remain tracked and available to agents.
- Prettier, its configuration, and the affected-file formatting path remain
  otherwise unchanged.

## Alternatives Considered

### Replace Prettier With Oxfmt

This was rejected because Markdown dominates the repository and Oxfmt still
delegates Markdown formatting to bundled Prettier. Its native JavaScript and
TypeScript performance would not target the measured bottleneck.

### Replace Prettier With dprint

This was rejected because native Markdown formatting would introduce a new
formatting contract, plugin configuration, and potentially broad documentation
churn for a problem that two ignore patterns solve.

### Enable Prettier Caching

This was deferred because caching mainly improves repeated local runs and adds
cache behavior to the workflow. Narrowing the input provides a similar warm-run
time on cold local and CI runs without another workflow state concern.

### Continue Formatting Every Tracked File

This was rejected because the measured cost comes primarily from duplicated or
vendored material rather than files maintained by this project.
