import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const runtimeRoots = ["src/worker.ts", "src/views"];
const ignoredFilePatterns = [/\.test\.ts$/, /\.e2e\.ts$/, /\.d\.ts$/];

const disallowedMarkupPatterns = [
  {
    name: "inline event handler attribute",
    pattern: /\son[a-z]+\s*=/giu,
  },
  {
    name: "javascript: URL",
    pattern: /javascript\s*:/giu,
  },
];

export function findWorkerClientScriptViolations(source) {
  const violations = findScriptViolations(source);

  for (const { name, pattern } of disallowedMarkupPatterns) {
    for (const match of source.matchAll(pattern)) {
      violations.push({ index: match.index ?? 0, name });
    }
  }

  return violations.sort((left, right) => left.index - right.index);
}

function findScriptViolations(source) {
  const violations = [];
  const openingPattern = /<script(?=[\s>/])/giu;

  for (const match of source.matchAll(openingPattern)) {
    const index = match.index ?? 0;
    const openingEnd = findTagEnd(source, index + match[0].length);
    if (openingEnd === -1) {
      violations.push({ index, name: "inline or malformed <script> tag" });
      continue;
    }

    const closingPattern = /<\/script\s*>/giu;
    closingPattern.lastIndex = openingEnd + 1;
    const closingMatch = closingPattern.exec(source);
    const content = closingMatch ? source.slice(openingEnd + 1, closingMatch.index) : undefined;
    const attributes = parseAttributes(source.slice(index + match[0].length, openingEnd));

    if (content === undefined || content.trim() !== "" || attributes === undefined) {
      violations.push({ index, name: "inline or malformed <script> tag" });
      continue;
    }

    const src = attributes.get("src");
    const type = attributes.get("type");
    if (type?.toLowerCase() !== "module" || !isLocalAssetModule(src)) {
      violations.push({ index, name: "non-local browser module <script> tag" });
    }
  }

  return violations;
}

function findTagEnd(source, start) {
  let quote;

  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === quote) quote = undefined;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === ">") return index;
  }

  return -1;
}

function parseAttributes(source) {
  const attributes = new Map();
  let index = 0;

  while (index < source.length) {
    const separatorStart = index;
    while (/\s/u.test(source[index] ?? "")) index += 1;
    if (index >= source.length) break;
    if (separatorStart === index) return undefined;
    if (source[index] === "/") return undefined;

    const nameStart = index;
    while (index < source.length && !/[\s=/>]/u.test(source[index] ?? "")) index += 1;
    if (nameStart === index) return undefined;
    const name = source.slice(nameStart, index).toLowerCase();

    const nameEnd = index;
    while (/\s/u.test(source[index] ?? "")) index += 1;
    let value = "";
    if (source[index] === "=") {
      index += 1;
      while (/\s/u.test(source[index] ?? "")) index += 1;
      const quote = source[index];
      if (quote === '"' || quote === "'") {
        index += 1;
        const valueStart = index;
        while (index < source.length && source[index] !== quote) index += 1;
        if (index >= source.length) return undefined;
        value = source.slice(valueStart, index);
        index += 1;
      } else {
        const valueStart = index;
        while (index < source.length && !/[\s>]/u.test(source[index] ?? "")) index += 1;
        if (valueStart === index) return undefined;
        value = source.slice(valueStart, index);
      }
    } else {
      index = nameEnd;
    }

    if (attributes.has(name)) return undefined;
    attributes.set(name, value);
  }

  return attributes;
}

function isLocalAssetModule(src) {
  if (typeof src !== "string" || !/^\/assets\/[a-z0-9._~/-]+\.js$/iu.test(src)) return false;

  const resolved = new URL(src, "https://worker-client-guard.invalid");
  return resolved.pathname === src && resolved.pathname.startsWith("/assets/");
}

async function run() {
  const files =
    process.argv.slice(2).length > 0 ? collectRequestedRuntimeFiles(process.argv.slice(2)) : await collectRuntimeFiles(runtimeRoots);
  const violations = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");

    for (const { index, name } of findWorkerClientScriptViolations(source)) {
      violations.push(formatViolation(file, source, index, name));
    }
  }

  if (violations.length > 0) {
    console.error("Worker-rendered HTML must not contain untyped or non-local browser code.");
    console.error("Use empty external module tags under /assets/*.js for typed browser modules.");
    console.error("");
    console.error(violations.join("\n"));
    process.exitCode = 1;
  }
}

async function collectRuntimeFiles(paths) {
  const files = [];

  for (const path of paths) {
    const absolutePath = join(repoRoot, path);

    if (path.endsWith(".ts")) {
      files.push(absolutePath);
      continue;
    }

    files.push(...(await collectTypeScriptFiles(absolutePath)));
  }

  return files.filter((file) => ignoredFilePatterns.every((pattern) => !pattern.test(file))).sort();
}

function collectRequestedRuntimeFiles(paths) {
  return paths
    .filter((file) => (file === "src/worker.ts" || file.startsWith("src/views/")) && file.endsWith(".ts"))
    .filter((file) => ignoredFilePatterns.every((pattern) => !pattern.test(file)))
    .map((file) => join(repoRoot, file))
    .sort();
}

async function collectTypeScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectTypeScriptFiles(absolutePath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push(absolutePath);
    }
  }

  return files;
}

function formatViolation(file, source, index, name) {
  const location = getWorkerClientSourceLocation(source, index);
  const line = source.split("\n")[location.line - 1]?.trim() ?? "";
  return `${relative(repoRoot, file)}:${location.line}:${location.column} - ${name}\n  ${line}`;
}

export function getWorkerClientSourceLocation(source, index) {
  const prefix = source.slice(0, index);
  const lines = prefix.split("\n");
  const currentLine = lines.at(-1) ?? "";

  return {
    line: lines.length,
    column: currentLine.length + 1,
  };
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  await run();
}
