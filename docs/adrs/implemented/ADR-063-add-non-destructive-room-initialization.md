# ADR-063: Add Non-Destructive Room Initialization

**Status:** Implemented

**Date:** 2026-09-08

**Amends:** [ADR-059](./ADR-059-harden-anonymous-room-state.md)

## Context

Routine setup and retries currently reuse destructive seeding, which can erase an active room's votes or reopen a locked result. The generic kit needs a safe initialization operation while preserving deliberate reseeding.

## Decision

Add `initializeChoices(choices)` to the existing Room State RPC contract. Existing choices are the initialization marker; no separate flag or schema migration is needed. Validate and seed only when no choices exist. For an initialized room, return the current aggregate snapshot without validating unused choices or changing choices, votes, status, or revision.

Keep the snapshot check and call to synchronous seeding in one uninterrupted execution, without an intervening `await`. Seeding retains its synchronous SQLite transaction. This follows Cloudflare's [synchronous SQLite execution contract](https://developers.cloudflare.com/durable-objects/api/state/), which prevents other events from interleaving during these operations.

Add `initializeRoom` using the existing application-owned authorization callback, checked before accessing the room even on retries. Keep participant routes free of initialization and administration. Room-id knowledge is not authorization.

Keep `seedChoices` explicitly destructive and `resetVotes` limited to clearing votes. The detailed behavior lives in the [capability specification](../../../specs/capability-kits/spec.md).

## Consequences

- Retried and concurrent setup preserves active sessions and frozen revisions.
- Adopters can add the operation without new dependencies, bindings, or migrations.
- Changing setup choices will no longer change an existing room; callers must deliberately reseed when desired.
- Future changes must preserve the uninterrupted check-and-seed sequence and its concurrency tests.

## Alternatives Considered

### Change Seed Semantics

Making `seedChoices` non-destructive would break callers that intentionally replace choices and clear votes.

### Check In The Worker Before Seeding

Separate snapshot and seed RPC requests leave a race where another setup or vote can intervene. The room must own the check and mutation together.

### Add An Initialization Flag Or Per-Request Concurrency Block

Choices already provide a durable marker because valid seeding requires at least one choice and reset preserves choices. Synchronous SQLite operations need no additional asynchronous concurrency block.
