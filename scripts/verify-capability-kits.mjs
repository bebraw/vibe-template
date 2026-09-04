import { execFile } from "node:child_process";
import { access, cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const fixtureCases = [
  { capabilityName: "workers-ai", fixtureName: "workers-ai" },
  { capabilityName: "room-state", fixtureName: "room-state" },
  { capabilityName: "browser-static-assets", fixtureName: "browser-static-assets" },
  { capabilityName: "browser-static-assets", fixtureName: "browser-static-assets-starter" },
];
const capabilityToolingTests = [".capabilities/deployment-safety/files/scripts/run-deployment-safety.test.mjs"];

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
      compatibility_date: "2026-09-04",
      compatibility_flags: ["no_nodejs_compat", "no_nodejs_compat_v2"],
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
      // @cloudflare/vitest-pool-workers 0.22.0 currently bundles a runtime that supports dates through 2026-08-22.
      compatibility_date: "2026-08-22",
      compatibility_flags: ["no_nodejs_compat", "no_nodejs_compat_v2"],
      durable_objects: { bindings: [{ class_name: "RoomState", name: "ROOM_STATE" }] },
      main: "src/worker.ts",
      migrations: [{ new_sqlite_classes: ["RoomState"], tag: "v1" }],
      name: "capability-room-state-verification",
    },
  },
  "browser-static-assets": {
    entrypoint: `export default {
  fetch(): Response {
    return new Response(
      '<!doctype html><html><head><script type="module" src="/assets/browser-entry.js"></script></head><body>Browser fixture</body></html>',
      { headers: { "content-security-policy": "default-src 'self'; script-src 'self'", "content-type": "text/html" } },
    );
  },
};
`,
    runDeployDryRun: true,
    runVitest: false,
    typecheckInclude: ["worker-configuration.d.ts", "src/worker.ts"],
    wrangler: {
      compatibility_date: "2026-09-04",
      compatibility_flags: ["no_nodejs_compat", "no_nodejs_compat_v2"],
      main: "src/worker.ts",
      name: "capability-browser-static-assets-verification",
    },
  },
  "browser-static-assets-starter": {
    expectedGeneratedFiles: [".generated/styles.css", "public/assets/browser-entry.js"],
    packageScripts: {
      build: "npm run build:css && npm run build:browser",
      "build:css": "mkdir -p ./.generated && tailwindcss -i ./src/tailwind-input.css -o ./.generated/styles.css --minify",
    },
    rootDependencies: ["@tailwindcss/cli"],
    rootFiles: [
      "src/api/health.ts",
      "src/app-routes.ts",
      "src/css.d.ts",
      "src/tailwind-input.css",
      "src/views/home.ts",
      "src/views/not-found.ts",
      "src/views/shared.ts",
      "src/worker.ts",
    ],
    runDeployDryRun: true,
    runVitest: false,
    typecheckInclude: ["worker-configuration.d.ts", "src/**/*.ts"],
    typecheckLib: ["ES2022", "DOM", "ESNext.Disposable"],
    wrangler: {
      compatibility_date: "2026-09-04",
      compatibility_flags: ["no_nodejs_compat", "no_nodejs_compat_v2"],
      main: "src/worker.ts",
      name: "capability-browser-static-assets-starter-verification",
      rules: [{ fallthrough: true, globs: ["**/*.css"], type: "Text" }],
    },
    wranglerOverrides: {
      build: {
        command: "npm run build",
        watch_dir: ["src", "tsconfig.browser.json"],
      },
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

export function assertGeneratedTypeDriftCoverage(manifest) {
  if (manifest.generatedFiles?.includes("worker-configuration.d.ts") && !manifest.verify?.includes("npm run types:check")) {
    throw new Error('Capability kits with generated files must include "npm run types:check" in their normal verification contract.');
  }
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

  for (const testPath of capabilityToolingTests) {
    log(`[capabilities:verify] ${testPath}: running copyable tooling tests`);
    await runFixtureCommand(process.execPath, ["--test", path.join(root, testPath)], root);
  }

  for (const fixtureCase of fixtureCases) {
    await verifyCapabilityKit({ ...fixtureCase, log, packageJson, root, toolchain });
  }
}

async function verifyCapabilityKit({ capabilityName, fixtureName, log, packageJson, root, toolchain }) {
  const definition = fixtureDefinitions[fixtureName];
  const kitRoot = path.join(root, ".capabilities", capabilityName);
  const manifest = JSON.parse(await readFile(path.join(kitRoot, "manifest.json"), "utf8"));
  assertGeneratedTypeDriftCoverage(manifest);
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), `vibe-template-${fixtureName}-`));

  log(`[capabilities:verify] ${fixtureName}: materializing disposable Worker`);

  try {
    await copyManifestFiles(kitRoot, manifest, temporaryRoot);
    const rootDependencies = Object.fromEntries(
      (definition.rootDependencies ?? []).map((name) => [name, packageJson.devDependencies[name]]),
    );
    await writeFixtureFiles({
      definition,
      dependencies: collectFixtureDependencies(
        { dependencies: { dev: { ...manifest.dependencies?.dev, ...rootDependencies } } },
        toolchain,
      ),
      fixtureRoot: temporaryRoot,
      manifest,
      packageManager: packageJson.packageManager,
      root,
    });
    await runFixtureCommand("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", "--package-lock=false"], temporaryRoot);

    const binaryRoot = path.join(temporaryRoot, "node_modules", ".bin");
    if (manifest.scripts?.["build:browser"]) {
      await runFixtureCommand("npm", ["run", "build:browser"], temporaryRoot);
    }
    await runFixtureCommand(path.join(binaryRoot, "wrangler"), ["types"], temporaryRoot);
    if (manifest.generatedFiles?.includes("worker-configuration.d.ts")) {
      await runFixtureCommand(path.join(binaryRoot, "wrangler"), ["types", "--check"], temporaryRoot);
    }
    await runFixtureCommand(path.join(binaryRoot, "tsc"), ["--noEmit", "--project", "tsconfig.json"], temporaryRoot);
    if (definition.runVitest !== false) {
      await runFixtureCommand(path.join(binaryRoot, "vitest"), ["run", "--config", "vitest.config.ts"], temporaryRoot);
    }
    if (definition.runDeployDryRun) {
      await runFixtureCommand(
        path.join(binaryRoot, "wrangler"),
        ["deploy", "--dry-run", "--experimental-provision=false", "--experimental-auto-create=false"],
        temporaryRoot,
      );
    }
    for (const generatedFile of definition.expectedGeneratedFiles ?? []) {
      await access(path.join(temporaryRoot, generatedFile));
    }

    log(`[capabilities:verify] ${fixtureName}: passed type and runtime checks`);
  } finally {
    await rm(temporaryRoot, { force: true, recursive: true });
  }
}

async function writeFixtureFiles({ definition, dependencies, fixtureRoot, manifest, packageManager, root }) {
  const fixturePackage = {
    name: "capability-verification-fixture",
    private: true,
    type: "module",
    packageManager,
    devDependencies: dependencies,
    scripts: { ...manifest.scripts, ...definition.packageScripts },
  };
  const tsconfig = {
    compilerOptions: {
      exactOptionalPropertyTypes: true,
      lib: definition.typecheckLib ?? ["ES2022", "ESNext.Disposable"],
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
    include: definition.typecheckInclude ?? ["worker-configuration.d.ts", "src/**/*.ts", "vitest.config.ts"],
  };

  for (const rootFile of definition.rootFiles ?? []) {
    const target = path.join(fixtureRoot, rootFile);
    await mkdir(path.dirname(target), { recursive: true });
    await cp(path.join(root, rootFile), target);
  }

  await mkdir(path.join(fixtureRoot, "src"), { recursive: true });
  await writeFile(path.join(fixtureRoot, "package.json"), `${JSON.stringify(fixturePackage, null, 2)}\n`);
  await writeFile(path.join(fixtureRoot, "tsconfig.json"), `${JSON.stringify(tsconfig, null, 2)}\n`);
  await writeFile(
    path.join(fixtureRoot, "wrangler.jsonc"),
    `${JSON.stringify({ ...definition.wrangler, ...manifest.wrangler, ...definition.wranglerOverrides }, null, 2)}\n`,
  );
  if (definition.entrypoint) {
    await writeFile(path.join(fixtureRoot, "src", "worker.ts"), definition.entrypoint);
  }
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
