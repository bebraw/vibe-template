import { basename, dirname } from "node:path";
import Ajv from "ajv";
import { parseDocument } from "yaml";
import projectSchema from "../specs/adr-rules/project-rules.schema.json" with { type: "json" };
import recordSchema from "../specs/adr-rules/record.schema.json" with { type: "json" };
import termsSchema from "../specs/adr-rules/gate-terms.schema.json" with { type: "json" };

const ajv = new Ajv({ strict: true, ownProperties: true });
function compile(name, schema) {
  return ajv.compile({ ...schema, $id: new URL(`../specs/adr-rules/${name}`, import.meta.url).href });
}
const checkTerms = compile("gate-terms.schema.json", termsSchema);
const checkRecord = compile("record.schema.json", recordSchema);
const checkProjectRules = compile("project-rules.schema.json", projectSchema);

function readYaml(source, path, validate) {
  const document = parseDocument(source, { stringKeys: true });
  const issue = document.errors[0] ?? document.warnings[0];
  if (issue) throw new Error(`${path}: ${issue.message}`);
  let value;
  try {
    value = document.toJS({ maxAliasCount: 0 });
  } catch (error) {
    throw new Error(`${path}: ${error.message}`);
  }
  if (!validate(value)) throw new Error(`${path}: ${ajv.errorsText(validate.errors)}`);
  return value;
}

export function parseGlossary(source, path) {
  const match = /^---[ \t]*\r?\n([\s\S]*?)^---[ \t]*\r?$/m.exec(source);
  if (match?.index !== 0) throw new Error(`${path}: expected YAML glossary frontmatter`);
  return readYaml(match[1], path, checkTerms);
}

export function parseProjectRules(source, path) {
  return readYaml(source, path, checkProjectRules);
}

export function parseAdrRecord(source, path) {
  const record = readYaml(source, path, checkRecord);
  const id = /^(ADR-\d{3,})-.+\.yaml$/.exec(basename(path))?.[1];
  if (record.id !== id) throw new Error(`${path}: record ID ${record.id} must match its filename`);
  const stage = record.status === "superseded" ? "implemented" : record.status;
  if (basename(dirname(path)) !== stage) throw new Error(`${path}: status ${record.status} belongs in ${stage}/`);
  if (record.date) {
    const date = new Date(record.date);
    if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== record.date)
      throw new Error(`${path}: invalid date ${record.date}`);
  }
  return record;
}

export function validateAdrRelations(record, ids, source) {
  for (const field of ["amends", "amendedBy", "supersedes", "supersededBy", "partiallySupersedes", "partiallySupersededBy"]) {
    for (const id of record[field] ?? []) {
      if (id === record.id || !ids.has(id)) throw new Error(`${source}: invalid related ADR ${id} in ${field}`);
    }
  }
}
