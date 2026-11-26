import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { selectQualityGateSteps } from "./run-quality-gate.mjs";

const repo = fileURLToPath(new URL("../", import.meta.url));
const cli = join(repo, "scripts/adr-rules.mjs");
const id = "local-mutation-testing";

function run(cwd, ...args) {
  return spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8" });
}

test("the typed local mutation history ends at the policy exercised by the gate commands", () => {
  const result = run(repo, "--json");
  assert.equal(result.status, 0, result.stderr);
  const { rules, terms } = JSON.parse(result.stdout);
  const history = rules.find((rule) => rule.id === id).history;
  assert.deepEqual(
    history.slice(0, 4).map((r) => [r.adr, r.gates]),
    [
      ["ADR-022", { "all-changes-local-gate": "full" }],
      ["ADR-025", { "baseline-local-gate": "full" }],
      ["ADR-028", { "baseline-local-gate": "incremental" }],
      ["ADR-043", { "baseline-local-gate": "none", "deep-local-gate": "incremental" }],
    ],
  );
  const current = history.at(-1);
  assert.equal(terms["all-changes-local-gate"].script, "quality:gate");
  assert.equal(terms["baseline-local-gate"].script, "quality:gate");
  assert.equal(terms["deep-local-gate"].script, "quality:gate:deep");
  const scripts = JSON.parse(readFileSync(join(repo, "package.json"), "utf8")).scripts;
  assert.equal(scripts.mutation, "stryker run");
  assert.equal(scripts["mutation:incremental"], "stryker run --incremental");
  for (const [term, mode] of Object.entries(current.gates)) {
    const [node, runner, ...args] = scripts[terms[term].script].split(" ");
    assert.equal(node, "node");
    assert.equal(runner, "./scripts/run-quality-gate.mjs");
    const phases = selectQualityGateSteps(args).map((phase) => phase.script);
    const expected = { none: [], incremental: ["mutation:incremental"], full: ["mutation"] }[mode];
    assert.deepEqual(
      phases.filter((phase) => phase === "mutation" || phase === "mutation:incremental"),
      expected,
      term,
    );
  }
});

test("the committed current-rule index is reproducible", () => {
  const result = run(repo, "--check");
  assert.equal(result.status, 0, result.stderr);
});

test("Local CI history distinguishes change scope, explicit readiness and the fallback", () => {
  const result = run(repo, "--json");
  assert.equal(result.status, 0, result.stderr);
  const { rules, localCi } = JSON.parse(result.stdout);
  const rule = rules.find(({ id }) => id === "local-ci-readiness");
  assert.ok(rule, "missing Local CI rule");
  const [baseline, docsException, scoped] = rule.history;
  assert.deepEqual([baseline.adr, docsException.adr, scoped.adr], ["ADR-019", "ADR-025", "ADR-046"]);
  assert.deepEqual(baseline.cases, { otherwise: "required" });
  assert.deepEqual(docsException.cases, { "documentation-only": "may-skip", otherwise: "required" });
  assert.deepEqual(scoped.cases, {
    "github-actions-workflows": "required",
    "package-or-installation": "required",
    "build-or-container": "required",
    "browser-ci": "required",
    "explicit-full-readiness": "required",
    otherwise: "may-skip",
  });
  assert.equal(scoped.evidence, "AGENTS.md#verification");
  assert.equal(localCi.script, "ci:local");
  const answer = run(repo, rule.id);
  assert.equal(answer.status, 0, answer.stderr);
  assert.match(answer.stdout, /npm run ci:local/);
  assert.match(answer.stdout, /ADR-019 → ADR-025 → ADR-046/);
  assert.match(answer.stdout, /Policy guidance.*AGENTS\.md#verification/);
});

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "adr-rule-pilot-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const dir of ["specs/quality-gate", "docs/adrs/implemented", "checks"]) mkdirSync(join(root, dir), { recursive: true });
  writeFileSync(join(root, "package.json"), JSON.stringify({ scripts: { verify: "node --test" } }));
  writeFileSync(
    join(root, "specs/quality-gate/spec.md"),
    "---\ngateTerms:\n  baseline: { script: verify, definition: Local readiness. }\n---\n",
  );
  writeFileSync(join(root, "checks/local.test.mjs"), 'throw new Error("evidence files are never executed by the CLI");');
  const index = join(root, "docs/adrs/README.md");
  writeFileSync(index, "Before\n<!-- adr-rules:start -->\n<!-- adr-rules:end -->\nAfter\n");
  const path = join(root, "docs/adrs/implemented/ADR-001-example.md");
  const text =
    "---\nruleSchema: 1\nrules:\n  - id: local-mutation-testing\n    gates: { baseline: none }\n    evidence: checks/local.test.mjs\n---\n\n# ADR-001: Example\n\n## Context\n\nThis gate runs on every edit.\n\n## Decision\n\nKeep feedback fast.\n";
  writeFileSync(path, text);
  return { root, index, path, text };
}

function draftFixture(t) {
  const files = fixture(t);
  const { root, text } = files;
  const directory = join(root, "docs/adrs/proposed");
  mkdirSync(directory);
  const draft = join(directory, "ADR-002-review.md");
  const proposal = text
    .replace("ADR-001:", "ADR-002:")
    .replace("    gates:", "    replaces: ADR-001\n    gates:")
    .replace("baseline: none", "baseline: incremental")
    .replace("    evidence: checks/local.test.mjs\n", "");
  writeFileSync(draft, proposal);
  return { ...files, draft, proposal };
}

test("reviewing a typed proposal compares it to the implemented rule without publishing it", (t) => {
  const { root, index, draft, proposal } = draftFixture(t);
  writeFileSync(join(root, "docs/adrs/proposed/ADR-003-unrelated.md"), "---\nruleSchema: 99\n---\n");
  const published = run(root, "--write-index");
  assert.equal(published.status, 0, published.stderr);
  const before = readFileSync(index);
  const rules = run(root, "--json").stdout;
  const review = run(root, "--check-draft", draft);
  assert.equal(review.status, 0, review.stderr);
  for (const detail of [/ADR-002/, /ADR-001/, /local-mutation-testing/, /incremental/, /pending/i]) assert.match(review.stdout, detail);
  assert.deepEqual(readFileSync(index), before);
  assert.equal(readFileSync(draft, "utf8"), proposal);
  assert.equal(run(root, "--json").stdout, rules);
  assert.doesNotMatch(rules, /ADR-002/);
});

function narrowerGateDraft(proposal) {
  return proposal
    .replace(
      "rules:\n",
      ["gateTermReplacements:", "  code-edits: { replaces: baseline, definition: Code changes only. }", "rules:\n"].join("\n"),
    )
    .replace("baseline: incremental", "code-edits: none");
}

test("a draft can narrow a gate's scope while the published rule still answers for all edits", (t) => {
  const { root, index, draft, proposal } = draftFixture(t);
  const glossary = join(root, "specs/quality-gate/spec.md");
  const glossaryText = readFileSync(glossary, "utf8").replace("Local readiness.", "Every edit.");
  writeFileSync(glossary, glossaryText);
  const candidate = narrowerGateDraft(proposal);
  writeFileSync(draft, candidate);
  const published = run(root, "--write-index");
  assert.equal(published.status, 0, published.stderr);
  const before = readFileSync(index);
  const json = run(root, "--json").stdout;
  const review = run(root, "--check-draft", draft);
  assert.equal(review.status, 0, review.stderr);
  assert.match(review.stdout, /Proposed gate scope baseline → code-edits · npm run verify/);
  assert.match(review.stdout, /Every edit\./);
  assert.match(review.stdout, /Code changes only\./);
  assert.match(review.stdout, /none \(unchanged\)/);
  assert.match(run(root, id).stdout, /Every edit\./);
  assert.doesNotMatch(json, /code-edits/);
  assert.equal(run(root, "--json").stdout, json);
  assert.equal(run(root, "--check").status, 0);
  assert.deepEqual(readFileSync(index), before);
  assert.equal(readFileSync(glossary, "utf8"), glossaryText);
});

test("a draft can only replace each active gate once and must name its successor in the rule", (t) => {
  const { root, draft, proposal } = draftFixture(t);
  const glossary = join(root, "specs/quality-gate/spec.md");
  writeFileSync(
    glossary,
    readFileSync(glossary, "utf8").replace(
      "gateTerms:\n",
      "gateTerms:\n  old: { script: verify, definition: Original scope., retired: true }\n",
    ),
  );
  const candidate = narrowerGateDraft(proposal);
  for (const [invalid, diagnostic] of [
    [candidate.replace("code-edits: {", "baseline: {"), /baseline already exists/],
    [candidate.replace("code-edits: {", "old: {"), /old already exists/],
    [candidate.replace("replaces: baseline", "replaces: old"), /old is retired/],
    [candidate.replace("replaces: baseline", "replaces: missing"), /unknown gate to replace missing/],
    [candidate.replace("rules:\n", "  other: { replaces: baseline, definition: Other scope. }\nrules:\n"), /already replaced/],
    [candidate.replace("code-edits: none", "baseline: none"), /retired gate baseline/],
    [candidate.replace("definition: Code changes only.", "definition: '  '"), /pattern/],
    [candidate.replace("replaces: baseline,", "script: another, replaces: baseline,"), /additional properties/],
    [
      candidate
        .replace("local-mutation-testing", "local-ci-readiness")
        .replace("gates: { code-edits: none }", "cases: { otherwise: required }"),
      /must contain/,
    ],
  ]) {
    writeFileSync(draft, invalid);
    const result = run(root, "--check-draft", draft);
    assert.equal(result.status, 1);
    assert.match(result.stderr, diagnostic);
    assert.equal(result.stdout, "");
  }
});

test("adopting a scope change moves its definition to the glossary and preserves the predecessor", (t) => {
  const { root, draft, proposal } = draftFixture(t);
  const candidate = narrowerGateDraft(proposal);
  const implemented = join(root, "docs/adrs/implemented/ADR-002-review.md");
  writeFileSync(implemented, candidate);
  assert.match(run(root, "--json").stderr, /additional properties/);
  rmSync(draft);
  const glossary = join(root, "specs/quality-gate/spec.md");
  writeFileSync(
    glossary,
    readFileSync(glossary, "utf8").replace(
      "definition: Local readiness. }",
      "definition: Local readiness., retired: true }\n  code-edits: { script: verify, definition: Code changes only. }",
    ),
  );
  writeFileSync(
    implemented,
    proposal.replace("baseline: incremental", "code-edits: none").replace("    gates:", "    evidence: checks/local.test.mjs\n    gates:"),
  );
  const result = run(root, "--json");
  assert.equal(result.status, 0, result.stderr);
  const { terms, rules } = JSON.parse(result.stdout);
  assert.deepEqual(
    rules[0].history.map(({ gates }) => gates),
    [{ baseline: "none" }, { "code-edits": "none" }],
  );
  assert.equal(terms.baseline.retired, true);
  assert.equal(terms["code-edits"].definition, "Code changes only.");
  assert.equal(terms["code-edits"].script, terms.baseline.script);
});

test("draft errors identify the offending proposal without printing a partial review", (t) => {
  const { root, index, path, draft, proposal } = draftFixture(t);
  const before = readFileSync(index);
  const firstRule = proposal.split("rules:\n")[1].split("---\n")[0];
  for (const [invalid, problem] of [
    [proposal.replace("baseline:", "typo:"), /unknown gate term typo/],
    [proposal.replace("incremental", "always"), /allowed values/],
    [proposal.replace("replaces: ADR-001", "replaces: ADR-099"), /must replace.*ADR-001/],
    [proposal.replace("    replaces: ADR-001\n", ""), /must replace.*ADR-001/],
    [proposal.replace(firstRule, firstRule + firstRule), /duplicate draft revision/],
    [proposal.replace("    gates:", "    evidence: checks/missing.test.mjs\n    gates:"), /evidence/],
    ["# ADR-002: Ordinary proposal\n", /no typed rule/],
  ]) {
    writeFileSync(draft, invalid);
    const result = run(root, "--check-draft", draft);
    assert.equal(result.status, 1);
    assert.match(result.stderr, problem);
    assert.equal(result.stdout, "");
    assert.deepEqual(readFileSync(index), before);
  }
  writeFileSync(draft, proposal);
  writeFileSync(join(root, "docs/adrs/implemented/ADR-002-prose.md"), "# ADR-002: Published prose\n");
  assert.match(run(root, "--check-draft", draft).stderr, /ADR-002 is already implemented/);
  assert.match(run(root, "--check-draft", path).stderr, /expected a proposal/i);
  assert.match(run(root, "--check-draft").stderr, /usage/i);
});

test("the first typed proposal starts without a predecessor", (t) => {
  const { root, path, draft, proposal } = draftFixture(t);
  writeFileSync(path, "# ADR-001: Legacy prose\n");
  const dangling = run(root, "--check-draft", draft);
  assert.equal(dangling.status, 1);
  assert.match(dangling.stderr, /no implemented predecessor/);
  writeFileSync(draft, proposal.replace("    replaces: ADR-001\n", ""));
  const first = run(root, "--check-draft", draft);
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stdout, /ADR-002/);
});

test("a proposal amending two rules must replace the implemented head of each", (t) => {
  const { root, draft, proposal, text } = draftFixture(t);
  const glossary = join(root, "specs/quality-gate/spec.md");
  writeFileSync(
    glossary,
    readFileSync(glossary, "utf8").replace(/---\n$/, "localCi:\n  script: verify\n  cases: { otherwise: Other work }\n---\n"),
  );
  writeFileSync(join(root, "AGENTS.md"), "## Verification\nRun the workflow.\n");
  const record = "  - id: local-ci-readiness\n    cases: { otherwise: required }\n    evidence: AGENTS.md#verification\n";
  const implemented = text.replace(/rules:\n[^]*?---\n/, "rules:\n" + record + "---\n").replace("ADR-001:", "ADR-003:");
  writeFileSync(join(root, "docs/adrs/implemented/ADR-003-workflow.md"), implemented);
  const candidate = proposal.replace(
    /---\n\n# ADR-002:/,
    record.replace("    cases:", "    replaces: ADR-003\n    cases:") + "---\n\n# ADR-002:",
  );
  writeFileSync(draft, candidate);
  const review = run(root, "--check-draft", draft);
  assert.equal(review.status, 0, review.stderr);
  assert.match(review.stdout, /local-mutation-testing\nImplemented head ADR-001/);
  assert.match(review.stdout, /local-ci-readiness\nImplemented head ADR-003/);
  writeFileSync(draft, candidate.replace("replaces: ADR-003", "replaces: ADR-001"));
  const stale = run(root, "--check-draft", draft);
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /local-ci-readiness must replace the implemented head ADR-003/);
  assert.equal(stale.stdout, "");
});

test("a retired gate keeps its meaning when a successor reuses or removes its command", (t) => {
  const { root, path, text } = fixture(t);
  const glossary = join(root, "specs/quality-gate/spec.md");
  const original = readFileSync(glossary, "utf8");
  writeFileSync(path, text.replace("baseline: none", "all-edits: full"));
  const next = text.replace("ADR-001:", "ADR-002:").replace("    gates:", "    replaces: ADR-001\n    gates:");
  const successor = join(root, "docs/adrs/implemented/ADR-002-successor.md");
  writeFileSync(successor, next);

  for (const script of ["old-verify", "verify"]) {
    const retired = `  all-edits: { script: ${script}, definition: Every edit., retired: true }\n`;
    writeFileSync(glossary, original.replace("gateTerms:\n", "gateTerms:\n" + retired));
    const answer = run(root, id);
    assert.equal(answer.status, 0, answer.stderr);
    const [current, previous] = answer.stdout.split("\n\nADR-001\n");
    assert.match(current, /baseline — npm run verify skips mutation testing/);
    assert.match(current, /Local readiness\./);
    assert.doesNotMatch(current, /all-edits/);
    assert.ok(previous.includes(`all-edits — npm run ${script} runs full mutation testing`));
    assert.match(previous, /Every edit\./);
    assert.doesNotMatch(previous, /Local readiness\./);
  }
  writeFileSync(successor, next.replace("baseline: none", "all-edits: none"));
  const retiredHead = run(root, "--check");
  assert.equal(retiredHead.status, 1);
  assert.match(retiredHead.stderr, /retired.*all-edits|all-edits.*retired/);

  writeFileSync(successor, next);
  writeFileSync(path, text.replace("baseline: none", "all-edits: full, baseline: none"));
  const ambiguous = run(root, "--check");
  assert.equal(ambiguous.status, 1);
  assert.match(ambiguous.stderr, /duplicate.*verify|verify.*twice/);
});

test("an invalid readiness snapshot cannot overwrite the published index", (t) => {
  const { root, index, path, text } = fixture(t);
  const glossary = join(root, "specs/quality-gate/spec.md");
  const original = readFileSync(glossary, "utf8");
  writeFileSync(
    glossary,
    original.replace(
      /---\n$/,
      "localCi:\n  script: replay\n  cases: { build: Build changes, docs: Documentation edits, otherwise: Other work }\n---\n",
    ),
  );
  writeFileSync(join(root, "package.json"), JSON.stringify({ scripts: { verify: "node --test", replay: "local-ci run" } }));
  writeFileSync(join(root, "AGENTS.md"), "## Verification\n\nReplay the workflow for build changes.\n\n~~~md\n## Example\n~~~\n");
  const snapshot = text
    .replace("local-mutation-testing", "local-ci-readiness")
    .replace("gates: { baseline: none }", "cases: { build: required, otherwise: may-skip }")
    .replace("checks/local.test.mjs", "AGENTS.md#verification");
  writeFileSync(path, snapshot);
  const publish = run(root, "--write-index");
  assert.equal(publish.status, 0, publish.stderr);
  const before = readFileSync(index, "utf8");
  for (const [from, to, diagnostic] of [
    ["otherwise: may-skip", "docs: required", /otherwise/],
    ["build: required", "build: sometimes", /allowed values/],
    ["build: required", "buid: required", /unknown case buid/],
    ["build: required", "build: required, docs: may-skip", /same outcome/],
    ["cases: {", "gates: {", /cases/],
    ["AGENTS.md#verification", "checks/local.test.mjs", /pattern/],
    ["AGENTS.md#verification", "AGENTS.md#removed", /heading/],
    ["AGENTS.md#verification", "AGENTS.md#example", /heading/],
  ]) {
    writeFileSync(path, snapshot.replace(from, to));
    const result = run(root, "--write-index");
    assert.equal(result.status, 1, to);
    assert.match(result.stderr, diagnostic, to);
    assert.equal(readFileSync(index, "utf8"), before);
  }
});

test("query, freshness check and explicit index update work in a mixed legacy corpus", (t) => {
  const { root, index } = fixture(t);
  writeFileSync(join(root, "docs/adrs/implemented/ADR-002-legacy.md"), "---\nowner: &lead Jamie\nreviewers: [*lead]\n---\nLegacy prose.\n");
  const before = readFileSync(index, "utf8");
  const stale = run(root, "--check");
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /stale ADR index/i);
  assert.equal(readFileSync(index, "utf8"), before);
  const update = run(root, "--write-index");
  assert.equal(update.status, 0, update.stderr);
  assert.match(readFileSync(index, "utf8"), /^Before\n[^]*ADR-001[^]*\nAfter\n$/);
  assert.equal(run(root, "--check").status, 0);
  const answer = run(root, id);
  assert.equal(answer.status, 0, answer.stderr);
  assert.match(answer.stdout, /This gate runs on every edit\./);
  assert.equal(run(root, "unrecognized-rule").status, 1);
});

test("closed schema, canonical terms and evidence are validated before an index write", (t) => {
  const { root, index, path, text } = fixture(t);
  const before = readFileSync(index, "utf8");
  for (const [from, to, diagnostic] of [
    ["ruleSchema: 1", "ruleSchema: 2", /constant/],
    ["ruleSchema: 1", "ruleSchema: 1\nruleSchema: 1", /unique/],
    ["baseline: none", "baseline: optional", /allowed values/],
    ["baseline: none", "base-line: full", /unknown gate term/],
    ["gates: {", "gatez: {", /required|additional properties/],
    ["checks/local.test.mjs", "checks/missing.test.mjs", /evidence/],
    ["checks/local.test.mjs", "../private.test.mjs", /pattern/],
    ["# ADR-001:", "# ADR-101:", /title/],
    ["## Context", "## Background", /Context/],
    ["## Context", "**Status:** Superseded by ADR-003\n\n## Context", /superseded ADR-001/],
  ]) {
    writeFileSync(path, text.replace(from, to));
    const result = run(root, "--write-index");
    assert.equal(result.status, 1, to);
    assert.match(result.stderr, diagnostic, to);
    assert.equal(readFileSync(index, "utf8"), before, to);
  }
});

test("current policies cover every glossary term and refer to distinct existing commands", (t) => {
  const { root } = fixture(t);
  const glossary = join(root, "specs/quality-gate/spec.md");
  const original = readFileSync(glossary, "utf8");
  writeFileSync(join(root, "package.json"), JSON.stringify({ scripts: { verify: "node --test", deep: "node --test --deep" } }));
  for (const [script, diagnostic] of [
    ["deep", /omits deep/],
    ["verify", /duplicate gate command/],
    ["unknown", /unknown npm script/],
  ]) {
    writeFileSync(glossary, original.trimEnd().replace(/---$/, `  deep: {script: ${script}, definition: Extended readiness.}\n---\n`));
    const result = run(root, "--json");
    assert.equal(result.status, 1, script);
    assert.match(result.stderr, diagnostic, script);
    assert.equal(result.stdout, "");
  }
});
