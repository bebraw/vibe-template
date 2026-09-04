# ADR-061: Enable Starter Worker Observability

**Status:** Implemented

**Date:** 2026-09-04

**Amends:** [ADR-060](./ADR-060-refresh-worker-operational-contracts.md)

## Context

The application kits emit bounded structured events, but the starter Wrangler configuration did not enable persistent Workers Logs or traces. A clone could therefore preserve the event contract while reaching production without predictable collection, leaving intermittent failures difficult to investigate after the fact.

Cloudflare recommends enabling logs and traces before production and making sampling explicit so collection volume is a deliberate operational choice. The template serves small experiments by default, but it must also remain cheap and easy for downstream projects to tune.

## Decision

Enable Workers observability explicitly in the base `wrangler.jsonc`. Persist all logs and invocation logs, and sample one percent of traces. Keep those sampling rates in committed configuration rather than relying on dashboard defaults.

Downstream projects may change either sampling rate to match traffic, cost, privacy, and diagnostic needs. Such changes remain deliberate application configuration; disabling collection silently is not the template default.

## Trigger

Downstream review found that the structured lifecycle events introduced by ADR-060 had no corresponding collection configuration in the starter.

## Consequences

**Positive:**

- Cloned Workers begin with searchable logs and sampled traces available for post-incident diagnosis.
- Reviewers can see and tune collection volume from version-controlled configuration.

**Negative:**

- Persisted telemetry consumes observability quota and may create cost at downstream production scale.
- One-percent trace sampling may miss individual low-volume requests.

**Neutral:**

- Applications still own their event fields, retention expectations, redaction policy, and any third-party telemetry export.

## Alternatives Considered

### Enable Logs Only

Logs would preserve structured events, but would omit request-path timing and span evidence that Cloudflare's production guidance recommends collecting before failures occur.

### Sample Every Trace

Full trace capture is convenient for tiny experiments, but it is an unsafe cost default for a template that can grow into higher-traffic applications.

### Ship An Optional Observability Capability

That would keep the base configuration smaller, but it would make basic production diagnosis opt-in even though the starter already establishes an operational logging contract.
