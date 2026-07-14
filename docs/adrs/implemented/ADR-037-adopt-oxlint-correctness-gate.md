# ADR-037: Adopt an Oxlint Correctness Gate

**Status:** Implemented

**Date:** 2026-07-14

## Context

The template has strict TypeScript checking, Prettier formatting, automated
tests, mutation testing, and Worker-specific guardrails, but it has no general
JavaScript and TypeScript linting step. TypeScript does not cover all
correctness-oriented source patterns, and the repository's JavaScript tooling
files are outside the TypeScript project.

The template should add that signal without inheriting a broad style policy,
duplicating TypeScript checking, replacing the established formatter, or
making the lightweight starter dependent on an extensive plugin ecosystem.

## Decision

Pin Oxlint as a development dependency and expose it through `npm run lint`.
Use Oxlint's default correctness rules, set the warning budget to zero, and do
not enable type-aware linting or additional style, restriction, pedantic, or
framework presets in the initial baseline.

Run the lint command in `npm run quality:gate:fast`. Run Oxlint only for
affected JavaScript and TypeScript files in `npm run quality:affected` so local
iteration and the pre-push hook retain their affected-file behavior.

Keep Prettier as the formatter and the pinned TypeScript compiler as the
authoritative project type checker. Add an Oxlint configuration only when the
template deliberately adopts rules beyond the built-in defaults.

## Trigger

The user asked whether to adopt Oxc, reviewed Ultracite as a possible
complement, and chose the narrow standalone Oxlint proposal.

## Consequences

**Positive:**

- JavaScript and TypeScript gain a fast correctness-oriented lint signal.
- JavaScript tooling files receive analysis beyond Node's syntax check.
- The initial adoption passes the existing repository without suppressions or
  cleanup churn.
- The quality policy remains visible and owned by the template.

**Negative:**

- The template gains a pinned native development dependency and platform
  bindings in the lockfile.
- Oxlint upgrades can introduce new default findings, so dependency updates
  need normal quality-gate review.

**Neutral:**

- Prettier formatting, TypeScript checking, tests, mutation testing, and
  Worker-specific guardrails remain separate required checks.
- The existing JavaScript syntax check remains in the affected path as an
  explicit Node parser check.

## Alternatives Considered

### Keep the Existing Checks Without a Linter

This was rejected because TypeScript, formatting, and tests do not provide the
same general correctness analysis, particularly for JavaScript tooling files.

### Adopt Ultracite's Oxlint Preset

This was rejected because Ultracite delegates hundreds of style, restriction,
pedantic, framework, and type-aware policy choices to an external preset. That
is broader and more opinionated than the template needs.

### Replace Prettier With Oxfmt

This was rejected because formatter performance is not a bottleneck in this
small repository and Oxfmt is not a complete drop-in replacement for the
existing whole-repository Prettier workflow.

### Enable Oxlint Type-Aware Rules

This was rejected for the initial adoption because it adds another dependency,
duplicates parts of the TypeScript gate, and relies on an evolving feature that
Oxlint excludes from its semantic-versioning guarantees.
