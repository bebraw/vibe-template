import assert from "node:assert/strict";
import test from "node:test";

import { findNodeBuiltinImports } from "./assert-no-worker-node-imports.mjs";

test("finds static, dynamic, and CommonJS Node built-in imports", () => {
  assert.deepEqual(
    findNodeBuiltinImports(`
      import { readFile } from "node:fs/promises";
      export { join } from "path";
      const crypto = await import("node:crypto");
      const util = require("util");
    `),
    ["node:fs/promises", "path", "node:crypto", "util"],
  );
});

test("allows web and application module imports", () => {
  assert.deepEqual(
    findNodeBuiltinImports(`
      import styles from "./styles.css";
      export { handler } from "./handler";
      const module = await import("package-name");
    `),
    [],
  );
});
