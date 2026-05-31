# Feature: Quality Gate

## Blueprint

### Context

The template needs a verification baseline that stays strict enough for end-to-end confidence while still returning useful failures quickly during normal development.

### Architecture

- **Fast gate:** `npm run quality:gate:fast`
- **Affected guardrails:** `npm run quality:affected`
- **Browser gate:** `npm run e2e`
- **Mutation gate:** `npm run mutation`
- **Full gate:** `npm run quality:gate`
- **Local workflow:** `npm run ci:local`
- **Local workflow concurrency:** Agent CI job auto-concurrency
- **Local workflow failure mode:** pause failed Agent CI runners for retry
- **Retry command:** `npm run ci:local:retry -- --name <runner-name>`
- **Remote workflow:** `.github/workflows/ci.yml`
- **CI install wrapper:** `scripts/ci-install-dependencies.sh`
- **Action pinning:** every GitHub Actions `uses:` reference must use a full commit SHA
- **Git hook path:** `.githooks/`
- **Hook setup script:** `scripts/setup-git-hooks.mjs`
- **Affected guardrail logic:** `scripts/run-affected-guardrails.mjs`
- **Runtime pin source:** `package.json#engines.node`
- **Package manager hint source:** `package.json#packageManager`
- **Browser runtime image:** `mcr.microsoft.com/playwright:v1.60.0-noble`
- **Coverage gate logic:** `scripts/run-coverage-gate.mjs`
- **Worker client-code guard:** `scripts/assert-no-worker-client-scripts.mjs`
- **Mutation config:** `stryker.config.mjs`
- **Readiness baseline:** `npm run quality:gate` and `npm run ci:local` for non-documentation changes
- **Documentation-only exception:** documentation-only changes may skip `npm run ci:local` when they do not alter executable config, generated artifacts, package metadata, source code, or tests

### Anti-Patterns

- Do not collapse fast and browser verification back into one opaque step without a concrete reason.
- Do not treat colocated tests or test-support files as runtime source code when deciding whether unit coverage is missing.
- Do not weaken the full gate just to make iteration faster.
- Do not treat targeted iteration checks as a replacement for the readiness baseline unless the change is documentation-only and qualifies for the documented Agent CI exception.
- Do not add undocumented workflow write targets for generated output, local state, caches, archives, or tool artifacts.

## Contract

### Definition of Done

- [ ] The fast gate covers formatting, type checking, Worker client-code guardrails, runtime audit, and unit coverage.
- [ ] The affected guardrail path scopes formatting, JavaScript syntax checks, Worker client-code checks, package audit, and unit coverage to affected files when possible.
- [ ] The browser gate covers the Playwright baseline.
- [ ] The mutation gate covers runtime `src/**/*.ts` files with Stryker, Vitest, and TypeScript checking.
- [ ] The full gate runs the fast, browser, and mutation gates in order.
- [ ] The repo-managed `pre-push` hook runs affected-file guardrails before a push leaves the machine.
- [ ] Local and remote CI use the same split verification model for non-documentation changes.
- [ ] Documentation-only changes can skip Agent CI when they do not alter executable behavior or workflow configuration.
- [ ] The spec is updated in the same change set.

### Regression Guardrails

- `npm run quality:gate:fast` must remain a useful faster signal than the full gate.
- `npm run quality:affected` must avoid full-repo work when affected files make a narrower check sufficient.
- `npm run quality:gate` must continue to represent the full baseline verification path.
- `npm run mutation` must fail when the mutation score is below the configured break threshold.
- `npm install` must keep the repo-managed `pre-push` hook configured without requiring extra setup steps.
- The CI workflow must cancel superseded runs for the same ref.
- The CI workflow must read the pinned Node version from `package.json` instead of a separate version file.
- The CI workflow must keep using npm for install and verification steps without depending on one exact npm patch release.
- The npm release used by CI must stay inside the supported npm range declared in `package.json`.
- The CI install wrapper must run plain `npm ci` outside local Agent CI.
- Under local Agent CI, the CI install wrapper must prevent concurrent installs from writing the same warm `node_modules` mount.
- The CI workflow must pin every GitHub Actions `uses:` action reference to a full commit SHA, with any tag information kept only as a comment.
- The browser CI job must use the pinned Playwright container instead of reinstalling Chromium at runtime.
- The coverage gate must only require unit tests when runtime `src/` code exists.
- The coverage gate must work in both the normal workspace and local Agent CI's warmed `node_modules` layout.
- The Worker client-code guard must fail on inline `<script>` tags, inline event-handler attributes, and `javascript:` URLs in Worker/view runtime files.
- The affected guardrail path must pass only affected Worker/view runtime files to the Worker client-code guard.
- The affected guardrail path must run JavaScript syntax checks only for affected JavaScript files.
- The affected guardrail path must run package audit only when package metadata or lockfiles change.
- The affected guardrail path must skip unit coverage when no runtime or unit test files are affected.
- The affected guardrail path may fall back to project-level type checking or coverage when a safe per-file check is not available.
- The repo's local CI scripts should use the repo-pinned `agent-ci` binary directly instead of carrying repo-specific runtime patching.
- The canonical local CI script should rely on the CI install wrapper instead of forcing `--jobs 1` to avoid warmed dependency races on macOS-hosted Docker.
- The canonical local CI script should use pause-on-failure so agents can fix and retry a failed runner without restarting the whole workflow.
- The local verification workflow should document macOS as the supported host baseline instead of implying cross-platform support.
- The Playwright server path must avoid macOS file-watcher exhaustion in local runs without changing the normal `npm run dev` workflow.
- The local CI documentation must cover the no-`origin` case through `.env.agent-ci` and `GITHUB_REPO` instead of treating that warning as normal noise.
- The local CI Docker daemon override must use Agent CI's `AGENT_CI_DOCKER_HOST` variable instead of the general Docker CLI `DOCKER_HOST` variable.
- Local Playwright browser installation should go through a pinned repo script instead of ad hoc `npx playwright install ...` usage.
- Targeted checks may be documented for iteration, but `npm run quality:gate` and `npm run ci:local` remain the readiness baseline for non-documentation changes.
- Documentation-only changes may skip `npm run ci:local` when they do not alter executable config, generated artifacts, package metadata, source code, or tests.
- Mutation testing must exclude colocated tests, end-to-end tests, declarations, and `src/test-support.ts` from mutation.
- Mutation reports must be written under `reports/mutation/`, and Stryker's temporary sandbox must stay under ignored `.stryker-tmp/`.
- New workflow write targets must be documented when they are introduced.

### Verification

- **Automated checks:** `npm run quality:gate` and `npm run ci:local`
- **Local setup check:** `git config --get core.hooksPath` should resolve to `.githooks`
- **Workflow shape:** `.github/workflows/ci.yml` should show separate fast and browser jobs, with repository-shape validation in the fast job

### Scenarios

**Scenario: Contributor wants an affected local signal**

- Given: a change is still being iterated locally
- When: the contributor runs `npm run quality:affected`
- Then: guardrails run against affected files where possible and skip unrelated work

**Scenario: Contributor wants a fast baseline signal**

- Given: a change that does not need immediate browser verification
- When: the contributor runs `npm run quality:gate:fast`
- Then: formatting, typing, audit, and unit coverage run without waiting for Playwright

**Scenario: Full verification before landing code changes**

- Given: a non-documentation change is ready for review or merge
- When: the contributor runs `npm run quality:gate` and `npm run ci:local`
- Then: the fast, browser, and mutation verification paths pass

**Scenario: Documentation-only change**

- Given: a change only edits documentation
- And: it does not alter executable config, generated artifacts, package metadata, source code, or tests
- When: the contributor runs the smallest relevant local checks
- Then: they may skip `npm run ci:local`

**Scenario: Contributor checks test assertion strength**

- Given: runtime `src/**/*.ts` code has colocated unit tests
- When: the contributor runs `npm run mutation`
- Then: Stryker mutates runtime source only and fails if the mutation score is below the configured break threshold

**Scenario: Contributor adds browser behavior to a Worker view**

- Given: a Worker-rendered view needs browser-side behavior
- When: the contributor adds inline executable browser code to `src/worker.ts` or `src/views/**/*.ts`
- Then: the fast quality gate fails and points them toward typed TypeScript modules instead

**Scenario: Contributor pushes with a broken fast gate**

- Given: the repo was bootstrapped with `npm install`
- When: the contributor runs `git push` while the fast gate is red
- Then: the `pre-push` hook runs affected-file guardrails and the push is blocked before remote CI starts

**Scenario: New push supersedes an old CI run**

- Given: a newer push exists on the same ref
- When: GitHub Actions schedules the new workflow run
- Then: the older in-progress run is canceled instead of continuing to consume time

**Scenario: Contributor audits remote action references**

- Given: the remote CI workflow uses reusable GitHub Actions
- When: the contributor reviews `.github/workflows/ci.yml`
- Then: every `uses:` action reference points at a full commit SHA instead of a mutable tag
