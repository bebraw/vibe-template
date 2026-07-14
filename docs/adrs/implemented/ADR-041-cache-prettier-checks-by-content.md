# ADR-041: Cache Prettier Checks By Content

**Status:** Implemented

**Date:** 2026-07-14

**Amends:** [ADR-038](./ADR-038-scope-prettier-to-owned-files.md)

## Context

ADR-038 reduced a cold full-repository Prettier check from roughly 4.56 seconds to under one second by excluding duplicated and vendored skill material. The formatter remained the largest individual component of the fast local gate. A temporary-cache benchmark measured a 0.77-second cold check and 0.19–0.23-second warm checks.

Repeated local checks commonly inspect identical content. Prettier supports caching successful results, but metadata-based invalidation can trust timestamps that change independently of content across branch switches, restores, or tooling operations.

## Decision

`npm run format:check` will enable Prettier's cache with `--cache-strategy content` and store it at `.cache/prettier`.

The `.cache/` directory remains ignored and disposable. CI does not restore this cache, so clean runners perform a complete cold check. The affected-file formatter path remains uncached because it already scopes work to changed files.

## Trigger

The user asked to implement the measured local Prettier caching direction after the formatting scope optimization landed.

## Consequences

**Positive:**

- Repeated local fast gates avoid reparsing unchanged formatted files.
- Content hashing remains safe across timestamp and branch changes.
- The implementation uses Prettier's built-in cache and adds no dependency.

**Negative:**

- The first check remains cold and creates disposable local state.
- Content hashing does slightly more work than metadata-based invalidation.

**Neutral:**

- Formatting output and failure behavior remain unchanged.
- Clean CI runners continue to check every owned file.

## Alternatives Considered

### Use Metadata Cache Invalidation

This can be marginally cheaper but relies on file size and modification time rather than content, making branch and restore behavior less robust.

### Restore The Prettier Cache In CI

This could save part of a second but would add cache restore/save overhead and workflow complexity that exceeds the current formatting budget.

### Keep Formatting Checks Uncached

This avoided local state but repeatedly spent most of the fast-gate formatting budget on unchanged files.
