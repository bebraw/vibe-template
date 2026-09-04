import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { collectFixtureDependencies, copyManifestFiles } from "./verify-capability-kits.mjs";

test("collects each kit's declared test dependencies with the verification toolchain", () => {
  assert.deepEqual(
    collectFixtureDependencies(
      { dependencies: { dev: { vitest: "4.1.11" } } },
      { "@types/node": "24.13.3", "typescript-7": "npm:typescript@7.0.2", wrangler: "4.127.1" },
    ),
    {
      "@types/node": "24.13.3",
      "typescript-7": "npm:typescript@7.0.2",
      vitest: "4.1.11",
      wrangler: "4.127.1",
    },
  );
});

test("rejects a kit dependency that conflicts with the verification toolchain", () => {
  assert.throws(
    () => collectFixtureDependencies({ dependencies: { dev: { wrangler: "4.126.0" } } }, { wrangler: "4.127.1" }),
    /conflicts with the repository toolchain/,
  );
});

test("copies declared kit files to their adopter paths", async (context) => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "capability-copy-test-"));
  context.after(async () => await rm(temporaryRoot, { force: true, recursive: true }));

  const kitRoot = path.join(temporaryRoot, "kit");
  const fixtureRoot = path.join(temporaryRoot, "fixture");
  await mkdir(path.join(kitRoot, "files", "src"), { recursive: true });
  await writeFile(path.join(kitRoot, "files", "src", "example.ts"), "export const example = true;\n");

  await copyManifestFiles(
    kitRoot,
    { files: [{ source: "files/src/example.ts", target: "src/example.ts", mode: "copy-or-merge" }] },
    fixtureRoot,
  );

  assert.equal(await readFile(path.join(fixtureRoot, "src", "example.ts"), "utf8"), "export const example = true;\n");
});

test("refuses manifest paths that escape the kit or fixture", async () => {
  await assert.rejects(
    copyManifestFiles("/tmp/kit", { files: [{ source: "../secret", target: "src/example.ts" }] }, "/tmp/fixture"),
    /must stay within/,
  );
});
