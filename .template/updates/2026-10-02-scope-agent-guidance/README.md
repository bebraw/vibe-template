# Scope Agent Guidance To The Task

Use this pack when an existing project has a compact skill baseline but still mandates broad context reading or repeats approvals for work already authorized by the user.

## Apply

1. Describe the required repository navigation, tool use, and engineering judgment as capabilities rather than naming a model generation. Preserve focused routing and project-specific constraints.
2. Use README links for context discovery when needed, then read the contracts relevant to the requested change. Remove unconditional whole-project documentation passes for routine edits.
3. Consolidate duplicated verification instructions in one agent-policy section. Keep the same required checks and workflow-sensitive Local CI boundary. Permit local checks, fixes caused by the requested change, and affected retries within existing authorization; run additional verification only for a new change, failure, or unresolved concern.
4. Preserve dependency, lasting-write, irreversible-action, and explicit workflow checkpoints. Existing authorization carries through necessary work within its scope and does not permit unrelated actions.
5. For To Spec, state the target and write the settled contract when the user has requested specification. Ask only about material unresolved choices; do not infer permission to implement the feature.
6. Update the feature spec, architecture rules, and ADR record. [ADR-066](../../../docs/adrs/implemented/ADR-066-scope-agent-guidance-to-the-task.md) records the template's rationale.

## Fallback

Merge the policy into existing agent instructions instead of replacing them. Preserve additional guidance when a concrete failure or fragile workflow justifies it. This update does not remove an adopted product skill, lower quality gates, or change Project Start's approved-plan requirement.

## Verify

- Validate the updated skill with the target repository's skill validator.
- Review a settled specification request: it should write to the owned spec without asking for the same approval again.
- Review an unresolved architecture choice and an unapproved Project Start Plan: both must still stop at their documented boundary.
- Run formatting and update-patch syntax checks.
