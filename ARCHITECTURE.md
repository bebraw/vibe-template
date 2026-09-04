# Architecture

This file stores cross-cutting rules that apply to the whole repo and to projects cloned from it.

Use this file for global constraints. Use feature specs under `specs/` for domain-specific behavior and contracts.

## Global Rules

- Keep the template lightweight, reusable, easy to clone, and easy to prune.
- Initialize a downstream clone through an approval-gated project-start pass: define one current closed product loop, classify inherited surfaces, preserve working seams, and record update provenance before pruning.
- Treat repo documentation as living context that should evolve with the code.
- Treat architectural decisions as explicit records, not implicit tribal knowledge.
- Treat specs and ADRs as the durable source of truth for expected behavior and architectural intent. Code, including AI-generated code, is only acceptable when it matches those documents or updates them intentionally in the same change set.
- Add or update an ADR in `docs/adrs/` whenever a change introduces or changes a lasting architectural constraint, selects between credible architectural alternatives, or replaces an earlier decision. Keep drafts in `docs/adrs/proposed/`, approved-but-not-yet-implemented decisions in `docs/adrs/accepted/`, and implemented decisions in `docs/adrs/implemented/`.
- Create or update the relevant feature spec in `specs/` in the same change set whenever feature behavior, contracts, workflows, or regression guardrails change.
- Add or update a template update pack in `.template/updates/` in the same change set whenever a reusable template maintenance change should be portable to downstream projects.
- Keep agent skill descriptions discriminating and entrypoints limited to project-specific decisions, invariants, exact local commands, and safety boundaries. Assume a capable `gpt-5.6-sol`-class baseline; retrieve version-sensitive manuals instead of vendoring command catalogs or teaching generic engineering judgment.
- Keep optional multi-session discovery maps under `docs/wayfinding/<effort>.md`. Treat them as working context rather than durable authority, and promote lasting outcomes into `ARCHITECTURE.md`, ADRs, or feature specs.
- Use focused red-green slices for observable runtime behavior and regression fixes when a stable test seam exists. When no meaningful failing test can be written, use and state the relevant deterministic verification instead.
- For every new or materially expanded independently evolvable capability, record its source root, composition root, state authority, public contracts, and dependency direction in the relevant feature spec.
- Treat `.architecture-check.json` limits as generous smoke alarms for architectural review. Do not split code mechanically to satisfy them; consolidate responsibilities or add an exact rationale-bearing exception.
- Keep the quality gate green before considering a change ready.
- Keep workflow writes explicit. New generated output, local state, cache, archive, or tool-artifact paths should be documented in the same change that introduces them.
- Verify executable capability kits by materializing independent adopter Workers in disposable operating-system temporary directories; kit manifests own their fixture dependencies and the verifier must not write generated application files into the repository.
- Keep deploy preflight read-only with respect to Cloudflare: authentication checks, generated binding inspection, and deploy bundling may write only to a disposable operating-system temporary directory, while existing configured build steps retain their documented write targets.
- Do not place executable browser code inline in Worker-rendered HTML. Client behavior should live in typed TypeScript modules before it is served to browsers.

## Tooling Baseline

- Local development and local CI target macOS as the supported host platform baseline.
- Browser-facing core behavior targets Baseline Widely available. Features outside that target require a usable core path or an explicitly documented narrower browser policy; Chromium-only browser checks do not establish cross-browser compatibility.
- Use the scoped `modern-web-guidance` skill as pinned, telemetry-disabled implementation input for substantive web-platform decisions. Repository architecture, specs, source conventions, and verification remain authoritative, and upstream upgrades require deliberate review.
- Use a connected Cloudflare MCP as the retrieval and account-operation layer for current Cloudflare product work. Keep only the `workers-best-practices` and `wrangler` skills in the template baseline; add product-specific Cloudflare skills when a project actually adopts those products.
- Node is pinned exactly through `package.json`, npm is constrained to a compatible major there instead of an exact patch pin, and `@types/node` stays on the supported Node major.
- The verification baseline is split into a fast gate and a browser gate so quick checks can return earlier without dropping full coverage.
- The repo-managed `pre-push` Git hook should run affected-file guardrails before code is pushed.
- Formatting, Oxlint correctness checks, type checking, unit tests, and end-to-end tests are part of the baseline quality gate.
- The fast and affected quality paths enforce extreme source-file and flat-directory limits through `npm run quality:structure`; Fallow remains the richer advisory layer for coupling, churn, complexity, and refactoring evidence.
- Keep incremental mutation testing in an explicit deep local gate instead of making it an unconditional baseline phase. GitHub remains responsible for the clean full mutation signal on runtime-relevant changes.
- Keep duplicated `.github/skills/` content and deliberately vendored skill references outside the Prettier baseline. Continue formatting project-owned skill entry points, specs, ADRs, and documentation.
- Cache successful Prettier checks by file content under ignored `.cache/prettier` so repeated local gates avoid unchanged files without trusting timestamps.
- Keep Oxlint focused on its default correctness rules unless additional rule categories are adopted through an explicit, documented decision. Oxlint does not replace Prettier or TypeScript checking.
- Fallow codebase diagnostics use best-effort type-aware analysis for exact-symbol evidence, public-signature coupling, complexity, duplication, dependency hygiene, and cleanup evidence; they remain advisory and do not replace the baseline quality gate.
- Affected-file guardrails should scope checks to changed files when the underlying tool supports it and fall back to project-level checks only when needed.
- Remote browser and mutation jobs should skip dependency installation and execution when every changed file is in a documented non-runtime area. Unknown paths and unavailable change ranges must run the expensive gates.
- Keep Stryker at 50% concurrency for responsive local work, while the isolated GitHub mutation job may use 100% of its runner's available parallelism.
- The fast quality gate should fail when Worker/view runtime files contain inline `<script>` tags, inline event-handler attributes, or `javascript:` URLs.
- Unit coverage for `src/` code should stay high enough that the coverage gate remains green.
- The baseline quality gate and CI should type-check and test executable capability kits through `npm run capabilities:verify`, independently of the root Vitest source glob.
- Local CI should validate the same baseline checks when changes cross workflow-sensitive boundaries or when full PR or release readiness is requested.
- The canonical local CI command should emit Local CI's structured lifecycle event stream so agents can track run, job, step, pause, and completion state without relying on animated terminal output. Agent command wrappers must pass that stream through live instead of buffering it until process exit.
- Targeted commands are useful while iterating, but `npm run quality:gate` remains the readiness baseline before proposing or landing non-documentation changes.
- Require `npm run ci:local` when a change touches GitHub Actions workflows, package metadata or dependency installation, build or container setup, browser CI setup, or when full PR or release readiness is requested. Ordinary source, test, and tooling changes do not require it when they stay outside those boundaries.
- Use `npm run quality:gate:deep` when local assertion-strength feedback is worth the additional mutation-testing cost.
- `npm run diagnostics:codebase` is useful during review and refactoring, but passing or failing it is not a readiness baseline by itself.
- Documentation-only changes should use the smallest relevant checks unless they alter executable instructions or workflow contracts.

## Capability Kits

- Put reusable partial-upgrade kits under `.capabilities/{capability-name}/`.
- Keep capability kits instructional and reviewable rather than fully automated by default.
- Each capability kit should include a README, a machine-readable manifest, any copyable files, package-manager recipes, and validation notes.
- Capability kits should preserve target-project conventions unless the kit explicitly documents a required constraint.
- Keep application capabilities such as Workers AI, room-scoped Durable Objects, and progressive form enhancement out of the default runtime; expose them as independently selectable kits.
- Keep the native browser-module/static-assets path optional and generated-output-aware; projects with an established client pipeline should retain it rather than adopting a second build system.
- Keep progressive interaction separate from room state until repeated project use justifies making it a core browser opinion. Conventional HTML GET/POST behavior remains authoritative when the enhancement is absent or fails.
- Keep deployment preview, traffic promotion, and rollback as distinct authorized operations. Version-preview workflows must reject unsupported Durable Object applications rather than claiming their preview is isolated or available.
- Anonymous room voting must validate POST origins, minimize voter-cookie retention, and expose participant selection plus lockable monotonic revisions without claiming cookie-based identity.
- Vendor third-party agent skills at a reviewed source revision, retain their license and source metadata, and adapt only where template compatibility requires it.

## Template Updates

- Put reusable maintenance update packs under `.template/updates/{update-id}/`.
- Keep update packs as reviewable plain files with metadata, a migration guide, and a focused patch.
- Use update packs for later changes to projects that already use this template or one of its capability kits.
- Do not treat update packs as source snapshots; preserve downstream project conventions and use the migration guide when the patch does not apply cleanly.
- When a downstream project prunes local update-pack history, record the template source, baseline Git revision, and applied update IDs in existing package metadata or durable documentation, and retain a discoverable sync entrypoint.

## Spec Conventions

- Put feature-level specs under `specs/{feature-domain}/spec.md`.
- Keep one spec per independently evolvable feature or domain.
- Synthesize only settled context into specs; keep unresolved discovery in conversation or a wayfinding map and keep architectural rationale in ADRs.
- Update the relevant spec in the same change set whenever behavior, contracts, workflows, or guardrails change.
