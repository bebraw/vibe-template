# ADRs

This directory stores Architecture Decision Records for decisions that are significant enough to shape future work in the repo.

The default in this template is to make architectural choices explicit. If a change introduces or changes a lasting architectural constraint, chooses between credible architectural alternatives, or supersedes an earlier decision, add or update an ADR in the same change set.

Use an ADR when a decision:

- establishes a lasting technical constraint
- selects between credible architectural alternatives
- accepts a meaningful trade-off that future contributors should understand
- replaces, narrows, or broadens an earlier architecture decision

Skip an ADR for small, reversible, or purely tactical choices.

ADRs are grouped by lifecycle status:

- `proposed/` stores draft ADRs and the reusable ADR template.
- `accepted/` stores accepted ADRs, including records later marked superseded so historical decisions stay with the accepted decision log.

## Proposed ADRs

| ADR                                       | Status   | Summary                            |
| ----------------------------------------- | -------- | ---------------------------------- |
| [ADR-000](./proposed/ADR-000-template.md) | Proposed | Template for drafting future ADRs. |

## Accepted ADRs

| ADR                                                                                | Status     | Summary                                                                                      |
| ---------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| [ADR-001](./accepted/ADR-001-use-architecture-decision-records.md)                 | Accepted   | Use ADRs to capture significant architectural decisions in this repo.                        |
| [ADR-002](./accepted/ADR-002-make-architectural-decisions-explicit.md)             | Accepted   | Require explicit ADR updates for lasting architectural decisions.                            |
| [ADR-003](./accepted/ADR-003-require-spec-updates-and-high-coverage.md)            | Accepted   | Treat completed feature work as spec work and gate `src/` code on high unit coverage.        |
| [ADR-004](./accepted/ADR-004-ship-a-worker-stub.md)                                | Accepted   | Ship a minimal Worker stub so the template is runnable and testable.                         |
| [ADR-005](./accepted/ADR-005-separate-worker-views-and-api.md)                     | Accepted   | Separate the Worker starter into `src/api` and `src/views` for easier evolution.             |
| [ADR-006](./accepted/ADR-006-adopt-tailwind-for-starter-ui.md)                     | Accepted   | Adopt the thesis-journey-tracker Tailwind v4 pipeline for the starter Worker UI.             |
| [ADR-007](./accepted/ADR-007-avoid-screenshot-tooling-in-the-template.md)          | Superseded | Avoid screenshot capture and screenshot automation in the template baseline.                 |
| [ADR-008](./accepted/ADR-008-allow-static-readme-screenshots-without-tooling.md)   | Superseded | Allowed committed README screenshots without restoring screenshot tooling or automation.     |
| [ADR-009](./accepted/ADR-009-split-fast-and-browser-verification.md)               | Accepted   | Split fast and browser verification so checks can fail earlier and CI can cancel stale runs. |
| [ADR-010](./accepted/ADR-010-adopt-pnpm-for-package-management.md)                 | Superseded | Use pnpm with a committed lockfile and Corepack-backed CI/local workflows instead of npm.    |
| [ADR-011](./accepted/ADR-011-upgrade-runtime-baseline-to-node-24.md)               | Accepted   | Move the template runtime baseline from Node 22 to Node 24 LTS.                              |
| [ADR-012](./accepted/ADR-012-constrain-local-tooling-to-macos.md)                  | Accepted   | Treat macOS as the local tooling baseline and use direct pinned Agent CI scripts.            |
| [ADR-013](./accepted/ADR-013-return-to-npm-for-agent-ci-compatibility.md)          | Accepted   | Return to npm because local Agent CI remains unreliable with pnpm warmed dependency mounts.  |
| [ADR-014](./accepted/ADR-014-run-the-fast-gate-on-pre-push.md)                     | Accepted   | Run the fast quality gate automatically before pushes to catch cheap failures locally.       |
| [ADR-015](./accepted/ADR-015-relax-npm-version-enforcement.md)                     | Accepted   | Keep npm as the required package manager while relaxing exact npm patch enforcement.         |
| [ADR-016](./accepted/ADR-016-allow-lightweight-local-readme-screenshot-tooling.md) | Superseded | Allowed a lightweight local script for refreshing the committed README screenshot.           |
| [ADR-017](./accepted/ADR-017-prune-redundant-package-scripts.md)                   | Accepted   | Keep one canonical package script per normal workflow and remove redundant aliases.          |
| [ADR-018](./accepted/ADR-018-add-capability-kits.md)                               | Accepted   | Add lightweight capability kits for applying specific template practices to existing repos.  |
| [ADR-019](./accepted/ADR-019-tighten-agent-workflow-guardrails.md)                 | Accepted   | Tighten TypeScript, write-target, and readiness-validation guardrails for agent work.        |
| [ADR-020](./accepted/ADR-020-keep-readme-screenshot-refresh-manual.md)             | Accepted   | Keep README screenshot refresh manual and outside the automated development loop.            |

## Creating A New ADR

1. Read the ASDLC guidance in [`.asdlc/practices/adr-authoring.md`](../../.asdlc/practices/adr-authoring.md).
2. Copy [`ADR-000-template.md`](./proposed/ADR-000-template.md).
3. Rename it using the next sequential ID: `proposed/ADR-NNN-short-title.md`.
4. Fill in context, decision, consequences, and alternatives.
5. When the ADR is accepted, move it to `accepted/`.
6. If the change supersedes an earlier ADR, update the old ADR status to point at the new one.
7. Update the ADR table in this file.

## Search Tips

```bash
rg "Status:" docs/adrs
rg "Superseded by" docs/adrs
rg "database|auth|deploy" docs/adrs
```
