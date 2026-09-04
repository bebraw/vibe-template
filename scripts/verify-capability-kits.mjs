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
  { capabilityNames: ["workers-ai"], fixtureName: "workers-ai" },
  { capabilityNames: ["room-state"], fixtureName: "room-state" },
  { capabilityNames: ["browser-static-assets"], fixtureName: "browser-static-assets" },
  {
    capabilityNames: ["quality-gate", "room-state", "browser-static-assets", "progressive-interaction", "workers-ai"],
    fixtureName: "standard-adopter",
  },
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
    runVitestCoverage: true,
    wrangler: {
      compatibility_date: "2026-09-04",
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
  "standard-adopter": {
    entrypoint: `import { createWorkersAiRunner } from "./lib/workers-ai";
import { handleRoomRequest } from "./room-http";
import { renderHomePage } from "./views/home";

export { RoomState } from "./room-state";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return await handleRequest(request, env);
  },
};

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const roomResponse = await handleRoomRequest(request, env);
  if (roomResponse) return roomResponse;

  const url = new URL(request.url);
  if (url.pathname === "/") return htmlResponse(renderHomePage());
  if (url.pathname === "/vote" && request.method === "POST") return htmlResponse(renderHomePage(true));
  if (url.pathname === "/api/ai") {
    const runner = createWorkersAiRunner(env);
    return Response.json({ configured: typeof runner.run === "function" });
  }
  return new Response("Not Found", { status: 404 });
}

function htmlResponse(body: string): Response {
  return new Response(body, {
    headers: {
      "content-security-policy": "default-src 'self'; script-src 'self'",
      "content-type": "text/html; charset=utf-8",
    },
  });
}
`,
    expectedGeneratedFiles: [".generated/server.txt", "public/assets/browser-entry.js", "public/assets/progressive-form.js"],
    files: {
      "playwright.config.ts": `import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: ["src/**/*.e2e.ts"],
  fullyParallel: false,
  workers: 1,
  use: { baseURL: "http://127.0.0.1:8788", browserName: "chromium", headless: true },
  webServer: {
    command: "npm run e2e:server",
    reuseExistingServer: false,
    timeout: 120_000,
    url: "http://127.0.0.1:8788",
  },
});
`,
      "scripts/build-server.mjs": `import { mkdir, writeFile } from "node:fs/promises";

await mkdir(".generated", { recursive: true });
await writeFile(".generated/server.txt", "synthetic server build\\n");
`,
      "src/browser/browser-entry.ts": `import { installProgressiveForms } from "./progressive-form.js";

export function installBrowserFeatures(documentObject: Document = document): void {
  documentObject.documentElement.dataset.browserModule = "ready";
  installProgressiveForms(documentObject);
}

installBrowserFeatures();
`,
      "src/standard-adopter.e2e.ts": `import { expect, test } from "@playwright/test";

test("runs the built browser module against the synthetic Worker", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-browser-module", "ready");
  await page.getByRole("button", { name: "Vote" }).click();
  await expect(page).toHaveURL("/vote");
  await expect(page.getByRole("heading", { name: "Vote recorded" })).toBeFocused();
});
`,
      "src/views/home.ts": `export function renderHomePage(submitted = false): string {
  const fragment = submitted
    ? '<section id="results" data-progressive-fragment><h1 tabindex="-1" data-progressive-focus>Vote recorded</h1></section>'
    : '<section id="results" data-progressive-fragment><form action="/vote" method="post" data-progressive-form data-progressive-target="#results"><button type="submit">Vote</button></form></section>';

  return \`<!doctype html><html><head><script src="/assets/browser-entry.js" type="module"></script></head><body>\${fragment}</body></html>\`;
}
`,
      "src/worker.test.ts": `import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { handleRequest } from "./worker";

describe("standard adopter Worker", () => {
  it("serves the synthetic browser workflow", async () => {
    const initial = await handleRequest(new Request("https://example.com/"), env);
    expect(await initial.text()).toContain("/assets/browser-entry.js");
    const submitted = await handleRequest(new Request("https://example.com/vote", { method: "POST" }), env);
    expect(await submitted.text()).toContain("Vote recorded");
  });

  it("composes room and Workers AI routes with the fallback response", async () => {
    await expect(handleRequest(new Request("https://example.com/api/ai"), env)).resolves.toMatchObject({ status: 200 });
    await expect(handleRequest(new Request("https://example.com/missing"), env)).resolves.toMatchObject({ status: 404 });
  });
});
`,
    },
    packageScripts: {
      build: "npm run build:server && npm run build:browser",
      "build:server": "node ./scripts/build-server.mjs",
      e2e: "playwright test",
      "e2e:server":
        "CHOKIDAR_USEPOLLING=1 CHOKIDAR_INTERVAL=200 wrangler dev --local --ip 127.0.0.1 --port 8788 --inspector-ip 127.0.0.1 --inspector-port 9230 --log-level error --show-interactive-dev-session=false",
      "worker:client-guard": "node ./scripts/assert-no-worker-client-scripts.mjs",
    },
    rootFiles: ["scripts/assert-no-worker-client-scripts.mjs"],
    runBrowserTests: true,
    runBuild: true,
    runClientGuard: true,
    runCoverage: true,
    runDeployDryRun: true,
    typecheckInclude: ["worker-configuration.d.ts", "src/**/*.ts"],
    typecheckLib: ["ES2022", "DOM", "ESNext.Disposable"],
    vitestConfig: `import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [cloudflareTest({ remoteBindings: false, wrangler: { configPath: "./wrangler.jsonc" } })],
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["src/**/*.e2e.ts"],
    coverage: {
      provider: "istanbul",
      include: ["src/**/*.{ts,tsx,js,jsx,mts,cts,mjs,cjs}"],
      exclude: ["src/browser/**", "src/**/*.d.ts", "src/**/*.test.ts", "src/**/*.e2e.ts", "src/test-support.ts", "src/test-support/**"],
      reporter: ["text"],
      reportsDirectory: "reports/coverage",
      thresholds: { branches: 80, functions: 90, lines: 90, statements: 90 },
    },
  },
});
`,
    wrangler: {
      ai: { binding: "AI" },
      compatibility_date: "2026-09-04",
      compatibility_flags: ["no_nodejs_compat", "no_nodejs_compat_v2"],
      durable_objects: { bindings: [{ class_name: "RoomState", name: "ROOM_STATE" }] },
      main: "src/worker.ts",
      migrations: [{ new_sqlite_classes: ["RoomState"], tag: "v1" }],
      name: "capability-standard-adopter-verification",
      vars: { AI_MODEL: "@cf/meta/llama-3.1-8b-instruct" },
    },
  },
};

export function selectFixtureCases(mode) {
  if (mode === "fast") return fixtureCases;
  if (mode === "browser") return fixtureCases.filter(({ fixtureName }) => fixtureName === "standard-adopter");
  throw new Error(`Unknown capability verification mode: ${mode}`);
}

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

export function composeCapabilityManifests(manifests) {
  const dependencies = {};
  const removedDependencies = new Set(manifests.flatMap((manifest) => manifest.dependencies?.removeDev ?? []));
  const scripts = {};
  const wrangler = {};
  const generatedFiles = new Set();
  const verify = new Set();

  for (const manifest of manifests) {
    mergeCompatibleEntries(
      dependencies,
      Object.fromEntries(Object.entries(manifest.dependencies?.dev ?? {}).filter(([name]) => !removedDependencies.has(name))),
      "dependency",
    );
    mergeCompatibleEntries(scripts, manifest.scripts, "script");
    Object.assign(wrangler, manifest.wrangler);
    for (const generatedFile of manifest.generatedFiles ?? []) generatedFiles.add(generatedFile);
    for (const command of manifest.verify ?? []) verify.add(command);
  }

  return {
    dependencies: { dev: dependencies },
    generatedFiles: [...generatedFiles],
    scripts,
    verify: [...verify],
    wrangler,
  };
}

function mergeCompatibleEntries(target, source = {}, label) {
  for (const [name, value] of Object.entries(source)) {
    if (name in target && target[name] !== value) {
      throw new Error(`Capability ${label} ${name} conflicts while composing adopter fixtures.`);
    }
    target[name] = value;
  }
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

export async function verifyCapabilityKits({ log = console.log, mode = "fast", root = repositoryRoot } = {}) {
  const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  const toolchain = {
    "@types/node": packageJson.devDependencies["@types/node"],
    "typescript-7": packageJson.devDependencies["typescript-7"],
    wrangler: packageJson.devDependencies.wrangler,
  };

  if (mode === "fast") {
    for (const testPath of capabilityToolingTests) {
      log(`[capabilities:verify] ${testPath}: running copyable tooling tests`);
      await runFixtureCommand(process.execPath, ["--test", path.join(root, testPath)], root);
    }
  }

  for (const fixtureCase of selectFixtureCases(mode)) {
    await verifyCapabilityKit({ ...fixtureCase, log, mode, packageJson, root, toolchain });
  }
}

async function verifyCapabilityKit({ capabilityNames, fixtureName, log, mode, packageJson, root, toolchain }) {
  const definition = fixtureDefinitions[fixtureName];
  const kits = await Promise.all(
    capabilityNames.map(async (capabilityName) => {
      const kitRoot = path.join(root, ".capabilities", capabilityName);
      const manifest = JSON.parse(await readFile(path.join(kitRoot, "manifest.json"), "utf8"));
      return { kitRoot, manifest };
    }),
  );
  const manifest = composeCapabilityManifests(kits.map(({ manifest }) => manifest));
  assertGeneratedTypeDriftCoverage(manifest);
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), `vibe-template-${fixtureName}-`));

  log(`[capabilities:verify] ${fixtureName}: materializing disposable Worker`);

  try {
    for (const { kitRoot, manifest: kitManifest } of kits) {
      await copyManifestFiles(kitRoot, kitManifest, temporaryRoot);
    }
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
    if (definition.runBuild) {
      await runFixtureCommand("npm", ["run", "build"], temporaryRoot);
    } else if (manifest.scripts?.["build:browser"]) {
      await runFixtureCommand("npm", ["run", "build:browser"], temporaryRoot);
    }
    if (mode === "browser" && definition.runBrowserTests) {
      await runFixtureCommand("npm", ["run", "e2e"], temporaryRoot);
    }
    if (mode === "fast") {
      await runFixtureCommand(path.join(binaryRoot, "wrangler"), ["types"], temporaryRoot);
      if (manifest.generatedFiles?.includes("worker-configuration.d.ts")) {
        await runFixtureCommand(path.join(binaryRoot, "wrangler"), ["types", "--check"], temporaryRoot);
      }
      await runFixtureCommand(path.join(binaryRoot, "tsc"), ["--noEmit", "--project", "tsconfig.json"], temporaryRoot);
      if (definition.runClientGuard) {
        await runFixtureCommand("npm", ["run", "worker:client-guard"], temporaryRoot);
      }
      if (definition.runCoverage) {
        await runFixtureCommand("npm", ["run", "test:coverage"], temporaryRoot);
      } else if (definition.runVitest !== false) {
        await runFixtureCommand(
          path.join(binaryRoot, "vitest"),
          ["run", ...(definition.runVitestCoverage ? ["--coverage"] : []), "--config", "vitest.config.ts"],
          temporaryRoot,
        );
      }
      if (definition.runDeployDryRun) {
        await runFixtureCommand(
          path.join(binaryRoot, "wrangler"),
          ["deploy", "--dry-run", "--experimental-provision=false", "--experimental-auto-create=false"],
          temporaryRoot,
        );
      }
    }
    for (const generatedFile of definition.expectedGeneratedFiles ?? []) {
      await access(path.join(temporaryRoot, generatedFile));
    }

    log(`[capabilities:verify] ${fixtureName}: passed ${mode} checks`);
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
      types: ["node", ...(dependencies["@cloudflare/vitest-plugin"] ? ["@cloudflare/vitest-plugin/types"] : [])],
    },
    include: definition.typecheckInclude ?? ["worker-configuration.d.ts", "src/**/*.ts", "vitest.config.ts"],
  };

  for (const rootFile of definition.rootFiles ?? []) {
    const target = path.join(fixtureRoot, rootFile);
    await mkdir(path.dirname(target), { recursive: true });
    await cp(path.join(root, rootFile), target);
  }

  for (const [file, contents] of Object.entries(definition.files ?? {})) {
    const target = resolveInside(fixtureRoot, file, "Fixture file");
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents);
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
  await verifyCapabilityKits({ mode: process.argv.includes("--browser") ? "browser" : "fast" });
}
