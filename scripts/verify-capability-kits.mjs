import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const capabilityNames = ["workers-ai", "room-state"];

const fixtureDefinitions = {
  "workers-ai": {
    entrypoint: `import { createWorkersAiRunner } from "./lib/workers-ai";

export default {
  async fetch(_request: Request, env: Env): Promise<Response> {
    const runner = createWorkersAiRunner(env);
    return Response.json({ configured: typeof runner.run === "function" });
  },
};
`,
    vitestConfig: `import { defineConfig } from "vitest/config";

export default defineConfig({ test: { include: ["src/**/*.test.ts"] } });
`,
    wrangler: {
      ai: { binding: "AI" },
      compatibility_date: "2026-03-28",
      main: "src/worker.ts",
      name: "capability-workers-ai-verification",
      vars: { AI_MODEL: "@cf/meta/llama-3.1-8b-instruct" },
    },
  },
  "room-state": {
    entrypoint: `import { handleRoomRequest } from "./room-http";

export { RoomState } from "./room-state";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return (await handleRoomRequest(request, env)) ?? new Response("Not Found", { status: 404 });
  },
};
`,
    wrangler: {
      compatibility_date: "2026-03-28",
      durable_objects: { bindings: [{ class_name: "RoomState", name: "ROOM_STATE" }] },
      main: "src/worker.ts",
      migrations: [{ new_sqlite_classes: ["RoomState"], tag: "v1" }],
      name: "capability-room-state-verification",
    },
  },
};

export function collectFixtureDependencies(manifest, toolchain) {
  const dependencies = { ...manifest.dependencies?.dev };

  for (const [name, version] of Object.entries(toolchain)) {
    if (dependencies[name] && dependencies[name] !== version) {
      throw new Error(
        `${name} ${dependencies[name]} in the capability manifest conflicts with the repository toolchain version ${version}.`,
      );
    }
    dependencies[name] = version;
  }

  return Object.fromEntries(Object.entries(dependencies).sort(([left], [right]) => left.localeCompare(right)));
}

export async function copyManifestFiles(kitRoot, manifest, fixtureRoot) {
  for (const file of manifest.files ?? []) {
    const source = resolveInside(kitRoot, file.source, "Capability source");
    const target = resolveInside(fixtureRoot, file.target, "Capability target");
    await mkdir(path.dirname(target), { recursive: true });
    await cp(source, target, { recursive: true });
  }
}

export async function verifyCapabilityKits({ log = console.log, root = repositoryRoot } = {}) {
  const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  const toolchain = {
    "@types/node": packageJson.devDependencies["@types/node"],
    "typescript-7": packageJson.devDependencies["typescript-7"],
    wrangler: packageJson.devDependencies.wrangler,
  };

  for (const capabilityName of capabilityNames) {
    await verifyCapabilityKit({ capabilityName, log, packageManager: packageJson.packageManager, root, toolchain });
  }
}

async function verifyCapabilityKit({ capabilityName, log, packageManager, root, toolchain }) {
  const definition = fixtureDefinitions[capabilityName];
  const kitRoot = path.join(root, ".capabilities", capabilityName);
  const manifest = JSON.parse(await readFile(path.join(kitRoot, "manifest.json"), "utf8"));
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), `vibe-template-${capabilityName}-`));

  log(`[capabilities:verify] ${capabilityName}: materializing disposable Worker`);

  try {
    await copyManifestFiles(kitRoot, manifest, temporaryRoot);
    await writeFixtureFiles({
      definition,
      dependencies: collectFixtureDependencies(manifest, toolchain),
      fixtureRoot: temporaryRoot,
      packageManager,
    });
    await runFixtureCommand("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", "--package-lock=false"], temporaryRoot);

    const binaryRoot = path.join(temporaryRoot, "node_modules", ".bin");
    await runFixtureCommand(path.join(binaryRoot, "wrangler"), ["types"], temporaryRoot);
    await runFixtureCommand(path.join(binaryRoot, "tsc"), ["--noEmit", "--project", "tsconfig.json"], temporaryRoot);
    await runFixtureCommand(path.join(binaryRoot, "vitest"), ["run", "--config", "vitest.config.ts"], temporaryRoot);

    log(`[capabilities:verify] ${capabilityName}: passed type and runtime checks`);
  } finally {
    await rm(temporaryRoot, { force: true, recursive: true });
  }
}

async function writeFixtureFiles({ definition, dependencies, fixtureRoot, packageManager }) {
  const fixturePackage = {
    name: "capability-verification-fixture",
    private: true,
    type: "module",
    packageManager,
    devDependencies: dependencies,
  };
  const tsconfig = {
    compilerOptions: {
      exactOptionalPropertyTypes: true,
      lib: ["ES2022", "ESNext.Disposable"],
      module: "ESNext",
      moduleResolution: "Bundler",
      noEmit: true,
      noUncheckedIndexedAccess: true,
      noUnusedLocals: true,
      skipLibCheck: true,
      strict: true,
      target: "ES2022",
      types: ["node"],
    },
    include: ["worker-configuration.d.ts", "src/**/*.ts", "vitest.config.ts"],
  };

  await mkdir(path.join(fixtureRoot, "src"), { recursive: true });
  await writeFile(path.join(fixtureRoot, "package.json"), `${JSON.stringify(fixturePackage, null, 2)}\n`);
  await writeFile(path.join(fixtureRoot, "tsconfig.json"), `${JSON.stringify(tsconfig, null, 2)}\n`);
  await writeFile(path.join(fixtureRoot, "wrangler.jsonc"), `${JSON.stringify(definition.wrangler, null, 2)}\n`);
  await writeFile(path.join(fixtureRoot, "src", "worker.ts"), definition.entrypoint);
  if (definition.vitestConfig) {
    await writeFile(path.join(fixtureRoot, "vitest.config.ts"), definition.vitestConfig);
  }
}

async function runFixtureCommand(command, args, cwd) {
  try {
    const { stderr, stdout } = await execFileAsync(command, args, {
      cwd,
      env: { ...process.env, CI: "1", WRANGLER_SEND_METRICS: "false" },
      maxBuffer: 10 * 1024 * 1024,
    });
    if (stdout.trim()) process.stdout.write(stdout);
    if (stderr.trim()) process.stderr.write(stderr);
  } catch (error) {
    if (error.stdout) process.stdout.write(error.stdout);
    if (error.stderr) process.stderr.write(error.stderr);
    throw error;
  }
}

function resolveInside(root, relativePath, label) {
  if (typeof relativePath !== "string" || path.isAbsolute(relativePath)) {
    throw new Error(`${label} path must stay within ${root}.`);
  }

  const resolved = path.resolve(root, relativePath);
  const relative = path.relative(root, resolved);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`${label} path must stay within ${root}.`);
  }
  return resolved;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await verifyCapabilityKits();
}
