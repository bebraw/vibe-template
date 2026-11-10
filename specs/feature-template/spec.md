# Feature: Template Feature

## Blueprint

### Context

{Why does this feature exist? What problem does it solve?}

### Architecture

- **Capability source root:** {Directory that owns this independently evolvable behavior}
- **Composition root:** {File or module that wires the capability into the application}
- **Entry points:** {Routes, commands, jobs, or other entry surfaces}
- **State authority:** {Canonical state, persistence owner, and derived/rebuildable state}
- **Public contracts:** {APIs, schemas, events, or module seams used by dependents}
- **Dependency direction:** {What this capability may depend on and what may depend on it}

### Out of Scope

- {Adjacent capability intentionally deferred from this contract}

### Anti-Patterns

- {What contributors and agents must avoid, with rationale}

## Contract

### External-Service Acceptance (When Applicable)

{Omit this section if there is no external dependency. Follow the [spec guidance](../README.md#external-service-features) and [evaluation and timing conventions](../../docs/development.md#external-service-evaluation-and-timing).}

- **Expected latency budget:** {Numerical limit and units; start/end boundaries such as submission to usable result; workload/environment; statistic, sample size, and pass/fail rule}
- **Dependency timeouts:** {Limit per external operation/attempt, including response consumption; retry/backoff policy within the remaining request deadline}
- **Overall request deadline:** {Total limit from request entry to completion, including application stages and all dependency attempts; how the caller stops waiting even if cancellation is ignored}
- **User-visible behavior:** {Loading state and behavior after the expected budget is missed; fallback/error and retry availability at dependency timeout or request deadline; handling of late results}
- **Reliability target:** {Acceptable error, timeout, and fallback rates over a stated sample/denominator; distinguish primary-service success from fallback}
- **Timing evidence:** {Fixed names and boundaries for the complete request and relevant application/dependency stages; duration, outcome, and timeout status only, with no sensitive content}

### Definition of Done

- [ ] {Observable success criterion}
- [ ] {Spec updated in the same change set}
- [ ] {Automated tests cover the critical behavior}
- [ ] {When external services are involved: representative evaluation meets the quality, latency, and reliability criteria, and deterministic tests verify timeout/deadline behavior}

### Regression Guardrails

- {Invariant that must continue to hold}

### Verification

- **Automated tests:** {Unit, integration, or e2e checks that prove the contract}
- **Coverage target:** {Expected coverage or critical paths that must stay exercised}
- **Early external-service evaluation (when applicable):** {Before building the full interaction, record representative request classes, environment/configuration, sample size, quality results, total/stage latency, errors/timeouts/fallbacks, and proceed/adjust/stop decision; keep sensitive request content out of timing records and evaluation summaries}
- **External-service acceptance (when applicable):** {Recheck the complete interaction against the budget; test slow success, dependency timeout, overall deadline across retries/stages, ignored cancellation, and failure/fallback behavior with fake dependencies and controlled time in CI; no paid calls required}

### Scenarios

**Scenario: {Name}**

- Given: {Precondition}
- When: {Action}
- Then: {Expected outcome}
