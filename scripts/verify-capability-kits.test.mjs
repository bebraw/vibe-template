import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assertGeneratedTypeDriftCoverage,
  collectFixtureDependencies,
  composeCapabilityManifests,
  copyManifestFiles,
  selectFixtureCases,
  writeFixtureFiles,
} from "./verify-capability-kits.mjs";

test("requires generated binding drift checks in a kit's normal verification contract", () => {
  assert.doesNotThrow(() =>
    assertGeneratedTypeDriftCoverage({ generatedFiles: ["worker-configuration.d.ts"], verify: ["npm run types:check"] }),
  );
  assert.throws(
    () => assertGeneratedTypeDriftCoverage({ generatedFiles: ["worker-configuration.d.ts"], verify: ["npm run types"] }),
    /types:check/,
  );
});

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

test("composes kit dependencies, scripts, configuration, and replacement declarations", () => {
  assert.deepEqual(
    composeCapabilityManifests([
      {
        dependencies: {
          dev: { "@vitest/coverage-istanbul": "4.1.11", vitest: "4.1.11" },
          removeDev: ["@vitest/coverage-v8"],
        },
        scripts: { types: "wrangler types" },
        wrangler: { durable_objects: { bindings: [{ class_name: "RoomState", name: "ROOM_STATE" }] } },
      },
      {
        dependencies: { dev: { "@vitest/coverage-v8": "4.1.11", vitest: "4.1.11" } },
        scripts: { test: "vitest run" },
        wrangler: { assets: { directory: "./public" } },
      },
    ]),
    {
      dependencies: {
        dev: { "@vitest/coverage-istanbul": "4.1.11", vitest: "4.1.11" },
      },
      generatedFiles: [],
      scripts: { test: "vitest run", types: "wrangler types" },
      verify: [],
      wrangler: {
        assets: { directory: "./public" },
        durable_objects: { bindings: [{ class_name: "RoomState", name: "ROOM_STATE" }] },
      },
    },
  );
});

test("rejects conflicting scripts while composing kits", () => {
  assert.throws(
    () => composeCapabilityManifests([{ scripts: { build: "first" } }, { scripts: { build: "second" } }]),
    /script build conflicts/,
  );
});

test("keeps browser-only composition checks out of the fast capability lane", () => {
  assert.deepEqual(
    selectFixtureCases("browser").map(({ fixtureName }) => fixtureName),
    ["standard-adopter"],
  );
  assert.deepEqual(
    selectFixtureCases("fast").map(({ fixtureName }) => fixtureName),
    ["workers-ai", "room-state", "browser-static-assets", "standard-adopter"],
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

test("writes a test-only Wrangler config without omitted remote bindings", async (context) => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "capability-wrangler-test-config-"));
  context.after(async () => await rm(temporaryRoot, { force: true, recursive: true }));

  await writeFixtureFiles({
    definition: {
      testWranglerOmit: ["ai"],
      wrangler: {
        ai: { binding: "AI" },
        durable_objects: { bindings: [{ class_name: "RoomState", name: "ROOM_STATE" }] },
        main: "src/worker.ts",
      },
    },
    dependencies: {},
    fixtureRoot: temporaryRoot,
    manifest: { scripts: {}, wrangler: { vars: { AI_MODEL: "test-model" } } },
    packageManager: "npm@11.19.1",
    root: temporaryRoot,
  });

  assert.deepEqual(JSON.parse(await readFile(path.join(temporaryRoot, "wrangler.test.jsonc"), "utf8")), {
    durable_objects: { bindings: [{ class_name: "RoomState", name: "ROOM_STATE" }] },
    main: "src/worker.ts",
    vars: { AI_MODEL: "test-model" },
  });
});
