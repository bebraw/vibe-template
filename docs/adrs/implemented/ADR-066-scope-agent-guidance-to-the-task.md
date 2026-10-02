# ADR-066: Scope Agent Guidance To The Task

**Status:** Implemented

**Date:** 2026-10-02

## Context

ADR-054 already removed unused skills and condensed the retained entrypoints. The remaining baseline still names a particular model generation, repeats verification requirements in `AGENTS.md`, requires README discovery before every implementation, and makes To Spec request confirmation even after a user has explicitly asked to record a settled contract.

These instructions add reading and approval steps without resolving uncertainty. Current [OpenAI skill guidance](https://developers.openai.com/plugins/build/skills) and its [instruction review guidance](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra) support narrow routing, contextual reading, and clear decision boundaries. Repository-specific constraints remain necessary across different agents.

## Decision

Describe the baseline by repository navigation, tool use, and engineering judgment rather than a model name. Retain ADR-054's compact, retrieval-first skills, precise routing, intentional distribution copies, and removal of unused product and persona suites.

Use README links for discovery when needed and load the contracts relevant to the requested task. Consolidate verification policy in one `AGENTS.md` section without changing required gates. Allow local checks, fixes caused by the requested change, and affected retries within existing authorization; additional verification needs a new change, failure, or unresolved concern.

To Spec states its destination and proceeds when the user has requested specification and the destination and contract are settled. It still asks about material unresolved choices and does not authorize implementation.

Existing authorization carries through necessary work within its scope. Preserve dependency and lasting-write approval when not already authorized, irreversible-action boundaries, and Project Start's explicit approved-plan checkpoint.

This supersedes the named-model assumption in ADR-054 and the unconditional confirmation step in ADR-049's adapted To Spec workflow; their other decisions remain active.

## Trigger

The user requested dependency maintenance and a review of legacy code and skills as agent capabilities improve.

## Consequences

- **Positive:** routine work loads less irrelevant context, settled specification requests complete directly, and approvals remain tied to actual uncertainty or scope.
- **Negative:** agents must judge which context matters; lower-capability environments may need focused additional guidance demonstrated by failures.
- **Neutral:** runtime behavior, skill ownership, required quality gates, and destructive workflow checkpoints stay unchanged.

## Alternatives Considered

### Replace The Named Model With A Newer Model

This would age again and imply that a model name proves the capabilities required by the repository.

### Delete The Remaining Skills Or Relax The Quality Gates

The retained skills carry project contracts and exact operational interfaces. Better model reasoning does not establish dependency compatibility, runtime correctness, or authorization for destructive changes.
