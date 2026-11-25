import assert from "node:assert/strict";
import test from "node:test";

import * as output from "./adr-rule-output.mjs";

const definitions = {
  "local-mutation-testing": {
    cases: {
      "baseline-local-gate": { script: "quality:gate", definition: "The routine local check." },
      "deep-local-gate": { script: "quality:gate:deep", definition: "The explicit local depth check." },
    },
    outcomes: { none: "skips mutation testing", full: "runs full mutation testing", incremental: "runs incremental mutation testing" },
    evidenceLabel: "Verification",
  },
  "local-ci-readiness": {
    cases: { workflow: { definition: "A GitHub Actions workflow change" }, otherwise: { definition: "Other changes" } },
    outcomes: { required: "requires Local CI", "may-skip": "may skip Local CI" },
    script: "ci:local",
    evidenceLabel: "Policy guidance",
  },
};
const rule = {
  id: "local-mutation-testing",
  history: [
    {
      id: "local-mutation-testing",
      adr: "ADR-022",
      source: "docs/adrs/implemented/ADR-022-add-mutation-testing-gate.md",
      rationale: "Coverage alone cannot show whether assertions would catch a regression.",
      gates: { "baseline-local-gate": "full" },
    },
    {
      id: "local-mutation-testing",
      adr: "ADR-043",
      source: "docs/adrs/implemented/ADR-043-make-local-mutation-opt-in.md",
      rationale: "The first `incremental` run still tests every mutant.\nThe baseline runs on every change.",
      gates: { "baseline-local-gate": "none", "deep-local-gate": "incremental" },
      replaces: "ADR-022",
      evidence: "scripts/run-quality-gate.test.mjs",
    },
  ],
};

test("links the current gate policy and its decision history from the ADR index", () => {
  assert.equal(
    output.renderRuleIndex([rule], definitions),
    [
      "### `local-mutation-testing`",
      "",
      "Current decision [ADR-043](implemented/ADR-043-make-local-mutation-opt-in.md) · [Rationale](implemented/ADR-043-make-local-mutation-opt-in.md#context) · [Verification](../../scripts/run-quality-gate.test.mjs)",
      "",
      "- `npm run quality:gate` skips mutation testing.",
      "- `npm run quality:gate:deep` runs incremental mutation testing.",
      "",
      "History [ADR-022](implemented/ADR-022-add-mutation-testing-gate.md) → [ADR-043](implemented/ADR-043-make-local-mutation-opt-in.md)",
    ].join("\n"),
  );
});

test("prints Local CI conditions before the fallback in both outputs and links the policy guidance to its section", () => {
  const id = "local-ci-readiness";
  const history = [
    {
      id,
      adr: "ADR-046",
      source: "docs/adrs/implemented/ADR-046-example.md",
      rationale: "A clean container matters when the workflow changes.",
      cases: { otherwise: "may-skip", workflow: "required" },
      evidence: "AGENTS.md#verification",
    },
  ];
  const index = output.renderRuleIndex([rule, { id, history }], definitions);
  const answer = output.describeRule({ id, history }, definitions);
  for (const text of [index, answer]) {
    assert.match(text, /A GitHub Actions workflow change — requires Local CI\.\n[^\n]*Other changes — may skip Local CI\./);
    assert.match(text, /npm run ci:local/);
  }
  assert.match(index, /\[Policy guidance\]\(\.\.\/\.\.\/AGENTS\.md#verification\)/);
  assert.match(answer, /Policy guidance  AGENTS\.md#verification/);
});

test("encodes a hash in an ADR filename independently of its rationale fragment", () => {
  const current = { ...rule.history.at(-1), source: "docs/adrs/implemented/ADR-043-name#tag.md" };
  const index = output.renderRuleIndex([{ id: rule.id, history: [current] }], definitions);
  assert.match(index, /\[Rationale\]\(implemented\/ADR-043-name%23tag\.md#context\)/);
});

const start = "<!-- adr-rules:start -->";
const end = "<!-- adr-rules:end -->";

test("replaces only the generated block and preserves CRLF and the original end of file", () => {
  const before = `Intro  \r\n\r\n${start}\r\nold content\r\n${end}\r\n\r\nTail `;
  const expected = `Intro  \r\n\r\n${start}\r\n\r\nNew\r\n\r\n- Rule\r\n\r\n${end}\r\n\r\nTail `;
  assert.equal(output.updateRuleIndex(before, "New\n\n- Rule"), expected);
  assert.equal(output.updateRuleIndex(expected, "New\n\n- Rule"), expected);
});

test("preserves LF when markers span the entire document", () => {
  assert.equal(output.updateRuleIndex(`${start}\n${end}`, "Rule"), `${start}\n\nRule\n\n${end}`);
});

test("refuses ambiguous or malformed generated regions", () => {
  for (const lines of [
    [],
    [start],
    [end, start],
    [start, start, end],
    [start, end, end],
    [` ${start}`, end],
    [start, `${end} text`],
    [start, "<!-- adr-rules:stop -->", end],
  ]) {
    assert.throws(() => output.updateRuleIndex(lines.join("\n"), "Rule"), /marker/i, lines.join("\n"));
  }
});

test("refuses to overwrite a historical ADR table enclosed by a misplaced end marker", () => {
  const table = "| ADR | Summary |\n| --- | --- |\n| ADR-022 | Introduced mutation testing. |";
  for (const heading of [
    "## Implemented ADRs",
    "# Implemented ADRs",
    "Implemented ADRs\n---------------",
    "Implemented ADRs\n===============",
  ]) {
    const readme = [start, "### Current rule", heading, table, end].join("\n\n");
    assert.throws(() => output.updateRuleIndex(readme, "Replacement"), /heading/i, heading);
  }
});

test("explains the current commands and traces earlier decisions back to their rationale", () => {
  const result = output.describeRule(rule, definitions);
  assert.match(result, /Current decision.*ADR-043/);
  assert.match(result, /baseline-local-gate — npm run quality:gate skips mutation testing/);
  assert.match(result, /deep-local-gate — npm run quality:gate:deep runs incremental mutation testing/);
  assert.match(result, /ADR-022 → ADR-043/);
  assert.match(result, /npm run quality:gate runs full mutation testing/);
  assert.match(result, /docs\/adrs\/implemented\/ADR-022-add-mutation-testing-gate\.md#context/);
  assert.match(result, /docs\/adrs\/implemented\/ADR-043-make-local-mutation-opt-in\.md#context/);
  assert.match(result, /scripts\/run-quality-gate\.test\.mjs/);
});

test("prints the current decision's rationale verbatim with its Context link before the history", () => {
  const currentOutput = output.describeRule(rule, definitions).split("\n\nHistory ")[0];
  assert.match(currentOutput, /Context when ADR-043 was written/);
  assert.ok(
    currentOutput.includes(
      "The first `incremental` run still tests every mutant.\nThe baseline runs on every change.\n  Source  docs/adrs/implemented/ADR-043-make-local-mutation-opt-in.md#context",
    ),
  );
});
