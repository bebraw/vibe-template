import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const zeroSha = "0000000000000000000000000000000000000000";
const nonRuntimeFiles = new Set([
  ".gitignore",
  ".prettierignore",
  ".prettierrc.json",
  "AGENTS.md",
  "ARCHITECTURE.md",
  "LICENSE",
  "README.md",
]);
const nonRuntimePrefixes = [".agents/", ".asdlc/", ".codex/", ".github/skills/", ".template/", "docs/", "specs/"];

export function shouldRunExpensiveCi(files) {
  return files.length === 0 || files.some((file) => !isNonRuntimeFile(file));
}

export function isNonRuntimeFile(file) {
  return (
    nonRuntimeFiles.has(file) ||
    (!file.includes("/") && file.endsWith(".md")) ||
    nonRuntimePrefixes.some((prefix) => file.startsWith(prefix))
  );
}

export function classifyCommitRange(baseSha, headSha, cwd = process.cwd()) {
  if (!isCommitSha(baseSha) || !isCommitSha(headSha) || baseSha === zeroSha) {
    return true;
  }

  ensureCommit(baseSha, cwd);
  ensureCommit(headSha, cwd);

  const result = runGit(["diff", "--name-only", "--diff-filter=ACMRD", "-z", baseSha, headSha], cwd);
  const files = result.stdout.split("\0").filter(Boolean);

  return shouldRunExpensiveCi(files);
}

function ensureCommit(sha, cwd) {
  const existing = runGit(["cat-file", "-e", `${sha}^{commit}`], cwd, true);

  if (existing.status === 0) {
    return;
  }

  runGit(["fetch", "--no-tags", "--depth=1", "origin", sha], cwd);
}

function runGit(args, cwd, allowFailure = false) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    throw result.error;
  }

  if (!allowFailure && result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args[0]} failed`);
  }

  return result;
}

function isCommitSha(value) {
  return /^[0-9a-f]{40}$/i.test(value ?? "");
}

function isDirectRun() {
  return process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
}

if (isDirectRun()) {
  const [baseSha, headSha] = process.argv.slice(2);

  try {
    console.log(`run_expensive=${classifyCommitRange(baseSha, headSha)}`);
  } catch (error) {
    console.error(`Expensive CI classification fell back to the safe path: ${error.message}`);
    console.log("run_expensive=true");
  }
}
