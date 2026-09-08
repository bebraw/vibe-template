---
name: start-project
description: Turn a fresh vibe-template clone into a focused project through an approved product-loop and pruning plan before any deletion.
---

# Start Project

Convert inherited starter context into deliberate project context without losing working behavior, governance, or the template update path.

## Boundaries

- Run only on explicit invocation or an unambiguous request to initialize a clone.
- Keep the first phase read-only. Do not edit, move, or delete files before approval of exact targets and coupled edits.
- Preserve user work and never assume inherited content is disposable.
- Do not add dependencies, CI, generated boilerplate, or new persistent state without separate approval.
- Prefer existing durable surfaces: `README.md`, `AGENTS.md`, `ARCHITECTURE.md`, specs, ADRs, and package metadata.

## Context

Read those durable surfaces, package metadata, Git remotes, and tracked files. Consult `.asdlc/SKILL.md` for methodology choices. Read `references/pruning-catalog.md` when template distribution material, update packs, starter runtime, or inherited skill collections remain.

## Phase 1: Plan

Establish the project name, purpose, first closed product loop, and retained runtime/deployment target. Infer implementation context from supplied material and existing docs; ask only for missing information that materially affects the current implementation. Leave unspecified, reversible implementation and visual choices to agent judgment. Inventory references, scripts, dependencies, workflows, skills and copies, specs, ADRs, and update records.

Classify each inherited surface as `Keep`, `Replace later`, `Remove after approval`, or `Decision required`. Trace every proposed removal through coupled files. Preserve either local update history or a durable record of template source, starting revision, applied update IDs, and retained sync entrypoint.

Present a `Project Start Plan` with these sections:

1. Product focus: describe the current increment's observable behavior and stopping condition. When relevant, include audience and usage context; authoritative reviewed content, assets, data sources, and references with their locations; persistent requirements that must survive presentation or implementation changes; and later capabilities explicitly marked deferred, not authorized work. Omit irrelevant fields instead of requiring a questionnaire or empty sections.
2. Keep
3. Replace later
4. Remove after approval
5. Decisions required
6. Template update path
7. Documentation changes: name exact paths, the facts each will own, and links from discovery surfaces. Keep each fact in one authoritative location, linking elsewhere. Use `README.md` for purpose, audience, and context links; `AGENTS.md` for concise routing and project-wide agent behavior; `specs/{feature-domain}/spec.md` for current behavior, authoritative input references, acceptance criteria, the stopping condition, and relevant deferred direction; `ARCHITECTURE.md` and ADRs for lasting architectural constraints and rationale; and existing operational docs, such as a runbook, for session workflow and demonstration context. Put persistent requirements with the behavior or architecture they constrain. Update only relevant surfaces; do not introduce a mandatory brief, configuration format, skill, or private state store.
8. Verification

List exact paths and reasons. Ask for explicit approval; approval covers only listed targets and coupled edits. Stop at decisions required when the product loop or lasting architecture remains unclear.

## Phase 2: Apply

Recheck `git status` and stop if overlapping changes stale the plan. Update durable project context before removals, replace references before targets, and delete only approved paths. Ensure README and agent routing lead a fresh agent to the relevant specs, inputs, constraints, and operational docs without needing the original conversation or this skill. In `AGENTS.md`, retain concise instructions to complete the requested increment and stop at its boundary, treat deferred direction as context rather than authorization, preserve documented working behavior when adding capabilities, and apply later explicit user instructions over earlier guidance while updating the authoritative docs when a durable requirement changes. Leave unspecified, reversible implementation and visual choices open.

Remove starter runtime only after replacement behavior and verification exist. Run targeted and repository-required checks, then compare the final diff with the plan. Check discovery from README and agent routing using a brief follow-up request: it should recover relevant context and stay within the current increment.

Finish when relevant implementation context and the current increment's boundary are discoverable, deferred scope is explicit where relevant, removed paths were approved and are unreferenced, retained tooling has an owner, update provenance remains discoverable, docs match the result, and checks pass. Initialization approval does not authorize product implementation or deferred capabilities. Offer removal of this skill only as a separate final item.
