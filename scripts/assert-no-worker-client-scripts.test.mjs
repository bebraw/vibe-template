import assert from "node:assert/strict";
import test from "node:test";

import { findWorkerClientScriptViolations, getWorkerClientSourceLocation } from "./assert-no-worker-client-scripts.mjs";

test("allows empty same-origin asset module tags regardless of attribute order", () => {
  assert.deepEqual(
    findWorkerClientScriptViolations(`
      <script type="module" src="/assets/browser-entry.js"></script>
      <script defer src='/assets/nested/progressive-form.js' type='MODULE'> \n </script>
    `),
    [],
  );
});

test("rejects inline, remote, non-module, and non-asset scripts", () => {
  const violations = findWorkerClientScriptViolations(`
    <script>window.alert("inline")</script>
    <script type="module" src="https://cdn.example/app.js"></script>
    <script src="/assets/classic.js"></script>
    <script type="module" src="/other/app.js"></script>
  `);

  assert.deepEqual(
    violations.map(({ name }) => name),
    [
      "inline or malformed <script> tag",
      "non-local browser module <script> tag",
      "non-local browser module <script> tag",
      "non-local browser module <script> tag",
    ],
  );
});

test("rejects content inside an otherwise allowed module script", () => {
  assert.deepEqual(
    findWorkerClientScriptViolations('<script src="/assets/app.js" type="module">fallback()</script>').map(({ name }) => name),
    ["inline or malformed <script> tag"],
  );
});

test("rejects malformed and duplicate module attributes", () => {
  assert.deepEqual(
    findWorkerClientScriptViolations(`
      <script src="/assets/app.js"type="module"></script>
      <script src="/assets/app.js" src="/assets/other.js" type="module"></script>
      <script src="/assets/app.js" type="module" />
    `).map(({ name }) => name),
    ["inline or malformed <script> tag", "inline or malformed <script> tag", "inline or malformed <script> tag"],
  );
});

test("rejects asset paths that normalize outside the allowed directory", () => {
  assert.deepEqual(
    findWorkerClientScriptViolations(`
      <script type="module" src="/assets/../outside.js"></script>
      <script type="module" src="/assets/%2e%2e/outside.js"></script>
      <script type="module" src="//example.com/assets/app.js"></script>
    `).map(({ name }) => name),
    ["non-local browser module <script> tag", "non-local browser module <script> tag", "non-local browser module <script> tag"],
  );
});

test("continues to reject inline handlers and javascript URLs", () => {
  assert.deepEqual(
    findWorkerClientScriptViolations('<button onclick="submit()"><a href="javascript:submit()">Submit</a></button>').map(
      ({ name }) => name,
    ),
    ["inline event handler attribute", "javascript: URL"],
  );
});

test("preserves the source location of the opening script tag", () => {
  const source = `const document = \`<main>Safe</main>
  <script src="https://example.com/app.js" type="module"></script>\`;`;

  const violations = findWorkerClientScriptViolations(source);

  assert.deepEqual(violations, [
    {
      index: source.indexOf("<script"),
      name: "non-local browser module <script> tag",
    },
  ]);
  assert.deepEqual(getWorkerClientSourceLocation(source, violations[0].index), { column: 3, line: 2 });
});
