import { spawnSync } from "node:child_process";
import { chmodSync, existsSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const gitPath = join(process.cwd(), ".git");

if (!existsSync(gitPath)) {
  console.log("Git hook setup skipped: no .git directory found.");
  process.exit(0);
}

const prePushHookPath = join(process.cwd(), ".githooks", "pre-push");

if (existsSync(prePushHookPath)) {
  chmodSync(prePushHookPath, 0o755);
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
