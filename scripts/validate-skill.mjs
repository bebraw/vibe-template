import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isMap, parseDocument } from "yaml";

function validate(content) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(content);
  if (!match) throw new Error("Invalid or missing YAML frontmatter");
  const document = parseDocument(match[1], { version: "1.1" });
  const issue = document.errors[0] ?? document.warnings[0];
  if (issue) throw new Error(`Invalid YAML: ${issue.message}`);
  if (!isMap(document.contents)) throw new Error("Frontmatter must be a YAML dictionary");
  const header = document.toJS({ mapAsMap: true });
  const allowed = new Set(["name", "description", "license", "allowed-tools", "metadata"]);
  for (const key of header.keys()) {
    if (!allowed.has(key)) throw new Error(`Unexpected frontmatter key: ${String(key)}`);
  }
  for (const key of ["name", "description"]) {
    if (!header.has(key)) throw new Error(`Missing ${key}`);
    if (typeof header.get(key) !== "string") throw new Error(`${key} must be a string`);
  }
  const name = header.get("name").trim();
  if (name && (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64)) {
    throw new Error("Name must be hyphen-case and at most 64 characters");
  }
  const description = header.get("description").trim();
  if (description.length > 1024 || /[<>]/.test(description)) {
    throw new Error("Description must be at most 1024 characters without angle brackets");
  }
  if (description.startsWith("[TODO:")) throw new Error("Description contains an unfinished TODO placeholder");
  validateBody(content.slice(match[0].length));
}

function validateBody(body) {
  let fenceMarker;
  let fenceLength = 0;
  for (const line of body.split(/\r?\n/)) {
    const fence = /^[ \t]*(?:(?:[-+*]|\d+[.)])[ \t]+)?(`{3,}|~{3,})(.*)$/.exec(line);
    if (fence) {
      const marker = fence[1][0];
      if (!fenceMarker) {
        fenceMarker = marker;
        fenceLength = fence[1].length;
      } else if (marker === fenceMarker && fence[1].length >= fenceLength && !fence[2].trim()) {
        fenceMarker = undefined;
      }
      continue;
    }
    if (!fenceMarker && /^ {0,3}\[TODO:[^\n]*\][ \t]*$/.test(line)) {
      throw new Error("Skill instructions contain an unfinished TODO placeholder");
    }
  }
}

if (process.argv.length !== 3) {
  console.error("Usage: node scripts/validate-skill.mjs <skill_directory>");
  process.exitCode = 1;
} else {
  try {
    validate(readFileSync(join(process.argv[2], "SKILL.md"), "utf8"));
    console.log("Skill is valid!");
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
