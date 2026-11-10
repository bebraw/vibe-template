# Specs

This directory stores living feature specs using the ASDLC spec pattern.

Specs are the durable source of truth for how a feature works and how we verify it. Keep them close to the code and update them when behavior changes.

Passing CI is necessary but not sufficient. Hand-written and AI-generated code are both valid implementation inputs, but they still need to implement the committed spec and any relevant ADRs instead of silently redefining them.

Completed feature work should not leave its contracts implicit. If a change introduces or changes feature behavior, workflows, quality targets, or regression guardrails, create a new spec or update the existing one in the same change set.

Use a spec when work introduces:

- feature-level architecture or API contracts
- important quality rules or regression guardrails
- workflows that future contributors or agents need to preserve
- any completed feature domain that would otherwise leave its expected behavior implicit

Skip a spec for small fixes, trivial copy changes, or narrow tactical edits.

## Layout

- Global rules belong in [`ARCHITECTURE.md`](../ARCHITECTURE.md).
- Feature specs belong in `specs/{feature-domain}/spec.md`.
- Capability-kit contracts belong in `specs/capability-kits/spec.md`.
- Deployment-readiness preflight contracts belong in `specs/deploy-preflight/spec.md`.
- Agent-skill baseline contracts belong in `specs/agent-skills/spec.md`.
- Project initialization, durable context ownership, and pruning contracts belong in [`specs/project-start/spec.md`](project-start/spec.md). An initialized project's current increment and authoritative input references belong in its relevant feature spec, linked from README and agent routing.
- Template update-pack contracts belong in `specs/template-updates/spec.md`.

## Starting Point

- Copy [`feature-template/spec.md`](./feature-template/spec.md) into a new feature directory.
- Rename the directory to match the feature domain in kebab-case.
- Update the spec whenever the feature's contracts, workflows, architecture, or quality guardrails change.
- Treat spec creation or update as part of done work for feature delivery, not a later documentation pass.

## External-Service Features

When a feature depends on an external service, make latency and reliability acceptance criteria alongside output quality. Fill in the external-service section of the [feature template](feature-template/spec.md); omit it when the feature has no external dependency. Keep numerical limits and interaction choices application specific.

- Define an expected latency budget with units, measurement start/end boundaries, representative workload, and a pass/fail rule (for example, a chosen percentile over a stated sample size). Distinguish user-perceived completion from server request duration; server timings alone do not measure network transfer or browser rendering.
- Specify dependency timeouts separately from the overall request deadline. The deadline bounds application work, dependency waits, retries/backoff, and response preparation together. State the user-visible behavior when the expected budget is missed and when a timeout or deadline ends the request, including loading state, fallback/error, retry availability, and treatment of late results.
- Define acceptable failure, timeout, and fallback rates with a denominator and evaluation sample. A useful result that arrives too slowly, or only after repeated failures, does not satisfy the contract. Count fallback outcomes separately from primary-service successes.
- Name the total-request and stage timings needed to distinguish dependency latency from application overhead, following the [privacy-safe timing conventions](../docs/development.md#external-service-evaluation-and-timing).
- Evaluate a small representative request set before building the full interaction. Record quality, latency, failures, environment, sample limitations, and the decision to proceed, adjust, or stop in the feature spec's verification notes. Re-evaluate the complete interaction against its budget before acceptance; unit tests with a fake dependency cannot establish live-service latency.

Keep automated timeout and failure checks deterministic with controlled clocks and fake dependencies. CI must not require paid service calls. This guidance introduces no telemetry service or shared timing helper; model selection, token limits, streaming, and caching remain application decisions.

## Search Tips

```bash
rg "^# Feature:" specs
rg "^## Contract" specs
rg "Regression Guardrails|Anti-Patterns" specs
```
