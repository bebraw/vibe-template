# Architecture

This file stores cross-cutting rules that apply to the whole repo and to projects cloned from it.

Use this file for global constraints. Use feature specs under `specs/` for domain-specific behavior and contracts.

## Global Rules

- Keep the template lightweight, reusable, easy to clone, and easy to prune.
- Treat repo documentation as living context that should evolve with the code.
- Treat architectural decisions as explicit records, not implicit tribal knowledge.
- Treat specs and ADRs as the durable source of truth for expected behavior and architectural intent. Code, including AI-generated code, is only acceptable when it matches those documents or updates them intentionally in the same change set.
- Add or update an ADR in `docs/adrs/` whenever a change introduces or changes a lasting architectural constraint, selects between credible architectural alternatives, or replaces an earlier decision. Keep drafts in `docs/adrs/proposed/`, approved-but-not-yet-implemented decisions in `docs/adrs/accepted/`, and implemented decisions in `docs/adrs/implemented/`.
- Create or update the relevant feature spec in `specs/` in the same change set whenever feature behavior, contracts, workflows, or regression guardrails change.
- Keep the quality gate green before considering a change ready.
- Keep workflow writes explicit. New generated output, local state, cache, archive, or tool-artifact paths should be documented in the same change that introduces them.
- Do not place executable browser code inline in Worker-rendered HTML. Client behavior should live in typed TypeScript modules before it is served to browsers.

## Tooling Baseline

- Local development and local CI target macOS as the supported host platform baseline.
- Node is pinned exactly through `package.json`, and npm is constrained to a compatible major there instead of an exact patch pin.
- The verification baseline is split into a fast gate and a browser gate so quick checks can return earlier without dropping full coverage.
- The repo-managed `pre-push` Git hook should run affected-file guardrails before code is pushed.
- Formatting, type checking, unit tests, and end-to-end tests are part of the baseline quality gate.
- Affected-file guardrails should scope checks to changed files when the underlying tool supports it and fall back to project-level checks only when needed.
- The fast quality gate should fail when Worker/view runtime files contain inline `<script>` tags, inline event-handler attributes, or `javascript:` URLs.
- Unit coverage for `src/` code should stay high enough that the coverage gate remains green.
- Local CI should validate the same baseline checks before non-documentation changes are proposed or merged.
- Targeted commands are useful while iterating, but `npm run quality:gate` and `npm run ci:local` remain the readiness baseline before proposing or landing non-documentation changes.
- Documentation-only changes may skip `npm run ci:local` when they do not alter executable config, generated artifacts, package metadata, source code, or tests.

## Capability Kits

- Put reusable partial-upgrade kits under `.capabilities/{capability-name}/`.
- Keep capability kits instructional and reviewable rather than fully automated by default.
- Each capability kit should include a README, a machine-readable manifest, any copyable files, package-manager recipes, and validation notes.
- Capability kits should preserve target-project conventions unless the kit explicitly documents a required constraint.

## Spec Conventions

- Put feature-level specs under `specs/{feature-domain}/spec.md`.
- Keep one spec per independently evolvable feature or domain.
- Update the relevant spec in the same change set whenever behavior, contracts, workflows, or guardrails change.
