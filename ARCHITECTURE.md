# Architecture

This file stores cross-cutting rules that apply to the whole repo and to projects cloned from it.

Use this file for global constraints. Use feature specs under `specs/` for domain-specific behavior and contracts.

## Global Rules

- Keep the template lightweight, reusable, easy to clone, and easy to prune.
- Treat repo documentation as living context that should evolve with the code.
- Treat architectural decisions as explicit records, not implicit tribal knowledge.
- Treat specs and ADRs as the durable source of truth for expected behavior and architectural intent. Code, including AI-generated code, is only acceptable when it matches those documents or updates them intentionally in the same change set.
- Add or update an ADR in `docs/adrs/` whenever a change introduces or changes a lasting architectural constraint, selects between credible architectural alternatives, or replaces an earlier decision.
- Create or update the relevant feature spec in `specs/` in the same change set whenever feature behavior, contracts, workflows, or regression guardrails change.
- Keep the quality gate green before considering a change ready.

## Tooling Baseline

- Local development and local CI target macOS as the supported host platform baseline.
- Node and npm versions are pinned through `package.json`.
- The verification baseline is split into a fast gate and a browser gate so quick checks can return earlier without dropping full coverage.
- The repo-managed `pre-push` Git hook should run the fast gate before code is pushed.
- Formatting, type checking, unit tests, and end-to-end tests are part of the baseline quality gate.
- Unit coverage for `src/` code should stay high enough that the coverage gate remains green.
- Local CI should validate the same baseline checks before changes are proposed or merged.

## Spec Conventions

- Put feature-level specs under `specs/{feature-domain}/spec.md`.
- Keep one spec per independently evolvable feature or domain.
- Update the relevant spec in the same change set whenever behavior, contracts, workflows, or guardrails change.
