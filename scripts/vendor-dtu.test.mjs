import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { deserialize } from "node:v8";

const require = createRequire(import.meta.url);
const localCiRequire = createRequire(require.resolve("run-local-ci/native-launcher"));
const dtuEntry = pathToFileURL(localCiRequire.resolve("dtu-github-actions"));
const configUrl = new URL("../config.js", dtuEntry);

function importConfig(overrides = {}) {
  const env = { ...process.env };
  for (const key of ["GITHUB_WEBHOOK_SECRET", "DTU_URL", "DTU_PORT", "DTU_CACHE_DIR"]) delete env[key];

  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      'import { serialize } from "node:v8"; const { config } = await import(process.argv[1]); process.stdout.write(serialize(config));',
      configUrl.href,
    ],
    { env: { ...env, ...overrides }, timeout: 10_000 },
  );
  assert.ifError(result.error);
  return result;
}

function loadConfig(overrides) {
  const result = importConfig(overrides);
  assert.equal(result.status, 0, result.stderr.toString());
  // Unlike JSON, V8 serialization preserves the existing infinite-number behavior.
  return deserialize(result.stdout);
}

test("Local CI resolves a DTU package without a Zod dependency", () => {
  const manifest = JSON.parse(readFileSync(new URL("../../package.json", dtuEntry), "utf8"));

  assert.equal(manifest.name, "dtu-github-actions");
  assert.equal(manifest.dependencies?.zod, undefined, "DTU must not install Zod");
});

test("the lockfile retains no DTU dependency on Zod", () => {
  const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
  const entries = Object.entries(lock.packages).filter(([location]) => location.endsWith("/dtu-github-actions"));

  assert.ok(entries.length > 0, "DTU must remain in the locked Local CI dependency tree");
  for (const [location, entry] of entries) {
    assert.equal(entry.dependencies?.zod, undefined, `${location} must not resolve Zod`);
  }
});

test("DTU uses defaults when environment variables are absent", () => {
  assert.deepEqual(loadConfig(), {
    GITHUB_WEBHOOK_SECRET: "local-ci-local",
    DTU_URL: "http://localhost:8910",
    DTU_PORT: 8910,
    DTU_CACHE_DIR: join(tmpdir(), "dtu_cache"),
  });
});

test("DTU uses explicit values without normalizing strings", () => {
  assert.deepEqual(
    loadConfig({
      GITHUB_WEBHOOK_SECRET: " custom-secret ",
      DTU_URL: " https://example.com/mock ",
      DTU_PORT: "9123",
      DTU_CACHE_DIR: "./custom-cache",
    }),
    {
      GITHUB_WEBHOOK_SECRET: " custom-secret ",
      DTU_URL: " https://example.com/mock ",
      DTU_PORT: 9123,
      DTU_CACHE_DIR: "./custom-cache",
    },
  );
});

test("DTU preserves empty cache paths and whitespace-only secrets", () => {
  const config = loadConfig({ DTU_CACHE_DIR: "", GITHUB_WEBHOOK_SECRET: " " });

  assert.equal(config.DTU_CACHE_DIR, "");
  assert.equal(config.GITHUB_WEBHOOK_SECRET, " ");
});

for (const [value, expected] of [
  ["", 0],
  [" ", 0],
  ["0", 0],
  [" 9123 ", 9123],
  ["1e3", 1000],
  ["0x10", 16],
  ["-1", -1],
  ["1.5", 1.5],
  ["65536", 65536],
  ["Infinity", Infinity],
  ["-Infinity", -Infinity],
]) {
  test(`DTU preserves numeric coercion for DTU_PORT=${JSON.stringify(value)}`, () => {
    assert.equal(loadConfig({ DTU_PORT: value }).DTU_PORT, expected);
  });
}

for (const value of ["http://[::1]:8910", "mailto:local@example.com"]) {
  test(`DTU accepts the URL ${value} unchanged`, () => {
    assert.equal(loadConfig({ DTU_URL: value }).DTU_URL, value);
  });
}

for (const [key, value] of [
  ["GITHUB_WEBHOOK_SECRET", ""],
  ["DTU_URL", ""],
  ["DTU_URL", "not a url"],
  ["DTU_URL", "/relative"],
  ["DTU_URL", "http://"],
  ["DTU_PORT", "not-a-number"],
  ["DTU_PORT", "8910junk"],
  ["DTU_PORT", "NaN"],
]) {
  test(`DTU rejects invalid ${key}=${JSON.stringify(value)} at startup`, () => {
    const result = importConfig({ [key]: value });

    assert.equal(result.status, 1, result.stderr.toString());
    assert.match(result.stderr.toString(), new RegExp(key));
  });
}
