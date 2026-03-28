# ADRs

This directory stores Architecture Decision Records for decisions that are significant enough to shape future work in the repo.

The default in this template is to make architectural choices explicit. If a change introduces or changes a lasting architectural constraint, chooses between credible architectural alternatives, or supersedes an earlier decision, add or update an ADR in the same change set.

Use an ADR when a decision:

- establishes a lasting technical constraint
- selects between credible architectural alternatives
- accepts a meaningful trade-off that future contributors should understand
- replaces, narrows, or broadens an earlier architecture decision

Skip an ADR for small, reversible, or purely tactical choices.

## Active ADRs

| ADR                                                            | Status   | Summary                                                                               |
| -------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| [ADR-001](./ADR-001-use-architecture-decision-records.md)      | Accepted | Use ADRs to capture significant architectural decisions in this repo.                 |
| [ADR-002](./ADR-002-make-architectural-decisions-explicit.md)  | Accepted | Require explicit ADR updates for lasting architectural decisions.                     |
| [ADR-003](./ADR-003-require-spec-updates-and-high-coverage.md) | Accepted | Treat completed feature work as spec work and gate `src/` code on high unit coverage. |
| [ADR-004](./ADR-004-ship-a-worker-stub.md)                     | Accepted | Ship a minimal Worker stub so the template is runnable and testable.                  |
| [ADR-005](./ADR-005-separate-worker-views-and-api.md)          | Accepted | Separate the Worker starter into `src/api` and `src/views` for easier evolution.      |

## Creating A New ADR

1. Read the ASDLC guidance in [`.asdlc/practices/adr-authoring.md`](../../.asdlc/practices/adr-authoring.md).
2. Copy [`ADR-000-template.md`](./ADR-000-template.md).
3. Rename it using the next sequential ID: `ADR-NNN-short-title.md`.
4. Fill in context, decision, consequences, and alternatives.
5. If the change supersedes an earlier ADR, update the old ADR status to point at the new one.
6. Update the active ADR table in this file.

## Search Tips

```bash
rg "Status:" docs/adrs
rg "Superseded by" docs/adrs
rg "database|auth|deploy" docs/adrs
```
