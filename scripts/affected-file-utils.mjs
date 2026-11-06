import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const zeroSha = "0000000000000000000000000000000000000000";

export function getRepoRoot() {
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });

  exitOnSpawnError(result);

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }

  return result.stdout.trim();
}

export function getAffectedFiles(repoRoot, { prePush = process.argv.includes("--pre-push") } = {}) {
  const files = collectPrePushFiles(repoRoot, prePush ? readStdin() : "");

  for (const file of getWorktreeFiles(repoRoot)) {
    files.add(file);
  }

  if (files.size === 0) {
    for (const file of getBranchFiles(repoRoot)) {
      files.add(file);
    }
  }

  return [...files];
}

export function normalizeFiles(files) {
  return [...new Set(files)].filter((file) => existsSync(file)).sort();
}

function readStdin() {
  try {
    return process.stdin.isTTY ? "" : readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

export function run(repoRoot, command, args) {
  const result = spawn(repoRoot, command, args);

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

export function spawn(repoRoot, command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env: process.env,
    stdio: options.encoding ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: options.encoding,
  });

  exitOnSpawnError(result);

  if (!options.allowFailure && (result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }

  return result;
}

function collectPrePushFiles(repoRoot, input) {
  const files = new Set();

  if (input.trim().length === 0) {
    return files;
  }

  for (const line of input.trim().split("\n")) {
    for (const file of getPrePushLineFiles(repoRoot, line)) {
      files.add(file);
    }
  }

  return files;
}

function getPrePushLineFiles(repoRoot, line) {
  const [, localSha, remoteRef, remoteSha] = line.trim().split(/\s+/);

  if (!localSha || localSha === zeroSha) {
    return [];
  }

  if (remoteSha && remoteSha !== zeroSha) {
    return gitFiles(repoRoot, ["diff", "--name-only", "--diff-filter=ACMR", `${remoteSha}..${localSha}`]);
  }

  if (remoteRef?.startsWith("refs/heads/")) {
    const head = spawn(repoRoot, "git", ["rev-parse", "--verify", "HEAD^{commit}"], { encoding: "utf8", allowFailure: true });
    if (head.status !== 0 || head.stdout.trim() !== localSha) {
      console.error("Cannot check a first branch push from a different checkout. Check out the pushed commit and retry.");
      process.exit(1);
    }
  }

  const files = gitFiles(repoRoot, ["ls-tree", "-r", "--name-only", localSha]);
  if (remoteRef?.startsWith("refs/heads/")) {
    const missing = files.filter((file) => !existsSync(join(repoRoot, file)));
    if (missing.length > 0) {
      console.error(
        `Cannot check first branch push: tracked paths are missing or dangling in the workspace: ${missing.map((file) => JSON.stringify(file)).join(", ")}`,
      );
      process.exit(1);
    }
  }
  return files;
}

function getWorktreeFiles(repoRoot) {
  return [
    ...gitFiles(repoRoot, ["diff", "--name-only", "--diff-filter=ACMR", "HEAD"]),
    ...gitFiles(repoRoot, ["diff", "--name-only", "--diff-filter=ACMR", "--cached"]),
    ...gitFiles(repoRoot, ["ls-files", "--others", "--exclude-standard"]),
  ];
}

function getBranchFiles(repoRoot) {
  const upstream = spawn(repoRoot, "git", ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"], {
    encoding: "utf8",
    allowFailure: true,
  });

  if (upstream.status === 0) {
    return gitFiles(repoRoot, ["diff", "--name-only", "--diff-filter=ACMR", `${upstream.stdout.trim()}...HEAD`]);
  }

  const previousCommit = spawn(repoRoot, "git", ["rev-parse", "--verify", "HEAD~1"], {
    encoding: "utf8",
    allowFailure: true,
  });

  if (previousCommit.status === 0) {
    return gitFiles(repoRoot, ["diff", "--name-only", "--diff-filter=ACMR", "HEAD~1..HEAD"]);
  }

  return gitFiles(repoRoot, ["ls-files"]);
}

function gitFiles(repoRoot, args) {
  const result = spawn(repoRoot, "git", [args[0], "-z", ...args.slice(1)], { encoding: "utf8", allowFailure: true });
  if ((result.status ?? 1) !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }
  return result.stdout.split("\0").filter(Boolean);
}

function exitOnSpawnError(result) {
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
}
