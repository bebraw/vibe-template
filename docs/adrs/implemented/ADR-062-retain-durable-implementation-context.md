# ADR-062: Retain Durable Implementation Context

**Status:** Implemented

**Date:** 2026-09-08

## Context

Project Start establishes a closed product loop and safe pruning boundaries, but later prompts may omit the audience, reviewed inputs, or persistent requirements supplied during initialization. An agent can then lose useful context, change working behavior while restyling, or mistake possible future capabilities for authorized work.

The repository already gives README, agent rules, feature specs, architecture records, and operational documents distinct responsibilities. Another project brief or private state store would create competing authority and additional maintenance in a template intended to remain easy to prune.

## Decision

Extend the existing Project Start Plan's Product focus and Documentation changes sections to capture relevant implementation context and route each fact to one authoritative existing surface. The [Project Start contract](../../../specs/project-start/spec.md#documentation-ownership) defines ownership and acceptance behavior. Discovery links and concise agent instructions must remain useful after the initialization skill is removed.

Infer context from supplied material, ask only about missing information that materially affects the current implementation, and omit irrelevant fields. Record the current increment's observable stopping condition and distinguish deferred direction from authorization. Later explicit user instructions can change durable requirements; update the owning documents when they do. Leave unspecified, reversible implementation and visual choices to agent judgment.

This extends [ADR-051](ADR-051-add-approval-gated-project-start.md). Its read-only planning phase, exact-target initialization and pruning approval, working-seam protection, and template-update provenance requirements remain in force. No mandatory brief, configuration format, skill, or private context store is introduced.

## Trigger

The user requested durable implementation context for brief follow-ups, deferred capabilities, improvised presentation changes, explicit changes of direction, and minimal projects.

## Consequences

**Positive:**

- Fresh agents can discover relevant context without replaying the original conversation.
- Increment boundaries and preserved behavior remain visible when presentation or implementation changes.
- Existing documentation ownership supports both simple projects and projects with reviewed inputs or staged delivery.

**Negative:**

- Initialization must identify exact documentation owners and keep discovery links useful.
- Durable changes require updating the owning document; stale links or requirements still need maintenance.

**Neutral:**

- Context capture adds no runtime dependencies or automatic product implementation.
- Operational session details remain in existing operational documents when relevant.
- The workflow does not require every context category for every project.

## Alternatives Considered

### Require A Project Brief Or Manifest

A fixed file would be easy to find but would duplicate facts already owned by specs and architecture records, and force simple projects into unnecessary fields.

### Keep Context In Conversation Or Agent-Private State

This avoids repository edits but cannot reliably inform a fresh agent and makes requirements difficult for users or other agents to review.

### Put All Context In AGENTS.md

Agent routing is discoverable, but storing product content, session details, and acceptance criteria there would crowd its concise project-wide instructions and compete with living feature specs.
