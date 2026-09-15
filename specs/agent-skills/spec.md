# Feature: Agent Skill Baseline

## Blueprint

### Context

The template should include agent workflows that are broadly useful to its baseline without vendoring large product documentation snapshots already available from connected platform tools.

The skill baseline targets capable `gpt-5.6-sol`-class agents that can inspect repositories, use tools, and apply ordinary engineering judgment. Skill context should therefore carry only routing, project-specific decisions, non-obvious invariants, exact local interfaces, and safety boundaries.

Large, uncertain initiatives also need a lightweight way to preserve discovery across sessions without requiring an external issue tracker or turning transient planning notes into architectural authority.

Once decisions settle, the template should provide a direct repository-local path from discussion to its living feature spec and from that contract to behavior-first implementation.

Users also need a concise README catalog that makes the available skills discoverable, explains the job each one performs, and shows how to request one without reading every skill file first.

Browser-facing implementation needs current web-platform and compatibility guidance without making a preview tool, a large vendored guide corpus, or a moving `@latest` package part of the application or quality gate.

### Architecture

- **Canonical project-local skill root:** `.codex/skills/`
- **Selective compatibility copies:** `.github/skills/` and capability-kit `files/` only for skills intentionally distributed through those surfaces
- **Copy policy:** keep an intentional distribution copy byte-equivalent to its canonical `.codex/skills/` source unless the target surface requires a documented compatibility adaptation
- **Composition roots:** `AGENTS.md` for model routing and `README.md` for user discovery
- **Skill contracts:** each canonical `SKILL.md` plus optional `agents/openai.yaml`
- **Agent capability baseline:** `gpt-5.6-sol`-class repository navigation, tool use, and engineering judgment
- **Instruction budget:** concise descriptions and entrypoints; version-sensitive manuals stay in current primary documentation rather than the prompt
- **Dependency direction:** routing and distribution surfaces point to canonical skills; canonical skills do not depend on their copies
- **Cloudflare knowledge and account layer:** connected Cloudflare MCP
- **Baseline Cloudflare implementation skill:** `workers-best-practices`
- **Baseline Cloudflare CLI skill:** `wrangler`
- **Specialized Cloudflare skills:** added on demand when their product is adopted
- **Sandbox SDK skill:** absent until the project adopts `@cloudflare/sandbox`
- **Repository-local wayfinding skill:** `.codex/skills/wayfinder/`
- **Explicit project-start skill:** `.codex/skills/start-project/`
- **Project-start behavior owner:** `specs/project-start/spec.md`
- **Wayfinding map:** `docs/wayfinding/<effort>.md`
- **Wayfinding authority:** working context only; lasting decisions graduate into architecture docs, ADRs, and specs
- **Repository-local specification skill:** `.codex/skills/to-spec/`
- **Specification target:** `specs/<feature-domain>/spec.md`
- **Behavior-first implementation skill:** `.codex/skills/tdd/`
- **Capability architecture review skill:** `.codex/skills/architecture-review/`
- **Architecture-feedback integration:** review-skill behavior is owned here; `specs/architecture-feedback/spec.md` owns its composition with deterministic source-shape evidence
- **Web-platform implementation skill:** `.codex/skills/modern-web-guidance/`
- **Web-platform instruction snapshot:** `GoogleChrome/modern-web-guidance` revision `684ab9d7c6b78fc2cd5677912d874397cb2e5dfa`, which labels itself `0.0.179`
- **Web-platform CLI artifact:** telemetry-disabled `modern-web-guidance@0.0.180`, sourced from `GoogleChrome/modern-web-guidance-src` tag `v0.0.180` and commit `29ecd9546013e32e0a597ad5ab3a2fc26add1f1d`, with npm integrity `sha512-55diU2dH4nMF2DKWmvOdeLKWUvTTz32UIcSlYFSa+AN699MVC7pvqJ4mlFMmPd7qfnRJiP/FxKcSkIOP0MSDDw==`
- **Browser-support target:** Baseline Widely available for core behavior, with progressive enhancement for newer features unless a project records a narrower target
- **Guidance authority:** retrieved guidance informs implementation; repository architecture, specs, source conventions, and verification remain authoritative
- **Browser verification boundary:** the current Playwright and Lighthouse setup provides Chromium evidence and does not claim cross-browser compatibility
- **User-facing skill catalog:** `README.md`

### Anti-Patterns

- Do not vendor broad Cloudflare documentation snapshots when the connected MCP supplies current retrieval.
- Do not embed static CLI catalogs, framework inventories, metric thresholds, or API tutorials that current tools and primary documentation can resolve.
- Do not repeat generic model capabilities such as basic debugging, review, or design judgment when a project-specific constraint is sufficient.
- Do not add persistent persona or output-compression skill suites to the template baseline.
- Do not treat the MCP as a replacement for local Wrangler development, configuration, type generation, or testing workflows.
- Do not retain product-specific skills for capabilities the template does not use.
- Do not let intentional compatibility or capability-kit copies diverge from their canonical `.codex/skills/` source without a documented adaptation.
- Do not require GitHub Issues, labels, assignments, tracker setup, or a companion skill suite for wayfinding.
- Do not treat a wayfinding map as the durable source of truth for architecture or feature behavior.
- Do not invoke wayfinding for work that is already clear enough to specify or implement in one session.
- Do not publish feature specs to issue trackers or create parallel PRD formats.
- Do not synthesize unresolved decisions into a spec as if they were settled.
- Do not force TDD onto changes without meaningful observable behavior or a stable test seam.
- Do not write tautological or implementation-coupled tests merely to satisfy a test-first sequence.
- Do not make users inspect the skill directory to discover names, purposes, or invocation behavior.
- Do not let project initialization edit or prune a clone before the user approves an exact plan.
- Do not duplicate complete skill workflows in the README; link to each `SKILL.md` as the source of truth.
- Do not treat structural metrics as a substitute for reviewing capability ownership and dependency direction.
- Do not invoke Modern Web Guidance for backend-only work, routine styling or behavior changes that apply established repository patterns, copy changes, CI, or general tooling.
- Do not replace the pinned Modern Web Guidance CLI with `@latest`, enable its telemetry, or install its full guide corpus as a repository dependency.
- Do not copy retrieved examples across local architecture or security boundaries, including the typed-client rule for browser behavior.
- Do not infer cross-browser compatibility from Chromium-only automated checks.

## Contract

### Definition of Done

- [ ] The template includes `workers-best-practices` and `wrangler` in both supported skill roots.
- [ ] Broad and unused product-specific Cloudflare skill bundles are absent from both roots.
- [ ] `sandbox-sdk` is absent while the repository has no Sandbox SDK runtime dependency or feature contract.
- [ ] Agent guidance routes current Cloudflare documentation, API discovery, and account operations through the connected MCP.
- [ ] Product-specific skills are introduced only with the capability that needs them.
- [ ] The template includes an explicitly invoked `wayfinder` skill for large, uncertain, multi-session efforts.
- [ ] Wayfinder stores one map per effort in `docs/wayfinding/` and creates no external tracker state.
- [ ] Wayfinder promotes lasting decisions into the repository's existing architecture, ADR, and spec structure.
- [ ] The template includes an explicitly invoked `to-spec` skill that writes the existing Blueprint/Contract format.
- [ ] The template includes a model-invoked `tdd` skill for observable source behavior and regression fixes.
- [ ] Both skills reuse the existing spec, ADR, test, and quality-gate conventions without companion setup.
- [ ] The README groups every project-local skill by job and gives each a concise, user-facing purpose.
- [ ] Skill descriptions remain discriminating and normally fit within 30 words; entrypoints contain only decision-changing guidance.
- [ ] The README explains natural matching, named `$skill` invocation, and which workflows require explicit invocation.
- [ ] The template includes a model-invoked `architecture-review` skill that combines durable capability contracts, deterministic source-shape checks, and advisory Fallow evidence.
- [ ] The template includes an explicitly invoked `start-project` skill whose behavior is owned by `specs/project-start/spec.md`.
- [ ] The template includes a narrowly routed `modern-web-guidance` skill with reviewed provenance, an adjacent Apache-2.0 license, valid UI metadata, a pinned CLI version, and telemetry-disabled commands.
- [ ] The browser-support target and the Chromium-only verification boundary are explicit in durable architecture and agent guidance.
- [ ] Modern Web Guidance adds no application dependency, vendored guide corpus, automatic update path, or CI gate.
- [ ] Missing browser declarations may prompt an opt-in `modern-web-types` recommendation, with dependency approval, version pinning, active-toolchain verification, and unchanged browser-support requirements; Cloudflare runtime types remain outside this recommendation.

### Regression Guardrails

- The baseline must not reintroduce `cloudflare`, `agents-sdk`, `cloudflare-email-service`, or `durable-objects` as vendored skills without an explicit architecture change.
- The baseline must not reintroduce `sandbox-sdk` or communication-style skill suites without adopting their capability explicitly.
- Compact rewrites must preserve destructive-action approval, secret handling, retrieval pins, telemetry controls, public-seam testing, evidence thresholds, and repository verification rules.
- Version-sensitive commands and thresholds must be retrieved or resolved from installed tool help rather than accumulated in skill entrypoints.
- The Worker and Wrangler skill copies must remain available while this repository is a Cloudflare Worker starter.
- Removing a baseline skill must not remove its runtime dependency or product implementation implicitly.
- Wayfinding must remain optional, repository-local, and independent of issue-tracker infrastructure.
- A map must not become ready for specification while lasting decisions exist only in transient planning text.
- To Spec must stop rather than invent an answer when a material contract or architecture decision remains unresolved.
- TDD must prove the intended missing behavior with a failing test before changing production code.
- TDD must allow explicit alternative verification for documentation, prototypes, generated output, and mechanical changes.
- Modern Web Guidance upgrades must be reviewed deliberately and update the instruction snapshot, package version, source tag and commit, npm integrity, provenance, spec, ADR or successor decision, and portable update path together.
- Features outside Baseline Widely available must preserve a usable core path unless a project explicitly records a narrower browser target.
- Retrieved guidance must not override repository architecture, user instructions, dependency approval, or deterministic verification.

### Verification

- **Skill presence:** `test -f .codex/skills/workers-best-practices/SKILL.md && test -f .codex/skills/wrangler/SKILL.md`
- **Mirror presence:** `test -f .github/skills/workers-best-practices/SKILL.md && test -f .github/skills/wrangler/SKILL.md`
- **Pruned bundles:** confirm unused Cloudflare product skills, `sandbox-sdk`, and communication-style suites are absent from repository skill roots
- **Instruction size:** inspect `wc -w $(rg --files .codex/skills -g SKILL.md)` and review any entrypoint whose growth is not justified by a fragile workflow or safety boundary
- **Documentation check:** `npm run format:check`
- **Wayfinder structure:** confirm the skill has valid `name` and `description` frontmatter plus valid `agents/openai.yaml`; use the skill-creator validator when its Python dependencies are available
- **Specification and TDD structure:** apply the same metadata validation to `.codex/skills/to-spec/` and `.codex/skills/tdd/`
- **Architecture review structure:** validate `.codex/skills/architecture-review/` metadata and confirm its workflow routes lasting outcomes into architecture docs, ADRs, or specs
- **Project start structure:** validate `.codex/skills/start-project/` metadata and confirm its workflow is read-only until the exact pruning plan is approved
- **Modern web structure:** validate `.codex/skills/modern-web-guidance/`, confirm its commands pin `modern-web-guidance@0.0.180` with `DISABLE_TELEMETRY=1`, confirm `@latest` is absent, and verify the recorded npm source commit and integrity against registry metadata
- **README catalog:** confirm every `.codex/skills/*/SKILL.md` has a corresponding README link and that explicit-only workflows are identified

### Scenarios

**Scenario: Agent needs current Cloudflare product information**

- Given: the Cloudflare MCP is connected
- When: an agent needs current documentation or API details
- Then: the agent retrieves them through the MCP instead of relying on a vendored platform snapshot

**Scenario: Agent edits Worker code**

- Given: the repository remains a Cloudflare Worker
- When: an agent authors or reviews Worker code
- Then: the agent uses `workers-best-practices`

**Scenario: Project adopts a specialized Cloudflare product**

- Given: the project adds Agents SDK, Durable Objects, Email Service, or Sandbox SDK
- When: specialized implementation guidance becomes useful
- Then: the project adds only the relevant skill rather than restoring the complete Cloudflare bundle

**Scenario: Agent needs version-sensitive syntax**

- Given: an installed CLI, platform API, or browser metric may have changed
- When: a skill guides implementation or review
- Then: the agent retrieves current primary documentation or installed-tool help and keeps only project-specific invariants in prompt context

**Scenario: Initiative is too uncertain to specify**

- Given: an initiative will span multiple sessions and still contains material decision fog
- When: the user explicitly invokes Wayfinder
- Then: the agent creates one repository-local map after confirming its destination and initial frontier

**Scenario: Wayfinding resolves a lasting decision**

- Given: a resolution changes a global constraint, architectural choice, or feature contract
- When: the agent records the resolution
- Then: the agent updates the appropriate architecture document, ADR, or feature spec and leaves only a concise pointer in the map

**Scenario: Work is already clear**

- Given: the requested outcome can already be specified or planned responsibly
- When: the user invokes Wayfinder
- Then: the agent recommends the direct workflow instead of creating a map

**Scenario: Settled discussion becomes a feature spec**

- Given: the user has settled the feature behavior and important constraints
- When: the user explicitly invokes To Spec
- Then: the agent confirms one `specs/<feature-domain>/spec.md` target and synthesizes the agreed Blueprint and Contract without creating tracker state

**Scenario: Specification still contains a material decision**

- Given: an unresolved choice would change the feature contract or architecture
- When: To Spec evaluates readiness
- Then: the agent names the unresolved decision and returns to brainstorming or wayfinding instead of guessing

**Scenario: Observable runtime behavior changes**

- Given: a stable public test seam exposes the requested behavior
- When: the agent implements the change
- Then: TDD proves the missing behavior red, makes the smallest production change green, and repeats by vertical slice

**Scenario: No meaningful red test exists**

- Given: the change is documentation-only, generated, a prototype, or purely mechanical
- When: the agent considers TDD
- Then: the agent skips it and states the deterministic verification used instead

**Scenario: User looks for an available workflow**

- Given: the user knows the job they need done but not the available skill names
- When: they read the README skill catalog
- Then: they can find the matching skill, understand its purpose, and either describe the job naturally or invoke it by `$skill-name`

**Scenario: User starts from a fresh clone**

- Given: the repository still contains inherited starter and distribution material
- When: the user explicitly invokes Start Project
- Then: the agent defines the first closed product loop and presents an exact, read-only pruning plan before editing or deleting files

**Scenario: Capability expansion meets structural pressure**

- Given: a capability is growing and source-shape or Fallow evidence indicates concentrated responsibility
- When: the agent uses Architecture Review
- Then: it returns Proceed, Consolidate first, or Decision required based on ownership and dependency evidence rather than recommending mechanical file splitting

**Scenario: Substantive browser behavior needs a platform choice**

- Given: a browser-facing task requires choosing an HTML or CSS platform feature, a browser API, a compatibility interpretation, or a fallback
- When: an agent prepares the implementation
- Then: it uses the pinned, telemetry-disabled Modern Web Guidance search and retrieves only focused relevant guides before adapting them to repository contracts

**Scenario: Retrieved guidance conflicts with the repository**

- Given: a retrieved example uses an inline handler, an unapproved dependency, or another pattern disallowed by local architecture
- When: the agent applies the guidance
- Then: it preserves the underlying platform recommendation while implementing it through the repository's typed, dependency-approved seams

**Scenario: Feature is newer than the browser target**

- Given: a useful feature is not Baseline Widely available
- When: the agent proposes using it
- Then: the feature progressively enhances a usable core path unless the project explicitly records a narrower browser target

**Scenario: Browser task does not need platform guidance**

- Given: a change only adjusts copy or applies established styling or behavior patterns without choosing a platform feature, interpreting compatibility, or designing a fallback
- When: the agent routes the task
- Then: it skips Modern Web Guidance and follows the smaller relevant workflow
