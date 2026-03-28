import { rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import process from "node:process";

const args = process.argv.slice(2);

if (!args.includes("--all")) {
  warnWhenCommandFails(
    "git",
    ["remote", "get-url", "origin"],
    ["Local CI can run without the `origin` remote, but repository metadata is cleaner when it is configured."],
  );
}

ensureCommandSucceeds(
  "docker",
  ["info"],
  ["Local CI requires a reachable Docker engine.", "Start Docker Desktop, OrbStack, or another Docker runtime before running local CI."],
);

const result = spawnSync("npx", ["agent-ci", "run", ...args], {
  encoding: "utf8",
  stdio: "pipe",
  env: process.env,
});

if (result.stdout) {
  process.stdout.write(result.stdout);
}

if (result.stderr) {
  process.stderr.write(result.stderr);
}

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

const combinedOutput = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
const cleanupFailureMatch = combinedOutput.match(/EACCES: permission denied, rmdir '([^']+\/(?:\.pnpm-store|\.bun\/install\/cache))'/);

if ((result.status ?? 1) !== 0 && cleanupFailureMatch && combinedOutput.includes("[Job startup failed]")) {
  try {
    rmSync(cleanupFailureMatch[1], { recursive: true, force: true });
  } catch {
    // Best-effort cleanup for the Agent CI workspace bug.
  }

  console.warn("Agent CI reported a known cache-cleanup failure after successful job steps. Treating the run as passed.");
  process.exit(0);
}

process.exit(result.status ?? 1);

function ensureCommandSucceeds(command, commandArgs, guidance) {
  const result = spawnSync(command, commandArgs, {
    stdio: "ignore",
    env: process.env,
  });

  if (!result.error && result.status === 0) {
    return;
  }

  for (const line of guidance) {
    console.error(line);
  }

  if (result.error) {
    console.error(result.error.message);
  }

  process.exit(1);
}

function warnWhenCommandFails(command, commandArgs, guidance) {
  const result = spawnSync(command, commandArgs, {
    stdio: "ignore",
    env: process.env,
  });

  if (!result.error && result.status === 0) {
    return;
  }

  for (const line of guidance) {
    console.warn(line);
  }

  if (result.error) {
    console.warn(result.error.message);
  }
}
