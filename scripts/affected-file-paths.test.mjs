import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(join(import.meta.dirname, "affected-file-utils.mjs")).href;
const zeroSha = "0000000000000000000000000000000000000000";

test("first-push guardrails retain Unicode and whitespace filenames", (t) => {
  const repo = mkdtempSync(join(tmpdir(), "affected-paths-"));
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const env = { ...process.env, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: join(repo, "global-config") };
  delete env.GIT_CONFIG_COUNT;
  delete env.GIT_DIR;
  delete env.GIT_WORK_TREE;
  const git = (...args) => execFileSync("git", args, { cwd: repo, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git("init");
  git("config", "user.name", "Test");
  git("config", "user.email", "test@example.invalid");
  git("config", "commit.gpgsign", "false");
  mkdirSync(join(repo, "src"));
  const files = ["src/échantillon.ts", "src/ leading and trailing .ts", "src/with\nnewline.ts"];
  for (const file of files) writeFileSync(join(repo, file), "export const value = true;\n");
  git("add", ".");
  git("commit", "-m", "add unusual filenames");
  const head = git("rev-parse", "HEAD^{commit}");
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import { getAffectedFiles, normalizeFiles } from ${JSON.stringify(moduleUrl)}; console.log(JSON.stringify(normalizeFiles(getAffectedFiles(process.cwd(), { prePush: true }))));`,
    ],
    { cwd: repo, env, encoding: "utf8", input: `refs/heads/feature ${head} refs/heads/feature ${zeroSha}\n` },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), files.toSorted());
});

for (const scenario of ["different checkout", "missing tracked file", "dangling tracked symlink"]) {
  test(`first push refuses ${scenario} when workspace checks cannot validate it`, (t) => {
    const repo = mkdtempSync(join(tmpdir(), "affected-mismatch-"));
    t.after(() => rmSync(repo, { recursive: true, force: true }));
    const env = { ...process.env, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: join(repo, "global-config") };
    delete env.GIT_CONFIG_COUNT;
    delete env.GIT_DIR;
    delete env.GIT_WORK_TREE;
    const git = (...args) => execFileSync("git", args, { cwd: repo, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    git("init");
    git("config", "user.name", "Test");
    git("config", "user.email", "test@example.invalid");
    git("config", "commit.gpgsign", "false");
    writeFileSync(join(repo, "base.txt"), "base\n");
    git("add", ".");
    git("commit", "-m", "base");
    const base = git("rev-parse", "HEAD^{commit}");
    if (scenario === "dangling tracked symlink") {
      writeFileSync(join(repo, "target.txt"), "target\n");
      symlinkSync("target.txt", join(repo, "link.txt"));
    } else {
      writeFileSync(join(repo, "code.ts"), "export const value = true;\n");
    }
    git("add", ".");
    git("commit", "-m", "feature");
    const head = git("rev-parse", "HEAD^{commit}");
    if (scenario === "different checkout") git("checkout", "--detach", base);
    if (scenario === "missing tracked file") unlinkSync(join(repo, "code.ts"));
    if (scenario === "dangling tracked symlink") unlinkSync(join(repo, "target.txt"));
    const result = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `import { getAffectedFiles } from ${JSON.stringify(moduleUrl)}; getAffectedFiles(process.cwd(), { prePush: true });`,
      ],
      { cwd: repo, env, encoding: "utf8", input: `refs/heads/feature ${head} refs/heads/feature ${zeroSha}\n` },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, scenario === "different checkout" ? /checked.out|checkout/i : /missing|dangling/i);
  });
}

test("new tags retain the existing behavior when pointing away from HEAD", (t) => {
  const repo = mkdtempSync(join(tmpdir(), "affected-tag-"));
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const env = { ...process.env, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: join(repo, "global-config") };
  delete env.GIT_CONFIG_COUNT;
  delete env.GIT_DIR;
  delete env.GIT_WORK_TREE;
  const git = (...args) => execFileSync("git", args, { cwd: repo, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git("init");
  git("config", "user.name", "Test");
  git("config", "user.email", "test@example.invalid");
  git("config", "commit.gpgsign", "false");
  writeFileSync(join(repo, "one.txt"), "one\n");
  git("add", ".");
  git("commit", "-m", "one");
  const oldCommit = git("rev-parse", "HEAD^{commit}");
  writeFileSync(join(repo, "two.txt"), "two\n");
  git("add", ".");
  git("commit", "-m", "two");
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import { getAffectedFiles } from ${JSON.stringify(moduleUrl)}; console.log(JSON.stringify(getAffectedFiles(process.cwd(), { prePush: true })));`,
    ],
    { cwd: repo, env, encoding: "utf8", input: `refs/tags/old ${oldCommit} refs/tags/old ${zeroSha}\n` },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.ok(JSON.parse(result.stdout).includes("one.txt"));
});

test("a failed Git path query reports its original error", (t) => {
  const repo = mkdtempSync(join(tmpdir(), "affected-git-error-"));
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  execFileSync("git", ["init", "--quiet"], { cwd: repo });
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import { getAffectedFiles } from ${JSON.stringify(moduleUrl)}; getAffectedFiles(process.cwd(), { prePush: true });`,
    ],
    { cwd: repo, encoding: "utf8", input: `refs/tags/missing ${"f".repeat(40)} refs/tags/missing ${zeroSha}\n` },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /fatal:|not a valid object|not a tree object/i);
});
