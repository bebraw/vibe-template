# Feature: Typed ADR Rules

## Blueprint

The pilot answers two questions. Which local quality gate runs mutation tests? When does a contributor need to run Local CI? Each participating ADR owns a revision of the relevant rule. The quality-gate spec owns the terms and npm script names used to interpret both histories. The ADR index displays their current answers. [Quality-gate glossary](../quality-gate/spec.md) · [Current rules](../../docs/adrs/README.md#current-typed-rules) · [ADR-076](../../docs/adrs/implemented/ADR-076-pilot-typed-adr-rules.md)

### Sources

- Read opted-in Markdown decisions from `docs/adrs/implemented/`. This directory establishes implementation under [ADR-021](../../docs/adrs/implemented/ADR-021-add-accepted-adr-state.md). Legacy `Accepted` headers can occur here. A superseded decision supplies historical context. Draft and approved-but-pending decisions live outside this directory.
- YAML frontmatter declares `ruleSchema: 1` and a `rules` list. Each revision's `id` selects its payload. `local-mutation-testing` uses `gates`, and `local-ci-readiness` uses `cases`. A successor names its predecessor's ADR identifier in `replaces`. Each current revision cites its `evidence`. [Rule schema](rules.schema.json)
- The quality-gate glossary defines the local gate scripts in `gateTerms`, the Local CI command in `localCi.script`, and the meanings of its readiness cases in `localCi.cases`. [Glossary schema](gate-terms.schema.json)

Each term keeps its meaning across revisions. Introduce a new identifier for a substantive change of meaning and retain the old definition so earlier decisions remain readable. The CLI checks references to the vocabulary. Reviewers check that revised wording preserves its meaning.

## Contract

For each rule ID, the predecessor links must form a single chain. The first revision has no predecessor. Each successor points to an existing revision of the same rule, and each revision has at most one successor. Reject duplicate revisions, missing predecessors, disconnected histories, forks, and cycles. The terminal revision supplies the current rule regardless of file order.

Each revision replaces the preceding settings for its rule in full. A current revision must cite evidence and belong to a decision that has not been superseded. Other rules in that ADR retain their own histories. Both rule kinds share the same history traversal, CLI queries, and index generation.

**Mutation scheduling.** ADR-022 → ADR-028 → ADR-043 traces a full run, then an incremental run, then an incremental run in the explicit deep gate. Gate values are `full`, `incremental`, or `none`. An omitted historical gate has no declaration in that revision. The current revision covers every gate in `gateTerms`, each mapped to a distinct, existing npm script. Its evidence names the gate-runner test file. The integration test compares the declared settings with the runner and package scripts. Running Stryker supplies the mutation score.

**Local CI readiness.** Each `cases` key resolves in `localCi.cases`. A revision may assign one common outcome, `required` or `may-skip`, to any number of named cases. Matching any one of those cases selects that outcome. The mandatory `otherwise` gives the outcome when none matches. ADR-019 documented Local CI as the readiness baseline. ADR-025 allowed qualifying documentation-only edits to skip it. ADR-046 requires Local CI for GitHub Actions workflows, package metadata or installation, build or container setup, browser CI setup, or an explicit request for full PR or release readiness. Other changes may skip Local CI. Its evidence links a plain-text heading in the written contributor instructions, such as `AGENTS.md#verification`. Contributors judge which cases apply to their change. [Verification policy](../../AGENTS.md#verification)

### Query and verification

| Command                                             | Result                                                                                                                                                                |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node scripts/adr-rules.mjs`                        | Show current typed rules.                                                                                                                                             |
| `node scripts/adr-rules.mjs local-mutation-testing` | Show which gates run mutation testing and trace their revisions.                                                                                                      |
| `node scripts/adr-rules.mjs local-ci-readiness`     | Show when Local CI is required or may be skipped and trace the decisions that changed this guidance.                                                                  |
| `node scripts/adr-rules.mjs --json`                 | Emit `terms` and a `rules` array. Each rule has an `id` and ordered `history`. When the Local CI glossary is present, also emit `localCi`.                            |
| `node scripts/adr-rules.mjs --check`                | Check metadata, references to npm scripts and evidence files, and the generated index section without writing files. A stale section or invalid rule fails the check. |
| `node scripts/adr-rules.mjs --write-index`          | Refresh only the section between the `adr-rules:start` and `adr-rules:end` comments in the ADR index.                                                                 |
| `node --test scripts/run-quality-gate.test.mjs`     | Exercise baseline and deep gate selection through the runner.                                                                                                         |
| `node --test scripts/adr-rules.test.mjs`            | Verify both rule queries, the documented Local CI outcomes, and mutation scheduling against the actual gate commands.                                                 |

The CLI reads the repository from the current working directory. In its text and JSON output, the rationale for each revision comes from the first paragraph of the ADR's `## Context` section. The index's lifecycle tables remain manually maintained. Prose-only ADRs and records with unrelated frontmatter remain discoverable there. The CLI owns the generated block, which lists only current typed rules and can be rebuilt from the checked-in decisions and glossary.
