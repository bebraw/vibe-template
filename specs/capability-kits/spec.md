# Feature: Capability Kits

## Blueprint

### Context

The template is useful both as a starter repo and as a source of specific practices that can be applied to existing projects. Contributors and agents need a lightweight way to transfer one capability, such as Local CI, without copying unrelated template structure.

### Architecture

- **Kit root:** `.capabilities/`
- **Kit layout:** `.capabilities/{capability-name}/`
- **Required overview:** `README.md`
- **Required manifest:** `manifest.json`
- **Copyable files:** `files/`
- **Package-manager recipes:** `recipes/`
- **Validation notes:** `checks.md`
- **Available kits:** `typescript-setup`, `local-ci`, `quality-gate`, `mutation-testing`, `pre-push-quality-gate`, `readme-screenshot`, `lighthouse-performance`, `website-baseline`, `engineering-quality-skills`, `workers-ai`, `room-state`, `progressive-interaction`, `browser-static-assets`, `deployment-safety`
- **Third-party skill provenance:** vendored skills retain their license, upstream repository, and reviewed revision in the copyable files.
- **Optional adjacent setup:** capability kits may include prompted optional steps for prerequisites such as GitHub Actions workflows.
- **Negotiation prompt:** `.capabilities/README.md` includes a prompt-style UI for selecting capabilities before editing a target repo.
- **Later maintenance sync:** template update packs under `.template/updates/` cover follow-up changes to projects that already adopted a kit.
- **Executable verification owner:** `scripts/verify-capability-kits.mjs` materializes supported application kits into independent disposable Workers.
- **Verification composition root:** each kit manifest supplies copyable files, exact test dependencies, and any replaced development dependencies; isolated fixtures receive the repository-pinned Wrangler, TypeScript, generated binding config, and a minimal Worker entrypoint, while one fully synthetic standard adopter composes Quality Gate, Room State, Browser Static Assets, Progressive Interaction, and mocked Workers AI without copying replaceable starter application files.
- **Verification state authority:** manifests own kit dependency declarations; generated types, installed packages, and materialized source live only in operating-system temporary directories that are removed after each run.
- **Verification public contract:** `npm run capabilities:verify` generates binding types, type-checks, and runs isolated kit tests plus the standard adopter's composed build, Istanbul unit coverage, Worker client guard, and deploy dry run. The standard adopter's Worker tests disable remote bindings and use a derived test-only Wrangler configuration that omits the mocked AI binding; `npm run capabilities:verify:browser` runs the shared standard adopter's Playwright checks from the browser gate.
- **Verification dependency direction:** the root verifier reads kit manifests and files; kit code does not depend on root application source or the root Vitest configuration.

#### Workers AI Kit

- **Capability source root:** `.capabilities/workers-ai/`
- **Target composition root:** the adopting Worker's request handler creates a runner from its generated `Env` binding and injects it into feature code
- **State authority:** `wrangler.jsonc` owns `AI` and `AI_MODEL`; the committed generated environment declaration owns their compile-time shape; the adopting feature owns prompts, schemas, validators, and deterministic fallbacks
- **Public contracts:** `WorkersAiRunner`, `runStructuredAi`, a strictly raced positive finite timeout, its discriminated model/fallback result, and the mock runner
- **Dependency direction:** feature code may depend on the small runner contract; only the Worker composition boundary depends on the generated Workers AI binding

#### Room State Kit

- **Capability source root:** `.capabilities/room-state/`
- **Target composition root:** the adopting Worker exports `RoomState`, routes `/rooms/:roomId` through `handleRoomRequest`, and places application authorization before seed/reset calls
- **State authority:** one SQLite-backed Durable Object selected by `ROOM_STATE.getByName(roomId)` owns predefined choices, pseudonymous replaceable votes, open/locked status, and the monotonic revision; aggregate counts and participant selection are derived from that database
- **Public contracts:** room choice/status/snapshot/vote result types, participant-aware `RoomState` RPC methods, conventional HTML GET/POST semantics, strict vote-origin validation, configurable voter-cookie lifetime, and authorized seed/reset/status helpers
- **Dependency direction:** Worker routing and administration composition depend on the room RPC contract; room state does not depend on browser enhancement or application-specific choices

#### Progressive Interaction Kit

- **Capability source root:** `.capabilities/progressive-interaction/`
- **Target composition root:** an existing typed browser entrypoint installs the delegated form enhancer; the server's conventional route remains the authoritative workflow
- **State authority:** the server-rendered URL and HTML response remain canonical; browser history stores only an enhancement marker and current URL
- **Public contracts:** `data-progressive-form`, `data-progressive-target`, `data-progressive-fragment`, optional `data-progressive-focus`, and the `installProgressiveForms` entrypoint
- **Dependency direction:** the browser module depends on semantic form/fragment markup and returned HTML; server behavior must not depend on the browser module

#### Browser Static Assets Kit

- **Capability source root:** `.capabilities/browser-static-assets/`
- **Target composition root:** the adopting Worker's document renderer references `public/assets/browser-entry.js`, while the application-level `build` script composes existing build steps with the browser compiler and Wrangler routes `/assets/*` through static assets
- **State authority:** typed source under `src/browser/` is authoritative; `public/assets/` is disposable generated output and `public/_headers` is authored static-response configuration
- **Public contracts:** the composed `build`, `build:browser`, `watch:browser`, the external module URL, `data-browser-module="ready"`, the Wrangler assets/build fragment, and static-response headers
- **Dependency direction:** feature installers may be imported by the browser entrypoint; server-rendered core behavior must remain usable without the emitted module, and Worker routes must not depend on browser state

#### Deployment Safety Kit

- **Capability source root:** `.capabilities/deployment-safety/`
- **Target composition root:** package scripts call the copyable deployment wrapper, which invokes only the target's pinned Wrangler executable
- **State authority:** Cloudflare owns uploaded versions and active deployment traffic; the review runbook owns the exact candidate, prior active version, approval result, and rollback target
- **Public contracts:** `deploy`/`deploy:preview`, `deploy:status`, `deploy:promote -- <version-id>`, `deploy:rollback -- <version-id>`, `WORKER_PREVIEW_ALIAS`, optional validated `WORKER_ENVIRONMENT`, and `DEPLOY_MESSAGE`
- **Dependency direction:** deployment orchestration may depend on the pinned Wrangler CLI and preflight; application runtime and capability code must not depend on deployment wrapper state

### Anti-Patterns

- Do not make capability kits hidden automation that rewrites target repos without review.
- Do not add adjacent capabilities such as GitHub Actions workflows without asking the user first.
- Do not apply a capability bundle to a target repo before the user approves the selected capabilities.
- Do not assume the target repo has the same package manager, docs structure, workflow names, or architecture rules as this template.
- Do not include secrets or machine-local values in copyable files.
- Do not let kit instructions drift from the template's own current implementation.
- Do not use capability kits as the only record for later maintenance changes that should be synced into projects that already adopted the capability.
- Do not present version preview URLs as available or isolated for Workers with Durable Objects, Containers, or Sandbox.

## Contract

### Definition of Done

- [ ] Each capability kit has a README explaining purpose, fit, poor fit, and apply steps.
- [ ] Each capability kit has a manifest with dependencies, scripts, files, docs, and verification commands.
- [ ] Copyable files live under `files/` using their target relative paths.
- [ ] Package-manager-specific steps live under `recipes/`.
- [ ] Optional adjacent setup steps include an explicit prompt before changing the target repo.
- [ ] The capability index includes a prompt-style selection UI for negotiating which kits to pull into another project.
- [ ] Validation steps live in `checks.md`.
- [ ] Durable docs mention capability kits as a supported partial-upgrade path.
- [ ] Executable application kits are verified as independent adopter Workers by the baseline quality gate and CI.

### Regression Guardrails

- Capability kits must remain lightweight and reviewable.
- Capability kits must preserve target-project conventions by default.
- Capability kit files must not contain secrets or local machine values.
- Recipes for exact manifest versions must use the package manager's exact-save
  mode so applying a kit does not silently widen dependency ranges.
- Optional adjacent setup must be opt-in when it adds a new target-project capability.
- The negotiation prompt must instruct agents to inspect the target repo, present recommended capabilities with trade-offs, and wait for approval before editing files.
- The TypeScript setup kit must keep its dependency, `typecheck` script, `tsconfig.json`, and optional CSS declaration guidance aligned with this repo's current TypeScript setup.
- The Local CI kit must keep its dependency and command guidance aligned with this repo's `package.json` and `.codex/skills/local-ci/SKILL.md`.
- The Local CI kit must configure structured lifecycle output alongside quiet rendering so agents can monitor local workflow progress without animated terminal output.
- The Local CI kit must rely on current Local CI warm-cache serialization instead of reintroducing a repo-local install-lock pattern for npm workflows.
- The quality-gate kit must keep the coverage gate script aligned with `scripts/run-coverage-gate.mjs`.
- The mutation-testing kit must keep its Stryker config aligned with `stryker.config.mjs`.
- The pre-push quality-gate kit must keep the hook setup aligned with `.githooks/pre-push` and `scripts/setup-git-hooks.mjs`.
- The README screenshot kit owns its copyable screenshot script because the template baseline no longer ships that script; the Lighthouse kit must keep its script aligned with `scripts/run-lighthouse.mjs` and audit performance, accessibility, best practices, and SEO.
- The website baseline kit must separate universal browser requirements from public-site and feature-dependent requirements, and must keep emerging agent-readiness conventions opt-in.
- The engineering quality skills kit must keep its copyable `correctness-review`, `test-review`, and `debug` skills aligned with the project-local versions and preserve upstream MIT attribution.
- The Workers AI kit must use generated `Env` types at the binding boundary, require runtime validation even when JSON Schema is requested, distinguish timeout/binding/validation fallbacks, reject non-positive or non-finite timeouts, and enforce its deadline even when a runner ignores `AbortSignal`. It must contain no application prompts or schemas and emit redacted start/finish events without prompts, schemas, raw output, fallback values, or exception text.
- The Room State kit must use one SQLite-backed Durable Object per deterministic room id, accept votes only for seeded choices, replace rather than duplicate a voter's prior choice, and keep seed/reset behind an application-owned authorization check.
- The Room State kit must bound buffered form bodies and store only a per-room digest of its opaque first-party voter cookie. It must not claim cryptographic ballot secrecy or authenticated identity.
- The Room State kit must reject vote POSTs without a same-origin or explicitly allowlisted `Origin`, default new voter cookies to eight hours, and bound configured cookie lifetimes.
- The Room State kit must use `@cloudflare/vitest-plugin` and Istanbul for Worker-runtime coverage, replacing the retired pool package and native V8 provider when they are present in an adopter.
- Room snapshots must include open/locked status, a monotonic revision, and only the requesting participant's current selection. Locked rooms must reject votes without advancing their revision.
- Room resets must emit a structured changed/unchanged event with removed count and resulting revision, without room or voter identifiers.
- The Progressive Interaction kit must leave unmarked, cross-origin, unsupported-method, text/plain, and GET-with-file forms on the native path; enhancement failure must return to native submission.
- The Progressive Interaction kit must keep conventional forms functional without JavaScript and include a JavaScript-disabled browser scenario. URL, history, and focus must remain coherent on the enhanced path.
- The Progressive Interaction kit must remain independently selectable from Room State until a later explicit decision promotes it into the core template or another kit.
- The Browser Static Assets kit must use native ES modules, keep stable unhashed module names on revalidated caching, keep Worker application routes authoritative, and document `public/assets/` as generated output.
- The Browser Static Assets kit must not replace an established client pipeline or imply that `_headers` affects Worker-generated responses.
- The Browser Static Assets kit must route Wrangler and Workers Builds through a composed application-level `build` script that preserves every existing build step and watch root.
- The Browser Static Assets kit must exclude `src/browser/**` from unit coverage only when Playwright remains mandatory in the full quality gate.
- Progressive Interaction must include JavaScript-enabled browser coverage for fragment replacement, URL, focus, and Back/Forward behavior in addition to its no-JavaScript scenario.
- Executable verification must keep the standard adopter synthetic, mock Workers AI without remote binding access, omit the AI binding from its derived test-only Wrangler configuration, preserve quality-gate thresholds, and prove that build output, unit coverage, the client-script guard, browser behavior, and deploy packaging work together.
- Deployment Safety must leave traffic unchanged during preview upload, require exact version IDs for non-interactive promotion and rollback, and emit structured operation logs without credentials or environment contents.
- Deployment Safety must append `--env` consistently to preview, status, promotion, and rollback when `WORKER_ENVIRONMENT` contains a validated lowercase environment name.
- Deployment Safety must document that preview URLs are public unless protected, preview logs are unavailable, preview requests may reach production bindings, and connected resources are not rolled back with code.
- Reusable follow-up changes to a capability kit must add or update a `.template/updates/` pack in the same change set.
- Executable verification must reject manifest paths outside the kit or fixture, reject toolchain version conflicts, remove temporary Workers after each run, and fail when generated bindings, type checking, kit tests, or composed starter/browser builds fail.
- Each executable kit manifest must declare the exact development dependencies required by its copied tests; another kit or the root repository must not satisfy undeclared test dependencies accidentally.
- A kit that commits `worker-configuration.d.ts` must include `npm run types:check` in its normal verification contract, and executable verification must prove the freshly generated declaration is stable.

### Verification

- **Repo check:** `npm run quality:gate`; add `npm run ci:local` only when a kit change crosses a workflow-sensitive boundary
- **Executable kits, fast lane:** `npm run capabilities:verify`
- **Synthetic standard adopter, browser lane:** `npm run capabilities:verify:browser`
- **Manifest parse:** `node -e "JSON.parse(require('node:fs').readFileSync('.capabilities/local-ci/manifest.json', 'utf8'))"`
- **Docs check:** `rg "capability kits|\\.capabilities|Local CI Capability Kit"`

### Scenarios

**Scenario: Agent applies Local CI to another npm repo**

- Given: an npm repo with a GitHub Actions workflow
- When: the agent follows `.capabilities/local-ci/recipes/npm.md`
- Then: the target repo gains the pinned Local CI dependency, local CI scripts with structured progress, local env example, Codex skill, and validation path

**Scenario: Target repo has no GitHub Actions workflow**

- Given: a target repo has no `.github/workflows/*.yml` or `.github/workflows/*.yaml` files
- When: the agent applies the Local CI capability kit
- Then: the agent asks whether to add a minimal GitHub Actions workflow before creating one

**Scenario: Target repo differs from this template**

- Given: the target repo has different docs or workflow names
- When: the agent applies a capability kit
- Then: the agent merges the kit into the existing conventions instead of overwriting unrelated structure

**Scenario: Kit drift is introduced**

- Given: this repo changes its Local CI setup
- When: the Local CI kit still documents the old command or dependency
- Then: the quality review treats the kit as stale and updates it in the same change set

**Scenario: Executable kit is incompatible in isolation**

- Given: a kit omits a test dependency, its generated binding shape drifts, or its copied application no longer type-checks
- When: `npm run capabilities:verify` materializes that kit into a disposable Worker
- Then: verification fails without depending on root application source or leaving generated files in the repository

**Scenario: Standard adopter capabilities conflict**

- Given: a typical Worker combines the quality gate, room state, browser assets, progressive interaction, and mocked Workers AI
- When: the fast and browser capability-verification commands materialize the synthetic standard adopter in their respective gates
- Then: its build, generated types, TypeScript, Istanbul coverage, client-script guard, Playwright flow, and deploy dry run all pass without remote AI access, remote-AI test warnings, or copied starter views

**Scenario: Generated bindings drift in an adopter**

- Given: an adopting project commits `worker-configuration.d.ts`
- When: its normal quality gate runs after Wrangler bindings, variables, flags, migrations, or compatibility date change
- Then: `npm run types:check` fails until the declaration is regenerated and reviewed

**Scenario: Contributor chooses a narrow upgrade**

- Given: another repo only needs local README screenshot refresh
- When: the agent applies `.capabilities/readme-screenshot/`
- Then: the target repo receives screenshot tooling without inheriting Local CI, hooks, Lighthouse, or the Worker starter

**Scenario: Contributor only needs TypeScript checking**

- Given: another npm repo wants strict TypeScript checking but not the full quality gate
- When: the agent applies `.capabilities/typescript-setup/`
- Then: the target repo receives TypeScript dependencies, a `typecheck` script, a mergeable `tsconfig.json`, and optional CSS import declaration guidance

**Scenario: Contributor adds assertion-strength checks**

- Given: another npm TypeScript repo uses Vitest and has meaningful unit tests
- When: the agent applies `.capabilities/mutation-testing/`
- Then: the target repo receives Stryker dependencies, a mutation script, mergeable Stryker config, report output guidance, and validation steps

**Scenario: Contributor is unsure which kits to apply**

- Given: another repo may benefit from multiple capabilities
- When: the agent uses the negotiation prompt from `.capabilities/README.md`
- Then: the agent inspects the target repo, presents a checkbox-style capability pull plan, and waits for approval before editing files

**Scenario: Browser project needs an owned web baseline**

- Given: another repo serves HTML but has no durable standards-based web quality contract
- When: the agent applies `.capabilities/website-baseline/`
- Then: the target repo receives a checklist whose conditional requirements are classified before enforcement and whose emerging agent conventions remain opt-in

**Scenario: Consumer adopts focused engineering workflows**

- Given: another repo uses coding-agent skills and wants stronger behavioral review and debugging guidance
- When: the agent applies `.capabilities/engineering-quality-skills/`
- Then: the target repo receives correctness review, test review, and debug skills with source metadata and MIT attribution, without runtime dependencies

**Scenario: Worker adds bounded structured inference**

- Given: a Cloudflare Worker has a feature-owned prompt, JSON Schema, runtime validator, and deterministic fallback
- When: the agent applies `.capabilities/workers-ai/`
- Then: the target receives a generated-type AI binding adapter, configurable model, timeout, explicit model/fallback result, and network-free mock runner without inheriting lecture content

**Scenario: Room receives replaceable votes**

- Given: a room id is the coordination atom and an authorized setup path has seeded predefined choices
- When: an anonymous browser submits a choice and later submits a different choice
- Then: the room's Durable Object stores one pseudonymous voter key, moves that vote, and derives aggregates whose total remains one

**Scenario: Room administration is composed**

- Given: a target project exposes seed or reset through an application route
- When: the route composes the Room State helpers
- Then: an application-owned authorization callback succeeds before the Durable Object operation is invoked

**Scenario: Presenter freezes an audience result**

- Given: a room has accepted votes at a known revision
- When: an authorized presenter locks the room
- Then: the revision advances once, later votes are rejected, and participant snapshots retain their current selection against the frozen aggregate

**Scenario: Foreign site submits a vote**

- Given: a browser sends a room vote POST with a missing or untrusted `Origin`
- When: the room HTTP handler receives it
- Then: the request returns `403` before a voter cookie is created or room state changes

**Scenario: Form enhancement is unavailable**

- Given: a marked server-rendered form has a valid action, method, named controls, and submit button
- When: JavaScript is disabled or the client enhancement fails
- Then: native submission completes the workflow and the browser renders the server response

**Scenario: Form enhancement succeeds**

- Given: the current and returned HTML contain the same declared fragment
- When: the optional browser module submits the form in the background
- Then: it replaces only that fragment, preserves or deliberately moves focus, updates history when the URL changes, and reloads the matching server URL during history traversal

**Scenario: Worker needs its first browser module**

- Given: a server-rendered Worker has no client framework, browser compiler, or static-assets path
- When: the agent applies `.capabilities/browser-static-assets/`
- Then: the application-level build preserves existing outputs while TypeScript emits an external native module, Wrangler serves it through `/assets/*`, stable filenames revalidate, and the server-rendered page remains functional when JavaScript is unavailable

**Scenario: Worker renders its external browser module**

- Given: Worker-rendered HTML contains an empty `type="module"` tag whose root-relative source stays under `/assets/` and ends in `.js`
- When: the Worker client-code guard scans the rendering source
- Then: the tag passes regardless of harmless attribute ordering, while inline, remote, classic, traversal, event-handler, and `javascript:` forms still fail at their source location

**Scenario: Presenter reviews a candidate without changing stage**

- Given: an active Worker supports preview URLs and stage is on a known-good version
- When: `npm run deploy` uploads a candidate and the presenter reviews its returned preview URL
- Then: active traffic remains unchanged until `deploy:promote` receives that exact reviewed version ID

**Scenario: Operator targets a named environment**

- Given: the application defines a lowercase named Wrangler environment
- When: the operator sets `WORKER_ENVIRONMENT` for preview, status, promotion, or rollback
- Then: the wrapper validates the name and passes the same explicit `--env` selection to Wrangler

**Scenario: Worker uses Durable Objects**

- Given: the Worker implements a Durable Object
- When: deployment safety is considered
- Then: the version-preview kit is rejected as a poor fit and the project designs a separately isolated preview environment
