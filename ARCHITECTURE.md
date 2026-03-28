# Architecture

This file stores cross-cutting rules that apply to the whole repo and to projects cloned from it.

Use this file for global constraints. Use feature specs under `specs/` for domain-specific behavior and contracts.

## Global Rules

- Keep the template lightweight, reusable, easy to clone, and easy to prune.
- Treat repo documentation as living context that should evolve with the code.
- Record significant architecture decisions in `docs/adrs/`.
- Keep the quality gate green before considering a change ready.

## Tooling Baseline

- Node and npm versions are pinned through `.nvmrc` and `package.json`.
- Formatting, type checking, unit tests, and end-to-end tests are part of the baseline quality gate.
- Local CI should validate the same baseline checks before changes are proposed or merged.

## Spec Conventions

- Put feature-level specs under `specs/{feature-domain}/spec.md`.
- Keep one spec per independently evolvable feature or domain.
- Update the relevant spec in the same change set whenever behavior or contracts change.
