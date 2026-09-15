import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const cli = fileURLToPath(new URL("./validate-skill.mjs", import.meta.url));
function validate(content) {
  const dir = mkdtempSync(join(tmpdir(), "validate-skill-"));
  try {
    if (content !== null) writeFileSync(join(dir, "SKILL.md"), content);
    return spawnSync(process.execPath, [cli, dir], { encoding: "utf8" });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const skill = (header = "name: example-skill\ndescription: Useful guidance", body = "# Instructions") => `---\n${header}\n---\n${body}\n`;

test("accepts a skill with folded YAML and nested metadata", () => {
  const result = validate(
    skill("name: example-skill\ndescription: >-\n  Useful guidance\n  across lines\nmetadata:\n  short-description: Example"),
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Skill is valid/);
});

for (const [label, content, message] of [
  ["missing file", null, /ENOENT/],
  ["missing frontmatter", "# Instructions", /frontmatter/],
  ["invalid delimiter", "---\nname: example\n---oops", /frontmatter/],
  ["malformed YAML", skill("name: ["), /Invalid YAML/],
  ["duplicate keys", skill("name: one\nname: two\ndescription: Example"), /Invalid YAML/],
  ["unsupported tag", skill("name: !custom example\ndescription: Example"), /Invalid YAML/],
  ["sequence root", skill("- name\n- description"), /dictionary/],
  ["empty root", skill(""), /dictionary/],
  ["unknown property", skill("name: example\ndescription: Example\nextra: true"), /Unexpected/],
  ["missing name", skill("description: Example"), /Missing name/],
  ["missing description", skill("name: example"), /Missing description/],
  ["numeric name", skill("name: 42\ndescription: Example"), /name must be a string/],
  ["YAML 1.1 boolean", skill("name: yes\ndescription: Example"), /name must be a string/],
  ["description object", skill("name: example\ndescription: {}"), /description must be a string/],
  ["invalid name", skill("name: bad--name\ndescription: Example"), /hyphen-case/],
  ["long name", skill(`name: ${"a".repeat(65)}\ndescription: Example`), /64/],
  ["long description", skill(`name: example\ndescription: ${"a".repeat(1025)}`), /1024/],
  ["description markup", skill("name: example\ndescription: Use <tag>"), /angle brackets/],
  ["description scaffold", skill('name: example\ndescription: "[TODO: explain]"'), /unfinished TODO/],
  ["body scaffold", skill(undefined, "[TODO: explain]"), /unfinished TODO/],
  ["scaffold after fence", skill(undefined, "```\nexample\n```\n[TODO: explain]"), /unfinished TODO/],
]) {
  test(`rejects ${label}`, () => {
    const result = validate(content);
    assert.equal(result.status, 1);
    assert.match(result.stderr, message);
  });
}

for (const body of [
  "```md\n[TODO: example]\n```",
  "~~~~\n```\n[TODO: example]\n~~~\n[TODO: still example]\n~~~~",
  "- ```md\n  [TODO: example]\n  ```",
  "Mention [TODO: example] in prose.",
]) {
  test(`allows illustrative placeholders: ${JSON.stringify(body)}`, () => {
    assert.equal(validate(skill(undefined, body)).status, 0);
  });
}

test("accepts CRLF and a closing delimiter at EOF", () => {
  assert.equal(validate(skill().replaceAll("\n", "\r\n")).status, 0);
  assert.equal(validate("---\nname: example\ndescription: Example\n---").status, 0);
});

test("reports usage for missing or excess arguments", () => {
  for (const args of [[], ["one", "two"]]) {
    const result = spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Usage:/);
  }
});
