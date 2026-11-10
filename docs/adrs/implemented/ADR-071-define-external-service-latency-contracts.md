# ADR-071: Define External-Service Latency Contracts

**Status:** Implemented

**Date:** 2026-11-10

## Context

The project idea generator experiment exposed a gap between useful output and an acceptable interaction. The user reported successful generation requests taking approximately 5–24 seconds. A provider timeout existed, but individual stages and the complete request had no timings, making slow requests difficult to diagnose. Existing quality checks could pass without establishing acceptable latency or reliability.

The template needs a reusable acceptance and evaluation convention while remaining lightweight. External services and user interactions differ enough that a universal timeout or optimization strategy would encode application assumptions.

## Decision

Require specs for external-service features to define an explicit latency budget, its measurement method, and user-visible behavior when the budget is exceeded. Distinguish the expected latency target, a dependency timeout, and an overall request deadline. [Spec guidance](../../../specs/README.md#external-service-features) and the [feature template](../../../specs/feature-template/spec.md) own the acceptance contract.

Use the existing [development guide](../../development.md#external-service-evaluation-and-timing) for privacy-safe total and stage timings that distinguish dependency latency from application overhead. Timing records contain a bounded operation name, duration, outcome, and timeout status, excluding prompts, responses, credentials, and personal data. This extends the minimal operational evidence established by [ADR-060](./ADR-060-refresh-worker-operational-contracts.md).

Evaluate representative requests early, before building the full interaction, with output quality, latency, and failures as explicit decision inputs. Record the evaluation method and limitations with the feature's acceptance evidence. Use deterministic local substitutes to verify deadline and failure behavior in CI; real-service evaluation remains separate.

Implement this convention through documentation and a portable update pack. Add no dependency, telemetry service, or paid CI calls. Applications own model selection, token limits, streaming, and caching. Defer a shared timing abstraction until repeated usage demonstrates a useful common contract.

## Consequences

- **Positive:** latency and reliability become reviewable acceptance criteria, and timing evidence helps identify dependency delays versus application overhead.
- **Negative:** feature authors must choose defensible budgets and maintain representative evaluation evidence; deterministic CI cannot establish a real provider's latency or reliability.
- **Neutral:** applications choose their own values and implementation mechanisms, and existing observability configuration remains unchanged.

## Alternatives Considered

### Rely on Provider Timeouts and Output Quality

A dependency timeout does not bound the complete request or show where time is spent. Useful output can still arrive too late for the intended interaction.

### Ship a Universal Budget and Timing Framework

One budget would ignore differences in interactions and providers. A shared helper or required telemetry service would add implementation and maintenance commitments before repeated use establishes their shape.

### Gate CI on Live Provider Calls

Paid calls and variable service conditions would make ordinary verification costly and unreliable. Separate representative evaluation from deterministic tests of application behavior.
