import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import process from "node:process";

const repoRoot = getRepoRoot();
const zeroSha = "0000000000000000000000000000000000000000";
const affectedFiles = getInputFiles();

if (affectedFiles.length === 0) {
  console.log("Affected tests skipped: no affected files found.");
  process.exit(0);
}

console.log(`Affected tests checking ${affectedFiles.length} file(s).`);

if (affectedFiles.some(affectsTestEnvironment)) {
  console.log("Running unit coverage because affected files include test environment inputs.");
  run("npm", ["run", "test:coverage"]);
  process.exit(0);
}

const sourceFiles = affectedFiles.filter(isRuntimeSourceFile);
const testFiles = affectedFiles.filter(isUnitTestFile);

if (sourceFiles.length === 0 && testFiles.length === 0) {
  console.log("Affected tests skipped: no affected runtime or unit test files.");
  process.exit(0);
}

if (sourceFiles.length > 0) {
  runRelatedTests(sourceFiles, testFiles.length === 0);
}

if (testFiles.length > 0) {
  console.log("Running affected unit test files...");
  run("npx", ["vitest", "run", ...testFiles]);
}

function getInputFiles() {
  const cliFiles = process.argv.slice(2).filter((arg) => arg !== "--pre-push");

  if (cliFiles.length > 0) {
    return normalizeFiles(cliFiles);
  }

  return normalizeFiles(getAffectedFiles());
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

  return [...files];
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

function runRelatedTests(files, requireRelatedTests) {
  console.log("Running tests related to affected runtime files...");

  const result = spawn("npx", ["vitest", "related", "--run", "--no-color", ...files], {
    encoding: "utf8",
    allowFailure: true,
  });

  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }

  if (requireRelatedTests && /No test files found/.test(`${result.stdout}\n${result.stderr}`)) {
    console.log("Running unit coverage because no related tests were found for affected runtime files.");
    run("npm", ["run", "test:coverage"]);
  }
}

function normalizeFiles(files) {
  return [...new Set(files)].filter((file) => existsSync(file)).sort();
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

function isRuntimeSourceFile(file) {
  return (
    file.startsWith("src/") &&
    /\.(?:ts|tsx|mts|cts|js|jsx|mjs|cjs)$/.test(file) &&
    !file.endsWith(".d.ts") &&
    !file.endsWith(".test.ts") &&
    !file.endsWith(".e2e.ts") &&
    file !== "src/test-support.ts"
  );
}

function isUnitTestFile(file) {
  return file.startsWith("src/") && /\.(?:test\.)?(?:ts|tsx|mts|cts|js|jsx|mjs|cjs)$/.test(file) && file.endsWith(".test.ts");
}

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

function readStdin() {
  try {
    return process.stdin.isTTY ? "" : readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function run(command, args) {
  const result = spawn(command, args);

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
