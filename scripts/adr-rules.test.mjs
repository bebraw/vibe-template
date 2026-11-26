import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { stringify } from "yaml";

const cli = fileURLToPath(new URL("./adr-rules.mjs", import.meta.url));
const id = "local-mutation-testing";

function run(cwd, ...args) {
  return spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8" });
}

const decision = {
  adrSchema: 1,
  id: "ADR-001",
  title: "Keep feedback fast",
  status: "implemented",
  date: "2025-01-23",
  context: "This gate runs on every edit.",
  decision: "Keep feedback fast.",
};

function writeRecord(path, record) {
  writeFileSync(path, stringify(record));
}

function repository(t) {
  const root = mkdtempSync(join(tmpdir(), "adr-repository-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const stage of ["proposed", "accepted", "implemented"]) mkdirSync(join(root, "docs/adrs", stage), { recursive: true });
  const index = join(root, "docs/adrs/README.md");
  writeFileSync(index, "Before\n<!-- adr-rules:start -->\n<!-- adr-rules:end -->\nAfter\n");
  return { root, index };
}

test("decisions without semantic rules need no glossary or project tooling at any lifecycle stage", (t) => {
  const { root } = repository(t);
  writeRecord(join(root, "docs/adrs/implemented/ADR-001-example.yaml"), decision);
  writeRecord(join(root, "docs/adrs/accepted/ADR-012-second.yaml"), { ...decision, id: "ADR-012", status: "accepted", rules: [] });
  const draft = join(root, "docs/adrs/proposed/ADR-501-third.yaml");
  writeRecord(draft, { ...decision, id: "ADR-501", status: "proposed", date: undefined });
  const result = run(root, "--json");
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).rules, []);
  const review = run(root, "--check-draft", draft);
  assert.equal(review.status, 0, review.stderr);
  assert.match(review.stdout, /ADR-501/);
  const write = run(root, "--write-index");
  assert.equal(write.status, 0, write.stderr);
  const check = run(root, "--check");
  assert.equal(check.status, 0, check.stderr);
});

const baseline = { id, gates: { baseline: "none" }, evidence: "checks/local.test.mjs" };
const gateTerms = { baseline: { script: "verify", definition: "Local readiness." } };

function writeGlossary(root, terms, localCi) {
  const path = join(root, "specs/quality-gate/spec.md");
  writeFileSync(path, "---\n" + stringify({ gateTerms: terms, localCi }) + "---\n");
  return path;
}

test("a downstream project can publish a Local CI history with only its readiness glossary and command", (t) => {
  const { root } = repository(t);
  mkdirSync(join(root, "specs/quality-gate"), { recursive: true });
  writeFileSync(join(root, "package.json"), JSON.stringify({ scripts: { replay: "node checks/replay.mjs" } }));
  const localCi = { script: "replay", cases: { otherwise: "Any release change" } };
  writeGlossary(root, undefined, localCi);
  writeFileSync(join(root, "CONTRIBUTING.md"), "## Releases\n\nReplay the workflow on release changes.\n");
  const readiness = { id: "local-ci-readiness", cases: { otherwise: "required" }, evidence: "CONTRIBUTING.md#releases" };
  writeRecord(join(root, "docs/adrs/implemented/ADR-330-check-releases.yaml"), { ...decision, id: "ADR-330", rules: [readiness] });
  const published = run(root, "--json");
  assert.equal(published.status, 0, published.stderr);
  const { rules, terms, localCi: glossary } = JSON.parse(published.stdout);
  assert.deepEqual(terms, {});
  assert.deepEqual(glossary, localCi);
  assert.deepEqual(
    rules.map(({ id }) => id),
    ["local-ci-readiness"],
  );
  const answer = run(root, "local-ci-readiness");
  assert.equal(answer.status, 0, answer.stderr);
  assert.match(answer.stdout, /npm run replay/);
  assert.match(answer.stdout, /CONTRIBUTING\.md#releases/);
});

function fixture(t) {
  const { root, index } = repository(t);
  for (const dir of ["specs/quality-gate", "checks"]) mkdirSync(join(root, dir), { recursive: true });
  writeFileSync(join(root, "package.json"), JSON.stringify({ scripts: { verify: "node --test" } }));
  writeGlossary(root, gateTerms);
  writeFileSync(join(root, baseline.evidence), 'throw new Error("evidence files are never executed by the CLI");');
  const path = join(root, "docs/adrs/implemented/ADR-001-example.yaml");
  writeRecord(path, { ...decision, rules: [baseline] });
  return { root, index, path };
}

const proposedRule = { id, replaces: "ADR-001", gates: { baseline: "incremental" } };
const proposal = { ...decision, id: "ADR-002", status: "proposed", date: undefined, rules: [proposedRule] };

function draftFixture(t) {
  const files = fixture(t);
  const draft = join(files.root, "docs/adrs/proposed/ADR-002-review.yaml");
  writeRecord(draft, proposal);
  return { ...files, draft };
}

test("normal reads validate YAML records and explain the Markdown migration in every lifecycle directory", (t) => {
  const { root, index } = fixture(t);
  const before = readFileSync(index);
  for (const stage of ["proposed", "accepted", "implemented"]) {
    const directory = join(root, "docs/adrs", stage);
    const path = join(directory, "ADR-820-weekly-release.yaml");
    writeRecord(path, { ...decision, id: "ADR-820", status: stage, decision: "  " });
    const invalid = run(root, "--json");
    assert.equal(invalid.status, 1, stage);
    assert.match(invalid.stderr, /ADR-820-weekly-release\.yaml/);
    assert.match(invalid.stderr, /decision/i);
    rmSync(path);

    const markdown = join(directory, "ADR-820-weekly-release.md");
    writeFileSync(markdown, "# ADR-820: Weekly release\n\n## Decision\n\nShip on Fridays.\n");
    const legacy = run(root, "--write-index");
    assert.equal(legacy.status, 1, stage);
    assert.match(legacy.stderr, /ADR-820-weekly-release\.md/);
    assert.match(legacy.stderr, /migrat.*Markdown/i);
    assert.deepEqual(readFileSync(index), before);
    rmSync(markdown);
  }
});

test("the lifecycle directory constrains status and requires a date for accepted and implemented decisions", (t) => {
  const { root } = repository(t);
  for (const stage of ["accepted", "implemented"]) {
    const path = join(root, "docs/adrs", stage, "ADR-001-example.yaml");
    writeRecord(path, { ...decision, status: stage, date: undefined });
    const undated = run(root, "--json");
    assert.equal(undated.status, 1, stage);
    assert.match(undated.stderr, /date/i);
    writeRecord(path, { ...decision, status: stage, date: "January 23, 2025" });
    const malformed = run(root, "--json");
    assert.equal(malformed.status, 1, stage);
    assert.match(malformed.stderr, /date/i);
    writeRecord(path, { ...decision, status: "proposed" });
    const misplaced = run(root, "--json");
    assert.equal(misplaced.status, 1, stage);
    assert.match(misplaced.stderr, /status|proposed/i);
    rmSync(path);
  }
});

test("calendar dates distinguish leap days from impossible dates", (t) => {
  const { root } = repository(t);
  const path = join(root, "docs/adrs/implemented/ADR-001-example.yaml");
  writeRecord(path, { ...decision, date: "2024-02-29" });
  const leap = run(root, "--json");
  assert.equal(leap.status, 0, leap.stderr);
  writeRecord(path, { ...decision, date: "2025-02-29" });
  const invalid = run(root, "--json");
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /date/i);
});

test("one-way relations can name another lifecycle stage and reject missing or self targets", (t) => {
  const { root } = repository(t);
  const current = join(root, "docs/adrs/implemented/ADR-001-example.yaml");
  writeRecord(join(root, "docs/adrs/accepted/ADR-250-next.yaml"), { ...decision, id: "ADR-250", status: "accepted" });
  writeRecord(current, { ...decision, amendedBy: ["ADR-250"] });
  const valid = run(root, "--json");
  assert.equal(valid.status, 0, valid.stderr);
  for (const target of ["ADR-019", "ADR-001"]) {
    writeRecord(current, { ...decision, amendedBy: [target] });
    const invalid = run(root, "--json");
    assert.equal(invalid.status, 1);
    assert.match(invalid.stderr, /related|amendedBy|relation/i);
    assert.ok(invalid.stderr.includes(target), invalid.stderr);
  }
});

test("decision IDs are unique across lifecycle directories even without semantic rules", (t) => {
  const { root } = repository(t);
  writeRecord(join(root, "docs/adrs/implemented/ADR-001-example.yaml"), decision);
  writeRecord(join(root, "docs/adrs/accepted/ADR-001-other.yaml"), { ...decision, status: "accepted" });
  const duplicate = run(root, "--json");
  assert.equal(duplicate.status, 1);
  assert.match(duplicate.stderr, /duplicate.*ADR-001/i);
});

test("reviewing one proposal ignores unrelated drafts and preserves published results and both inputs", (t) => {
  const { root, index, draft } = draftFixture(t);
  const published = run(root, "--write-index");
  assert.equal(published.status, 0, published.stderr);
  const before = readFileSync(index);
  const draftBefore = readFileSync(draft);
  const rules = run(root, "--json").stdout;
  const unrelated = join(root, "docs/adrs/proposed/ADR-003-unrelated.yaml");
  const legacy = join(root, "docs/adrs/proposed/ADR-004-legacy.md");
  writeFileSync(unrelated, "adrSchema: 99\n");
  writeFileSync(legacy, "# ADR-004: Unmigrated proposal\n");
  const review = run(root, "--check-draft", draft);
  assert.equal(review.status, 0, review.stderr);
  for (const detail of [/ADR-002/, /ADR-001/, /local-mutation-testing/, /incremental/, /pending/i]) assert.match(review.stdout, detail);
  assert.deepEqual(readFileSync(index), before);
  assert.deepEqual(readFileSync(draft), draftBefore);
  rmSync(unrelated);
  rmSync(legacy);
  assert.equal(run(root, "--json").stdout, rules);
  assert.doesNotMatch(rules, /ADR-002/);
});

const replacement = { replaces: "baseline", definition: "Code changes only." };
const narrowerRule = { ...proposedRule, gates: { "code-edits": "none" } };
const narrower = { ...proposal, gateTermReplacements: { "code-edits": replacement }, rules: [narrowerRule] };

test("a draft can narrow a gate's scope while the published rule still answers for all edits", (t) => {
  const { root, index, draft } = draftFixture(t);
  const glossary = writeGlossary(root, { baseline: { script: "verify", definition: "Every edit." } });
  const glossaryText = readFileSync(glossary);
  writeRecord(draft, narrower);
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
  assert.deepEqual(readFileSync(glossary), glossaryText);
});

test("a draft can only replace each active gate once and must name its successor in the rule", (t) => {
  const { root, draft } = draftFixture(t);
  writeGlossary(root, { ...gateTerms, old: { script: "verify", definition: "Original scope.", retired: true } });
  for (const [change, diagnostic] of [
    [{ gateTermReplacements: { baseline: replacement } }, /baseline already exists/],
    [{ gateTermReplacements: { old: replacement } }, /old already exists/],
    [{ gateTermReplacements: { "code-edits": { ...replacement, replaces: "old" } } }, /old is retired/],
    [{ gateTermReplacements: { "code-edits": { ...replacement, replaces: "missing" } } }, /unknown gate to replace missing/],
    [{ gateTermReplacements: { "code-edits": replacement, other: { ...replacement } } }, /already replaced/],
    [{ rules: [proposedRule] }, /retired gate baseline/],
    [{ gateTermReplacements: { "code-edits": { ...replacement, definition: "  " } } }, /pattern|nonblank/],
    [{ gateTermReplacements: { "code-edits": { ...replacement, script: "another" } } }, /additional properties/],
    [{ rules: [{ id: "local-ci-readiness", cases: { otherwise: "required" } }] }, /must contain/],
  ]) {
    writeRecord(draft, { ...narrower, ...change });
    const result = run(root, "--check-draft", draft);
    assert.equal(result.status, 1);
    assert.match(result.stderr, diagnostic);
    assert.equal(result.stdout, "");
  }
});

test("adopting a scope change moves its definition to the glossary and preserves the predecessor", (t) => {
  const { root, draft } = draftFixture(t);
  const implemented = join(root, "docs/adrs/implemented/ADR-002-review.yaml");
  rmSync(draft);
  const record = { ...narrower, status: "implemented", date: "2025-02-05", rules: [{ ...narrowerRule, evidence: baseline.evidence }] };
  writeRecord(implemented, record);
  const invalid = run(root, "--json");
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /ADR-002-review\.yaml/);
  writeGlossary(root, {
    baseline: { ...gateTerms.baseline, retired: true },
    "code-edits": { script: "verify", definition: "Code changes only." },
  });
  writeRecord(implemented, { ...record, gateTermReplacements: undefined });
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
  const { root, index, path, draft } = draftFixture(t);
  const before = readFileSync(index);
  for (const [rules, problem] of [
    [[{ ...proposedRule, gates: { typo: "incremental" } }], /unknown gate term typo/],
    [[{ ...proposedRule, gates: { baseline: "always" } }], /allowed values/],
    [[{ ...proposedRule, replaces: "ADR-099" }], /must replace.*ADR-001/],
    [[{ ...proposedRule, replaces: undefined }], /must replace.*ADR-001/],
    [[proposedRule, { ...proposedRule, gates: { ...proposedRule.gates } }], /duplicate draft revision/],
    [[{ ...proposedRule, evidence: "checks/missing.test.mjs" }], /evidence/],
  ]) {
    writeRecord(draft, { ...proposal, rules });
    const result = run(root, "--check-draft", draft);
    assert.equal(result.status, 1);
    assert.match(result.stderr, problem);
    assert.equal(result.stdout, "");
    assert.deepEqual(readFileSync(index), before);
  }
  writeRecord(draft, proposal);
  writeRecord(join(root, "docs/adrs/implemented/ADR-002-published.yaml"), { ...decision, id: "ADR-002" });
  assert.match(run(root, "--check-draft", draft).stderr, /ADR-002.*already|duplicate.*ADR-002/i);
  assert.match(run(root, "--check-draft", path).stderr, /expected a proposal|proposed/i);
  assert.match(run(root, "--check-draft").stderr, /usage/i);
});

test("the first typed proposal starts without a predecessor", (t) => {
  const { root, path, draft } = draftFixture(t);
  writeRecord(path, decision);
  const dangling = run(root, "--check-draft", draft);
  assert.equal(dangling.status, 1);
  assert.match(dangling.stderr, /no implemented predecessor/);
  writeRecord(draft, { ...proposal, rules: [{ ...proposedRule, replaces: undefined }] });
  const first = run(root, "--check-draft", draft);
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stdout, /ADR-002/);
});

test("a proposal amending two rules must replace the implemented head of each", (t) => {
  const { root, draft } = draftFixture(t);
  writeGlossary(root, gateTerms, { script: "verify", cases: { otherwise: "Other work" } });
  writeFileSync(join(root, "AGENTS.md"), "## Verification\nRun the workflow.\n");
  const readiness = { id: "local-ci-readiness", cases: { otherwise: "required" }, evidence: "AGENTS.md#verification" };
  writeRecord(join(root, "docs/adrs/implemented/ADR-003-workflow.yaml"), { ...decision, id: "ADR-003", rules: [readiness] });
  writeRecord(draft, { ...proposal, rules: [proposedRule, { ...readiness, replaces: "ADR-003" }] });
  const review = run(root, "--check-draft", draft);
  assert.equal(review.status, 0, review.stderr);
  assert.match(review.stdout, /local-mutation-testing\nImplemented head ADR-001/);
  assert.match(review.stdout, /local-ci-readiness\nImplemented head ADR-003/);
  writeRecord(draft, { ...proposal, rules: [proposedRule, { ...readiness, replaces: "ADR-001" }] });
  const stale = run(root, "--check-draft", draft);
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /local-ci-readiness must replace the implemented head ADR-003/);
  assert.equal(stale.stdout, "");
});

test("a retired gate keeps its meaning when a successor reuses or removes its command", (t) => {
  const { root, path } = fixture(t);
  writeRecord(path, { ...decision, rules: [{ ...baseline, gates: { "all-edits": "full" } }] });
  const successorRule = { ...baseline, replaces: "ADR-001" };
  const next = { ...decision, id: "ADR-002", rules: [successorRule] };
  const successor = join(root, "docs/adrs/implemented/ADR-002-successor.yaml");
  writeRecord(successor, next);

  for (const script of ["old-verify", "verify"]) {
    writeGlossary(root, { ...gateTerms, "all-edits": { script, definition: "Every edit.", retired: true } });
    const answer = run(root, id);
    assert.equal(answer.status, 0, answer.stderr);
    const [current, previous] = answer.stdout.split("\n\nADR-001\n");
    assert.match(current, /baseline — npm run verify skips mutation testing/);
    assert.match(current, /Local readiness\./);
    assert.doesNotMatch(current, /all-edits/);
    assert.ok(previous.includes("all-edits — npm run " + script + " runs full mutation testing"));
    assert.match(previous, /Every edit\./);
    assert.doesNotMatch(previous, /Local readiness\./);
  }
  writeRecord(successor, { ...next, rules: [{ ...successorRule, gates: { "all-edits": "none" } }] });
  const retiredHead = run(root, "--check");
  assert.equal(retiredHead.status, 1);
  assert.match(retiredHead.stderr, /retired.*all-edits|all-edits.*retired/);

  writeRecord(successor, next);
  writeRecord(path, { ...decision, rules: [{ ...baseline, gates: { "all-edits": "full", baseline: "none" } }] });
  const ambiguous = run(root, "--check");
  assert.equal(ambiguous.status, 1);
  assert.match(ambiguous.stderr, /duplicate.*verify|verify.*twice/);
});

test("an invalid readiness snapshot cannot overwrite the published index", (t) => {
  const { root, index, path } = fixture(t);
  writeGlossary(root, gateTerms, {
    script: "replay",
    cases: { build: "Build changes", docs: "Documentation edits", otherwise: "Other work" },
  });
  writeFileSync(join(root, "package.json"), JSON.stringify({ scripts: { verify: "node --test", replay: "local-ci run" } }));
  writeFileSync(join(root, "AGENTS.md"), "## Verification\n\nReplay the workflow for build changes.\n\n~~~md\n## Example\n~~~\n");
  const readiness = { id: "local-ci-readiness", cases: { build: "required", otherwise: "may-skip" }, evidence: "AGENTS.md#verification" };
  writeRecord(path, { ...decision, rules: [readiness] });
  const publish = run(root, "--write-index");
  assert.equal(publish.status, 0, publish.stderr);
  const before = readFileSync(index, "utf8");
  for (const [change, diagnostic] of [
    [{ cases: { build: "required", docs: "required" } }, /otherwise/],
    [{ cases: { build: "sometimes", otherwise: "may-skip" } }, /allowed values/],
    [{ cases: { buid: "required", otherwise: "may-skip" } }, /unknown case buid/],
    [{ cases: { build: "required", docs: "may-skip", otherwise: "may-skip" } }, /same outcome/],
    [{ cases: undefined, gates: readiness.cases }, /cases/],
    [{ evidence: "checks/local.test.mjs" }, /pattern/],
    [{ evidence: "AGENTS.md#removed" }, /heading/],
    [{ evidence: "AGENTS.md#example" }, /heading/],
  ]) {
    writeRecord(path, { ...decision, rules: [{ ...readiness, ...change }] });
    const result = run(root, "--write-index");
    assert.equal(result.status, 1);
    assert.match(result.stderr, diagnostic);
    assert.equal(readFileSync(index, "utf8"), before);
  }
});

test("only implemented rule revisions contribute to queries, index updates and freshness checks", (t) => {
  const { root, index } = fixture(t);
  writeRecord(join(root, "docs/adrs/implemented/ADR-002-unrelated.yaml"), { ...decision, id: "ADR-002" });
  for (const [stage, adr] of [
    ["accepted", "ADR-003"],
    ["proposed", "ADR-004"],
  ]) {
    writeRecord(join(root, "docs/adrs", stage, adr + "-next.yaml"), { ...proposal, id: adr, status: stage, date: "2025-02-07" });
  }
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
  assert.doesNotMatch(answer.stdout, /ADR-002|ADR-003|ADR-004/);
  assert.equal(run(root, "unrecognized-rule").status, 1);
});

test("closed schema, canonical terms and evidence are validated before an index write", (t) => {
  const { root, index, path } = fixture(t);
  const before = readFileSync(index, "utf8");
  for (const [change, diagnostic] of [
    [{ adrSchema: 2 }, /constant/],
    [{ unexpected: true }, /additional properties/],
    [{ rules: [{ ...baseline, gates: { baseline: "optional" } }] }, /allowed values/],
    [{ rules: [{ ...baseline, gates: { "base-line": "full" } }] }, /unknown gate term/],
    [{ rules: [{ ...baseline, gates: undefined, gatez: baseline.gates }] }, /required|additional properties/],
    [{ rules: [{ ...baseline, evidence: "checks/missing.test.mjs" }] }, /evidence/],
    [{ rules: [{ ...baseline, evidence: "../private.test.mjs" }] }, /pattern/],
    [{ id: "ADR-101" }, /filename|file name/i],
    [{ context: undefined }, /context/i],
    [{ title: "  " }, /title/i],
    [{ status: "superseded" }, /superseded ADR-001.*successor/i],
  ]) {
    writeRecord(path, { ...decision, rules: [baseline], ...change });
    const result = run(root, "--write-index");
    assert.equal(result.status, 1);
    assert.match(result.stderr, diagnostic);
    assert.equal(readFileSync(index, "utf8"), before);
  }
  const duplicate = stringify(decision) + "adrSchema: 1\n";
  writeFileSync(path, duplicate);
  const invalid = run(root, "--write-index");
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /unique|duplicate/i);
  assert.equal(readFileSync(index, "utf8"), before);
});

test("current policies cover every glossary term and refer to distinct existing commands", (t) => {
  const { root } = fixture(t);
  writeFileSync(join(root, "package.json"), JSON.stringify({ scripts: { verify: "node --test", deep: "node --test --deep" } }));
  for (const [script, diagnostic] of [
    ["deep", /omits deep/],
    ["verify", /duplicate gate command/],
    ["unknown", /unknown npm script/],
  ]) {
    writeGlossary(root, { ...gateTerms, deep: { script, definition: "Extended readiness." } });
    const result = run(root, "--json");
    assert.equal(result.status, 1, script);
    assert.match(result.stderr, diagnostic, script);
    assert.equal(result.stdout, "");
  }
});
