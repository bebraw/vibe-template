# Retain Project Start Implementation Context

Use this update when a downstream project retains Project Start or needs its initialized context to remain discoverable during brief follow-ups and changes of direction. It extends the existing Product focus and Documentation changes sections while preserving read-only planning and approval of exact initialization and pruning targets.

## Apply

1. Inspect the target's initialization skill, README, agent routing, feature specs, architecture records, and existing operational documents. Preserve their current ownership and any project-specific requirements.
2. Review `patch.diff` and try `git apply --check`. Apply it only when the touched surfaces still match. It extends the compact Project Start workflow and its documentation; it does not initialize the downstream project.
3. In Product focus, capture relevant audience and usage context, reviewed input locations, persistent constraints, the current increment's observable behavior and stopping condition, and explicitly deferred direction. Infer supplied context; ask only for missing information that materially affects current implementation. Omit irrelevant fields.
4. In Documentation changes, name exact owning paths and discovery links. Use README for purpose and audience, agent rules for routing and project-wide behavior, feature specs for behavior and input references, architecture and ADRs for lasting constraints and rationale, and existing operational docs for session or demonstration details. Keep each fact authoritative in one place; link elsewhere.
5. Keep concise post-initialization agent instructions to discover context, stop at the requested increment's boundary, leave deferred capabilities unimplemented, preserve documented working behavior during extensions or restyling, and follow later explicit user instructions while updating changed durable requirements. Leave unspecified, reversible choices open.
6. Update any maintained compatibility copies intentionally; this template currently has no Project Start compatibility copy. Keep the explicit-only invocation policy. Adopt the spec and ADR using the target's paths and next available ADR ID, and update their discovery links.

## Fallback

If the target has diverged, port the behavior manually from this guide and the patch. Keep the existing eight plan sections and all approval, working-seam, and template-provenance protections. Do not replace project documentation wholesale or copy template-specific catalog and ADR indexes blindly.

If initialization is already complete or its skill was removed, adapt only the relevant routing and documentation ownership rules. Do not reinstall a skill solely to store context, invent missing requirements, require every field, or create a mandatory brief, configuration format, private state store, or domain-specific convention. Operational details belong in an existing operational document when relevant.

## Verify

- Run the installed skill-creator `scripts/quick_validate.py` against the target's `start-project` folder and any maintained copies, when the skill is retained.
- Run formatting and the target's normal baseline checks. This pack changes no dependencies, runtime code, build configuration, or CI workflow.
- In a disposable representative clone, compare file contents and Git status before and after the initial planning pass; it must remain read-only and name exact documentation targets.
- Approve only the planned initialization in the disposable clone. Give a fresh agent the initialized repository and a brief enhancement request; confirm it discovers relevant audience, reviewed inputs, constraints, and operational context and stops at the current increment's boundary.
- Exercise presentation changes, an explicit durable requirement change, and a minimal project. Check that deferred capabilities remain context rather than authorization and no duplicate context store or empty sections appear.
- Run `node --test scripts/template-update-patches.test.mjs` when the target retains update-pack tooling, and record this update ID in the target's existing adoption record after successful adoption.
