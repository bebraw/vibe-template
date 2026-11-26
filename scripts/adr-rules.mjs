import {
  existsSync,
  lstatSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { parsers } from "prettier/plugins/markdown";
import { parseAdrRecord, parseGlossary, parseProjectRules, validateAdrRelations } from "./adr-record.mjs";
import { evidenceReferences, resolveRuleHistories } from "./adr-rule-history.mjs";
import { describeDraftRule, describeRule, renderRuleIndex, updateRuleIndex } from "./adr-rule-output.mjs";

const stages = ["implemented", "accepted", "proposed"];
const glossaryPath = "specs/quality-gate/spec.md";

function recordGateCommand(seen, script, source) {
  if (seen.has(script)) throw new Error(`${source}: duplicate gate command ${script}`);
  seen.add(script);
}

function readGlossary() {
  const { gateTerms = {}, localCi } = parseGlossary(readFileSync(glossaryPath, "utf8"), glossaryPath);
  const { scripts } = JSON.parse(readFileSync("package.json", "utf8"));
  const seen = new Set();
  for (const { script, retired } of Object.values(gateTerms)) {
    if (retired) continue;
    if (!Object.hasOwn(scripts, script)) throw new Error(`${glossaryPath}: unknown npm script ${script}`);
    recordGateCommand(seen, script, glossaryPath);
  }
  if (localCi && !Object.hasOwn(scripts, localCi.script)) throw new Error(`${glossaryPath}: unknown npm script ${localCi.script}`);
  return { gateTerms, localCi };
}

function readProjectRules(recordsDir) {
  const path = join(recordsDir, "project-rules.yaml");
  if (existsSync(path)) return parseProjectRules(readFileSync(path, "utf8"), path);
}

function ruleDefinitions({ gateTerms, localCi }, projectRules) {
  const definitions = {
    __proto__: null,
    "local-mutation-testing": {
      cases: gateTerms,
      outcomes: { none: "skips mutation testing", full: "runs full mutation testing", incremental: "runs incremental mutation testing" },
      evidenceLabel: "Verification",
    },
  };
  if (localCi) {
    definitions["local-ci-readiness"] = {
      script: localCi.script,
      cases: Object.fromEntries(Object.entries(localCi.cases).map(([key, definition]) => [key, { definition }])),
      outcomes: { required: "Local CI required", "may-skip": "Local CI optional" },
      evidenceLabel: "Policy guidance",
    };
  }
  for (const [id, { questions }] of Object.entries(projectRules ?? {})) definitions[id] = { questions, evidenceLabel: "Verification" };
  return definitions;
}

function hasPolicyHeading(document, fragment) {
  const anchors = new Set();
  function headingText(node) {
    if (node.children) return node.children.map(headingText).join("");
    return node.type === "text" || node.type === "inlineCode" ? node.value : "";
  }
  function matches(node) {
    if (node.type !== "heading") return node.children?.some(matches);
    const base = headingText(node)
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, "")
      .replaceAll(" ", "-");
    let anchor = base;
    for (let suffix = 1; anchors.has(anchor); suffix++) anchor = `${base}-${suffix}`;
    anchors.add(anchor);
    return anchor === fragment && node.children.length === 1 && node.children[0].type === "text";
  }
  return matches(document);
}

function checkEvidence(reference, source) {
  const [path, fragment] = reference.split("#");
  // Resolve symlinks before accepting a repository-relative evidence reference.
  const target = statSync(path, { throwIfNoEntry: false });
  if (!target?.isFile() || relative(realpathSync("."), realpathSync(path)).split("/")[0] === "..") {
    throw new Error(`${source}: evidence must be a file inside the repository: ${path}`);
  }
  if (fragment) {
    const document = parsers.markdown.parse(readFileSync(path, "utf8"), {});
    if (!hasPolicyHeading(document, fragment)) {
      throw new Error(`${source}: missing policy guidance heading ${reference}`);
    }
  }
}

function validateRevision(rule, vocabulary) {
  const { source } = rule;
  if (!vocabulary) throw new Error(`${source}: missing glossary for ${rule.id}`);
  for (const reference of evidenceReferences(rule)) checkEvidence(reference, source);
  if (rule.answers) {
    for (const [key, choice] of Object.entries(rule.answers)) {
      if (!Object.hasOwn(vocabulary.questions, key)) throw new Error(`${source}: unknown question ${key} for ${rule.id}`);
      if (!Object.hasOwn(vocabulary.questions[key].options, choice)) throw new Error(`${source}: unknown answer ${choice} for ${key}`);
    }
    return;
  }
  const commands = new Set();
  for (const key of Object.keys(rule.gates ?? rule.cases)) {
    if (!Object.hasOwn(vocabulary.cases, key)) throw new Error(`${source}: unknown ${rule.gates ? "gate term" : "case"} ${key}`);
    if (rule.gates) recordGateCommand(commands, vocabulary.cases[key].script, source);
  }
  if (rule.cases) {
    const { otherwise: _fallback, ...specific } = rule.cases;
    if (new Set(Object.values(specific)).size > 1) throw new Error(`${source}: overlapping cases must have the same outcome`);
  }
}

function readDecision(source, ids) {
  const record = parseAdrRecord(readFileSync(source, "utf8"), source);
  validateAdrRelations(record, ids, source);
  const adr = record.id;
  const rationale = record.context.trim().split(/\r?\n[ \t]*\r?\n/, 1)[0];
  const { partiallySupersedes, partiallySupersededBy } = record;
  const revisions = (record.rules ?? []).map((rule) => ({ ...rule, adr, source, rationale, partiallySupersedes, partiallySupersededBy }));
  return { adr, revisions, source, status: record.status, gateTermReplacements: record.gateTermReplacements };
}

function decisionFiles(recordsDir, stage, draftFile) {
  const dir = join(recordsDir, stage);
  const entry = lstatSync(dir, { throwIfNoEntry: false });
  if (!entry) return [];
  if (!entry.isDirectory()) throw new Error(`${dir}: expected a lifecycle directory`);
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (!/\.(md|ya?ml)$/i.test(entry.name)) return [];
    const source = join(dir, entry.name);
    // A focused review only needs the IDs of other unimplemented records.
    if (draftFile && stage !== "implemented" && source !== draftFile) {
      return entry.isFile() && /^ADR-\d{3,}-.+\.yaml$/.test(entry.name) ? [source] : [];
    }
    if (/\.md$/i.test(entry.name)) throw new Error(`${source}: migrate Markdown ADRs with node scripts/migrate-adrs.mjs`);
    if (!entry.isFile() || !entry.name.endsWith(".yaml")) throw new Error(`${source}: expected a standalone .yaml decision file`);
    return [source];
  });
}

function readRecords(recordsDir, draftFile) {
  const files = stages.flatMap((stage) => decisionFiles(recordsDir, stage, draftFile));
  const inScope = (path) => !draftFile || dirname(path) === join(recordsDir, "implemented") || path === draftFile;
  const ids = new Map();
  for (const source of files) {
    const id = /^(ADR-\d{3,})-/.exec(basename(source))?.[1];
    if (!id) throw new Error(`${source}: expected ADR-<number>-<name>.yaml`);
    if (ids.has(id) && (inScope(source) || inScope(ids.get(id))))
      throw new Error(`${source}: duplicate ${id}, already present in ${ids.get(id)}`);
    ids.set(id, source);
  }
  return files.filter(inScope).map((source) => readDecision(source, ids));
}

function validateCurrentRevision(revision, vocabulary) {
  if (revision.answers) {
    for (const key of Object.keys(vocabulary.questions)) {
      if (!Object.hasOwn(revision.answers, key)) throw new Error(`${revision.source}: ${revision.id} omits question ${key}`);
    }
    return;
  }
  if (!revision.gates) return;
  const terms = vocabulary.cases;
  for (const term of Object.keys(revision.gates)) {
    if (terms[term].retired) throw new Error(`${revision.source}: rule uses retired gate ${term}`);
  }
  for (const [term, { retired }] of Object.entries(terms)) {
    if (!retired && !Object.hasOwn(revision.gates, term)) throw new Error(`${revision.source}: rule omits ${term}`);
  }
}

function implementedHistories(records, definitions) {
  const revisions = [];
  const superseded = new Set();
  for (const decision of records) {
    if (!["implemented", "superseded"].includes(decision.status)) continue;
    if (decision.status === "superseded") superseded.add(decision.adr);
    for (const rule of decision.revisions) {
      validateRevision(rule, definitions[rule.id]);
      revisions.push(rule);
    }
  }
  const histories = resolveRuleHistories(revisions);
  for (const { history } of histories) {
    const current = history.at(-1);
    if (superseded.has(current.adr)) throw new Error(`Current rule in superseded ${current.adr} needs a successor.`);
    validateCurrentRevision(current, definitions[current.id]);
  }
  return histories;
}

function replaceGateTerms(vocabulary, replacements, source) {
  const cases = { ...vocabulary.cases };
  for (const [id, { replaces, definition }] of Object.entries(replacements)) {
    if (Object.hasOwn(vocabulary.cases, id)) throw new Error(`${source}: replacement gate ID ${id} already exists`);
    if (!Object.hasOwn(vocabulary.cases, replaces)) throw new Error(`${source}: unknown gate to replace ${replaces}`);
    const previous = cases[replaces];
    if (previous.retired) throw new Error(`${source}: gate ${replaces} is retired or already replaced`);
    cases[replaces] = { ...previous, retired: true };
    cases[id] = { script: previous.script, definition };
  }
  return { ...vocabulary, cases };
}

function checkDraft(draft, histories, definitions) {
  const { source } = draft;
  if (!draft.revisions.length) return `${draft.adr} is a valid proposal with no rule revisions.`;
  const seen = new Set();
  return draft.revisions
    .map((revision) => {
      if (seen.has(revision.id)) throw new Error(`${source}: duplicate draft revision of ${revision.id}`);
      seen.add(revision.id);
      const previous = histories.find(({ id }) => id === revision.id)?.history.at(-1);
      if (revision.replaces !== previous?.adr) {
        const expected = previous ? `must replace the implemented head ${previous.adr}` : "has no implemented predecessor";
        throw new Error(`${source}: ${revision.id} ${expected}`);
      }
      const published = definitions[revision.id];
      const replacements = revision.gates ? draft.gateTermReplacements : undefined;
      const vocabulary = replacements ? replaceGateTerms(published, replacements, source) : published;
      validateRevision(revision, vocabulary);
      validateCurrentRevision(revision, vocabulary);
      return describeDraftRule(revision, previous, vocabulary, replacements);
    })
    .join("\n\n");
}

function writeIndex(indexPath, text) {
  const dir = mkdtempSync(join(dirname(indexPath), ".adr-rules-"));
  try {
    const temporary = join(dir, "README.md");
    writeFileSync(temporary, text, { mode: statSync(indexPath).mode });
    renameSync(temporary, indexPath);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function selectRecordsDir(args) {
  if (args[0] !== "--records") return "docs/adrs";
  const [, path] = args.splice(0, 2);
  if (!path || !statSync(path, { throwIfNoEntry: false })?.isDirectory())
    throw new Error("--records requires an existing decision directory");
  const directory = relative(realpathSync("."), realpathSync(path));
  if (!directory || directory.split("/")[0] === "..") throw new Error("--records must select a directory inside the repository");
  if (!stages.some((stage) => lstatSync(join(directory, stage), { throwIfNoEntry: false })?.isDirectory()))
    throw new Error(`${directory}: --records must contain a proposed, accepted, or implemented directory`);
  return directory;
}

function main(args) {
  const recordsDir = selectRecordsDir(args);
  const indexPath = join(recordsDir, "README.md");
  const draftsDir = join(recordsDir, "proposed");
  const [option] = args;
  const checkingDraft = option === "--check-draft";
  const knownOption = !option?.startsWith("-") || ["--json", "--check", "--write-index", "--check-draft"].includes(option);
  const validArity = checkingDraft ? args.length === 2 : args.length <= 1;
  if (!knownOption || !validArity) {
    throw new Error(
      "Usage: node scripts/adr-rules.mjs [--records <directory>] [rule-id | --json | --check | --write-index | --check-draft <file>]",
    );
  }
  const draftFile = checkingDraft ? relative(realpathSync("."), realpathSync(args[1])) : undefined;
  if (checkingDraft && dirname(draftFile) !== draftsDir) throw new Error(`Expected a proposal in ${draftsDir}: ${args[1]}`);
  const records = readRecords(recordsDir, draftFile);
  const draft = checkingDraft && records.find(({ source }) => source === draftFile);
  if (checkingDraft && !draft) throw new Error(`${draftFile}: expected a standalone .yaml decision file`);
  const needsGlossary = records.some(
    ({ revisions, status, source }) =>
      revisions.some((rule) => !rule.answers) && (status === "implemented" || status === "superseded" || source === draftFile),
  );
  const { gateTerms: terms, localCi } = needsGlossary ? readGlossary() : { gateTerms: {} };
  const projectRules = readProjectRules(recordsDir);
  const definitions = ruleDefinitions({ gateTerms: terms, localCi }, projectRules);
  const rules = implementedHistories(records, definitions);
  if (checkingDraft) return console.log(checkDraft(draft, rules, definitions));
  if (option === "--json") return console.log(JSON.stringify({ terms, localCi, projectRules, rules }, null, 2));
  if (option === "--check" || option === "--write-index") {
    const before = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : "";
    if (!rules.length && !before.includes("<!-- adr-rules")) return console.log("ADR records are valid.");
    const after = updateRuleIndex(before, renderRuleIndex(rules, definitions, recordsDir));
    if (before === after) return console.log("Typed ADR rules and index are current.");
    if (option === "--check")
      throw new Error(`Stale ADR index at ${indexPath}. Rerun this command with --write-index in place of --check.`);
    writeIndex(indexPath, after);
    return console.log("Updated the current typed rules in " + indexPath);
  }
  if (!option && !rules.length) return console.log("No implemented rule revisions.");
  const matches = option ? rules.filter((rule) => rule.id === option) : rules;
  if (!matches.length) throw new Error(`Unknown rule: ${option}`);
  console.log(matches.map((rule) => describeRule(rule, definitions)).join("\n\n"));
}

try {
  main(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
