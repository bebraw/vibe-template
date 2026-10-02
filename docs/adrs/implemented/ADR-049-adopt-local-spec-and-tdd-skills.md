# ADR-049: Adopt Repository-Local Specification And TDD Skills

**Status:** Implemented

The adapted To Spec confirmation policy is superseded by [ADR-066](./ADR-066-scope-agent-guidance-to-the-task.md); the specification and TDD ownership decisions remain active.

**Date:** 2026-08-03

## Context

The template requires living feature specs, ADRs for lasting architecture decisions, and high automated coverage for source behavior. It has skills for brainstorming, multi-session wayfinding, debugging, review, and test adequacy, but no focused workflow for converting settled context into the repository's spec format or for driving implementation through failing behavioral tests.

The upstream `mattpocock/skills` collection provides `to-spec` and `tdd`. Its To Spec workflow publishes a PRD-like document to an issue tracker and assumes companion setup. Its TDD guidance contains useful red-green, public-seam, vertical-slice, and independent-expected-value discipline, but duplicates some existing review guidance and requires seam confirmation more broadly than this lightweight template needs.

## Decision

Vendor adapted `to-spec` and `tdd` skills from `mattpocock/skills` revision `2ab958093e83e0ec752e6c1c5932da465bf23e0c` under `.codex/skills/`, retaining the upstream MIT license and recording provenance in each skill.

Make To Spec explicitly invoked. It synthesizes only settled context into `specs/<feature-domain>/spec.md`, follows the existing Blueprint/Contract structure, updates rather than duplicates existing domain specs, and routes architectural rationale into ADRs. It creates no issue-tracker state.

Allow TDD to be model-invoked for observable runtime behavior and regression fixes when a stable seam exists. It works in focused red-green slices, tests public behavior with independent expected values, and asks the user only when introducing or moving a test seam would create a lasting architecture choice. It explicitly skips changes without meaningful test-first behavior and states alternative verification.

## Trigger

After reviewing the upstream collection, the user approved adopting the recommended repository-local To Spec and compact TDD workflows.

## Consequences

**Positive:**

- Settled brainstorming and wayfinding results have a direct path into the template's durable spec format.
- Runtime implementation gains a concise test-first feedback loop that complements review-time test adequacy checks.
- Both skills reuse existing ADR, spec, test, and quality-gate conventions without new services or dependencies.
- Explicit exceptions keep documentation, prototypes, generated output, and mechanical edits lightweight.

**Negative:**

- The adapted skills can drift from upstream and require deliberate review for future updates.
- TDD adds an extra targeted test execution before production edits when it applies.
- Agents still need judgment to distinguish a stable public seam from an architectural choice requiring user input.

**Neutral:**

- To Spec does not replace brainstorming or Wayfinder; it starts only after material decisions settle.
- TDD does not replace `test-review`, `debug`, or the repository quality gate.

## Alternatives Considered

### Install The Upstream Skills Unchanged

This preserves upstream behavior but introduces issue-tracker assumptions, companion setup, a parallel PRD structure, and broader seam-confirmation ceremony.

### Extend Wayfinder And Test Review Instead

This avoids new skill names but mixes distinct phases. Wayfinder manages unresolved discovery, while To Spec captures accepted state; test review evaluates finished coverage, while TDD drives implementation feedback.

### Encode Both Workflows Only In AGENTS.md

This reduces file count but loads detailed process guidance into every session and makes the workflows harder to invoke, adapt, or remove independently.

### Keep Using General Agent Behavior

General behavior can write specs and tests, but it does not reliably enforce the repository's synthesis boundary or prove red before production changes.
