import assert from "node:assert/strict";
import test from "node:test";

import { isNonRuntimeFile, shouldRunExpensiveCi } from "./classify-expensive-ci.mjs";

test("skips expensive CI for known non-runtime files", () => {
  const files = [
    "README.md",
    ".prettierignore",
    "docs/development.md",
    "specs/quality-gate/spec.md",
    ".codex/skills/agent-ci/SKILL.md",
    ".github/skills/example/SKILL.md",
    ".template/updates/example/README.md",
  ];

  assert.equal(shouldRunExpensiveCi(files), false);
});

test("runs expensive CI when any file may affect runtime verification", () => {
  assert.equal(shouldRunExpensiveCi(["docs/development.md", "src/worker.ts"]), true);
  assert.equal(shouldRunExpensiveCi(["package.json"]), true);
  assert.equal(shouldRunExpensiveCi([".github/workflows/ci.yml"]), true);
});

test("runs expensive CI when no reliable change set is available", () => {
  assert.equal(shouldRunExpensiveCi([]), true);
});

test("treats unknown paths conservatively", () => {
  assert.equal(isNonRuntimeFile("notes/idea.md"), false);
  assert.equal(isNonRuntimeFile("wrangler.jsonc"), false);
});
