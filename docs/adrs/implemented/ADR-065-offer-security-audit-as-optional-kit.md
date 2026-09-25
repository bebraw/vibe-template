# ADR-065: Offer Security Audit As An Optional Kit

**Status:** Implemented

**Date:** 2026-09-25

## Context

The template's compact `security` skill handles proportional reviews during normal implementation. Cloudflare's `security-audit-skill` provides a much larger six-phase codebase-audit workflow with coverage tracking, independent candidate and record verification, machine-readable findings, and report artifacts. That workflow needs delegated agents, a separate output location, and strict execution isolation when running target-controlled code. Putting it in the baseline would add substantial context and an audit trigger to every small project.

Capability kits already provide an opt-in route for transferring agent workflows to downstream repositories. The upstream skill includes companion guides, a schema, and validators that must travel together to keep full audit mode functional.

## Decision

Provide `security-audit` as an optional capability kit. Vendor the complete Cloudflare skill distribution at revision `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8` with its MIT license and source metadata. Make one documented Oxlint compatibility edit to remove an unused catch binding. The kit's integration instructions own target-specific routing, output location, and sandbox checks.

Keep the project-local `security` skill as the default focused-review path. Do not add the full audit skill to the template's baseline skill roots, normal quality gate, or CI. An adopter explicitly selects this kit and keeps its own security guidance authoritative.

## Consequences

**Positive:**

- Downstream projects can adopt a complete, reviewable audit workflow without changing the starter's normal review path.
- Pinned provenance, license, and bundled validator tests make installation and later updates auditable.

**Negative:**

- The kit carries a large vendored instruction and validator tree that requires deliberate upstream review to refresh.
- Some environments cannot satisfy the execution sandbox or independent-agent requirements; their full audits will have limited validation.

**Neutral:**

- The kit adds no package dependency, default CI step, audit artifacts, or runtime behavior to the template.

## Alternatives Considered

### Add The Audit Skill To The Template Baseline

This would make broad audit requests trigger the full workflow in every clone, including small projects that only need focused reviews. It would also expand the baseline instruction surface.

### Link To The Upstream Repository Without A Kit

A moving upstream reference would not give adopters a complete, pinned and reviewable set of guides, schema, validators, license, and integration checks.

### Copy Only The Entrypoint

The six-phase workflow refers to companion guides and validators. An entrypoint-only copy would leave core phases incomplete.
