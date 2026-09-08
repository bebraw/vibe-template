# Feature: Project Start

## Blueprint

### Context

A fresh clone contains useful quality, architecture, documentation, and agent guardrails, but it also contains distribution kits, historical migrations, a replaceable starter application, and workflows that may not fit the new product. Removing these by intuition can break the working baseline or erase the route to later template maintenance. Keeping everything indefinitely makes product ownership harder to see.

The project needs a lightweight one-time workflow that establishes the first closed product loop, audits inherited material, and lets the user approve exact pruning before the repository changes. Brief or improvised later prompts should not require the user to repeat essential audience, input, or constraint context, nor accidentally authorize later capabilities.

### Architecture

- **Capability source root:** `.codex/skills/start-project/`
- **Composition roots:** `AGENTS.md` for explicit routing and `README.md` for user discovery
- **Entry point:** explicit `$start-project` invocation or an unambiguous request to initialize, personalize, or prune a fresh clone
- **State authority:** existing durable repository documents and package metadata; the skill creates no private state store
- **Public contracts:** the read-only Project Start Plan, the approved target list, and the resulting project docs/specs/ADRs
- **Dependency direction:** the skill reads template and project surfaces; those surfaces do not depend on the skill after initialization
- **Update provenance:** template source, baseline Git revision, and applied update IDs in existing package metadata or durable docs when local update history is pruned
- **Decision:** [ADR-062](../../docs/adrs/implemented/ADR-062-retain-durable-implementation-context.md) extends [ADR-051](../../docs/adrs/implemented/ADR-051-add-approval-gated-project-start.md) without changing its initialization or pruning approval boundaries

### Out of Scope

- Discovering a materially uncertain product direction; use brainstorming or wayfinding first.
- Implementing the first product loop as part of the planning pass.
- Automatically choosing a framework, dependency, CI service, or deployment target.
- Cleaning ignored machine-local artifacts as if they were repository architecture.

### Anti-Patterns

- Do not edit or delete files during the initial audit.
- Do not label all inherited material as disposable template residue.
- Do not delete working starter behavior before its replacement or explicit abandonment is approved and verifiable.
- Do not remove a skill, tool, or workflow without tracing its routing, copies, packages, scripts, docs, specs, and checks.
- Do not prune historical update packs without recording an upstream source and baseline.
- Do not create a second project-state file when README, architecture docs, specs, ADRs, or package metadata already own the information.
- Do not turn context capture into a mandatory questionnaire, require empty sections, or impose a domain-specific convention on every project.
- Do not interpret reviewed inputs, deferred direction, or initialization approval as authorization to implement additional capabilities.

## Contract

### Product Focus

Extend the existing Project Start Plan's **Product focus** section with the current increment's observable behavior and stopping condition. Capture the following only when relevant:

- **Audience and usage context:** who uses the product and where or how they use it.
- **Authoritative inputs:** reviewed content, assets, data sources, and references, including their actual repository paths or external locations. Distinguish authoritative inputs from unreviewed suggestions; do not claim an unavailable reference has been reviewed.
- **Persistent constraints:** requirements that must survive presentation or implementation changes.
- **Deferred direction:** possible later capabilities, explicitly distinguished from the current authorized increment.

Infer these from supplied context and existing documentation. Ask only about missing information that materially affects the current implementation. Unspecified, reversible implementation and visual choices remain open to agent judgment; they are not blockers to initialization. Retain the existing eight plan sections without adding a compulsory brief or context form.

### Documentation Ownership

Extend the plan's **Documentation changes** section with exact paths, the facts each will own, and the links that make those facts discoverable. Keep each fact in one authoritative location and link to it elsewhere. References point to reviewed inputs rather than copying their content into multiple documents.

| Surface                                      | Owns                                                                                                                                                  |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`                                  | Purpose, audience, and links to relevant implementation context                                                                                       |
| `AGENTS.md`                                  | Concise context routing and project-wide agent behavior                                                                                               |
| `specs/{feature-domain}/spec.md`             | Observable behavior, authoritative input references, acceptance criteria, the current increment's stopping condition, and relevant deferred direction |
| `ARCHITECTURE.md` and ADRs                   | Lasting architectural constraints and their decision rationale, respectively                                                                          |
| Existing operational docs, such as a runbook | Session-specific workflow and demonstration context                                                                                                   |

Place persistent requirements with the behavior or architecture they constrain, and usage context with its relevant purpose, behavior, or operational owner. Update only surfaces whose owned facts change; create a feature spec or ADR when its contract requires one. Do not create empty sections, an extra context file, mandatory configuration, another skill, or a private state store. A simple project needs no special audience, assets, or staged-delivery sections.

### Context After Initialization

README and agent routing must lead a fresh agent to the relevant feature spec, authoritative inputs, architectural constraints, and any operational context without the original conversation or the Start Project skill. Retain concise project-wide instructions in `AGENTS.md` to:

- Discover and apply relevant documented context before implementing a brief follow-up.
- Complete the requested increment and stop at its stated boundary; treat deferred capabilities as context, not authorization.
- Preserve documented working behavior and persistent content requirements when adding capabilities or changing presentation.
- Apply later explicit user instructions over earlier project guidance, updating the authoritative documents when a durable requirement changes, including the relevant ADR process for architectural changes.
- Leave unspecified, reversible implementation and visual choices open to judgment.

### Definition of Done

- [ ] The template includes an explicitly invoked `start-project` skill and user-facing catalog entry.
- [ ] The planning phase is read-only and defines purpose, one current closed loop, and any deferred capabilities.
- [ ] Product focus captures relevant supplied context and the current increment's observable stopping condition without requiring every field or repeating answered questions.
- [ ] Documentation changes name exact ownership and discovery targets, with one authoritative location per fact.
- [ ] The plan classifies exact paths as keep, replace later, remove after approval, or decision required.
- [ ] Proposed removals list coupled edits, update-path impact, and verification.
- [ ] No edit or deletion occurs until the user approves the exact plan.
- [ ] Approved execution updates README, agent rules, architecture, specs, and ADRs where their owned contracts change.
- [ ] A fresh agent can discover relevant implementation context through README and agent routing without the original conversation or the initialization skill.
- [ ] Pruning local update history preserves template source, baseline, applied updates, and a discoverable sync path.
- [ ] Final verification matches the repository's retained tooling and workflow-sensitive boundaries.

### Regression Guardrails

- Start Project must remain explicitly invoked.
- Plan approval must be scoped to listed targets and coupled edits, not treated as blanket cleanup authority.
- Initialization approval does not authorize product implementation or deferred capabilities.
- New overlapping worktree changes must invalidate or narrow a previously approved plan before execution continues.
- Implemented ADRs and living specs remain retained by default; consolidation requires proof that active constraints and behavior remain represented.
- Canonical skills and compatibility copies must be changed together intentionally.
- The workflow may offer to remove itself only as the final, separately listed cleanup item.

### Verification

- **Skill metadata:** run the skill-creator validator against `.codex/skills/start-project/` and any maintained compatibility copies
- **Documentation:** `npm run format:check`
- **Catalog coverage:** confirm README and `AGENTS.md` identify Start Project as explicit-only
- **Update path:** confirm `.template/updates/AGENT_SYNC.md` can discover `source`, `baseline`, and `updates` from existing metadata
- **Forward test:** in a disposable representative clone, supply audience, reviewed input locations, a persistent requirement, one current increment, two deferred capabilities, and existing operational context. Ask an independent agent to use the skill; compare file contents and Git status before and after planning to confirm it remains read-only, and inspect the plan's exact documentation targets. Explicitly approve a scoped initialization in the disposable clone, then give a fresh agent only a brief enhancement request and the initialized repository. Confirm it discovers and applies the context, stays within the current increment, and introduces no duplicate context store or domain-specific convention. Also exercise a presentation change, an explicit durable constraint change, and a minimal project. Keep evaluation artifacts outside the working tree.

### Scenarios

**Scenario: Fresh clone is still generic**

- Given: the repository contains the Worker stub, template skills, capability kits, and historical update packs
- When: the user invokes Start Project with a product idea
- Then: the agent presents the first closed loop and exact keep, replace, remove, and decision categories without editing files

**Scenario: User approves only part of the plan**

- Given: the Project Start Plan proposes several removals
- When: the user approves only the distribution-kit removal
- Then: the agent applies that subset and its listed coupled documentation changes without performing adjacent cleanup

**Scenario: Starter behavior has no replacement yet**

- Given: the current Worker stub is still the only verified runtime path
- When: the audit evaluates `src/`
- Then: it classifies the starter as replace later instead of deleting it

**Scenario: Historical update packs are pruned**

- Given: a downstream project no longer wants local migration history
- When: the user approves removing old packs
- Then: the agent first records the actual template source, baseline revision, and applied updates in package metadata or durable docs and retains a discoverable sync route

**Scenario: Product direction is unresolved**

- Given: alternative first loops would create materially different project architecture
- When: Start Project reaches the decision
- Then: it stops in the Decisions required section and routes the user to brainstorming or wayfinding instead of inventing a project structure

**Scenario: Brief follow-up prompt**

- Given: an initialized project documents audience, trusted input locations, persistent constraints, and the current increment in their owning surfaces
- When: a fresh agent receives a small enhancement request without the original conversation
- Then: it discovers and applies that context through README and agent routing without asking the user to repeat it

**Scenario: Deferred capability**

- Given: three possible increments are described but only the first is authorized
- When: initialization records product focus and a later request implements the first increment
- Then: the other two remain explicitly deferred in the relevant spec, and implementation stops at the first increment's acceptance boundary

**Scenario: Improvised change**

- Given: behavior and content requirements are documented but visual treatment is unspecified
- When: the user requests a new visual treatment
- Then: the agent can change presentation while preserving documented working behavior and authoritative content requirements

**Scenario: Explicit change of direction**

- Given: a durable requirement is documented in its owning spec or architecture surface
- When: the user explicitly changes that requirement
- Then: the agent follows the new instruction and updates its authoritative documentation, using the ADR process when the architectural decision changes rather than maintaining conflicting copies

**Scenario: Minimal project**

- Given: a simple project has no special audience, assets, or staged delivery
- When: the user invokes Start Project
- Then: initialization records only useful purpose, current behavior, stopping condition, and routing in the relevant existing surfaces, without a questionnaire, empty context sections, or additional context files
