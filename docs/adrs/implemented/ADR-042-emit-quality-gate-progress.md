# ADR-042: Emit Quality-Gate Progress

**Status:** Implemented

**Date:** 2026-07-15

## Context

The local `quality:gate` ran three npm scripts through a shell chain. npm announced each child command, but a long browser or mutation phase could produce no output for long enough to look hung. The gate must retain its sequential fail-fast behavior and stream the underlying tools' output without adding a dependency or a persistent state target.

## Decision

Run the full local gate through a small repository-owned Node script. The runner names each phase, reports completion or failure with elapsed time, and emits a heartbeat every 30 seconds while the current phase remains active. Child processes inherit standard input and output so their native interactive behavior and live logs remain available.

Keep `quality:gate:fast`, `e2e`, and `mutation:incremental` as the canonical phase commands and run them sequentially with fail-fast exit codes.

## Consequences

**Positive:**

- Contributors can distinguish a slow active phase from a hung gate.
- Phase and child-tool output remains visible in terminals and agent command streams.
- The runner is covered by the existing tooling test command without a new dependency.

**Negative:**

- The repository owns a small process-orchestration script instead of expressing the full gate as a package-script shell chain.
- Long-running gate logs gain one line every 30 seconds.

**Neutral:**

- The phase order and readiness baseline do not change.

## Alternatives Considered

### Enable more verbose output in individual tools

This would not provide a consistent liveness signal across formatting, browser, and mutation phases, and tool-specific verbosity can generate substantially noisier logs.

### Keep only phase transition messages

Transitions identify the current phase but still leave an ambiguous quiet period while a single phase runs for several minutes.
