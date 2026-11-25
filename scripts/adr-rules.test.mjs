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
  assert.deepEqual(history.map((r) => r.adr).slice(0, 3), ["ADR-022", "ADR-028", "ADR-043"]);
  const current = history.at(-1);
  assert.equal(terms["baseline-local-gate"].script, "quality:gate");
  assert.equal(terms["deep-local-gate"].script, "quality:gate:deep");
  const scripts = JSON.parse(readFileSync(join(repo, "package.json"), "utf8")).scripts;
  assert.equal(scripts.mutation, "stryker run");
  assert.equal(scripts["mutation:incremental"], "stryker run --incremental");
  for (const [term, definition] of Object.entries(terms)) {
    const [node, runner, ...args] = scripts[definition.script].split(" ");
    assert.equal(node, "node");
    assert.equal(runner, "./scripts/run-quality-gate.mjs");
    const phases = selectQualityGateSteps(args).map((phase) => phase.script);
    const expected = { none: [], incremental: ["mutation:incremental"], full: ["mutation"] }[current.gates[term]];
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
