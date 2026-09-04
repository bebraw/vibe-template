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
- **Available kits:** `typescript-setup`, `local-ci`, `quality-gate`, `mutation-testing`, `pre-push-quality-gate`, `readme-screenshot`, `lighthouse-performance`, `website-baseline`, `engineering-quality-skills`, `workers-ai`, `room-state`, `progressive-interaction`
- **Third-party skill provenance:** vendored skills retain their license, upstream repository, and reviewed revision in the copyable files.
- **Optional adjacent setup:** capability kits may include prompted optional steps for prerequisites such as GitHub Actions workflows.
- **Negotiation prompt:** `.capabilities/README.md` includes a prompt-style UI for selecting capabilities before editing a target repo.
- **Later maintenance sync:** template update packs under `.template/updates/` cover follow-up changes to projects that already adopted a kit.
- **Executable verification owner:** `scripts/verify-capability-kits.mjs` materializes supported application kits into independent disposable Workers.
- **Verification composition root:** each kit manifest supplies copyable files and exact test dependencies; the verifier supplies only the repository-pinned Wrangler, TypeScript, generated binding config, and minimal Worker entrypoint.
- **Verification state authority:** manifests own kit dependency declarations; generated types, installed packages, and materialized source live only in operating-system temporary directories that are removed after each run.
- **Verification public contract:** `npm run capabilities:verify` generates binding types, type-checks, and runs the materialized kit tests.
- **Verification dependency direction:** the root verifier reads kit manifests and files; kit code does not depend on root application source or the root Vitest configuration.

#### Workers AI Kit

- **Capability source root:** `.capabilities/workers-ai/`
- **Target composition root:** the adopting Worker's request handler creates a runner from its generated `Env` binding and injects it into feature code
- **State authority:** `wrangler.jsonc` owns `AI` and `AI_MODEL`; the committed generated environment declaration owns their compile-time shape; the adopting feature owns prompts, schemas, validators, and deterministic fallbacks
- **Public contracts:** `WorkersAiRunner`, `runStructuredAi`, its discriminated model/fallback result, and the mock runner
- **Dependency direction:** feature code may depend on the small runner contract; only the Worker composition boundary depends on the generated Workers AI binding

#### Room State Kit

- **Capability source root:** `.capabilities/room-state/`
- **Target composition root:** the adopting Worker exports `RoomState`, routes `/rooms/:roomId` through `handleRoomRequest`, and places application authorization before seed/reset calls
- **State authority:** one SQLite-backed Durable Object selected by `ROOM_STATE.getByName(roomId)` owns predefined choices and pseudonymous replaceable votes; aggregate counts are derived from that database
- **Public contracts:** room choice/snapshot/vote result types, `RoomState` RPC methods, conventional HTML GET/POST semantics, and authorized seed/reset helpers
- **Dependency direction:** Worker routing and administration composition depend on the room RPC contract; room state does not depend on browser enhancement or application-specific choices

#### Progressive Interaction Kit

- **Capability source root:** `.capabilities/progressive-interaction/`
- **Target composition root:** an existing typed browser entrypoint installs the delegated form enhancer; the server's conventional route remains the authoritative workflow
- **State authority:** the server-rendered URL and HTML response remain canonical; browser history stores only an enhancement marker and current URL
- **Public contracts:** `data-progressive-form`, `data-progressive-target`, `data-progressive-fragment`, optional `data-progressive-focus`, and the `installProgressiveForms` entrypoint
- **Dependency direction:** the browser module depends on semantic form/fragment markup and returned HTML; server behavior must not depend on the browser module

### Anti-Patterns

- Do not make capability kits hidden automation that rewrites target repos without review.
- Do not add adjacent capabilities such as GitHub Actions workflows without asking the user first.
- Do not apply a capability bundle to a target repo before the user approves the selected capabilities.
- Do not assume the target repo has the same package manager, docs structure, workflow names, or architecture rules as this template.
- Do not include secrets or machine-local values in copyable files.
- Do not let kit instructions drift from the template's own current implementation.
- Do not use capability kits as the only record for later maintenance changes that should be synced into projects that already adopted the capability.

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
- The Workers AI kit must use generated `Env` types at the binding boundary, require runtime validation even when JSON Schema is requested, distinguish timeout/binding/validation fallbacks, and contain no application prompts or schemas.
- The Room State kit must use one SQLite-backed Durable Object per deterministic room id, accept votes only for seeded choices, replace rather than duplicate a voter's prior choice, and keep seed/reset behind an application-owned authorization check.
- The Room State kit must bound buffered form bodies and store only a per-room digest of its opaque first-party voter cookie. It must not claim cryptographic ballot secrecy or authenticated identity.
- The Progressive Interaction kit must leave unmarked, cross-origin, unsupported-method, text/plain, and GET-with-file forms on the native path; enhancement failure must return to native submission.
- The Progressive Interaction kit must keep conventional forms functional without JavaScript and include a JavaScript-disabled browser scenario. URL, history, and focus must remain coherent on the enhanced path.
- The Progressive Interaction kit must remain independently selectable from Room State until a later explicit decision promotes it into the core template or another kit.
- Reusable follow-up changes to a capability kit must add or update a `.template/updates/` pack in the same change set.
- Executable verification must reject manifest paths outside the kit or fixture, reject toolchain version conflicts, remove temporary Workers after each run, and fail when generated bindings, type checking, or kit tests fail.
- Each executable kit manifest must declare the exact development dependencies required by its copied tests; another kit or the root repository must not satisfy undeclared test dependencies accidentally.

### Verification

- **Repo check:** `npm run quality:gate`; add `npm run ci:local` only when a kit change crosses a workflow-sensitive boundary
- **Executable kits:** `npm run capabilities:verify`
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

**Scenario: Form enhancement is unavailable**

- Given: a marked server-rendered form has a valid action, method, named controls, and submit button
- When: JavaScript is disabled or the client enhancement fails
- Then: native submission completes the workflow and the browser renders the server response

**Scenario: Form enhancement succeeds**

- Given: the current and returned HTML contain the same declared fragment
- When: the optional browser module submits the form in the background
- Then: it replaces only that fragment, preserves or deliberately moves focus, updates history when the URL changes, and reloads the matching server URL during history traversal
