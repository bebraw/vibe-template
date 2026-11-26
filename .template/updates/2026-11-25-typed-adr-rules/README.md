# Migrate an architecture decision log to YAML

Adopt this pack when you want one schema for authoring and validating the project's decisions. Projects can adopt the record format independently of the template's mutation-testing and Local CI histories. A project that skips the pack can continue using the workflow at its current template revision. [Format decision](../../../docs/adrs/implemented/ADR-077-store-decisions-in-yaml.yaml) · [Record and rule contract](../../../specs/adr-rules/spec.md)

## Apply

1. Work on a branch with the current decision log committed. Inspect `patch.diff` with `git apply --check <path-to-pack>/patch.diff`. It adds Ajv 8.20.0 as a direct development dependency. Apply the patch or add the dependency to the destination manifest. The tools also use the template's existing YAML 2.9.1 and Prettier 3.10.1. Run the destination's pinned npm to update its lockfile and verify `npm ci`.
2. Copy `scripts/adr-record.mjs`, `scripts/adr-rule*.mjs`, `scripts/adr-migrate-*.mjs`, `scripts/migrate-adrs*.mjs`, and `specs/adr-rules/` from this template revision. Keep the destination's own decision IDs, lifecycle directories and index. The portable tests create disposable repositories. This template's separate `scripts/template-adr-policy.test.mjs` checks its own commands and decision numbers.
3. Run `node scripts/migrate-adrs.mjs` from the destination root to preview all three lifecycle directories and the affected references. Resolve any unsupported metadata or filename collision before applying. Run `node scripts/migrate-adrs.mjs --write` and review the diff. Verify decisions, amendment directions and any custom sections. Repository Markdown links and update manifests can point to the YAML files. Update external bookmarks and references in other repositories manually. Archived patch contents continue to describe the tree they originally targeted.
4. Point the project's ADR authoring instructions at its migrated proposal template and the new schema. Update any project-specific scripts that consumed Markdown ADR headings. If the project already published typed rules during the Markdown pilot, run `node scripts/adr-rules.mjs --write-index` to regenerate their links. Run `node scripts/adr-rules.mjs --check`. Include that command in the existing quality gate. A project with ordinary decisions can finish here. A fresh template clone retiring the sample policies can remove their rule declarations, glossary and template-policy assertions, and keep the same record check.

## Adopt a policy history

Add `rules` only to decisions that establish or revise a policy the team wants to query. Start a history with a single current decision if that is all the project documents. Add the relevant glossary in `specs/quality-gate/spec.md`. Retain historical term IDs and give a changed meaning a new ID. Cite the destination's own evidence. [Template glossary](../../../specs/quality-gate/spec.md)

- For mutation scheduling, record `gates` and cite the test for gate selection. Query it with `node scripts/adr-rules.mjs local-mutation-testing`.
- For Local CI readiness, record named `cases` and an `otherwise` fallback. Cite the heading that defines the contributor policy. Query it with `node scripts/adr-rules.mjs local-ci-readiness`.

Put `<!-- adr-rules:start -->` and `<!-- adr-rules:end -->` on separate lines in the ADR index. Run `node scripts/adr-rules.mjs --write-index`, review the generated section, and run `node scripts/adr-rules.mjs --check`. Check each modeled policy against the project's own commands. [Draft review and promotion](../../../specs/adr-rules/spec.md#reviewing-a-proposal)

## Verify

Run `node --test scripts/adr-rule*.test.mjs scripts/adr-migrate-*.test.mjs scripts/migrate-adrs.test.mjs`, then the destination's normal quality and installation checks. Confirm a second `node scripts/migrate-adrs.mjs` reports zero Markdown decisions. Record `2026-11-25-typed-adr-rules` in the destination's applied update history after verification.
