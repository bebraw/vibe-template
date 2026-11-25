# ADR-076: Pilot Typed ADR Rules

**Status:** Implemented

**Date:** 2026-11-25

## Context

Three decisions changed when local quality gates run mutation tests. ADR-022 introduced a full run, ADR-028 replaced it with an incremental run, and ADR-043 moved that phase into a separately requested deep gate. A reader following only ADR-022's index summary could run the wrong check. Marking all of ADR-022 superseded would discard its still-current decisions about Stryker and the standalone mutation command.

## Decision

Pilot rule-level revisions for `local-mutation-testing`. Each participating decision records its complete gate settings in YAML frontmatter. A later revision names its predecessor for that rule. The quality-gate spec owns the two gate names and maps each to its npm script. The ADR index derives the current settings from this chain. Historical summaries and decision prose retain their original meaning. [Rule contract](../../../specs/adr-rules/spec.md) · [Gate glossary](../../../specs/quality-gate/spec.md)

The current revision cites the gate-runner tests as evidence of phase selection. The historical revisions describe the behavior agreed at the time. This pilot covers local gate scheduling. The standalone mutation command, GitHub workflow, concurrency settings, and score threshold have their own contracts.

Author the rule and glossary schemas directly in JSON Schema Draft 7. Promote Ajv 8.20.0 from the existing lockfile to a direct development dependency so the CLI can validate the same schema files that editors and other tools consume. [Ajv validation guide](https://ajv.js.org/guide/getting-started.html)

## Consequences

A contributor can retrieve the current settings and trace each change to its decision. Changing a typed rule now requires a valid successor and an index refresh. The existing gate tests remain the place to verify which commands run.

## Alternatives Considered

- A hand-maintained table of current rules would duplicate the decision history and leave another place for a stale summary.
- Inferring current rules from ADR status and date would lose partial amendments and treat legacy status labels as implementation state.
- A repository-wide metadata migration would require classifying unrelated historical decisions before this rule can demonstrate the value of the approach.
- In a five-case trial, Valibot 1.5.0 and Ajv 8.20.0 agreed on a valid record, an invalid enum, a missing field, and extra fields at two nesting levels. Valibot also inferred the exact TypeScript union. Its separate `@valibot/to-json-schema` converter preserved those constraints. For this Markdown workflow, authoring the portable schema directly avoids maintaining a conversion step. [Valibot conversion guide](https://valibot.dev/guides/json-schema/)
