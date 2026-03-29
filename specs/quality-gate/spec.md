# Feature: Quality Gate

## Blueprint

### Context

The template needs a verification baseline that stays strict enough for end-to-end confidence while still returning useful failures quickly during normal development.

### Architecture

- **Fast gate:** `npm run quality:gate:fast`
- **Browser gate:** `npm run quality:gate:browser`
- **Full gate:** `npm run quality:gate`
- **Local workflow:** `npm run ci:local:quiet`
- **Retry command:** `npm run ci:local:retry -- --name <runner-name>`
- **Remote workflow:** `.github/workflows/ci.yml`
- **Runtime pin source:** `package.json#engines.node`
- **Browser runtime image:** `mcr.microsoft.com/playwright:v1.58.2-noble`
- **Coverage gate logic:** `scripts/run-coverage-gate.mjs`

### Anti-Patterns

- Do not collapse fast and browser verification back into one opaque step without a concrete reason.
- Do not treat colocated tests or test-support files as runtime source code when deciding whether unit coverage is missing.
- Do not weaken the full gate just to make iteration faster.

## Contract

### Definition of Done

- [ ] The fast gate covers formatting, type checking, runtime audit, and unit coverage.
- [ ] The browser gate covers the Playwright baseline.
- [ ] The full gate runs both in order.
- [ ] Local and remote CI use the same split verification model.
- [ ] The spec is updated in the same change set.

### Regression Guardrails

- `npm run quality:gate:fast` must remain a useful faster signal than the full gate.
- `npm run quality:gate` must continue to represent the full baseline verification path.
- The CI workflow must cancel superseded runs for the same ref.
- The CI workflow must read the pinned Node version from `package.json` instead of a separate version file.
- The browser CI job must use the pinned Playwright container instead of reinstalling Chromium at runtime.
- The coverage gate must only require unit tests when runtime `src/` code exists.
- The coverage gate must work in both the normal workspace and local Agent CI's warmed `node_modules` layout.
- The repo's local CI scripts should call `agent-ci` directly unless an upstream limitation requires extra wrapping.
- The local verification workflow should document macOS as the supported host baseline instead of implying cross-platform support.
- The Playwright server path must avoid macOS file-watcher exhaustion in local runs without changing the normal `npm run dev` workflow.

### Verification

- **Automated checks:** `npm run quality:gate` and `npm run ci:local:quiet`
- **Workflow shape:** `.github/workflows/ci.yml` should show separate fast and browser jobs, with repository-shape validation in the fast job

### Scenarios

**Scenario: Contributor wants a fast local signal**

- Given: a change that does not need immediate browser verification
- When: the contributor runs `npm run quality:gate:fast`
- Then: formatting, typing, audit, and unit coverage run without waiting for Playwright

**Scenario: Full verification before landing**

- Given: a change is ready for review or merge
- When: the contributor runs `npm run quality:gate` and `npm run ci:local:quiet`
- Then: both the fast and browser verification paths pass

**Scenario: New push supersedes an old CI run**

- Given: a newer push exists on the same ref
- When: GitHub Actions schedules the new workflow run
- Then: the older in-progress run is canceled instead of continuing to consume time
