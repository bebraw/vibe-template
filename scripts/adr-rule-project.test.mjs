import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { stringify } from "yaml";

const cli = fileURLToPath(new URL("./adr-rules.mjs", import.meta.url));
const rule = "archive-access";
const catalog = {
  [rule]: {
    questions: {
      public: { question: "Who can read a public archive?", options: { all: "Every visitor.", members: "Signed-in members." } },
      private: { question: "Who can read a private archive?", options: { owner: "Its owner." } },
    },
  },
};
const head = { id: rule, replaces: "ADR-008", answers: { public: "all", private: "owner" }, evidence: "test/access.test.mjs" };

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "project-adr-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const path of ["docs/adrs/implemented", "docs/adrs/proposed", "test"]) mkdirSync(join(root, path), { recursive: true });
  const index = join(root, "docs/adrs/README.md");
  writeFileSync(index, "<!-- adr-rules:start -->\n\n<!-- adr-rules:end -->\n");
  writeFileSync(join(root, head.evidence), "// The evidence is read, never executed.\n");
  function glossary(value) {
    writeFileSync(join(root, "docs/adrs/project-rules.yaml"), stringify(value));
  }
  function record(id, revision, status = "implemented") {
    const path = join(root, "docs/adrs", status, id + "-access.yaml");
    writeFileSync(
      path,
      stringify({
        adrSchema: 1,
        id,
        title: "Archive access",
        date: "2026-08-01",
        status,
        context: "Archive access changed.",
        decision: "Adopt the new access policy.",
        rules: [revision],
      }),
    );
    return path;
  }
  function run(...args) {
    return spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: "utf8" });
  }
  glossary(catalog);
  record("ADR-008", { id: rule, answers: { public: "members" } });
  record("ADR-002", head);
  return { glossary, record, run, index };
}

test("published project rules resolve local questions and options through the CLI, JSON and generated index", (t) => {
  const { run, index } = fixture(t);
  const query = run(rule);
  assert.equal(query.status, 0, query.stderr);
  assert.match(query.stdout, /Who can read a public archive\? — Every visitor\./);
  assert.match(query.stdout, /Who can read a public archive\? — Signed-in members\./);
  assert.match(query.stdout, /Who can read a private archive\? — Its owner\./);
  assert.match(query.stdout, /History ADR-008 → ADR-002/);
  assert.match(query.stdout, /test\/access\.test\.mjs/);
  const json = run("--json");
  assert.equal(json.status, 0, json.stderr);
  const { projectRules, rules } = JSON.parse(json.stdout);
  assert.deepEqual(projectRules, catalog);
  assert.deepEqual(
    rules[0].history.map(({ answers }) => answers),
    [{ public: "members" }, { public: "all", private: "owner" }],
  );
  const write = run("--write-index");
  assert.equal(write.status, 0, write.stderr);
  assert.match(readFileSync(index, "utf8"), /Who can read a private archive\? — Its owner\./);
  assert.equal(run("--check").status, 0);
});

test("draft review compares project answers in the project's vocabulary", (t) => {
  const { run, record } = fixture(t);
  const draft = record("ADR-010", { id: rule, replaces: "ADR-002", answers: { public: "members", private: "owner" } }, "proposed");
  const before = run("--json").stdout;
  const review = run("--check-draft", draft);
  assert.equal(review.status, 0, review.stderr);
  assert.match(review.stdout, /Who can read a public archive\?\s+Every visitor\. → Signed-in members\./);
  assert.doesNotMatch(review.stdout, /Who can read a private archive/);
  assert.match(review.stdout, /Implemented verification\s+test\/access\.test\.mjs/);
  assert.match(review.stdout, /Proposed verification\s+pending/);
  assert.equal(run("--json").stdout, before);
});

test("every selected project answer belongs to its question and current and proposed revisions answer each question", (t) => {
  const { run, record } = fixture(t);
  for (const [revision, error] of [
    [{ ...head, id: "unknown-policy" }, /unknown-policy/],
    [{ ...head, answers: { public: "all", secret: "owner" } }, /unknown question secret/],
    [{ ...head, answers: { public: "owner", private: "owner" } }, /unknown answer owner for public/],
    [{ ...head, answers: { public: "all" } }, /omits question private/],
    [{ ...head, answers: { public: "all", private: "constructor" } }, /unknown answer constructor/],
    [{ ...head, evidence: "test/missing.test.mjs" }, /evidence/],
    [{ ...head, id: "local-ci-readiness" }, /must NOT be valid/],
  ]) {
    record("ADR-002", revision);
    const invalid = run("--json");
    assert.equal(invalid.status, 1, invalid.stdout);
    assert.match(invalid.stderr, error);
  }
  record("ADR-002", head);
  const draft = record("ADR-010", { ...head, replaces: "ADR-002", answers: { public: "all" } }, "proposed");
  const invalid = run("--check-draft", draft);
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /ADR-010-access.yaml.*omits question private/);
});

test("the project glossary rejects a reserved rule name or malformed question before writing the index", (t) => {
  const { glossary, run, index } = fixture(t);
  const before = readFileSync(index);
  for (const value of [
    { "local-ci-readiness": catalog[rule] },
    { "local-mutation-testing": catalog[rule] },
    { [rule]: { questions: { public: { question: "Who can read?", options: {} } } } },
    { [rule]: { questions: { public: { question: "Who can read?", options: { all: " " } } } } },
    { [rule]: { questions: { public: { question: "Who can read?", opts: { all: "Everyone." } } } } },
  ]) {
    glossary(value);
    const invalid = run("--write-index");
    assert.equal(invalid.status, 1);
    assert.match(invalid.stderr, /project-rules.yaml/);
    assert.deepEqual(readFileSync(index), before);
  }
});
