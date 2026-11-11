# Development

This document collects development-facing setup and workflow notes for the template.

## Agent Context

The template vendors the ASDLC knowledge base in `.asdlc/`.

- Start with `.asdlc/SKILL.md` for ASDLC concepts, patterns, and practices.
- Use `AGENTS.md` as the Codex-native context anchor for this repo.

## Local CI

This template is set up for the Local CI runner.

### Prerequisites

- Local development in this template targets macOS. The documented commands assume a macOS shell environment and are not maintained as a cross-platform baseline.
- Run `nvm use` before `npm install` or any other development command so your shell uses the Node.js version mirrored in `.nvmrc`, which also keeps the bundled npm release inside the repo's supported npm 11 range.
- Install dependencies with `npm install`.
- Installation configures the repo-managed Git hook path and enables affected-file guardrails unless a different hook path is already configured. In that case the path is preserved and a warning asks the user to integrate the guardrails with their existing hooks.
- The exact Node.js version is pinned in `package.json`, mirrored in `.nvmrc` for `nvm` users, and read directly by CI through `actions/setup-node`.
- The repo requires npm 11 in `package.json` but does not pin one exact patch release. Local development, CI, and platforms such as Cloudflare may use different npm 11 patch versions as long as they stay inside the supported major range.
- Copy `.dev.vars.example` to `.dev.vars` and replace placeholder values when a project needs local secrets.
- Copy `.env.local-ci.example` to `.env.local-ci` when you need machine-local Local CI overrides. Local CI loads that file automatically.
- If your clone has no `origin` remote, set `GITHUB_REPO=owner/repo` in `.env.local-ci` to stop Local CI from warning while inferring the repository name.
- If Local CI needs a non-default Docker socket or daemon, set `LOCAL_CI_DOCKER_HOST=...` in `.env.local-ci`.
- Start a Docker runtime before running Local CI.
- Install the GitHub Actions runner image once with `docker pull ghcr.io/actions/actions-runner:latest`.

The repo pins CLI tooling in `devDependencies`, including Wrangler for Cloudflare-based experiments. Prefer invoking those tools through `npx` or repo scripts so the project version is used instead of a global install.

### Time-sensitive session warm-up

Before a lecture, workshop, release rehearsal, or other time-sensitive local session, warm every slow dependency path from the exact checkout and network you will use:

```bash
nvm use
npm install
npm run playwright:install
npm run capabilities:verify
npm run capabilities:verify:browser
docker pull ghcr.io/actions/actions-runner:latest
npm run ci:local
```

Run this early enough to resolve registry, browser-download, Docker, authentication, and pinned-runtime failures before the session. These commands populate normal npm, Playwright, Docker, and Local CI caches; they do not create a lecture-specific application surface in the template.

If local CI fails with `No such image: ghcr.io/actions/actions-runner:latest`, pull that image manually and re-run the workflow.

If Local CI warns with `No such remote 'origin'`, add `GITHUB_REPO=owner/repo` to `.env.local-ci` and rerun the workflow.

### Commands

- Run the local workflow with Local CI's quiet renderer, structured NDJSON progress, explicit dependency prewarming, parallelism, isolated per-job dependency views, and pause-on-failure using `npm run ci:local`.
- Rebuild the generated stylesheet manually with `npm run build:css`.
- Run the fast local gate with `npm run quality:gate:fast`.
- Run the baseline quality gate with `npm run quality:gate`.
- Run executable capability-kit fast verification directly with `npm run capabilities:verify` when iterating on application kit files and manifests; run the synthetic standard-adopter browser lane with `npm run capabilities:verify:browser`.
- Run the deep local gate with incremental mutation testing using `npm run quality:gate:deep`.
- Run advisory codebase readability diagnostics with `npm run diagnostics:codebase`.
- Run the shipped runtime dependency audit with `npm run security:audit`.
- Start the local Worker with `npm run dev`.
- Install the Playwright browser with `npm run playwright:install`.
- Run end-to-end tests with `npm run e2e`.
- Run unit and integration tests with `npm test`.
- Run tests related to affected runtime or unit test files with `npm run test:affected`.
- Run the unit coverage gate with `npm run test:coverage`.
- Run full mutation tests with `npm run mutation`.
- Run incremental mutation tests with `npm run mutation:incremental`.
- Run the deployment readiness preflight with `npm run preflight`.
- Run TypeScript checks with `npm run typecheck`.
- Run Lighthouse with `LIGHTHOUSE_URL=http://127.0.0.1:8787 LIGHTHOUSE_SERVER_COMMAND="npm run dev" npm run lighthouse`.
- Run JavaScript and TypeScript correctness linting with `npm run lint`.
- Format the repo with `npm run format`.
- Check formatting with `npm run format:check`.
- If a run pauses on failure, fix the issue and resume with `npm run ci:local:retry -- --name <runner-name>`.

`npm run ci:local` combines `--quiet` with `--json`. Quiet mode suppresses the animated terminal renderer; JSON mode independently emits newline-delimited `run`, `job`, `step`, pause, diagnostic, and completion events. This gives an agent continuous machine-readable lifecycle progress and an explicit retry command when a run pauses instead of leaving it to infer state from sparse quiet output. The command also selects `quality-fast`'s stable `install` step with `--prewarm-through`; Local CI runs that step once in a disposable job before parallel jobs receive private writable dependency views.

Agents following this repo's RTK requirement should invoke the workflow as `rtk proxy npm run ci:local` and retries as `rtk proxy npm run ci:local:retry -- --name <runner-name>`. RTK's proxy mode passes the NDJSON stream through live; its normal filtered mode may buffer this output until the command finishes.

### Temporary DTU Dependency Fix

Local CI 0.18.1 uses a patched `dtu-github-actions` archive through the scoped npm override in `package.json`. The override references the explicit root DTU development dependency with `$dtu-github-actions`, allowing npm to resolve the archive consistently during existing-install migrations and fresh installs. The archive removes Zod from DTU's four-value environment configuration parser while preserving its defaults and accepted values. Invalid configuration still fails at startup, now with a plain error identifying the first invalid field. This removes the affected dependency from the resolved DTU tree; it does not suppress audit output or remediate separate `minimatch` findings.

Keep `vendor/dtu-github-actions/` available before `npm install` or `npm ci`, including in Docker build contexts and downstream template copies. The archive is committed, so installs do not need a local build or postinstall patching tool. See its [provenance and rebuild instructions](../vendor/dtu-github-actions/README.md) and [ADR-074](adrs/implemented/ADR-074-vendor-dtu-without-zod.md). Run `node --test scripts/vendor-dtu.test.mjs` for focused installed-package checks; the normal tooling tests include them automatically. Removing Local CI from a downstream project should also remove its override, explicit DTU development dependency, this vendor directory, and those temporary checks.

Revisit the override when updating Local CI. Verify a compatible upstream replacement with a clean install, the configuration cases, `npm audit`, `npm run quality:gate`, and `npm run ci:local`, then remove the override, explicit DTU development dependency, vendor directory, and temporary checks together. Keep historical ADRs and update packs as records of the original decision.

### Readiness Checks

Use targeted checks while iterating, then run the checks that match the change before proposing or landing it:

- Docs-only changes: `npm run format:check`
- JavaScript or TypeScript changes: `npm run lint`
- TypeScript or typed tooling changes: `npm run typecheck`
- Runtime `src/` changes while iterating: `npm run typecheck` and `npm run test:affected`
- Browser behavior or UI changes: `npm run quality:gate`
- Extreme source-file or flat-directory growth: `npm run quality:structure`
- Readability, complexity, duplication, or cleanup review: `npm run diagnostics:codebase`
- Baseline readiness for non-documentation changes: `npm run quality:gate`
- Workflow-sensitive changes or explicit full PR/release readiness: `npm run quality:gate` and `npm run ci:local`

Workflow-sensitive changes include GitHub Actions workflows, package metadata or dependency installation, build or container setup, and browser CI setup. Ordinary source, test, and tooling changes that stay outside those boundaries do not require Local CI. Documentation-only changes should use the smallest relevant checks unless they alter executable instructions or workflow contracts.

`npm run preflight` checks the active Node and npm versions against `package.json`, verifies the repo-pinned Wrangler binary and current authentication, generates binding types into a disposable operating-system temporary directory, and runs `wrangler deploy --dry-run` with automatic provisioning disabled. It does not deploy or create Cloudflare resources, and it suppresses child command output so account identities are not printed in the summary. Existing Wrangler build hooks may still refresh their already documented outputs, such as `.generated/styles.css`.

The starter Worker and Room State verifier use compatibility date `2026-09-04`. Cloudflare enables Node.js compatibility by default for dates on or after `2026-08-04`, so `wrangler.jsonc` deliberately carries both opt-out flags. Local scripts and tests may use Node; the deployed starter Worker does not adopt Node runtime APIs.

The template now ships with a minimal Worker stub in `src/worker.ts`. `npm run dev` starts it on `http://127.0.0.1:8787`, and Playwright uses `npm run e2e:server` on `http://127.0.0.1:8788` so browser tests can run without extra setup. Both commands inherit the user's normal `HOME`; it is not a Wrangler control variable. The e2e server forces Chokidar polling mode to avoid file-watcher exhaustion in macOS-hosted local runs while preserving the normal `npm run dev` developer loop. API modules live under `src/api/`, view modules live under `src/views/`, and tests are colocated under `src/`.

The GitHub Actions CI workflow splits fast checks, browser checks, and mutation checks into separate jobs, reads the pinned Node version from `package.json`, relies on the npm release bundled with that Node setup as long as it satisfies the repo's npm 11 constraint, runs repository-shape validation as part of the fast job, runs the browser job in the version-pinned Playwright container image `mcr.microsoft.com/playwright:v1.65.0-noble`, pins every `uses:` action reference to a full commit SHA, and cancels superseded runs on the same ref. The browser and mutation jobs use `scripts/classify-expensive-ci.mjs` after checkout and skip cache restoration, Node setup, dependency installation, and gate execution when every changed file is in a known non-runtime area such as docs, specs, template update packs, or agent skill material. Unknown paths, missing commit ranges, and classifier failures take the safe path and run the expensive gates. The full `quality-mutation` workflow job is reserved for GitHub Actions with a `github.server_url` guard, so Local CI runs skip it; use `npm run quality:gate:deep` or `npm run mutation` when local mutation feedback is needed. Dependency installation uses plain `npm ci`; Local CI explicitly prewarms through the fast job's stable `install` step, then gives parallel jobs isolated writable `node_modules` views. This prevents cross-job cache races while avoiding duplicate cold installs, unnecessary npm self-upgrades in CI, and mutable action tags.

The starter UI now follows the same Tailwind v4 baseline shape as `thesis-journey-tracker`: Tailwind input lives in `src/tailwind-input.css`, generated CSS is written to `.generated/styles.css`, and Wrangler runs `npm run build:css` automatically before local development.

The Lighthouse setup is also generic, but the Worker stub gives it a concrete local target. Use `LIGHTHOUSE_URL=http://127.0.0.1:8787 LIGHTHOUSE_SERVER_COMMAND="npm run dev" npm run lighthouse`. Reports cover performance, accessibility, best practices, and SEO in mobile and desktop modes and are written to `reports/lighthouse/`. Configure the performance floor with `LIGHTHOUSE_MIN_PERFORMANCE_SCORE` and the other category floors with `LIGHTHOUSE_MIN_QUALITY_SCORE`.

Playwright `1.65.0` and its matching CI image passed screenshot tracing and full mobile and desktop Lighthouse audits with screenshots enabled in a Linux ARM64 container on a macOS ARM64 host. Playwright `1.63.0`'s Chromium had crashed when screenshot tracing started, as documented in [ADR-068](adrs/implemented/ADR-068-verify-browser-screenshot-tracing.md). `src/browser-tracing.e2e.ts` guards both the headless shell and full Chromium through the normal browser gate, reading screenshot events in memory without adding report files. Before refreshing Playwright again, run this regression and full mobile/desktop Lighthouse audits in the matching Linux ARM64 image with screenshots enabled; disabling screenshot collection does not verify the audit runtime.

The Vitest setup is generic as well. `vitest.config.ts` targets colocated `src/**/*.test.ts` files while excluding `src/**/*.e2e.ts`. The default `npm test` command uses `--passWithNoTests` so the template remains usable before a project adds its first test file.

The coverage gate is stricter than the basic test run. `npm run test:coverage` measures the root Node-oriented runtime `src/**` code with the V8 provider, writes reports to `reports/coverage/`, and enforces high thresholds once a project actually has `src/` code. Worker-runtime Vitest projects use Istanbul because native V8 coverage is unsupported there. When the Browser Static Assets kit is installed, `src/browser/**` is excluded from unit coverage and owned by mandatory Playwright coverage. Colocated unit tests, end-to-end tests, and test-support files do not count as source files for the gate's skip-or-fail logic. `npm run test:affected` runs Vitest related tests for affected runtime files and directly runs affected unit test files. It falls back to `npm run test:coverage` when affected files include test environment inputs or when affected runtime files have no related tests.

Mutation testing uses Stryker with Vitest and the TypeScript checker. `npm run mutation` performs a full mutation run against runtime `src/**/*.ts` files while excluding declarations, unit tests, end-to-end tests, and `src/test-support.ts`. `npm run mutation:incremental` enables Stryker incremental mode so repeated deep local runs can reuse previous mutant results while still producing a complete mutation report. The Vitest runner uses Stryker's per-test coverage analysis and related-test narrowing, so each mutant runs against the tests Stryker can associate with the mutated file instead of blindly rerunning the whole suite. Stryker worker concurrency is set to `50%` so local mutation testing can use parallel workers without assuming a fixed core count or monopolizing a developer machine. The isolated GitHub mutation job overrides this with `--concurrency 100%` to use the runner fully and shorten the workflow critical path. Mutation reports and Stryker incremental data are written under `reports/`, and Stryker's temporary `.stryker-tmp/` sandbox must stay untracked.

The TypeScript setup is generic too. `tsconfig.json` covers repo-level `.ts` files and `src/**/*.ts`, and `npm run typecheck` runs TypeScript 7. During the TypeScript 7.0 transition, `typescript` is intentionally pinned to the `@typescript/typescript6` compatibility package for tools that import the compiler API, while `typescript-7` provides the compiler used by the typecheck script.

Vitest and its coverage providers are aligned at `5.1.0`; the Room State kit's `@cloudflare/vitest-plugin` `1.7.0` and Stryker Vitest runner `10.1.1` support that major. Keep those packages aligned when updating capability manifests and installation recipes. The Room State kit declares no Containers; plugin `1.7.0` starts any Containers an adopting project configures, as described in the [kit's installation recipe](../.capabilities/room-state/recipes/npm.md). Playwright's package and browser CI image must also move together. A full `npm audit` checks development tooling that the normal shipped-runtime audit omits.

Oxlint provides the baseline JavaScript and TypeScript correctness lint. `npm run lint` uses Oxlint's default rules, treats warnings as failures, and stays separate from both Prettier formatting and TypeScript project checking. The affected-file guardrail scopes Oxlint to changed JavaScript and TypeScript files during iteration and pre-push checks.

`npm run format:check` enables Prettier's content-based cache at `.cache/prettier`. Repeated checks skip unchanged files while content hashing keeps the result safe across branch switches and timestamp changes. The cache is disposable, ignored local state; remove it when measuring a cold formatting run. CI does not restore this cache, so every clean runner still performs a cold check.

Prettier formats project-owned code and documentation. The committed `.prettierignore` excludes duplicated `.github/skills/` content and vendored `.codex/skills/**/references/` material so the fast gate does not repeatedly format externally maintained skill documentation. Project-owned skill entry points remain in the formatting baseline.

Fallow provides advisory codebase readability diagnostics. `npm run diagnostics:readability` runs a changed-code audit for complexity, duplication, dependency hygiene, and cleanup findings while relaxing CRAP-score noise from untested tooling scripts. `npm run diagnostics:health` reports whole-repo health scoring, hotspots, refactoring targets, and advisory public-signature type coupling. `npm run diagnostics:codebase` runs both. These commands use Fallow's best-effort type-aware mode for exact-symbol evidence while leaving compiler diagnostics to `npm run typecheck` and local lint rules to Oxlint.

`npm run quality:structure` scans production JavaScript and TypeScript under the roots configured in `.architecture-check.json`. It fails when a non-exempt source file exceeds 1,000 lines or one directory contains more than 40 direct source files. These intentionally generous limits are smoke alarms: use `$architecture-review` and the Fallow diagnostics to evaluate ownership before expanding the capability. Intentional exceptions must name the exact file or directory and include a rationale in the config.

`npm run diagnostics:map` generates a read-only interactive treemap and import graph at `.fallow/codebase-map.html`; open that file in a browser after generation. All diagnostic commands use `--no-cache`. The map is the only normal diagnostic artifact, and its ignored `.fallow/` location also contains any caches contributors create with manual Fallow commands.

The project Fallow config ignores `typescript-7` because the typecheck script executes that aliased compiler directly from `node_modules` rather than importing it, and ignores the Stryker API package referenced only through tooling JSDoc types.

The README includes a committed application screenshot at `docs/screenshots/home.png`. Refresh that asset manually when the starter UI changes materially, but keep screenshot capture out of the automated development loop, CI, and remote workflows.

Template update packs live under `.template/updates/`. Use them to port later template maintenance changes into projects that already use this template or one of its capability kits. Each pack has metadata, a migration guide, and a focused patch to try first; when the patch does not apply cleanly, use the guide to adapt the change to the target project's conventions.

## External-Service Evaluation and Timing

Use the [feature spec](../specs/README.md#external-service-features) to set application-specific quality, latency, and reliability criteria before integrating an external service. The template supplies conventions, not a default number of seconds, telemetry service, or shared timing abstraction.

### Evaluate Before Building the Full Interaction

Exercise a small representative set through the intended dependency path early: ordinary requests, larger valid requests, and plausible failure cases. Use synthetic or otherwise approved evaluation inputs. Keep live evaluation deliberate and outside CI; use fake dependencies for repeatable failure and timeout checks without paid calls.

Record a compact summary in the feature spec's verification notes: request classes, environment and relevant non-secret configuration, sample size, output-quality assessment, total and dependency durations, errors, timeouts, and fallback counts. Include slow and failed attempts instead of reporting only successful requests. Report the observed range and median for a small sample; use tail percentiles only with enough observations to support them, recording sample size and limitations. Compare failure/timeout/fallback rates against the stated denominator and target. A handful of fast successes does not establish production reliability.

Use that evidence to decide whether to proceed, adjust the interaction or service configuration, or stop. Successful output that misses the agreed latency budget does not pass acceptance. Recheck the complete user interaction before accepting the feature, including network transfer and rendering when the budget covers them. Keep evaluation summaries free of prompts, responses, credentials, and personal data. Model selection, token limits, streaming, and caching stay application specific.

### Budgets, Timeouts, and Deadlines

An expected latency budget defines acceptable completion time under the spec's workload and measurement rule. It may be shorter than the hard request deadline. Document what the user sees after the target is missed, even if the request can still complete, and do not silently relax the target to match slow observations.

A dependency timeout limits one external operation or attempt. State whether it covers connection, response headers, and body consumption; a headers-only timeout does not bound completion. An overall request deadline limits the complete application request, including input handling, all dependency attempts, retry delays, validation, and response preparation. Give each attempt at most the remaining time and reserve time for finishing the response; retries must not reset the overall deadline.

At a timeout or deadline, stop awaiting the result, request cancellation where supported, and complete the specified fallback/error behavior. Cancellation alone is insufficient if a dependency ignores it. Prevent late results from replacing the completed response or changing a UI that has already timed out. Stopping the wait does not prove remote work or side effects stopped; define retry safety in the feature contract. Specify how loading ends and whether a user can retry. Verify these paths using fake dependencies and controlled time, including slow success, a never-settling dependency, and several individually permitted stages or retries that together exceed the request deadline.

### Privacy-Safe Timing Conventions

Measure elapsed durations with a monotonic clock within one execution context. Record a total-request duration from application entry until response preparation finishes or the request fails/times out, plus meaningful stages such as input validation, each external attempt (through response consumption), output validation, and response rendering. Document the boundaries in the feature spec. Measure client submission-to-usable-result separately when that is the acceptance metric; do not subtract timestamps from different clocks.

Record the clock's resolution and runtime limitations. In deployed Cloudflare Workers, clocks such as `performance.now()` and `Date.now()` advance only after I/O, so CPU-only stages can report zero and request timings can omit final CPU work; see [Cloudflare's Performance documentation](https://developers.cloudflare.com/workers/runtime-apis/performance/). Zero does not prove the absence of application overhead. Use existing platform CPU/invocation evidence or local profiling to investigate CPU stages, and independent end-to-end measurements for the user-facing budget.

Use structured completion records through the application's existing logging or diagnostic path. Emit them for success, error, cancellation, and timeout paths, with these allowlisted fields:

| Field         | Convention                                                                                                                                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operation`   | Fixed, low-cardinality name such as `request.total`, `dependency.generate`, or `response.validate`; never derived from user input or a URL.                                                                                                                   |
| `duration_ms` | Non-negative elapsed milliseconds for the named operation, including failed or timed-out attempts up to their termination.                                                                                                                                    |
| `outcome`     | Bounded value such as `success`, `error`, `timeout`, `cancelled`, or `fallback`; no raw exception text.                                                                                                                                                       |
| `timed_out`   | Boolean indicating whether this operation's own timeout/deadline fired. A recovered dependency timeout is true on that dependency record; a completed fallback before the request deadline has outcome `fallback` and `timed_out: false` on the total record. |

For example, a synthetic completion record is `{"operation":"dependency.generate","duration_ms":2000,"outcome":"timeout","timed_out":true}`. The duration illustrates the format, not a template timeout default.

Never include prompts, response bodies, credentials, headers, query strings, personal data, user/session identifiers, or raw errors in timing records. Use an existing opaque request correlation mechanism when available to associate stages with their total; never derive correlation values from payloads or identities. During a small local evaluation, collecting stage durations in one per-request summary also avoids mixing concurrent requests. Do not create a new persistent log store or artifact directory for this convention; follow existing documented write boundaries and retention/access settings.

### Distinguish Dependency Time from Application Overhead

Compare total and stage durations from the same request, accounting for the clock limitations above. With a clock that measures the full elapsed interval and sequential, non-overlapping dependency waits, total request time minus those waits shows time outside the dependencies: application work, scheduling, and uninstrumented gaps. Time validation and rendering explicitly where the runtime permits, using profiling when necessary. Dependency duration includes transport and response reading as observed by the application; it is not proof of the provider's internal execution time.

Do not sum nested or overlapping spans and subtract them from the total. With parallel calls, use their covered wall-time intervals or inspect the critical path, counting overlapping time once. Keep retries and backoff visible: attempt durations show dependency waits, while backoff consumes the request budget without being provider execution. If the total is slow while dependency waits are short, inspect application stages and gaps; if waits dominate, investigate the dependency path. Compare server timing with separate end-to-end measurements to locate transfer or browser overhead. Missing or sampled records are unknowns, not zero-duration operations.

## Write Boundaries

Keep workflow write targets explicit and documented. Generated CSS belongs in `.generated/`, Prettier's disposable content cache belongs in `.cache/prettier`, Lighthouse reports belong in `reports/lighthouse/`, coverage reports belong in `reports/coverage/`, mutation reports belong in `reports/mutation/`, Stryker temporary sandboxes belong in `.stryker-tmp/`, optional Fallow caches and the generated codebase map belong in ignored `.fallow/`, Local CI caches belong under Local CI's managed cache directory, preflight inspection artifacts belong in its disposable operating-system temporary directory, template update packs belong in `.template/updates/`, the committed README screenshot belongs in `docs/screenshots/`, and local secrets belong in untracked files such as `.dev.vars` or `.env.local-ci`.

The reviewed DTU archive, patch, and provenance documentation are committed under `vendor/dtu-github-actions/`. Regeneration uses disposable operating-system temporary directories; only the verified replacement archive is copied into this documented vendor target.

When adding a new tool or workflow that writes files, document the target path in the same change and prefer ignored local output unless the artifact is intentionally reviewed.

## Security Baseline

The template keeps secret handling lightweight and explicit:

- Keep local secrets in untracked files such as `.dev.vars` or `.dev.vars.production`. The ignore rules also cover environment-specific `.env` files.
- Commit only the explicitly allowed example files, such as `.dev.vars.example` and `.env.local-ci.example`, with placeholder values only.
- Treat `npm run security:audit` as part of the baseline gate for shipped runtime dependencies.

## Quality Gate

Use this expectation for routine changes:

- `npm run quality:gate` must pass before a change is considered ready.
- Use `npm run quality:gate:fast` for quicker local iteration when browser coverage is not the immediate focus.
- `npm run ci:local` should also pass when the change is workflow-sensitive or the user asks for full PR or release readiness.
- When configured, the repo-managed `pre-push` hook runs `npm run quality:affected` automatically, so pushes stop locally when affected guardrails are already red.

The baseline quality gate runs the fast gate, Playwright browser tests, and executable capability-kit verification. The capability phase copies each supported kit into its own operating-system temporary Worker, installs only its manifest-declared test dependencies plus the repository-pinned verification toolchain, generates binding types, type-checks, runs the kit tests, and removes the fixture. It therefore requires npm registry access, but writes no generated application files into the repository. The explicit `quality:gate:deep` command adds incremental mutation testing for local assertion-strength feedback. Both commands print named phase transitions and an elapsed-time heartbeat every 30 seconds while a phase is still running, while preserving each child command's live output. GitHub Actions runs separate fast, browser, and full mutation jobs, with repository-shape validation and capability verification included in the fast job. Local CI runs should go through `npm run ci:local`, which prewarms through one stable install step before independent jobs run concurrently with isolated writable dependency views. The command emits structured lifecycle progress and pauses a failed runner for agent retry. Local browser installation should go through the pinned `npm run playwright:install` script.

## Skill Validation

After creating or updating a skill, run:

```bash
npm run skill:validate -- .codex/skills/modern-web-guidance
```

The repository-owned validator uses the existing Node setup and pinned `yaml` dev dependency; PyYAML is unnecessary. It checks `SKILL.md` frontmatter and unfinished placeholders. Review `agents/openai.yaml` and behavioral quality separately. Tests use disposable OS temporary directories and remove them afterward; the validator creates no artifacts. Run its CLI regression tests with `node --test scripts/validate-skill.test.mjs` (also included in `npm run test:tooling`).
