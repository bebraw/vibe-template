import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const scripts = [resolve("scripts/setup-git-hooks.mjs"), resolve(".capabilities/pre-push-quality-gate/files/scripts/setup-git-hooks.mjs")];

function withRepository(run) {
  const directory = mkdtempSync(join(tmpdir(), "vibe-hooks-test-"));
  const repo = join(directory, "repo");
  const globalConfig = join(directory, "gitconfig");
  mkdirSync(repo);
  writeFileSync(globalConfig, "");
  const env = { ...process.env, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: globalConfig };
  delete env.GIT_CONFIG_COUNT;
  delete env.GIT_DIR;
  delete env.GIT_WORK_TREE;
  const git = (...args) => spawnSync("git", args, { cwd: repo, env, encoding: "utf8" });
  assert.equal(git("init", "--quiet").status, 0);
  mkdirSync(join(repo, ".githooks"));
  writeFileSync(join(repo, ".githooks", "pre-push"), "#!/bin/sh\nexit 0\n");
  try {
    run({ repo, env, git });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

for (const script of scripts) {
  test(`${script}: installs the default hook path when no path is configured`, () => {
    withRepository(({ repo, env, git }) => {
      const result = spawnSync(process.execPath, [script], { cwd: repo, env, encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(git("config", "--get", "core.hooksPath").stdout.trim(), ".githooks");
      assert.equal(statSync(join(repo, ".githooks", "pre-push")).mode & 0o111, 0o111);
    });
  });

  test(`${script}: retains an equivalent inherited repo hook path`, () => {
    withRepository(({ repo, env, git }) => {
      assert.equal(git("config", "--global", "core.hooksPath", "./.githooks").status, 0);
      const result = spawnSync(process.execPath, [script], { cwd: repo, env, encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(git("config", "--get", "core.hooksPath").stdout.trim(), "./.githooks");
      assert.equal(git("config", "--local", "--get", "core.hooksPath").status, 1);
      assert.equal(statSync(join(repo, ".githooks", "pre-push")).mode & 0o111, 0o111);
    });
  });

  test(`${script}: preserves a different local hook path`, () => {
    withRepository(({ repo, env, git }) => {
      assert.equal(git("config", "--local", "core.hooksPath", ".custom-hooks").status, 0);
      const result = spawnSync(process.execPath, [script], { cwd: repo, env, encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(git("config", "--get", "core.hooksPath").stdout.trim(), ".custom-hooks");
      assert.match(result.stdout + result.stderr, /existing.*hooksPath/i);
    });
  });

  test(`${script}: preserves a different inherited hook path`, () => {
    withRepository(({ repo, env, git }) => {
      assert.equal(git("config", "--global", "core.hooksPath", ".global-hooks").status, 0);
      const result = spawnSync(process.execPath, [script], { cwd: repo, env, encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(git("config", "--get", "core.hooksPath").stdout.trim(), ".global-hooks");
      assert.equal(git("config", "--local", "--get", "core.hooksPath").status, 1);
      assert.match(result.stdout + result.stderr, /existing.*hooksPath/i);
    });
  });
}
