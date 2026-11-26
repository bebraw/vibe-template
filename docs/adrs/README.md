# ADRs

This directory stores Architecture Decision Records for decisions that are significant enough to shape future work in the repo.

The default in this template is to make architectural choices explicit. If a change introduces or changes a lasting architectural constraint, chooses between credible architectural alternatives, or supersedes an earlier decision, add or update an ADR in the same change set.

Use an ADR when a decision:

- establishes a lasting technical constraint
- selects between credible architectural alternatives
- accepts a meaningful trade-off that future contributors should understand
- replaces, narrows, or broadens an earlier architecture decision

Skip an ADR for small, reversible, or purely tactical choices.

To draft a decision, copy the [YAML proposal template](./proposed/ADR-000-template.yaml), assign a new ID, and edit its context and decision. Prose fields support Markdown. Run `node scripts/adr-rules.mjs --check` to validate the log. To migrate a downstream Markdown log, preview `node scripts/migrate-adrs.mjs` from its repository root. [Format and migration contract](../../specs/adr-rules/spec.md)

ADRs are grouped by lifecycle status:

- `proposed/` stores draft ADRs and the reusable ADR template.
- `accepted/` stores approved ADRs whose decisions are not fully implemented yet.
- `implemented/` stores ADRs only after the repo actually implements the decision, including records later marked superseded so historical decisions stay with the implemented decision log.

## Proposed ADRs

Review a typed proposal with `node scripts/adr-rules.mjs --check-draft <file>` to see what it would change in the implemented rules. [Draft review](../../specs/adr-rules/spec.md#reviewing-a-proposal)

| ADR                                         | Status   | Summary                            |
| ------------------------------------------- | -------- | ---------------------------------- |
| [ADR-000](./proposed/ADR-000-template.yaml) | Proposed | Template for drafting future ADRs. |

## Accepted ADRs

No accepted-only ADRs are currently pending implementation.

## Current Typed Rules

This generated section covers the decisions that opt into the [typed rules pilot](../../specs/adr-rules/spec.md). Run `node scripts/adr-rules.mjs local-mutation-testing` to trace the local mutation rule through its revisions. The implemented ADR table below preserves the original decision summaries.

<!-- adr-rules:start -->

### `local-ci-readiness`

Current decision [ADR-046](implemented/ADR-046-scope-local-agent-ci-to-workflow-sensitive-changes.yaml) · [Policy guidance](../../AGENTS.md#verification)

- Command `npm run ci:local`
- GitHub Actions workflow changes — Local CI required.
- Package metadata or dependency installation changes — Local CI required.
- Build or container setup changes — Local CI required.
- Browser CI setup changes — Local CI required.
- An explicit request for full PR or release readiness — Local CI required.
- All other changes and requests, including routine source, test, tooling, or documentation work outside the listed cases — Local CI optional.

History [ADR-019](implemented/ADR-019-tighten-agent-workflow-guardrails.yaml) → [ADR-025](implemented/ADR-025-skip-agent-ci-for-docs-only-changes.yaml) → [ADR-046](implemented/ADR-046-scope-local-agent-ci-to-workflow-sensitive-changes.yaml)

### `local-mutation-testing`

Current decision [ADR-043](implemented/ADR-043-make-local-mutation-opt-in.yaml) · [Verification](../../scripts/run-quality-gate.test.mjs)

- `npm run quality:gate` skips mutation testing.
- `npm run quality:gate:deep` runs incremental mutation testing.

History [ADR-022](implemented/ADR-022-add-mutation-testing-gate.yaml) → [ADR-025](implemented/ADR-025-skip-agent-ci-for-docs-only-changes.yaml) → [ADR-028](implemented/ADR-028-use-incremental-local-mutation-gate.yaml) → [ADR-043](implemented/ADR-043-make-local-mutation-opt-in.yaml)

<!-- adr-rules:end -->

## Implemented ADRs

| ADR                                                                                      | Status      | Summary                                                                                           |
| ---------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| [ADR-001](./implemented/ADR-001-use-architecture-decision-records.yaml)                  | Accepted    | Use ADRs to capture significant architectural decisions in this repo.                             |
| [ADR-002](./implemented/ADR-002-make-architectural-decisions-explicit.yaml)              | Accepted    | Require explicit ADR updates for lasting architectural decisions.                                 |
| [ADR-003](./implemented/ADR-003-require-spec-updates-and-high-coverage.yaml)             | Accepted    | Treat completed feature work as spec work and gate `src/` code on high unit coverage.             |
| [ADR-004](./implemented/ADR-004-ship-a-worker-stub.yaml)                                 | Accepted    | Ship a minimal Worker stub so the template is runnable and testable.                              |
| [ADR-005](./implemented/ADR-005-separate-worker-views-and-api.yaml)                      | Accepted    | Separate the Worker starter into `src/api` and `src/views` for easier evolution.                  |
| [ADR-006](./implemented/ADR-006-adopt-tailwind-for-starter-ui.yaml)                      | Accepted    | Adopt the thesis-journey-tracker Tailwind v4 pipeline for the starter Worker UI.                  |
| [ADR-007](./implemented/ADR-007-avoid-screenshot-tooling-in-the-template.yaml)           | Superseded  | Avoid screenshot capture and screenshot automation in the template baseline.                      |
| [ADR-008](./implemented/ADR-008-allow-static-readme-screenshots-without-tooling.yaml)    | Superseded  | Allowed committed README screenshots without restoring screenshot tooling or automation.          |
| [ADR-009](./implemented/ADR-009-split-fast-and-browser-verification.yaml)                | Accepted    | Split fast and browser verification so checks can fail earlier and CI can cancel stale runs.      |
| [ADR-010](./implemented/ADR-010-adopt-pnpm-for-package-management.yaml)                  | Superseded  | Use pnpm with a committed lockfile and Corepack-backed CI/local workflows instead of npm.         |
| [ADR-011](./implemented/ADR-011-upgrade-runtime-baseline-to-node-24.yaml)                | Accepted    | Move the template runtime baseline from Node 22 to Node 24 LTS.                                   |
| [ADR-012](./implemented/ADR-012-constrain-local-tooling-to-macos.yaml)                   | Accepted    | Treat macOS as the local tooling baseline and use direct pinned Agent CI scripts.                 |
| [ADR-013](./implemented/ADR-013-return-to-npm-for-agent-ci-compatibility.yaml)           | Accepted    | Return to npm because local Agent CI remains unreliable with pnpm warmed dependency mounts.       |
| [ADR-014](./implemented/ADR-014-run-the-fast-gate-on-pre-push.yaml)                      | Superseded  | Run the fast quality gate automatically before pushes to catch cheap failures locally.            |
| [ADR-015](./implemented/ADR-015-relax-npm-version-enforcement.yaml)                      | Accepted    | Keep npm as the required package manager while relaxing exact npm patch enforcement.              |
| [ADR-016](./implemented/ADR-016-allow-lightweight-local-readme-screenshot-tooling.yaml)  | Superseded  | Allowed a lightweight local script for refreshing the committed README screenshot.                |
| [ADR-017](./implemented/ADR-017-prune-redundant-package-scripts.yaml)                    | Accepted    | Keep one canonical package script per normal workflow and remove redundant aliases.               |
| [ADR-018](./implemented/ADR-018-add-capability-kits.yaml)                                | Accepted    | Add lightweight capability kits for applying specific template practices to existing repos.       |
| [ADR-019](./implemented/ADR-019-tighten-agent-workflow-guardrails.yaml)                  | Accepted    | Tighten TypeScript, write-target, and readiness-validation guardrails for agent work.             |
| [ADR-020](./implemented/ADR-020-keep-readme-screenshot-refresh-manual.yaml)              | Accepted    | Keep README screenshot refresh manual and outside the automated development loop.                 |
| [ADR-021](./implemented/ADR-021-add-accepted-adr-state.yaml)                             | Accepted    | Add an accepted ADR state so implemented means the decision is actually reflected in the repo.    |
| [ADR-022](./implemented/ADR-022-add-mutation-testing-gate.yaml)                          | Accepted    | Add Stryker mutation testing to the full quality gate and CI workflow.                            |
| [ADR-023](./implemented/ADR-023-pin-github-actions-to-commit-shas.yaml)                  | Accepted    | Pin GitHub Actions workflow action references to immutable commit SHAs.                           |
| [ADR-024](./implemented/ADR-024-disallow-inline-client-code-in-worker-views.yaml)        | Implemented | Reject untyped inline browser code in Worker-rendered HTML through the fast quality gate.         |
| [ADR-025](./implemented/ADR-025-skip-agent-ci-for-docs-only-changes.yaml)                | Superseded  | Allowed documentation-only changes to skip local Agent CI when executable behavior was unchanged. |
| [ADR-026](./implemented/ADR-026-run-affected-guardrails-when-possible.yaml)              | Implemented | Run affected-file guardrails during iteration and pre-push when checks can be scoped safely.      |
| [ADR-027](./implemented/ADR-027-lock-local-agent-ci-installs.yaml)                       | Superseded  | Allow parallel local Agent CI jobs with a locked warm dependency install.                         |
| [ADR-028](./implemented/ADR-028-use-incremental-local-mutation-gate.yaml)                | Superseded  | Used incremental Stryker runs in the local quality gate while GitHub CI ran full mutation.        |
| [ADR-029](./implemented/ADR-029-use-relative-stryker-concurrency.yaml)                   | Implemented | Use percentage-based Stryker worker concurrency instead of a fixed worker count.                  |
| [ADR-030](./implemented/ADR-030-reserve-full-mutation-ci-for-github.yaml)                | Implemented | Reserve the full mutation workflow job for GitHub and skip it in local Agent CI.                  |
| [ADR-031](./implemented/ADR-031-use-agent-ci-warm-cache-serialization.yaml)              | Implemented | Use Agent CI warm-cache serialization instead of a repo-local install lock.                       |
| [ADR-032](./implemented/ADR-032-add-template-update-packs.yaml)                          | Implemented | Add plain-file update packs for syncing reusable template maintenance downstream.                 |
| [ADR-033](./implemented/ADR-033-add-advisory-fallow-diagnostics.yaml)                    | Implemented | Add advisory Fallow diagnostics for readability, health, duplication, and cleanup evidence.       |
| [ADR-034](./implemented/ADR-034-emit-agent-ci-progress-events.yaml)                      | Implemented | Emit structured local Agent CI lifecycle progress while retaining quiet rendering.                |
| [ADR-035](./implemented/ADR-035-adopt-a-web-response-baseline.yaml)                      | Implemented | Adopt explicit response, routing, and styling contracts for the starter Worker.                   |
| [ADR-036](./implemented/ADR-036-prewarm-agent-ci-dependencies-explicitly.yaml)           | Implemented | Prewarm dependencies once before isolated parallel Agent CI jobs start.                           |
| [ADR-037](./implemented/ADR-037-adopt-oxlint-correctness-gate.yaml)                      | Implemented | Add Oxlint's default correctness rules to the fast and affected quality gates.                    |
| [ADR-038](./implemented/ADR-038-scope-prettier-to-owned-files.yaml)                      | Implemented | Exclude duplicated and vendored skill material from the Prettier baseline.                        |
| [ADR-039](./implemented/ADR-039-skip-expensive-ci-for-non-runtime-changes.yaml)          | Implemented | Skip remote browser and mutation work for known non-runtime-only changes.                         |
| [ADR-040](./implemented/ADR-040-use-full-stryker-concurrency-in-ci.yaml)                 | Implemented | Use full available Stryker parallelism in the isolated GitHub mutation job.                       |
| [ADR-041](./implemented/ADR-041-cache-prettier-checks-by-content.yaml)                   | Implemented | Cache successful Prettier checks by content for faster repeated local gates.                      |
| [ADR-042](./implemented/ADR-042-emit-quality-gate-progress.yaml)                         | Implemented | Emit named phase transitions and elapsed-time heartbeats from the full local quality gate.        |
| [ADR-043](./implemented/ADR-043-make-local-mutation-opt-in.yaml)                         | Implemented | Keep mutation testing out of the baseline local gate and expose an explicit deep gate.            |
| [ADR-044](./implemented/ADR-044-vendor-engineering-quality-skills.yaml)                  | Implemented | Vendor focused correctness, test, and debug skills as a reusable capability kit.                  |
| [ADR-045](./implemented/ADR-045-adopt-type-aware-fallow-diagnostics.yaml)                | Implemented | Use Fallow's stable type-aware evidence and expose its interactive codebase map.                  |
| [ADR-046](./implemented/ADR-046-scope-local-agent-ci-to-workflow-sensitive-changes.yaml) | Implemented | Require local Agent CI for workflow-sensitive changes and explicit full readiness checks.         |
| [ADR-047](./implemented/ADR-047-use-cloudflare-mcp-as-the-platform-knowledge-layer.yaml) | Implemented | Use Cloudflare MCP for current platform knowledge while keeping focused local skills.             |
| [ADR-048](./implemented/ADR-048-adopt-repository-local-wayfinding.yaml)                  | Implemented | Adapt Wayfinder to repository-local maps and the template's durable documentation model.          |
| [ADR-049](./implemented/ADR-049-adopt-local-spec-and-tdd-skills.yaml)                    | Implemented | Add repository-local spec synthesis and focused red-green implementation skills.                  |
| [ADR-050](./implemented/ADR-050-add-early-architecture-feedback.yaml)                    | Implemented | Add ownership contracts, structural smoke alarms, and capability architecture review.             |
| [ADR-051](./implemented/ADR-051-add-approval-gated-project-start.yaml)                   | Implemented | Add a read-only project-start plan before approved pruning of a fresh clone.                      |
| [ADR-052](./implemented/ADR-052-adopt-scoped-modern-web-guidance.yaml)                   | Implemented | Add pinned, telemetry-disabled web-platform guidance with explicit browser-support boundaries.    |
| [ADR-053](./implemented/ADR-053-adopt-local-ci-canonical-interface.yaml)                 | Implemented | Use Local CI's canonical package, executable, configuration, and agent-skill names.               |
| [ADR-054](./implemented/ADR-054-target-a-compact-agent-skill-baseline.yaml)              | Implemented | Target capable agents with compact, retrieval-first skills and remove overlapping or unused ones. |
| [ADR-055](./implemented/ADR-055-add-optional-cloudflare-application-kits.yaml)           | Implemented | Add optional Workers AI, room state, and progressive interaction kits plus deploy preflight.      |
| [ADR-056](./implemented/ADR-056-verify-executable-capability-kits.yaml)                  | Implemented | Verify executable capability kits as isolated disposable adopter Workers.                         |
| [ADR-057](./implemented/ADR-057-add-browser-static-assets-kit.yaml)                      | Implemented | Add an optional native browser-module and Worker static-assets capability kit.                    |
| [ADR-058](./implemented/ADR-058-add-preview-promotion-deployment-safety-kit.yaml)        | Implemented | Add guarded preview upload, explicit promotion, and rollback tooling.                             |
| [ADR-059](./implemented/ADR-059-harden-anonymous-room-state.yaml)                        | Implemented | Harden anonymous room voting with origin checks, bounded cookies, and lockable revisions.         |
| [ADR-060](./implemented/ADR-060-refresh-worker-operational-contracts.yaml)               | Implemented | Refresh runtime, module, binding-drift, logging, and warm-up contracts.                           |
| [ADR-061](./implemented/ADR-061-enable-starter-worker-observability.yaml)                | Implemented | Persist starter Worker logs and invocation logs while sampling traces explicitly.                 |
| [ADR-062](./implemented/ADR-062-retain-durable-implementation-context.yaml)              | Implemented | Retain relevant initialization context in existing documents with explicit increment boundaries.  |
| [ADR-063](./implemented/ADR-063-add-non-destructive-room-initialization.yaml)            | Implemented | Initialize room choices atomically without disturbing existing sessions.                          |
| [ADR-064](./implemented/ADR-064-use-node-skill-validation.yaml)                          | Implemented | Validate skill structure through repository-owned Node tooling without PyYAML.                    |
| [ADR-065](./implemented/ADR-065-offer-security-audit-as-optional-kit.yaml)               | Implemented | Offer Cloudflare's full security audit as an optional, pinned capability kit.                     |
| [ADR-066](./implemented/ADR-066-scope-agent-guidance-to-the-task.yaml)                   | Implemented | Use capability-based, task-scoped agent guidance and honor existing authorization.                |
| [ADR-067](./implemented/ADR-067-refresh-reviewed-web-guidance.yaml)                      | Superseded  | Pin Modern Web Guidance 0.0.191; superseded by ADR-072.                                           |
| [ADR-068](./implemented/ADR-068-verify-browser-screenshot-tracing.yaml)                  | Implemented | Verify screenshot tracing and Linux ARM64 Lighthouse audits before distributing browser pins.     |
| [ADR-069](./implemented/ADR-069-adopt-typescript-7-typechecking.yaml)                    | Implemented | Use TypeScript 7 for project checks while retaining the TypeScript 6 compiler API for tooling.    |
| [ADR-070](./implemented/ADR-070-preserve-existing-git-hook-configuration.yaml)           | Implemented | Preserve existing Git hook configuration and check the tracked tree on a first push.              |
| [ADR-071](./implemented/ADR-071-define-external-service-latency-contracts.yaml)          | Implemented | Define latency acceptance, privacy-safe timings, and representative external-service evaluation.  |
| [ADR-072](./implemented/ADR-072-adopt-modern-web-guidance-v1.yaml)                       | Implemented | Pin Modern Web Guidance 1.0.0 and add an optional, context-verified modernization audit.          |
| [ADR-073](./implemented/ADR-073-refresh-review-and-debug-guidance.yaml)                  | Implemented | Refresh test protection, toolchain diagnosis, regression guards, and staged-secret guidance.      |
| [ADR-074](./implemented/ADR-074-vendor-dtu-without-zod.yaml)                             | Implemented | Vendor the patched DTU package and verify its configuration and resolved dependencies.            |
| [ADR-075](./implemented/ADR-075-consolidate-local-skill-routing.yaml)                    | Implemented | Retire the simplify shortcut and move starter visual guidance into frontend-design.               |
| [ADR-076](./implemented/ADR-076-pilot-typed-adr-rules.yaml)                              | Implemented | Track local mutation-test scheduling as a versioned rule across implemented decisions.            |
| [ADR-077](./implemented/ADR-077-store-decisions-in-yaml.yaml)                            | Implemented | Store decisions in standalone YAML and provide a one-time Markdown migration.                     |
| [ADR-078](./implemented/ADR-078-keep-product-rules-with-the-project.yaml)                | Implemented | Keep project-specific rule questions and answers in the project that owns the policy.             |

## Creating A New ADR

1. Read the ASDLC guidance in [`.asdlc/practices/adr-authoring.md`](../../.asdlc/practices/adr-authoring.md).
2. Copy [`ADR-000-template.yaml`](./proposed/ADR-000-template.yaml).
3. Set the next sequential ID in the record and its filename, such as `proposed/ADR-NNN-short-title.yaml`.
4. Fill in the context and decision. Record the trade-offs and alternatives where they help explain the choice.
5. When the ADR is accepted but implementation is still pending, set `status: accepted`, add the date, and move it to `accepted/`.
6. Once implemented, set `status: implemented` and move the record to `implemented/`.
7. For a full replacement, mark the previous record `superseded` and identify its successor in `supersededBy`. For a partial replacement, keep the applicable lifecycle status, record `partiallySupersededBy`, and identify the affected clauses in the decision.
8. Update the ADR table in this file.

## Search Tips

```bash
rg "^status:" docs/adrs -g "*.yaml"
rg "^supersededBy:" docs/adrs -g "*.yaml"
rg "database|auth|deploy" docs/adrs
```
