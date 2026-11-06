import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(join(import.meta.dirname, "affected-file-utils.mjs")).href;
const zeroSha = "0000000000000000000000000000000000000000";

test("first push of a multi-commit branch includes earlier changed files", (t) => {
  const repo = mkdtempSync(join(tmpdir(), "affected-first-push-"));
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
  writeFileSync(join(repo, "first.ts"), "export const first = true;\n");
  git("add", ".");
  git("commit", "-m", "first");
  writeFileSync(join(repo, "second.txt"), "second\n");
  git("add", ".");
  git("commit", "-m", "second");
  const head = git("rev-parse", "--verify", "HEAD^{commit}");
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import { getAffectedFiles } from ${JSON.stringify(moduleUrl)}; console.log(JSON.stringify(getAffectedFiles(process.cwd(), { prePush: true })));`,
    ],
    {
      cwd: repo,
      env,
      encoding: "utf8",
      input: `refs/heads/feature ${head} refs/heads/feature ${zeroSha}\n`,
    },
  );
  assert.equal(result.status, 0, result.stderr);
  const files = JSON.parse(result.stdout);
  assert.ok(files.includes("first.ts"));
  assert.ok(files.includes("second.txt"));
});
