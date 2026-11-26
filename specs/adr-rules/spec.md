# Architecture decision records and typed rules

## Blueprint

Each architecture decision lives in one standalone YAML record. Its identity, lifecycle, relationships, and optional rule revisions are machine-readable. Its context and decision are Markdown strings. The template models two recurring policy questions. Which gate runs mutation tests? When does a contributor need to run Local CI? [Record schema](record.schema.json) · [Current rules](../../docs/adrs/README.md#current-typed-rules) · [Format decision](../../docs/adrs/implemented/ADR-077-store-decisions-in-yaml.yaml)

### Record format

Start from the [proposal template](../../docs/adrs/proposed/ADR-000-template.yaml). Use `ADR-<number>-<slug>.yaml` and the same ID in the record. Set `adrSchema: 1`, a title, status, context, and decision. Accepted, implemented, and superseded records require a calendar date in `YYYY-MM-DD` format. A proposed record can omit the date. Move the file when its lifecycle changes. Superseded decisions stay in `implemented/`. IDs remain unique across all three directories.

Use separate fields for the trigger, consequences, alternatives, or a preamble when they exist. Use `extraSections` for named sections specific to a decision. Markdown lists, code blocks, and links can appear in prose fields. Relative paths resolve from the record's directory. YAML source files have no Markdown section anchors.

The optional `amends`, `amendedBy`, `supersedes`, and `supersededBy` fields contain ADR IDs. The validator checks each target exists and differs from the source. Record each direction explicitly when warranted. Historical records can describe partial amendments in prose, and an incoming edge can exist without its inverse.

The CLI in `scripts/adr-rules.mjs` assembles the record reader, rule histories, and index renderer. The shared reader in `scripts/adr-record.mjs` applies the same schema to authoring, queries, and migration. Only the one-time migration command imports the legacy Markdown reader. A normal query reads the log and glossary. An explicit index refresh writes the generated block in `docs/adrs/README.md`.

### One-time Markdown migration

From the downstream repository root, run `node scripts/migrate-adrs.mjs` to preview the conversion. Review diagnostics and the planned paths, then run `node scripts/migrate-adrs.mjs --write`. The converter reads legacy template headings and metadata across the three lifecycle directories. It preserves authored Markdown within the corresponding prose fields, any existing rule revisions, and the original accepted label of historical decisions filed as implemented. Review the resulting Git diff and update links from external repositories separately. [Downstream update pack](../../.template/updates/2026-11-25-typed-adr-rules/README.md)

### Optional policy histories

Add `rules` when contributors repeatedly need a policy's current answer and amendments have changed its scope or outcome. A project can validate ordinary records with an empty rule history. Only implemented or superseded records contribute revisions to published answers.

- Each revision's `id` selects its payload. `local-mutation-testing` uses `gates` and `local-ci-readiness` uses `cases`. A successor names its predecessor's ADR identifier in `replaces`. Each current revision cites its `evidence`. [Record schema](record.schema.json)
- The quality-gate glossary defines the local gate scripts in `gateTerms`, the Local CI command in `localCi.script`, and the meanings of its readiness cases in `localCi.cases`. [Glossary](../quality-gate/spec.md) · [Glossary schema](gate-terms.schema.json)

Projects can publish either rule independently. The glossary needs only the vocabulary for the policies the project uses. Each term keeps its meaning across revisions. Introduce a new identifier when a gate's scope or meaning changes, even if its npm command keeps the same name. Retain the previous definition with `retired: true` when the gate leaves current use. It may name a removed script or a name later reused by another gate. The CLI checks vocabulary references. Reviewers check that revised wording preserves each term's meaning.

## Contract

For each rule ID, the predecessor links must form a single chain. The first revision has no predecessor. Each successor points to an existing revision of the same rule, and each revision has at most one successor. Reject duplicate revisions, missing predecessors, disconnected histories, forks, and cycles. The terminal revision supplies the current rule regardless of file order.

Each revision replaces the preceding settings for its rule in full. A current revision must cite evidence and belong to a decision that has not been superseded. Other rules in that ADR retain their own histories. Both rule kinds share the same history traversal, CLI queries, and index generation.

**Mutation scheduling.** ADR-022 scheduled full mutation testing in the `all-changes-local-gate`. ADR-025 kept the full run but narrowed the readiness baseline to non-documentation changes, introducing `baseline-local-gate` for the same command. ADR-028 made the run incremental. ADR-043 moved it to the explicit deep gate. Gate values are `full`, `incremental`, or `none`.

An omitted historical gate has no declaration in that revision. Every historical or current revision may assign at most one gate meaning to a given npm script. The current revision covers exactly the active terms in `gateTerms`, each mapped to a distinct, existing npm script. Its evidence names the gate-runner test file. The integration test compares the active settings with the runner and package scripts. Running Stryker supplies the mutation score.

**Local CI readiness.** Each `cases` key resolves in `localCi.cases`. A revision may assign one common outcome, `required` or `may-skip`, to any number of named cases. Matching any one of those cases selects that outcome. The mandatory `otherwise` gives the outcome when none matches. ADR-019 documented Local CI as the readiness baseline. ADR-025 allowed qualifying documentation-only edits to skip it. ADR-046 requires Local CI for GitHub Actions workflows, package metadata or installation, build or container setup, browser CI setup, or an explicit request for full PR or release readiness. Other changes may skip Local CI. Its evidence links a plain-text heading in the written contributor instructions, such as `AGENTS.md#verification`. Contributors judge which cases apply to their change. [Verification policy](../../AGENTS.md#verification)

### Reviewing a proposal

Run `node scripts/adr-rules.mjs --check-draft <file>` with one typed ADR under `docs/adrs/proposed/`. For each rule it declares, the command validates the draft against the existing schema and glossary and compares it with that rule's latest implemented revision. A successor must name that revision in `replaces`. A supported rule with no implemented history can start without a predecessor. The review reports missing proposal evidence as pending and validates any evidence reference supplied. Evidence is required when the revision becomes current.

For Local CI, the report shows additions and removals of named cases separately from changes to the `otherwise` fallback. A named match takes precedence even for mixed work. An ordinary source edit that also changes browser CI meets the named browser CI condition.

Mutation proposals normally use the active gate IDs in the quality-gate glossary. To preview a new meaning for an existing npm command, add the optional top-level `gateTermReplacements` map. Give the proposed term a fresh ID, identify the active term it would replace, and define the new scope. The proposed term inherits its predecessor's npm script. Include the new ID and the other active gates in the draft's complete mutation revision. [Record schema](record.schema.json)

To try the example against ADR-043, save it as `docs/adrs/proposed/ADR-078-narrow-local-gate.yaml` and pass that path to `--check-draft`.

```yaml
adrSchema: 1
id: ADR-078
title: Narrow the local readiness gate
status: proposed
context: The ordinary readiness gate currently covers tooling changes as well as deployed Worker source.
decision: Limit the ordinary readiness gate to Worker source.
gateTermReplacements:
  worker-source-local-gate:
    replaces: baseline-local-gate
    definition: The local readiness check for changes to deployed Worker source.
rules:
  - id: local-mutation-testing
    replaces: ADR-043
    gates:
      worker-source-local-gate: none
      deep-local-gate: incremental
```

Draft review is read-only. Published queries, JSON, and the index continue to use the canonical glossary and implemented revisions. At implementation, mark the old term `retired: true` in the quality-gate glossary and add the new term with the inherited script and reviewed definition. Remove `gateTermReplacements` from the ADR, keep the new ID in `gates`, and cite the test that verifies the implemented gate in `evidence`.

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
| `node --test scripts/adr-rules.test.mjs`            | Verify the portable validator and queries against disposable projects.                                                                                                |

The CLI reads the repository from the current working directory. Normal commands validate the records in all lifecycle directories. Draft review checks the named proposal against the implemented history. Text queries show the gate scope alongside its command. JSON `terms` preserves both active and retired definitions. Each revision takes its rationale from the first paragraph of `context`.

The index's lifecycle tables retain their human-written summaries. For published rules, place `<!-- adr-rules:start -->` and `<!-- adr-rules:end -->` on separate lines around the generated section. Projects with zero published rules can omit the glossary, npm scripts, and index markers. The template's own policy regression tests live in `scripts/template-adr-policy.test.mjs`. Downstream teams can use the portable fixtures with their own decision numbers and add tests for their own policies.
