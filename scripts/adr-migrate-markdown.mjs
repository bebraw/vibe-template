import { basename, dirname } from "node:path";
import { parsers } from "prettier/plugins/markdown";
import { parseDocument } from "yaml";

const sectionFields = new Map([
  ["Context", "context"],
  ["Decision", "decision"],
  ["Trigger", "trigger"],
  ["Consequences", "consequences"],
  ["Alternatives", "alternatives"],
  ["Alternatives Considered", "alternatives"],
]);

function headingText(node, source) {
  if (!node.children.length) throw new Error("Empty Markdown heading");
  return source.slice(node.children[0].position.start.offset, node.children.at(-1).position.end.offset).trim();
}

function trimBlankLines(text) {
  return text.replace(/^(?:[ \t]*\r?\n)+|(?:\r?\n[ \t]*)+$/g, "");
}

const relationshipFields = new Map([
  ["Amends", "amends"],
  ["Amended by", "amendedBy"],
  ["Supersedes", "supersedes"],
  ["Superseded by", "supersededBy"],
]);

function addRelationships(record, field, text) {
  const ids = new Set(record[field]);
  for (const item of text.split(/\s*,\s*/)) {
    let id = item;
    if (!/^ADR-\d{3,}$/.test(id)) {
      const link = /^\[(ADR-\d{3,})\]\(([^\s)]+)\)$/.exec(item);
      const file = link && /^(ADR-\d{3,})-.+\.md$/.exec(basename(link[2]));
      if (!link || !file || link[1] !== file[1] || /^[a-z]+:|[?#]/i.test(link[2])) throw new Error("Invalid ADR relationship: " + item);
      id = link[1];
    }
    ids.add(id);
  }
  record[field] = [...ids];
}

function setStatus(record, directory, text) {
  if (record.status) throw new Error("Repeated Status");
  const superseded = /^superseded(?: by (.+))?$/i.exec(text);
  if (superseded && directory === "implemented") {
    record.status = "superseded";
    if (superseded[1]) addRelationships(record, "supersededBy", superseded[1]);
  } else if (directory === "implemented" && text.toLowerCase() === "accepted") {
    record.status = "implemented";
    record.recordedStatus = "accepted";
  } else if (text.toLowerCase() === directory) {
    record.status = directory;
  } else {
    throw new Error("Status conflicts with the lifecycle directory: " + text);
  }
}

function setDate(record, directory, text) {
  if (Object.hasOwn(record, "date")) throw new Error("Repeated Date");
  record.date = text;
  if (directory === "proposed" && record.id === "ADR-000" && text === "YYYY-MM-DD") return;
  const time = Date.parse(text);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || !Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== text) {
    throw new Error("Invalid Date: " + text);
  }
}

function readMetadata(nodes, record, directory, source) {
  let preambleEnd;
  for (const node of nodes) {
    const text = source.slice(node.position.start.offset, node.position.end.offset);
    if (node.type !== "paragraph" || !/^\*\*[^*]+:\*\*/.test(text)) {
      const gap = source.slice(preambleEnd, node.position.start.offset);
      const separator = gap.trim() ? (source.includes("\r\n") ? "\r\n\r\n" : "\n\n") : gap;
      record.preamble = preambleEnd === undefined ? text : record.preamble + separator + text;
      preambleEnd = node.position.end.offset;
      continue;
    }
    for (const line of text.split(/\r?\n/)) {
      const field = /^\*\*([^*]+):\*\*[ \t]*(.+)$/.exec(line);
      if (!field) throw new Error("Unrecognized content before the first section: " + line);
      const [, key, raw] = field;
      const value = raw.trim();
      if (key === "Status") {
        setStatus(record, directory, value);
      } else if (key === "Date") {
        setDate(record, directory, value);
      } else if (relationshipFields.has(key)) {
        addRelationships(record, relationshipFields.get(key), value);
      } else {
        throw new Error("Unsupported metadata: " + key);
      }
    }
  }
  if (!record.status) throw new Error("Missing Status");
  if (record.date === "YYYY-MM-DD") delete record.date;
  if (!record.date && directory !== "proposed") throw new Error("Missing Date");
}

function readRuleHeader(node, directory) {
  if (node.language !== "yaml") throw new Error("Expected YAML frontmatter");
  const document = parseDocument(node.value + "\n", { stringKeys: true });
  const issue = document.errors[0] ?? document.warnings[0];
  if (issue) throw new Error("Invalid YAML frontmatter: " + issue.message);
  let header;
  try {
    header = document.toJS({ maxAliasCount: 0 });
  } catch (error) {
    throw new Error("Invalid YAML frontmatter: " + error.message, { cause: error });
  }
  const allowed = ["ruleSchema", "rules", "gateTermReplacements"];
  const unknown = Object.keys(header ?? {}).filter((key) => !allowed.includes(key));
  if (unknown.length) throw new Error("Unsupported frontmatter fields: " + unknown.join(", "));
  if (header?.ruleSchema !== 1 || !Array.isArray(header.rules) || !header.rules.length) {
    throw new Error("Expected ruleSchema: 1 and nonempty rules in ADR frontmatter");
  }
  const { rules, gateTermReplacements } = header;
  if (!Object.hasOwn(header, "gateTermReplacements")) return { rules };
  if (directory !== "proposed") throw new Error("gateTermReplacements belongs only in proposed ADR frontmatter");
  return { rules, gateTermReplacements };
}

function convert(source, sourcePath) {
  const directory = basename(dirname(sourcePath));
  const id = /^(ADR-\d{3,})-.+\.md$/.exec(basename(sourcePath))?.[1];
  if (!id || !["implemented", "accepted", "proposed"].includes(directory))
    throw new Error("Expected an ADR Markdown path in a lifecycle directory");
  const nodes = parsers.markdown.parse(source, {}).children;
  const fields = nodes[0]?.type === "frontMatter" ? readRuleHeader(nodes.shift(), directory) : {};
  const heading = nodes.shift();
  if (heading?.type !== "heading" || heading.depth !== 1) throw new Error("Missing ADR title");
  const title = /^(ADR-\d{3,}):[ \t]+(.+)$/.exec(headingText(heading, source));
  if (title?.[1] !== id) throw new Error("ADR title must match filename " + id);
  const record = { adrSchema: 1, id, title: title[2], ...fields };
  const sections = nodes.filter((node) => node.type === "heading" && node.depth <= 2);
  readMetadata(nodes.slice(0, sections.length ? nodes.indexOf(sections[0]) : nodes.length), record, directory, source);
  for (const [i, section] of sections.entries()) {
    if (section.depth === 1) throw new Error("Unexpected second level-one heading");
    const name = headingText(section, source);
    const body = trimBlankLines(source.slice(section.position.end.offset, sections[i + 1]?.position.start.offset ?? source.length));
    const field = sectionFields.get(name);
    if (field) {
      if (Object.hasOwn(record, field)) throw new Error("Duplicate section: " + name);
      record[field] = body;
    } else {
      (record.extraSections ??= []).push({ heading: name, body });
    }
  }
  if (!record.context || !record.decision) throw new Error("Both Context and Decision sections need content");
  return record;
}

export function convertMarkdownAdr(sourceText, sourcePath) {
  try {
    return convert(sourceText.replace(/^\uFEFF/, ""), sourcePath);
  } catch (error) {
    throw new Error(sourcePath + ": " + error.message, { cause: error });
  }
}
