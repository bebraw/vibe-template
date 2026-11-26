import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { selectQualityGateSteps } from "./run-quality-gate.mjs";

const repo = fileURLToPath(new URL("../", import.meta.url));
const id = "local-mutation-testing";

function run(...args) {
  return spawnSync(process.execPath, ["scripts/adr-rules.mjs", ...args], { cwd: repo, encoding: "utf8" });
}

test("the typed local mutation history ends at the policy exercised by the gate commands", () => {
  const result = run("--json");
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
  const result = run("--check");
  assert.equal(result.status, 0, result.stderr);
});

test("Local CI history distinguishes change scope, explicit readiness and the fallback", () => {
  const result = run("--json");
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
  const answer = run(rule.id);
  assert.equal(answer.status, 0, answer.stderr);
  assert.match(answer.stdout, /npm run ci:local/);
  assert.match(answer.stdout, /ADR-019 → ADR-025 → ADR-046/);
  assert.match(answer.stdout, /Policy guidance.*AGENTS\.md#verification/);
});
