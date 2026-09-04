import { builtinModules } from "node:module";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const sourceExtensions = /\.(?:js|jsx|mjs|cjs|ts|tsx|mts|cts)$/u;
const ignoredFiles = /(?:\.(?:test|e2e)|\.d)\.(?:js|jsx|mjs|cjs|ts|tsx|mts|cts)$/u;
const nodeBuiltins = new Set(builtinModules.map((specifier) => specifier.replace(/^node:/u, "")));
const importPatterns = [
  /\b(?:import|export)\s+(?:type\s+)?(?:[^;]*?\s+from\s+)?(["'])([^"']+)\1/gu,
  /\b(?:import|require)\s*\(\s*(["'])([^"']+)\1\s*\)/gu,
];

export function findNodeBuiltinImports(source) {
  return findNodeBuiltinImportMatches(source).map(({ specifier }) => specifier);
}

async function runGuard(paths) {
  const files = paths.length > 0 ? collectRequestedSourceFiles(paths) : await collectSourceFiles(join(repoRoot, "src"));
  const violations = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const match of findNodeBuiltinImportMatches(source)) {
      const line = source.slice(0, match.index).split("\n").length;
      violations.push(`${relative(repoRoot, file)}:${line} imports ${JSON.stringify(match.specifier)}`);
    }
  }

  if (violations.length === 0) return;

  console.error("Production source for the Web-standards-only Worker must not import Node built-ins.");
  console.error(violations.join("\n"));
  process.exitCode = 1;
}

function findNodeBuiltinImportMatches(source) {
  const matches = [];

  for (const pattern of importPatterns) {
    for (const match of source.matchAll(pattern)) {
      const specifier = match[2];
      if (specifier === undefined || !isNodeBuiltin(specifier)) continue;
      matches.push({ index: match.index, specifier });
    }
  }

  return matches.sort((left, right) => left.index - right.index);
}

function isNodeBuiltin(specifier) {
  const normalized = specifier.replace(/^node:/u, "");
  return nodeBuiltins.has(normalized) || nodeBuiltins.has(normalized.split("/")[0]);
}

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "test-support") files.push(...(await collectSourceFiles(absolutePath)));
      continue;
    }
    if (isProductionSource(entry.name)) files.push(absolutePath);
  }

  return files.sort();
}

function collectRequestedSourceFiles(paths) {
  return paths
    .filter((file) => file.startsWith("src/") && isProductionSource(file) && !file.startsWith("src/test-support/"))
    .map((file) => join(repoRoot, file))
    .sort();
}

function isProductionSource(file) {
  return sourceExtensions.test(file) && !ignoredFiles.test(file) && file !== "src/test-support.ts" && file !== "test-support.ts";
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runGuard(process.argv.slice(2));
}
