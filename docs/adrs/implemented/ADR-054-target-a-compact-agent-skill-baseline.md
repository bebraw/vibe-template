# ADR-054: Target A Compact Agent Skill Baseline

**Status:** Implemented

**Date:** 2026-08-31

The named-model assumption is superseded by [ADR-066](./ADR-066-scope-agent-guidance-to-the-task.md); the compact skill and removal decisions remain active.

## Context

The repository had 26 active local skill entrypoints containing 15,727 words, including 1,023 words of descriptions exposed during skill routing. Several skills repeated generic engineering advice already handled by capable agents, while Wrangler, Worker, Sandbox, and performance skills embedded version-sensitive command catalogs and tutorials despite the repository's retrieval-first architecture.

The installed Caveman suite added six overlapping routing entries and two names for the same file-compression implementation. Its broad automatic triggers could replace normal review, commit, or communication behavior when a user merely mentioned brevity or token efficiency. The local Sandbox SDK skill described a product the template does not use, contrary to the on-demand product-skill rule in `specs/agent-skills/spec.md`.

The project can assume a `gpt-5.6-sol`-class baseline with strong repository navigation, tool use, and ordinary engineering judgment. Skill context should change decisions, not reteach those capabilities.

## Decision

Author repository skills for that capable baseline:

- Keep descriptions short and discriminating.
- Keep entrypoints focused on project-specific contracts, non-obvious invariants, exact local commands, retrieval routes, and safety boundaries.
- Retrieve version-sensitive CLI syntax, APIs, metrics, and platform rules from installed help or current primary documentation instead of embedding static catalogs.
- Preserve approval gates, secret handling, telemetry controls, reviewed pins, evidence thresholds, public-seam testing, and repository verification requirements even when they cost context.
- Keep intentional `.github/skills/` and capability-kit copies byte-equivalent to their canonical sources.

Remove the Caveman skill suite and its lockfile. Remove the local and GitHub Sandbox SDK skill until the project adopts `@cloudflare/sandbox`. Retain and compact the Worker and Wrangler baseline required by ADR-047.

Treat instruction size as a review signal rather than an absolute file limit. A larger skill remains valid when a fragile workflow, safety boundary, or genuinely conditional reference requires it.

## Trigger

The user asked to reduce skill context for a `gpt-5.6-sol` baseline and explicitly approved dropping Caveman when it did not provide enough value.

## Consequences

**Positive:**

- Every session sees fewer and shorter routing descriptions.
- Activated skills spend more context on repository evidence and task artifacts.
- Current documentation replaces stale command and threshold snapshots.
- Overlapping persona, review, commit, compression, and unused product routing disappears.
- Compact skills are easier to audit and keep synchronized across mirrors.

**Negative:**

- Weaker or offline agents receive less embedded tutorial material.
- Version-sensitive work depends more heavily on installed help or current documentation access.
- Future upstream skill updates require intent-level review rather than copying prose wholesale.

**Neutral:**

- Worker runtime behavior, package dependencies, and quality-gate scope do not change.
- Focused skills remain independently invocable; this decision changes their instruction density, not their ownership.

## Alternatives Considered

### Keep The Existing Definitions

This preserved compatibility with weaker agents but spent context on generic reasoning, created routing conflicts, and kept stale platform details beside retrieval-first instructions.

### Move Every Manual Into References

This made entrypoints look smaller but preserved repository weight and still loaded the same stale material whenever a broad reference was required. References remain appropriate only for genuinely conditional detail.

### Remove All Local Skills

This minimized context but discarded project-specific approval gates, quality interfaces, architecture workflows, reviewed pins, and portable guidance for environments without the same global skill catalog.
