# ADR-076: Pilot Typed ADR Rules

**Status:** Implemented

**Date:** 2026-11-25

## Context

Three decisions changed when local quality gates run mutation tests. ADR-022 introduced a full run, ADR-028 replaced it with an incremental run, and ADR-043 moved that phase into a separately requested deep gate. A reader following only ADR-022's index summary could run the wrong check. Marking all of ADR-022 superseded would discard its still-current decisions about Stryker and the standalone mutation command.

Local CI readiness evolved through a different kind of decision. ADR-019 documented a baseline for contributors, ADR-025 exempted qualifying documentation-only work, and ADR-046 narrowed the requirement to workflow-sensitive changes and explicit full-readiness requests. This history tests whether the same query can explain a written policy whose evidence is contributor guidance.

## Decision

Pilot two rule kinds under `ruleSchema: 1`. Each participating ADR records the complete settings for its rule and identifies its predecessor. Both kinds share history resolution, query commands, and the renderer that produces their CLI and index rows. The quality-gate spec defines the vocabulary and commands. [Rule contract](../../../specs/adr-rules/spec.md) · [Quality-gate glossary](../../../specs/quality-gate/spec.md)

- `local-mutation-testing` records each gate's mutation phase in `gates`. ADR-043 cites the tests that exercise phase selection. The standalone mutation command, GitHub workflow, concurrency settings, and score threshold have their own contracts.
- `local-ci-readiness` records when a contributor should run Local CI in `cases`. Specific cases are alternatives with a common outcome, and `otherwise` covers every nonmatching change or request. ADR-046 cites the verification instructions as policy evidence. Contributors apply this guidance when assessing readiness. [Verification policy](../../../AGENTS.md#verification)

Author the rule and glossary schemas directly in JSON Schema Draft 7. Promote Ajv 8.20.0 from the existing lockfile to a direct development dependency so the CLI can validate the same schema files that editors and other tools consume. [Ajv validation guide](https://ajv.js.org/guide/getting-started.html)

## Consequences

A contributor can retrieve both current answers and trace each change to its decision. Changing a typed rule requires a valid successor and an index refresh. A substantive change in a glossary term's meaning requires a new identifier so historical revisions remain interpretable.

## Alternatives Considered

- A hand-maintained table of current rules would duplicate the decision history and leave another place for a stale summary.
- Inferring current rules from ADR status and date would lose partial amendments and treat legacy status labels as implementation state.
- A repository-wide metadata migration would require classifying unrelated historical decisions before this rule can demonstrate the value of the approach.
- In a five-case trial, Valibot 1.5.0 and Ajv 8.20.0 agreed on a valid record, an invalid enum, a missing field, and extra fields at two nesting levels. Valibot also inferred the exact TypeScript union. Its separate `@valibot/to-json-schema` converter preserved those constraints. For this Markdown workflow, authoring the portable schema directly avoids maintaining a conversion step. [Valibot conversion guide](https://valibot.dev/guides/json-schema/)
