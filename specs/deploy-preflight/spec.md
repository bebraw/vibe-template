# Feature: Deploy Preflight

## Blueprint

### Context

The template has a reliable local quality gate, but deployment can still fail late because the active runtime differs from the repository contract, Wrangler is unavailable or unauthenticated, bindings cannot generate types, or the Worker cannot produce a deployment bundle.

### Architecture

- **Capability source root:** `scripts/run-preflight.mjs` and its colocated Node test
- **Composition root:** the `preflight` script in `package.json`
- **Entry point:** `npm run preflight`
- **State authority:** `package.json` owns Node/npm requirements; the repo-pinned Wrangler binary and `wrangler.jsonc` own platform configuration; preflight results are ephemeral
- **Public contracts:** a six-check pass/fail summary and process exit status
- **Dependency direction:** preflight may inspect package metadata and invoke the repo-pinned Wrangler; runtime Worker code does not depend on preflight

### Out of Scope

- Deploying, provisioning, migrating, or changing any Cloudflare resource.
- Validating application-specific production data, prompts, seed choices, or secrets.
- Replacing the baseline quality gate or Local CI.

### Anti-Patterns

- Do not print `wrangler whoami --json` output, account identities, or environment values.
- Do not enable Wrangler automatic provisioning during the deploy dry run.
- Do not persist generated binding declarations or dry-run bundles from preflight.
- Do not treat a successful dry run as authorization to deploy.

## Contract

### Definition of Done

- [ ] Active Node matches `package.json#engines.node` exactly.
- [ ] Active npm satisfies the supported major range in `package.json#engines.npm`.
- [ ] The repo-pinned Wrangler binary runs and reports an authenticated identity without exposing it in preflight output.
- [ ] Wrangler can generate environment types from declared bindings into a disposable temporary directory.
- [ ] Wrangler can compile a deploy bundle with dry-run mode and automatic provisioning disabled.
- [ ] The command exits nonzero and prints one actionable hint for every failed check.
- [ ] Temporary preflight files are removed after success or failure.

### Regression Guardrails

- Every independent check runs even when an earlier check fails so one invocation reports the complete readiness picture.
- Child stdout and stderr remain captured rather than copied into the summary.
- Wrangler telemetry is disabled for the command.
- Existing configured build hooks may use their already documented outputs; preflight itself introduces no repository-local write target.
- The preflight command remains separate from `npm run quality:gate` because authentication is machine-specific and may require network access.

### Verification

- **Unit tests:** `node --test scripts/run-preflight.test.mjs`
- **Repository readiness:** `npm run quality:gate` and, because `package.json` changes, `npm run ci:local`
- **Manual operational check:** `npm run preflight` in an authenticated environment using the pinned Node/npm baseline

### Scenarios

**Scenario: Deployment environment is ready**

- Given: the active runtime matches `package.json`, dependencies are installed, Wrangler is authenticated, bindings parse, and the Worker bundles
- When: the contributor runs `npm run preflight`
- Then: all six checks pass without deploying or provisioning anything

**Scenario: Authentication is missing**

- Given: local configuration and bundling are valid but Wrangler has no authenticated account or token
- When: the contributor runs `npm run preflight`
- Then: authentication fails with a login/token hint, local binding and bundle checks still run, and the command exits nonzero

**Scenario: Runtime drift exists**

- Given: Node or npm differs from the package contract
- When: the contributor runs `npm run preflight`
- Then: the summary identifies the active versions and the required correction while continuing the Wrangler checks
