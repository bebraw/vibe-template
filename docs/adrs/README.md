# ADRs

This directory stores Architecture Decision Records for decisions that are significant enough to shape future work in the repo.

Use an ADR when a decision:

- establishes a lasting technical constraint
- selects between credible architectural alternatives
- accepts a meaningful trade-off that future contributors should understand

Skip an ADR for small, reversible, or purely tactical choices.

## Active ADRs

| ADR                                                       | Status   | Summary                                                               |
| --------------------------------------------------------- | -------- | --------------------------------------------------------------------- |
| [ADR-001](./ADR-001-use-architecture-decision-records.md) | Accepted | Use ADRs to capture significant architectural decisions in this repo. |

## Creating A New ADR

1. Read the ASDLC guidance in [`.asdlc/practices/adr-authoring.md`](../../.asdlc/practices/adr-authoring.md).
2. Copy [`ADR-000-template.md`](./ADR-000-template.md).
3. Rename it using the next sequential ID: `ADR-NNN-short-title.md`.
4. Fill in context, decision, consequences, and alternatives.
5. Update the active ADR table in this file.

## Search Tips

```bash
rg "Status:" docs/adrs
rg "Superseded by" docs/adrs
rg "database|auth|deploy" docs/adrs
```
