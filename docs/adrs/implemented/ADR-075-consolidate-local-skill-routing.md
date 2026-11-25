# ADR-075: Consolidate Local Skill Routing

**Status:** Implemented

**Date:** 2026-11-25

## Context

The move to GPT-6.2 prompted a review of two kinds of duplication. The `simplify` skill described routine edits such as deriving duplicate state and preserving public behavior. Its checks already applied through the repository's verification policy. The `frontend-design` skill sent agents to a second skill for the starter's visual conventions, even though both tasks use the same stylesheet and Worker view.

In a small GPT-6.2 Astra comparison with and without the respective skill text, both simplifications passed the same 24 cases, while the guided brainstorming response also considered maintenance and reversibility. Each pair covered one synthetic task.

## Decision

Retire `simplify` as a named skill. Users can request behavior-preserving simplification directly. Keep `brainstorming` as the entrypoint for comparing options before implementation.

Move `minimal-visual-style` into `frontend-design`. For changes that extend the current starter, consult its source and preserve the narrow serif layout, `app-*` tokens, single accent and route rows. Refresh a screenshot from the verified UI. Users can still request a different visual direction. [Agent skill contract](../../../specs/agent-skills/spec.md)

## Consequences

The template publishes 17 local skills, down from 19. Users who previously named `$simplify` can describe the edit directly. Users who named `$minimal-visual-style` can use `$frontend-design`.

## Alternatives Considered

Keeping aliases would preserve the two command names at the cost of continuing to advertise both routing entries. Removing the starter visual guidance outright would lose the distinction between extending the starter and designing a new identity. The existing capability-based baseline continues to govern other skills. [ADR-066](./ADR-066-scope-agent-guidance-to-the-task.md)
