import { spawnSync } from "node:child_process";
import { chmodSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";

function isGitWorktree() {
  const result = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
    encoding: "utf8",
  });

  return !result.error && result.status === 0 && result.stdout.trim() === "true";
}

if (!isGitWorktree()) {
  console.log("Git hook setup skipped: no usable Git worktree found.");
  process.exit(0);
}

const existing = spawnSync("git", ["config", "--path", "--get", "core.hooksPath"], {
  stdio: ["ignore", "pipe", "pipe"],
  env: process.env,
  encoding: "utf8",
});

if (existing.error || (existing.status !== 0 && existing.status !== 1)) {
  console.error(`Git hook setup failed: ${existing.error?.message ?? existing.stderr.trim()}`);
  process.exit(1);
}

const existingPath = existing.status === 0 ? existing.stdout.replace(/\r?\n$/, "") : null;
if (existingPath !== null && (!existingPath || resolve(existingPath) !== resolve(".githooks"))) {
  console.warn(
    `Git hook setup skipped: existing core.hooksPath is ${JSON.stringify(existingPath)}. Integrate .githooks/pre-push with the existing hooks to enable the repo guardrails.`,
  );
  process.exit(0);
}

const prePushHookPath = join(process.cwd(), ".githooks", "pre-push");

if (existsSync(prePushHookPath)) {
  chmodSync(prePushHookPath, 0o755);
}

if (existingPath !== null) {
  console.log("Repo Git hooks are already configured at .githooks.");
  process.exit(0);
}

const result = spawnSync("git", ["config", "--local", "core.hooksPath", ".githooks"], {
  env: process.env,
  stdio: "inherit",
});

if (result.error) {
  console.error(`Git hook setup failed: ${result.error.message}`);
  process.exit(1);
}

if ((result.status ?? 1) !== 0) {
  process.exit(result.status ?? 1);
}

console.log("Configured repo Git hooks at .githooks.");
