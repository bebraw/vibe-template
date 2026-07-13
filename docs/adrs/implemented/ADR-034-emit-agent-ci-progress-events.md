# ADR-034: Emit Agent CI Progress Events

**Status:** Implemented

**Date:** 2026-07-13

## Context

The canonical local CI command used Agent CI's `--quiet` mode so animated terminal output would not consume an agent's context. Quiet output is useful for log hygiene, but on a long workflow its sparse human-readable transitions can make progress tracking ambiguous and can look like a hung process.

The pinned Agent CI release exposes an independent `--json` mode. It emits versioned newline-delimited lifecycle events for runs, jobs, steps, diagnostics, pauses, and completion. A pause event also carries the runner name and retry command. Agent CI automatically suppresses animated rendering in JSON mode, and explicitly combining both flags documents the intended agent-facing behavior.

## Decision

The canonical `npm run ci:local` command will combine `--quiet` and `--json` with the existing `--pause-on-failure` behavior.

Agents following this repo's RTK requirement will invoke local CI through `rtk proxy` so the wrapper passes the NDJSON event stream through while the workflow runs instead of buffering it until process exit.

Capability-kit guidance and downstream template updates will preserve the same contract: agents receive structured lifecycle progress while animated terminal rendering stays disabled.

## Trigger

The user reported that quiet Agent CI output could be problematic for progress tracking and asked to ensure enough progress reaches an agent to avoid treating the process as hung.

## Consequences

**Positive:**

- Agents receive explicit run, job, and step transitions throughout local CI.
- Paused runs expose a machine-readable runner name and retry command.
- Progress monitoring no longer depends on scraping human-readable terminal animation.
- RTK's raw proxy preserves live event delivery for agents working under this repo's command-wrapper requirement.

**Negative:**

- Local CI stdout is NDJSON rather than prose, which is less friendly for a person reading raw output without tooling.
- Consumers that capture stdout should treat it as a versioned event stream.

**Neutral:**

- Human-readable status remains available on stderr.
- Warm-cache serialization, local parallelism, workflow selection, and pause-on-failure behavior do not change.

## Alternatives Considered

### Remove `--quiet` and use the animated renderer

This would provide visible human progress, but animated ANSI output is noisy for agents and does not provide a stable state contract.

### Keep quiet mode without structured events

This preserves the smallest output volume but leaves agents with sparse, human-oriented progress and no complete lifecycle stream.

### Use JSON mode without retaining the explicit quiet flag

Agent CI currently suppresses animation automatically under `--json`, so this is functionally valid. Keeping both flags makes the intended combination discoverable in the canonical script and remains consistent with Agent CI's documented agent-output usage.
