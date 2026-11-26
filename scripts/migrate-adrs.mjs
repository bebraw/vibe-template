import { execFileSync } from "node:child_process";
import {
  chmodSync,
  linkSync,
  lstatSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { format } from "prettier";
import { stringify } from "yaml";
import { convertMarkdownAdr } from "./adr-migrate-markdown.mjs";
import { migrateReferences } from "./adr-migrate-references.mjs";
import { parseAdrRecord, validateAdrRelations } from "./adr-record.mjs";

const stages = ["proposed", "accepted", "implemented"];
const archive =
  /(?:^|\/)(?:node_modules|vendor|\.git|\.asdlc|\.cache|\.npm|\.agentci|\.fallow|\.generated|\.wrangler|\.stryker-tmp|coverage|dist|build|playwright-report|reports|test-results)(?:\/|$)/;
const isManifest = (path) => /^\.template\/updates\/[^/]+\/update\.json$/.test(path);

function filesUnder(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (archive.test(path)) continue;
    if (entry.isDirectory()) files.push(...filesUnder(path));
    if (entry.isFile()) files.push(path);
  }
  return files;
}

function documents() {
  const files = lstatSync(".git", { throwIfNoEntry: false })
    ? execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
      }).split("\0")
    : filesUnder(".");
  return files.filter((path) => !archive.test(path) && (path.endsWith(".md") || isManifest(path) || path.endsWith(".yaml")));
}

function read(path) {
  const stat = lstatSync(path, { throwIfNoEntry: false });
  if (!stat) return undefined;
  if (!stat.isFile()) throw new Error(`Expected a regular file: ${path}`);
  if (relative(realpathSync("."), realpathSync(path)) !== path) throw new Error(`Refusing to follow a symbolic link: ${path}`);
  const bytes = readFileSync(path);
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch (error) {
    throw new Error(`${path}: expected UTF-8 text`, { cause: error });
  }
}

function decisions() {
  const result = [];
  for (const stage of stages) {
    const dir = join("docs/adrs", stage);
    const stat = lstatSync(dir, { throwIfNoEntry: false });
    if (!stat) continue;
    if (!stat.isDirectory()) throw new Error(`Expected a lifecycle directory: ${dir}`);
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!/\.(md|ya?ml)$/i.test(entry.name)) continue;
      const path = join(dir, entry.name);
      if (!entry.isFile() || !/^ADR-\d{3,}-.+\.(md|yaml)$/.test(entry.name)) {
        throw new Error(`${path}: expected a regular ADR-<number>-<name>.md or .yaml file`);
      }
      result.push(path);
    }
  }
  return result.sort();
}

async function encode(record, destination) {
  const yaml = await format(stringify(record, { lineWidth: 0 }), { parser: "yaml", printWidth: 140 });
  if (!isDeepStrictEqual(record, parseAdrRecord(yaml, destination))) throw new Error(`${destination}: serialization changed the record`);
  return yaml;
}

function updateProse(record, source, targets) {
  for (const key of ["title", "preamble", "context", "trigger", "decision", "consequences", "alternatives"]) {
    if (record[key]) record[key] = migrateReferences(record[key], source, targets);
  }
  for (const section of record.extraSections ?? []) {
    section.heading = migrateReferences(section.heading, source, targets);
    section.body = migrateReferences(section.body, source, targets);
  }
}

async function plan() {
  const paths = decisions();
  const sources = paths.filter((path) => path.endsWith(".md"));
  const targets = new Set(paths.map((path) => path.replace(/\.yaml$/, ".md")));
  const ids = new Map();
  const records = new Map();
  const outputs = new Map();
  const removals = new Map();
  for (const path of paths) {
    const id = /^ADR-\d{3,}(?=-)/.exec(basename(path))?.[0];
    const destination = path.replace(/\.md$/, ".yaml");
    if (ids.has(id) && ids.get(id) !== destination) throw new Error(`Duplicate ${id}: ${ids.get(id)} and ${path}`);
    ids.set(id, destination);
    if (path.endsWith(".yaml")) records.set(path, parseAdrRecord(read(path), path));
  }
  for (const path of sources) {
    const before = read(path);
    const record = convertMarkdownAdr(before, path);
    updateProse(record, path, targets);
    const destination = path.replace(/\.md$/, ".yaml");
    const after = await encode(record, destination);
    const existing = read(destination);
    if (existing !== undefined && existing !== after) throw new Error(`Refusing to overwrite ${destination} while migrating ${path}`);
    outputs.set(destination, { before: existing, after, mode: lstatSync(path).mode });
    records.set(destination, record);
    removals.set(path, before);
  }
  for (const [path, record] of records) validateAdrRelations(record, ids, path);
  if (sources.length) {
    for (const path of documents()) {
      if (removals.has(path) || outputs.has(path) || (path.endsWith(".yaml") && !paths.includes(path))) continue;
      if (!lstatSync(path, { throwIfNoEntry: false })?.isFile()) continue;
      const before = read(path);
      const after = migrateReferences(before, path, targets);
      if (after === before) continue;
      if (isManifest(path)) JSON.parse(after);
      if (path.endsWith(".yaml")) parseAdrRecord(after, path);
      outputs.set(path, { before, after });
    }
  }
  return { outputs, removals };
}

function requireOriginal(path, before) {
  if (read(path) !== before) throw new Error(`${path} changed during migration. Review its contents and retry.`);
}

function publish(path, { before, after, mode }) {
  requireOriginal(path, before);
  if (before === after) return;
  const dir = mkdtempSync(join(dirname(path), ".migrate-adrs-"));
  try {
    const staged = join(dir, "new");
    writeFileSync(staged, after, { mode: 0o600 });
    chmodSync(staged, (mode ?? lstatSync(path).mode) & 0o777);
    if (before === undefined) linkSync(staged, path);
    else renameSync(staged, path);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function main(args) {
  if (args.length && (args.length !== 1 || args[0] !== "--write")) throw new Error("Usage: node scripts/migrate-adrs.mjs [--write]");
  const { outputs, removals } = await plan();
  for (const path of removals.keys()) console.log(`${path} → ${path.replace(/\.md$/, ".yaml")}`);
  for (const [path, { before, after }] of outputs)
    if (before !== undefined && after !== before) console.log(`Update references in ${path}`);
  if (args[0] === "--write") {
    for (const [path, before] of removals) requireOriginal(path, before);
    for (const [path, change] of outputs) publish(path, change);
    // If publication fails, every Markdown source remains available for a retry.
    for (const [path, before] of removals) {
      requireOriginal(path, before);
      unlinkSync(path);
    }
  }
  console.log(`${args.length ? "Migrated" : "Would migrate"} ${removals.size} ADRs.`);
}

try {
  await main(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
