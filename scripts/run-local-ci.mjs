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
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
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
