import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import process from "node:process";

const repoRoot = getRepoRoot();
const zeroSha = "0000000000000000000000000000000000000000";
const affectedFiles = getAffectedFiles();

if (affectedFiles.length === 0) {
  console.log("Affected guardrails skipped: no affected files found.");
  process.exit(0);
}

console.log(`Affected guardrails checking ${affectedFiles.length} file(s).`);

runPrettier(affectedFiles);
runJavaScriptSyntaxCheckWhenNeeded(affectedFiles);
runTypecheckWhenNeeded(affectedFiles);
runWorkerClientGuard(affectedFiles);
runAuditWhenNeeded(affectedFiles);
runTestsWhenNeeded(affectedFiles);

function getRepoRoot() {
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }

  return result.stdout.trim();
}

function getAffectedFiles() {
  const prePushInput = process.argv.includes("--pre-push") ? readStdin() : "";
  const files = new Set();

  if (prePushInput.trim().length > 0) {
    for (const line of prePushInput.trim().split("\n")) {
      const [, localSha, , remoteSha] = line.trim().split(/\s+/);

      if (!localSha || localSha === zeroSha) {
        continue;
      }

      const changedFiles =
        remoteSha && remoteSha !== zeroSha
          ? gitFiles(["diff", "--name-only", "--diff-filter=ACMR", `${remoteSha}..${localSha}`])
          : gitFiles(["diff-tree", "--no-commit-id", "--name-only", "--diff-filter=ACMR", "-r", localSha]);

      for (const file of changedFiles) {
        files.add(file);
      }
    }
  }

  for (const file of getWorktreeFiles()) {
    files.add(file);
  }

  if (files.size === 0) {
    for (const file of getBranchFiles()) {
      files.add(file);
    }
  }

  return [...files].filter((file) => existsSync(file)).sort();
}

function getWorktreeFiles() {
  return [
    ...gitFiles(["diff", "--name-only", "--diff-filter=ACMR", "HEAD"]),
    ...gitFiles(["diff", "--name-only", "--diff-filter=ACMR", "--cached"]),
    ...gitFiles(["ls-files", "--others", "--exclude-standard"]),
  ];
}

function getBranchFiles() {
  const upstream = spawn("git", ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"], {
    encoding: "utf8",
    allowFailure: true,
  });

  if (upstream.status === 0) {
    return gitFiles(["diff", "--name-only", "--diff-filter=ACMR", `${upstream.stdout.trim()}...HEAD`]);
  }

  const previousCommit = spawn("git", ["rev-parse", "--verify", "HEAD~1"], {
    encoding: "utf8",
    allowFailure: true,
  });

  if (previousCommit.status === 0) {
    return gitFiles(["diff", "--name-only", "--diff-filter=ACMR", "HEAD~1..HEAD"]);
  }

  return gitFiles(["ls-files"]);
}

function gitFiles(args) {
  const result = spawn("git", args, { encoding: "utf8" });
  return result.stdout
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean);
}

function runPrettier(files) {
  console.log("Checking formatting for affected files...");
  run("npx", ["prettier", "--check", "--ignore-unknown", ...files]);
}

function runTypecheckWhenNeeded(files) {
  if (!files.some(affectsTypecheck)) {
    console.log("Typecheck skipped: no affected TypeScript or typed tooling files.");
    return;
  }

  console.log("Running project typecheck for affected typed files...");
  run("npm", ["run", "typecheck"]);
}

function runJavaScriptSyntaxCheckWhenNeeded(files) {
  const syntaxCheckFiles = files.filter(affectsJavaScriptSyntax);

  if (syntaxCheckFiles.length === 0) {
    console.log("JavaScript syntax check skipped: no affected JavaScript files.");
    return;
  }

  console.log("Running JavaScript syntax checks for affected files...");

  for (const file of syntaxCheckFiles) {
    run("node", ["--check", file]);
  }
}

function runWorkerClientGuard(files) {
  const guardFiles = files.filter(isWorkerClientGuardFile);

  if (guardFiles.length === 0) {
    console.log("Worker client guard skipped: no affected Worker view files.");
    return;
  }

  console.log("Running Worker client guard for affected Worker view files...");
  run("npm", ["run", "worker:client-guard", "--", ...guardFiles]);
}

function runAuditWhenNeeded(files) {
  if (!files.some((file) => file === "package.json" || file === "package-lock.json")) {
    console.log("Security audit skipped: package files unchanged.");
    return;
  }

  console.log("Running security audit because package files changed...");
  run("npm", ["run", "security:audit"]);
}

function runTestsWhenNeeded(files) {
  if (!files.some(affectsUnitCoverage)) {
    console.log("Affected tests skipped: no affected runtime, unit test, or test environment files.");
    return;
  }

  console.log("Running affected tests because affected files include runtime, unit test, or test environment code...");
  run("npm", ["run", "test:affected", "--", ...files]);
}

function affectsTypecheck(file) {
  return (
    /\.(?:ts|tsx|mts|cts)$/.test(file) || ["tsconfig.json", "vitest.config.ts", "playwright.config.ts", "wrangler.jsonc"].includes(file)
  );
}

function affectsJavaScriptSyntax(file) {
  return /\.(?:js|jsx|mjs|cjs)$/.test(file);
}

function isWorkerClientGuardFile(file) {
  return (
    (file === "src/worker.ts" || file.startsWith("src/views/")) &&
    file.endsWith(".ts") &&
    !file.endsWith(".test.ts") &&
    !file.endsWith(".e2e.ts") &&
    !file.endsWith(".d.ts")
  );
}

function affectsUnitCoverage(file) {
  return (
    affectsTestEnvironment(file) ||
    (file.startsWith("src/") &&
      /\.(?:test\.)?(?:ts|tsx|mts|cts|js|jsx|mjs|cjs)$/.test(file) &&
      !file.endsWith(".d.ts") &&
      !file.endsWith(".e2e.ts"))
  );
}

function affectsTestEnvironment(file) {
  return [
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "vitest.config.ts",
    "scripts/run-coverage-gate.mjs",
    "scripts/run-affected-tests.mjs",
  ].includes(file);
}

function readStdin() {
  try {
    return process.stdin.isTTY ? "" : readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function run(command, args) {
  const result = spawn(command, args, { stdio: "inherit" });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

function spawn(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env: process.env,
    stdio: options.encoding ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: options.encoding,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (!options.allowFailure && (result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }

  return result;
}
