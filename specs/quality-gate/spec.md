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
- **Git hook path:** `.githooks/`
- **Hook setup script:** `scripts/setup-git-hooks.mjs`
- **Runtime pin source:** `package.json#engines.node`
- **Package manager hint source:** `package.json#packageManager`
- **Browser runtime image:** `mcr.microsoft.com/playwright:v1.59.1-noble`
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
- [ ] The repo-managed `pre-push` hook runs the fast gate before a push leaves the machine.
- [ ] Local and remote CI use the same split verification model.
- [ ] The spec is updated in the same change set.

### Regression Guardrails

- `npm run quality:gate:fast` must remain a useful faster signal than the full gate.
- `npm run quality:gate` must continue to represent the full baseline verification path.
- `npm install` must keep the repo-managed `pre-push` hook configured without requiring extra setup steps.
- The CI workflow must cancel superseded runs for the same ref.
- The CI workflow must read the pinned Node version from `package.json` instead of a separate version file.
- The CI workflow must keep using npm for install and verification steps without depending on one exact npm patch release.
- The npm release used by CI must stay inside the supported npm range declared in `package.json`.
- The browser CI job must use the pinned Playwright container instead of reinstalling Chromium at runtime.
- The coverage gate must only require unit tests when runtime `src/` code exists.
- The coverage gate must work in both the normal workspace and local Agent CI's warmed `node_modules` layout.
- The repo's local CI scripts should use the repo-pinned `agent-ci` binary directly instead of carrying repo-specific runtime patching.
- The local verification workflow should document macOS as the supported host baseline instead of implying cross-platform support.
- The Playwright server path must avoid macOS file-watcher exhaustion in local runs without changing the normal `npm run dev` workflow.
- The local CI documentation must cover the no-`origin` case through `.env.agent-ci` and `GITHUB_REPO` instead of treating that warning as normal noise.
- The local CI Docker daemon override must use Agent CI's `AGENT_CI_DOCKER_HOST` variable instead of the general Docker CLI `DOCKER_HOST` variable.
- Local Playwright browser installation should go through a pinned repo script instead of ad hoc `npx playwright install ...` usage.

### Verification

- **Automated checks:** `npm run quality:gate` and `npm run ci:local:quiet`
- **Local setup check:** `git config --get core.hooksPath` should resolve to `.githooks`
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

**Scenario: Contributor pushes with a broken fast gate**

- Given: the repo was bootstrapped with `npm install`
- When: the contributor runs `git push` while the fast gate is red
- Then: the `pre-push` hook runs `npm run quality:gate:fast` and the push is blocked before remote CI starts

**Scenario: New push supersedes an old CI run**

- Given: a newer push exists on the same ref
- When: GitHub Actions schedules the new workflow run
- Then: the older in-progress run is canceled instead of continuing to consume time
