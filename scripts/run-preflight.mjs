import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function npmVersionMatches(actualVersion, expectedRange) {
  const match = /^>=(\d+)\s+<(\d+)$/.exec(expectedRange);
  const actualMajor = Number(actualVersion.split(".")[0]);

  return match !== null && actualMajor >= Number(match[1]) && actualMajor < Number(match[2]);
}

export function evaluateRuntime({ actualNode, actualNpm, expectedNode, expectedNpm }) {
  return [
    actualNode === expectedNode
      ? { label: `Node ${actualNode}`, ok: true }
      : {
          label: `Node ${actualNode}`,
          ok: false,
          hint: `Use Node ${expectedNode} (run \`nvm use\` when nvm is available).`,
        },
    npmVersionMatches(actualNpm, expectedNpm)
      ? { label: `npm ${actualNpm}`, ok: true }
      : {
          label: `npm ${actualNpm}`,
          ok: false,
          hint: `Use an npm version matching ${expectedNpm}.`,
        },
  ];
}

export function createPreflightPlan(rootDirectory, temporaryDirectory) {
  const wrangler = join(rootDirectory, "node_modules", ".bin", "wrangler");

  return [
    {
      args: ["--version"],
      command: wrangler,
      hint: "Run `npm install` to restore the repo-pinned Wrangler binary.",
      label: "Wrangler CLI",
    },
    {
      args: ["whoami", "--json"],
      command: wrangler,
      hint: "Authenticate with `npx wrangler login` or configure an API token.",
      label: "Wrangler authentication",
    },
    {
      args: ["types", join(temporaryDirectory, "worker-configuration.d.ts"), "--include-runtime=false"],
      command: wrangler,
      hint: "Fix Wrangler configuration or declared bindings, then regenerate environment types.",
      label: "Declared bindings",
    },
    {
      args: [
        "deploy",
        "--dry-run",
        "--outdir",
        join(temporaryDirectory, "bundle"),
        "--experimental-provision=false",
        "--experimental-auto-create=false",
      ],
      command: wrangler,
      hint: "Fix the Worker build or Wrangler deployment configuration.",
      label: "Deploy dry run",
    },
  ];
}

export function runPreflightPlan(plan, runCommand = spawnSync, options = {}) {
  return plan.map(({ args, command, hint, label }) => {
    const result = runCommand(command, args, {
      cwd: options.cwd,
      encoding: "utf8",
      env: options.env,
      stdio: "pipe",
    });

    return result.status === 0 ? { label, ok: true } : { label, ok: false, hint };
  });
}

export function formatPreflightSummary(results) {
  const failures = results.filter(({ ok }) => !ok);
  const lines = ["Preflight"];

  for (const result of results) {
    lines.push(`${result.ok ? "✓" : "✗"} ${result.label}`);
    if (!result.ok) lines.push(`  ${result.hint}`);
  }

  lines.push(
    failures.length === 0
      ? `Preflight passed (${results.length} checks).`
      : `Preflight failed (${failures.length} of ${results.length} checks).`,
  );

  return lines.join("\n");
}

function readNpmVersion() {
  const result = spawnSync("npm", ["--version"], { encoding: "utf8", stdio: "pipe" });
  return result.status === 0 ? result.stdout.trim() : "unavailable";
}

function runCli() {
  const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
  const temporaryDirectory = mkdtempSync(join(tmpdir(), "vibe-template-preflight-"));

  try {
    const runtimeResults = evaluateRuntime({
      actualNode: process.versions.node,
      actualNpm: readNpmVersion(),
      expectedNode: packageJson.engines.node,
      expectedNpm: packageJson.engines.npm,
    });
    const commandResults = runPreflightPlan(createPreflightPlan(repoRoot, temporaryDirectory), spawnSync, {
      cwd: repoRoot,
      env: {
        ...process.env,
        WRANGLER_LOG_PATH: join(temporaryDirectory, "wrangler.log"),
        WRANGLER_SEND_METRICS: "false",
      },
    });
    const results = [...runtimeResults, ...commandResults];

    console.log(formatPreflightSummary(results));
    process.exitCode = results.some(({ ok }) => !ok) ? 1 : 0;
  } finally {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
