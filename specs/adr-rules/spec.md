# Feature: Typed ADR Rules

## Blueprint

The pilot answers “Which local quality gate runs mutation tests, and which decisions changed it?” Each participating ADR owns one revision of `local-mutation-testing`. The [quality-gate spec](../quality-gate/spec.md) owns the gate identifiers, their definitions, and their npm script names. The [ADR index](../../docs/adrs/README.md#current-typed-rules) displays the current revision. [ADR-076](../../docs/adrs/implemented/ADR-076-pilot-typed-adr-rules.md)

### Sources

- Read opted-in Markdown decisions from `docs/adrs/implemented/`. This directory establishes implementation under [ADR-021](../../docs/adrs/implemented/ADR-021-add-accepted-adr-state.md). Legacy `Accepted` headers can occur here. A superseded decision supplies historical context. Draft and approved-but-pending decisions live outside this directory.
- Version 1 of the [rule schema](rules.schema.json) uses YAML frontmatter with `ruleSchema: 1` and a `rules` list. The only supported `id` is `local-mutation-testing`. Each revision declares a `gates` map. A successor supplies `replaces` with its predecessor's ADR identifier. A revision may cite a repository-relative `evidence` file. Additional rule kinds require a schema change.
- Gate keys resolve through `gateTerms` in the quality-gate spec, validated against the [glossary schema](gate-terms.schema.json). In the pilot, the values `full`, `incremental`, and `none` mean a clean mutation run, an incremental mutation run, and no scheduled mutation phase respectively.

## Contract

For each rule ID, the predecessor links must form a single chain. The first revision has no predecessor. Each successor points to an existing revision of the same rule, and each revision has at most one successor. Reject duplicate revisions, missing predecessors, disconnected histories, forks, and cycles. The terminal revision supplies the current rule regardless of file order.

Each revision replaces the previous gate map in full. An omitted historical gate has no declaration in that revision. The current revision must cover every gate in the glossary, cite an evidence file, and belong to a decision that has not been superseded. An explicit `none` records the decision to skip the phase. Each glossary term names a distinct, existing npm script. Replacing this rule leaves other decisions in the same ADR independent. The pilot follows ADR-022 → ADR-028 → ADR-043.

The evidence link in ADR-043 identifies tests for the commands selected by each local gate. The validator checks that the evidence points to a file in the repository. The integration test separately compares the live declarations to the gate runner and npm script definitions. These tests exercise scheduling. Running Stryker supplies evidence of mutation-test results.

### Query and verification

| Command                                             | Result                                                                                                                                                                |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node scripts/adr-rules.mjs`                        | Show current typed rules.                                                                                                                                             |
| `node scripts/adr-rules.mjs local-mutation-testing` | Show the selected rule and its decision history.                                                                                                                      |
| `node scripts/adr-rules.mjs --json`                 | Emit `terms` and a `rules` array. Each entry contains its `id` and ordered `history`.                                                                                 |
| `node scripts/adr-rules.mjs --check`                | Check metadata, references to npm scripts and evidence files, and the generated index section without writing files. A stale section or invalid rule fails the check. |
| `node scripts/adr-rules.mjs --write-index`          | Refresh only the section between the `adr-rules:start` and `adr-rules:end` comments in the ADR index.                                                                 |
| `node --test scripts/run-quality-gate.test.mjs`     | Exercise baseline and deep gate selection through the runner.                                                                                                         |
| `node --test scripts/adr-rules.test.mjs`            | Verify the CLI contract and compare the current rule to the repository's actual gate commands.                                                                        |

The CLI reads the repository from the current working directory. In its text and JSON output, the rationale for each revision comes from the first paragraph of the ADR's `## Context` section. The index's lifecycle tables remain manually maintained. Prose-only ADRs and records with unrelated frontmatter remain discoverable there. The CLI owns the generated block, which lists only current typed rules and can be rebuilt from the checked-in decisions and glossary.
