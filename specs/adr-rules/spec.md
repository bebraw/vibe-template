# Feature: Typed ADR Rules

## Blueprint

The pilot answers two questions. Which local quality gate runs mutation tests? When does a contributor need to run Local CI? Each participating ADR owns a revision of the relevant rule. The quality-gate spec owns the terms and npm script names used to interpret both histories. The ADR index displays their current answers. [Quality-gate glossary](../quality-gate/spec.md) · [Current rules](../../docs/adrs/README.md#current-typed-rules) · [ADR-076](../../docs/adrs/implemented/ADR-076-pilot-typed-adr-rules.md)

Opt in when contributors repeatedly need a decision's current answer and amendments have changed which cases it covers or what they require. One-off decisions and rationale remain in ordinary ADR prose.

### Sources

- Read opted-in Markdown decisions from `docs/adrs/implemented/`. This directory establishes implementation under [ADR-021](../../docs/adrs/implemented/ADR-021-add-accepted-adr-state.md). Legacy `Accepted` headers can occur here. A superseded decision supplies historical context. Draft and approved-but-pending decisions live outside this directory.
- YAML frontmatter declares `ruleSchema: 1` and a `rules` list. Each revision's `id` selects its payload. `local-mutation-testing` uses `gates`, and `local-ci-readiness` uses `cases`. A successor names its predecessor's ADR identifier in `replaces`. Each current revision cites its `evidence`. [Rule schema](rules.schema.json)
- The quality-gate glossary defines the local gate scripts in `gateTerms`, the Local CI command in `localCi.script`, and the meanings of its readiness cases in `localCi.cases`. [Glossary schema](gate-terms.schema.json)

Each term keeps its meaning across revisions. Introduce a new identifier when a gate's scope or meaning changes, even if its npm command keeps the same name. Retain the previous definition with `retired: true` when the gate leaves current use. It may name a removed script or a name later reused by another gate. The CLI checks vocabulary references. Reviewers check that revised wording preserves each term's meaning.

## Contract

For each rule ID, the predecessor links must form a single chain. The first revision has no predecessor. Each successor points to an existing revision of the same rule, and each revision has at most one successor. Reject duplicate revisions, missing predecessors, disconnected histories, forks, and cycles. The terminal revision supplies the current rule regardless of file order.

Each revision replaces the preceding settings for its rule in full. A current revision must cite evidence and belong to a decision that has not been superseded. Other rules in that ADR retain their own histories. Both rule kinds share the same history traversal, CLI queries, and index generation.

**Mutation scheduling.** ADR-022 scheduled full mutation testing in the `all-changes-local-gate`. ADR-025 kept the full run but narrowed the readiness baseline to non-documentation changes, introducing `baseline-local-gate` for the same command. ADR-028 made the run incremental. ADR-043 moved it to the explicit deep gate. Gate values are `full`, `incremental`, or `none`.

An omitted historical gate has no declaration in that revision. Every historical or current revision may assign at most one gate meaning to a given npm script. The current revision covers exactly the active terms in `gateTerms`, each mapped to a distinct, existing npm script. Its evidence names the gate-runner test file. The integration test compares the active settings with the runner and package scripts. Running Stryker supplies the mutation score.

**Local CI readiness.** Each `cases` key resolves in `localCi.cases`. A revision may assign one common outcome, `required` or `may-skip`, to any number of named cases. Matching any one of those cases selects that outcome. The mandatory `otherwise` gives the outcome when none matches. ADR-019 documented Local CI as the readiness baseline. ADR-025 allowed qualifying documentation-only edits to skip it. ADR-046 requires Local CI for GitHub Actions workflows, package metadata or installation, build or container setup, browser CI setup, or an explicit request for full PR or release readiness. Other changes may skip Local CI. Its evidence links a plain-text heading in the written contributor instructions, such as `AGENTS.md#verification`. Contributors judge which cases apply to their change. [Verification policy](../../AGENTS.md#verification)

### Reviewing a proposal

Run `node scripts/adr-rules.mjs --check-draft <file>` with one typed ADR under `docs/adrs/proposed/`. For each rule it declares, the command validates the draft against the existing schema and glossary and compares it with that rule's latest implemented revision. A successor must name that revision in `replaces`. A supported rule with no implemented history can start without a predecessor. The review reports missing proposal evidence as pending and validates any evidence reference supplied. Evidence is required when the revision becomes current.

For mutation testing, the draft and the implemented head both use the active gate IDs in the repository's glossary. A draft can change the mutation mode assigned to each. For Local CI, the report shows additions and removals of named cases separately from changes to the `otherwise` fallback. A named match takes precedence even for mixed work. An ordinary source edit that also changes browser CI meets the named browser CI condition. Draft review is read-only. The generated index and `--json` continue to describe implemented rules.

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

The CLI reads the repository from the current working directory. Text queries show the gate's scope alongside its command. JSON `terms` preserves the definitions for both active and retired gates. In both outputs, each revision's rationale comes from the first paragraph of the ADR's `## Context` section. The index's lifecycle tables remain manually maintained. Prose-only ADRs and records with unrelated frontmatter remain discoverable there. The CLI owns the generated block, which lists only current typed rules and can be rebuilt from the checked-in decisions and glossary.
