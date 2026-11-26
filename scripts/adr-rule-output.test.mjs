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
  assert.match(result, /deep-local-gate[^\n]*\n[^\n]*The explicit local depth check\./);
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

test("draft comparisons distinguish gate meanings sharing a command and distinguish a missing declaration from an explicit skip", () => {
  const id = "local-mutation-testing";
  const previous = { id, adr: "ADR-022", gates: { original: "full" } };
  const draft = { id, adr: "ADR-025", gates: { replacement: "none" } };
  const definition = {
    ...definitions[id],
    cases: {
      original: { script: "quality:gate", definition: "Every change." },
      replacement: { script: "quality:gate", definition: "Source changes." },
    },
  };
  const answer = output.describeDraftRule(draft, previous, definition);
  assert.match(answer, /Draft ADR-025 · local-mutation-testing/);
  assert.match(answer, /Implemented head ADR-022/);
  assert.match(answer, /Removed gate original · npm run quality:gate — Every change\.\n\s+runs full mutation testing → no declaration/);
  assert.match(answer, /Added gate replacement · npm run quality:gate — Source changes\.\n\s+no declaration → skips mutation testing/);
});

const scopeDefinition = {
  ...definitions[rule.id],
  cases: {
    ...definitions[rule.id].cases,
    "source-local-gate": { script: "quality:gate", definition: "The local check for source changes." },
  },
};
const scopeReplacement = { "source-local-gate": { replaces: "baseline-local-gate", definition: "The local check for source changes." } };

test("a proposed gate scope change pairs both definitions and identifies preserved full mutation testing", () => {
  const previous = rule.history[0];
  const draft = { id: rule.id, adr: "ADR-025", gates: { "source-local-gate": "full" } };
  assert.equal(
    output.describeDraftRule(draft, previous, scopeDefinition, scopeReplacement),
    [
      "Draft ADR-025 · local-mutation-testing",
      "Implemented head ADR-022",
      "Settings (implemented → proposed)",
      "  Proposed gate scope baseline-local-gate → source-local-gate · npm run quality:gate",
      "    Current scope  The routine local check.",
      "    Proposed scope  The local check for source changes.",
      "    Mutation mode  full (unchanged)",
      "Proposed verification  pending",
    ].join("\n"),
  );
});

test("the scope pair reports a changed mutation mode alongside changes to other gates", () => {
  const previous = { ...rule.history[0], gates: { "baseline-local-gate": "full", "deep-local-gate": "none" } };
  const draft = { id: rule.id, adr: "ADR-025", gates: { "source-local-gate": "incremental", "deep-local-gate": "full" } };
  const answer = output.describeDraftRule(draft, previous, scopeDefinition, scopeReplacement);
  assert.match(answer, /Mutation mode  full → incremental/);
  assert.match(
    answer,
    /Changed gate deep-local-gate · npm run quality:gate:deep[^\n]*\n\s+skips mutation testing → runs full mutation testing/,
  );
});

test("previewing new vocabulary for the first typed mutation rule identifies the missing implemented mode", () => {
  const draft = { id: rule.id, adr: "ADR-001", gates: { "source-local-gate": "full" } };
  const answer = output.describeDraftRule(draft, undefined, scopeDefinition, scopeReplacement);
  assert.match(answer, /Implemented head none/);
  assert.match(answer, /Current scope  The routine local check\./);
  assert.match(answer, /Mutation mode  no implemented rule → full/);
});

test("a Local CI draft shows removed and added conditions even when the outcomes for isolated cases stay the same", () => {
  const id = "local-ci-readiness";
  const previous = { id, adr: "ADR-019", cases: { workflow: "required", otherwise: "may-skip" } };
  const draft = { id, adr: "ADR-025", cases: { otherwise: "required", documentation: "may-skip" } };
  const definition = {
    ...definitions[id],
    cases: { ...definitions[id].cases, documentation: { definition: "A documentation change" } },
  };
  const answer = output.describeDraftRule(draft, previous, definition);
  assert.match(answer, /npm run ci:local/);
  assert.match(answer, /Removed condition workflow — A GitHub Actions workflow change\n\s+requires Local CI → no explicit condition/);
  assert.match(answer, /Added condition documentation — A documentation change\n\s+no explicit condition → may skip Local CI/);
  assert.match(answer, /Fallback when no named condition matches\n\s+may skip Local CI → requires Local CI/);
  assert.match(answer, /Any matching named condition takes precedence/);
});

test("an evidence-only draft identifies both references and reports unchanged settings", () => {
  const id = "local-ci-readiness";
  const previous = { id, adr: "ADR-046", cases: { otherwise: "required" }, evidence: "AGENTS.md#verification" };
  const draft = { ...previous, adr: "ADR-077", evidence: "docs/development.md#checks" };
  const answer = output.describeDraftRule(draft, previous, definitions[id]);
  assert.match(answer, /No changed settings\./);
  assert.match(answer, /Fallback when no named condition matches\n\s+requires Local CI \(unchanged\)/);
  assert.match(answer, /Implemented policy guidance {2}AGENTS\.md#verification/);
  assert.match(answer, /Proposed policy guidance {2}docs\/development\.md#checks/);
});

test("a new rule reports the proposed settings and pending evidence before implementation", () => {
  const id = "local-ci-readiness";
  const draft = { id, adr: "ADR-019", cases: { otherwise: "required" } };
  const answer = output.describeDraftRule(draft, undefined, definitions[id]);
  assert.match(answer, /Implemented head none/);
  assert.match(answer, /Fallback when no named condition matches\n\s+no implemented rule → requires Local CI/);
  assert.match(answer, /Proposed policy guidance {2}pending/);
  assert.doesNotMatch(answer, /No changed settings/);
});
