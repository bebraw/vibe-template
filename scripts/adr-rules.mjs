import { mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import Ajv from "ajv";
import { parseDocument } from "yaml";
import rulesSchema from "../specs/adr-rules/rules.schema.json" with { type: "json" };
import termsSchema from "../specs/adr-rules/gate-terms.schema.json" with { type: "json" };
import { resolveRuleHistories } from "./adr-rule-history.mjs";
import { describeRule, renderRuleIndex, updateRuleIndex } from "./adr-rule-output.mjs";

const ajv = new Ajv({ strict: true, ownProperties: true });
const validateRules = ajv.compile(rulesSchema);
const validateTerms = ajv.compile(termsSchema);
const indexPath = "docs/adrs/README.md";
const decisionsDir = "docs/adrs/implemented";
const glossaryPath = "specs/quality-gate/spec.md";

function frontmatter(text, path, optInKeys) {
  if (!/^---[ \t]*\r?(?:\n|$)/.test(text)) return undefined;
  const match = /^---[ \t]*\r?\n([\s\S]*?)^---[ \t]*\r?$/m.exec(text);
  if (!match) throw new Error(`${path}: unterminated YAML frontmatter`);
  const doc = parseDocument(match[1], { stringKeys: true });
  if (optInKeys && !optInKeys.some((key) => doc.has(key))) return undefined;
  const issue = doc.errors[0] ?? doc.warnings[0];
  if (issue) throw new Error(`${path}: ${issue.message}`);
  try {
    return doc.toJS({ maxAliasCount: 0 });
  } catch (error) {
    throw new Error(`${path}: ${error.message}`);
  }
}

function assertSchema(validate, value, path) {
  if (!validate(value)) throw new Error(`${path}: ${ajv.errorsText(validate.errors)}`);
}

function readTerms() {
  const header = frontmatter(readFileSync(glossaryPath, "utf8"), glossaryPath);
  assertSchema(validateTerms, header, glossaryPath);
  const { scripts } = JSON.parse(readFileSync("package.json", "utf8"));
  const seen = new Set();
  for (const { script } of Object.values(header.gateTerms)) {
    if (!Object.hasOwn(scripts, script)) throw new Error(`${glossaryPath}: unknown npm script ${script}`);
    if (seen.has(script)) throw new Error(`${glossaryPath}: duplicate gate command ${script}`);
    seen.add(script);
  }
  return header.gateTerms;
}

function checkEvidence(path, source) {
  // Resolve symlinks before accepting a repository-relative evidence reference.
  const target = statSync(path, { throwIfNoEntry: false });
  if (!target?.isFile() || relative(realpathSync("."), realpathSync(path)).split("/")[0] === "..") {
    throw new Error(`${source}: evidence must be a file inside the repository: ${path}`);
  }
}

function readDecision(name, terms) {
  const source = join(decisionsDir, name);
  const text = readFileSync(source, "utf8");
  const header = frontmatter(text, source, ["ruleSchema", "rules"]);
  if (!header) return undefined;
  assertSchema(validateRules, header, source);

  const adr = /^(ADR-\d{3,})-.+\.md$/.exec(name)?.[1];
  if (!adr || !text.split(/\r?\n/).some((line) => line.startsWith(`# ${adr}: `))) {
    throw new Error(`${source}: ADR title must match filename`);
  }
  const context = text.split(/^## Context[ \t]*\r?$/m)[1]?.split(/^#{1,2} /m)[0];
  const rationale = context?.trim().split(/\r?\n[ \t]*\r?\n/, 1)[0];
  if (!rationale) throw new Error(`${source}: missing rationale in Context section`);

  const revisions = header.rules.map((rule) => {
    for (const term of Object.keys(rule.gates)) {
      if (!Object.hasOwn(terms, term)) throw new Error(`${source}: unknown gate term ${term}`);
    }
    if (rule.evidence) checkEvidence(rule.evidence, source);
    return { ...rule, adr, source, rationale };
  });
  return { adr, revisions, superseded: /^\*\*Status:\*\* Superseded\b/m.test(text) };
}

function readDecisions(terms) {
  const revisions = [];
  const superseded = new Set();
  for (const entry of readdirSync(decisionsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const decision = readDecision(entry.name, terms);
    if (!decision) continue;
    if (decision.superseded) superseded.add(decision.adr);
    revisions.push(...decision.revisions);
  }
  const histories = resolveRuleHistories(revisions);
  if (!histories.length) throw new Error("No implemented typed rules found.");
  for (const { history } of histories) {
    const current = history.at(-1);
    if (superseded.has(current.adr)) throw new Error(`Current rule in superseded ${current.adr} needs a successor.`);
    for (const term of Object.keys(terms)) {
      if (!Object.hasOwn(current.gates, term)) throw new Error(`${current.source}: current rule omits ${term}`);
    }
  }
  return histories;
}

function writeIndex(text) {
  const dir = mkdtempSync(join(dirname(indexPath), ".adr-rules-"));
  try {
    const temporary = join(dir, "README.md");
    writeFileSync(temporary, text, { mode: statSync(indexPath).mode });
    renameSync(temporary, indexPath);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function main(args) {
  const [option] = args;
  if (args.length > 1 || (option?.startsWith("-") && !["--json", "--check", "--write-index"].includes(option))) {
    throw new Error("Usage: node scripts/adr-rules.mjs [rule-id | --json | --check | --write-index]");
  }
  const terms = readTerms();
  const rules = readDecisions(terms);
  if (option === "--json") return console.log(JSON.stringify({ terms, rules }, null, 2));
  if (option === "--check" || option === "--write-index") {
    const before = readFileSync(indexPath, "utf8");
    const after = updateRuleIndex(before, renderRuleIndex(rules, terms));
    if (before === after) return console.log("Typed ADR rules and index are current.");
    if (option === "--check") throw new Error("Stale ADR index. Run node scripts/adr-rules.mjs --write-index.");
    writeIndex(after);
    return console.log("Updated the current typed rules in " + indexPath);
  }
  const matches = option ? rules.filter((rule) => rule.id === option) : rules;
  if (!matches.length) throw new Error(`Unknown rule: ${option}`);
  console.log(matches.map((rule) => describeRule(rule, terms)).join("\n\n"));
}

try {
  main(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
