import assert from "node:assert/strict";
import test from "node:test";
import { convertMarkdownAdr } from "./adr-migrate-markdown.mjs";

const path = "docs/adrs/implemented/ADR-123-example.md";
const source = [
  "# ADR-123: An example",
  "**Status:** Accepted",
  "**Date:** 2024-02-29",
  "## Context",
  "Keep the original *emphasis*.  \nThis line follows a hard break.",
  "## Decision",
  "    keep indentation\n    on both lines",
].join("\n\n");

test("converts a legacy implemented decision and keeps the source Markdown of its sections", () => {
  assert.deepEqual(convertMarkdownAdr(source, path), {
    adrSchema: 1,
    id: "ADR-123",
    title: "An example",
    status: "implemented",
    recordedStatus: "accepted",
    date: "2024-02-29",
    context: "Keep the original *emphasis*.  \nThis line follows a hard break.",
    decision: "    keep indentation\n    on both lines",
  });
});

test("keeps preamble, relationships and extra sections without taking metadata from quoted code", () => {
  const metadata = [
    "**Status:** Superseded by [ADR-140](./ADR-140-new.md)",
    "**Amended by:** ADR-127",
    "**Amended by:** [ADR-127](./ADR-127-first.md), [ADR-134](./ADR-134-next.md)",
    "**Supersedes:** ADR-100",
    "**Amends:** ADR-099",
  ].join("\n\n");
  const note = "The older [discussion](./why.md#reason) still applies.";
  const code = "```markdown\n## Decision\n**Status:** Accepted\n```";
  const alreadyWritten = source.replace("**Status:** Accepted", metadata).replace("## Context", note + "\n\n## Context");
  const record = convertMarkdownAdr(alreadyWritten + "\n\n## Verification\n\n" + code, path);
  assert.equal(record.status, "superseded");
  assert.deepEqual(record.supersededBy, ["ADR-140"]);
  assert.deepEqual(record.amendedBy, ["ADR-127", "ADR-134"]);
  assert.deepEqual(record.amends, ["ADR-099"]);
  assert.deepEqual(record.supersedes, ["ADR-100"]);
  assert.equal(record.preamble, note);
  assert.deepEqual(record.extraSections, [{ heading: "Verification", body: code }]);
});

test("keeps accepted proposals distinct and omits the date placeholder only for a proposal template", () => {
  assert.equal(convertMarkdownAdr(source, path.replace("implemented", "accepted")).status, "accepted");
  const proposedPath = path.replace("implemented", "proposed");
  const proposed = source.replace("Accepted", "Proposed");
  assert.ok(!Object.hasOwn(convertMarkdownAdr(proposed.replace("**Date:** 2024-02-29\n\n", ""), proposedPath), "date"));
  assert.throws(() => convertMarkdownAdr(proposed.replace("2024-02-29", "YYYY-MM-DD"), proposedPath), /Invalid Date/);
  const template = source.replaceAll("ADR-123", "ADR-000").replace("Accepted", "Proposed").replace("2024-02-29", "YYYY-MM-DD");
  const record = convertMarkdownAdr(template, "docs/adrs/proposed/ADR-000-template.md");
  assert.equal(record.status, "proposed");
  assert.ok(!Object.hasOwn(record, "date"));
});

test("refuses ambiguous metadata, missing sections, or mismatched lifecycle labels", () => {
  for (const [input, issue] of [
    [source.replace("Accepted", "Proposed"), /Status/],
    [source.replace("2024-02-29", "2023-02-29"), /Date/],
    [source.replace("**Date:**", "**Owner:**"), /Owner/],
    [source.replace("## Context", "**Amends:** [ADR-122](./ADR-120-wrong.md)\n\n## Context"), /relationship/i],
    [source.replace("## Context", "## Decision"), /uplicate/],
  ]) {
    assert.throws(() => convertMarkdownAdr(input, path), issue);
  }
});

test("moves opted-in rule revisions and draft-only gate proposals without reinterpreting their data", () => {
  const headers = [
    "---",
    "ruleSchema: 1",
    "rules:",
    "  - id: local-mutation-testing",
    "    replaces: ADR-022",
    "    gates: { code-gate: full }",
    "gateTermReplacements:",
    "  code-gate: { replaces: baseline, definition: Code changes only. }",
    "---",
  ].join("\r\n");
  const prose = source.replace("Accepted", "Proposed").replaceAll("\n", "\r\n");
  const record = convertMarkdownAdr("\uFEFF" + headers + "\r\n\r\n" + prose, path.replace("implemented", "proposed"));
  assert.deepEqual(record.rules, [{ id: "local-mutation-testing", replaces: "ADR-022", gates: { "code-gate": "full" } }]);
  assert.deepEqual(record.gateTermReplacements, { "code-gate": { replaces: "baseline", definition: "Code changes only." } });
  assert.ok(!Object.hasOwn(record, "ruleSchema"));
  assert.equal(record.context, "Keep the original *emphasis*.  \r\nThis line follows a hard break.");
});

test("rejects frontmatter it cannot preserve", () => {
  for (const header of [
    "owner: Jane",
    "ruleSchema: 2\nrules: []",
    "ruleSchema: 1\nrules: []\nowner: Jane",
    "ruleSchema: 1\nruleSchema: 1\nrules: []",
    "ruleSchema: 1\nrules: &items [{ id: example }]\ngateTermReplacements: *items",
  ]) {
    assert.throws(() => convertMarkdownAdr("---\n" + header + "\n---\n\n" + source, path), /frontmatter/i);
  }
});
