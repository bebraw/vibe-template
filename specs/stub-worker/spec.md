# Feature: Stub Worker

## Blueprint

### Context

This template needs a concrete runnable starting point so developers can clone it, start a local app immediately, and exercise the existing quality-gate tools against a real surface instead of empty scaffolding.

### Architecture

- **Entry points:** `wrangler dev` via `src/worker.ts`
- **Source layout:** `src/worker.ts` routes requests, `src/api/` holds API handlers, and `src/views/` holds HTML rendering modules.
- **Data models:** None yet. The stub is stateless.
- **Dependencies:** Wrangler provides the Worker runtime; Playwright and Vitest verify the behavior.

### Anti-Patterns

- Do not let the template drift back into an untestable empty shell with no runnable app surface.
- Do not add feature-specific persistence or auth behavior to the stub without updating this spec and the relevant ADRs.
- Do not collapse API handling and rendered views back into one file as the starter evolves.

## Contract

### Definition of Done

- [ ] The template starts locally through Wrangler without extra scaffolding.
- [ ] The root route returns a visible HTML starter page for developers.
- [ ] The health route returns stable JSON for smoke tests and tooling.
- [ ] The spec is updated in the same change set.
- [ ] Automated tests cover the critical behavior.

### Regression Guardrails

- `GET /` must keep returning HTML with a recognizable starter heading.
- `GET /api/health` must keep returning HTTP 200 JSON with `ok: true`.
- Unknown routes must return HTTP 404.

### Verification

- **Automated tests:** `tests/worker.test.ts` for routing and module behavior and `tests/e2e/app.spec.ts` for the browser-visible flow.
- **Coverage target:** Keep the `src/worker.ts`, `src/api/**`, and `src/views/**` branches, lines, functions, and statements above the repo coverage thresholds.

### Scenarios

**Scenario: Developer opens the starter app**

- Given: the Worker is running locally
- When: the developer visits `/`
- Then: they see a starter page that explains what the template provides

**Scenario: Tooling checks app health**

- Given: the Worker is running locally
- When: a tool requests `/api/health`
- Then: it receives a stable JSON response with `ok: true`

**Scenario: Unknown route**

- Given: the Worker is running locally
- When: a request hits an undefined route
- Then: the Worker returns HTTP 404
