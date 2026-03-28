# ADR-001: Use Architecture Decision Records

**Status:** Accepted

**Date:** 2026-03-28

## Context

`vibe-template` is meant to be cloned and adapted for many small projects. That makes architectural choices easy to lose: one project may add a deployment model, persistence layer, auth system, or testing strategy that later contributors need to understand.

The repo already vendors ASDLC guidance, including [ADR authoring](../../.asdlc/practices/adr-authoring.md), but it did not yet provide a local place to record project-specific architectural decisions. Without a lightweight ADR baseline, important trade-offs would end up scattered across commits, pull requests, or ad hoc notes.

## Decision

We will keep Architecture Decision Records in `docs/adrs/` for significant architectural decisions in this repo and in projects cloned from it.

The ADR baseline consists of:

- a directory-local index in `docs/adrs/README.md`
- a starter template in `docs/adrs/ADR-000-template.md`
- sequentially numbered ADR files using the format `ADR-NNN-short-title.md`

## Consequences

**Positive:**

- Significant architectural choices have a stable, searchable home in the repo.
- Future contributors have a clear place to record decisions that affect setup, runtime, testing, or deployment.
- The template now matches the ASDLC recommendation for ADR organization.

**Negative:**

- Contributors must spend extra time deciding when a change deserves an ADR and keeping the index up to date.
- Poorly written ADRs could add noise if teams record tactical decisions that should stay out of the log.

**Neutral:**

- The repo gains a small amount of permanent documentation structure under `docs/adrs/`.

## Alternatives Considered

### Keep decisions in README and development docs only

Rejected because those docs are better for current usage instructions than for preserving architectural trade-offs over time.

### Wait until the first large architectural change

Rejected because the template should provide the convention before projects need it. An empty convention is easier to follow when the first real decision appears.
