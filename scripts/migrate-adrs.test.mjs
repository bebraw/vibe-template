import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const cli = fileURLToPath(new URL("./migrate-adrs.mjs", import.meta.url));
const implemented = "docs/adrs/implemented/ADR-317-new-home.md";
const accepted = "docs/adrs/accepted/ADR-415-another-decision.md";
const pack = ".template/updates/custom/update.json";

function repository(t) {
  const cwd = mkdtempSync(join(tmpdir(), "adr-migration-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  function put(path, text) {
    mkdirSync(dirname(join(cwd, path)), { recursive: true });
    writeFileSync(join(cwd, path), text);
  }
  function markdown(id, status, context) {
    return `# ${id}: Example\n\n**Status:** ${status}\n\n**Date:** 2024-05-06\n\n## Context\n\n${context}\n\n## Decision\n\nKeep the check.\n`;
  }
  const remote = "https://example.com/" + implemented + "#context";
  put(implemented, markdown("ADR-317", "Accepted", "See [next](../accepted/ADR-415-another-decision.md#decision)."));
  put(accepted, markdown("ADR-415", "Accepted", "See the [source](" + remote + ")."));
  const doc = `See [first](../${implemented}#decision) or \`${accepted}\`.\n\n[external](${remote})\n`;
  put("docs-extra/README.md", doc);
  const notOwned = ["node_modules/tool/README.md", "vendor/tool/README.md", ".template/updates/custom/patch.diff"];
  for (const file of notOwned) put(file, doc);
  put(pack, JSON.stringify({ id: "whatever", adrs: [implemented], touches: [accepted], note: remote }));
  return {
    cwd,
    put,
    doc,
    remote,
    notOwned,
    read: (path) => readFileSync(join(cwd, path), "utf8"),
    has: (path) => existsSync(join(cwd, path)),
    run: (...args) => spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8" }),
  };
}

test("a dry run previews migration and a write preserves local references, external URLs and archived patches", (t) => {
  const repo = repository(t);
  chmodSync(join(repo.cwd, implemented), 0o600);
  const preview = repo.run();
  assert.equal(preview.status, 0, preview.stderr);
  assert.match(preview.stdout, /ADR-317/);
  assert.ok(repo.has(implemented));
  assert.equal(repo.has(implemented.replace(".md", ".yaml")), false);
  assert.equal(repo.read("docs-extra/README.md"), repo.doc);
  const applied = repo.run("--write");
  assert.equal(applied.status, 0, applied.stderr);
  const destination = implemented.replace(".md", ".yaml");
  assert.equal(statSync(join(repo.cwd, destination)).mode & 0o777, 0o600);
  const other = accepted.replace(".md", ".yaml");
  assert.equal(repo.has(implemented), false);
  assert.equal(repo.has(accepted), false);
  assert.equal(parse(repo.read(destination)).context, "See [next](../accepted/ADR-415-another-decision.yaml).");
  assert.equal(parse(repo.read(other)).context, "See the [source](" + repo.remote + ").");
  assert.equal(repo.read("docs-extra/README.md"), `See [first](../${destination}) or \`${other}\`.\n\n[external](${repo.remote})\n`);
  assert.deepEqual(JSON.parse(repo.read(pack)), { id: "whatever", adrs: [destination], touches: [other], note: repo.remote });
  for (const file of repo.notOwned) assert.equal(repo.read(file), repo.doc);
  const snapshot = repo.read(destination);
  const again = repo.run("--write");
  assert.equal(again.status, 0, again.stderr);
  assert.equal(repo.read(destination), snapshot);
});

test("preflights every record and refuses conflicting destinations before publishing any changes", (t) => {
  const repo = repository(t);
  const original = repo.read(implemented);
  const other = accepted.replace(".md", ".yaml");
  repo.put(implemented, original.replace("## Decision", "## Missing"));
  const invalid = repo.run("--write");
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /ADR-317.*Decision/);
  assert.ok(repo.has(accepted));
  assert.ok(!repo.has(other));
  repo.put(implemented, original);
  const existing =
    "adrSchema: 1\nid: ADR-317\ntitle: Different\nstatus: implemented\ndate: 2024-05-06\ncontext: Another author\ndecision: Retain this\n";
  const collision = implemented.replace(".md", ".yaml");
  repo.put(collision, existing);
  const refused = repo.run("--write");
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /overwrite.*ADR-317/);
  assert.equal(repo.read(collision), existing);
  assert.equal(repo.read(implemented), original);
  assert.equal(repo.read("docs-extra/README.md"), repo.doc);
  assert.ok(!repo.has(other));
});

test("a retry accepts an identical published destination and updates references from an existing YAML decision", (t) => {
  const repo = repository(t);
  const original = repo.read(implemented);
  const existing = "docs/adrs/implemented/ADR-511-already-migrated.yaml";
  repo.put(
    existing,
    "adrSchema: 1\nid: ADR-511\ntitle: Retained\nstatus: implemented\ndate: 2024-07-17\ncontext: Follow [the earlier decision](./ADR-317-new-home.md).\ndecision: Keep this. # retained comment\n",
  );
  const apply = repo.run("--write");
  assert.equal(apply.status, 0, apply.stderr);
  assert.match(repo.read(existing), /\.\/ADR-317-new-home\.yaml\)\./);
  assert.match(repo.read(existing), /# retained comment/);
  repo.put(implemented, original);
  const before = repo.read(implemented.replace(".md", ".yaml"));
  const retry = repo.run("--write");
  assert.equal(retry.status, 0, retry.stderr);
  assert.ok(!repo.has(implemented));
  assert.equal(repo.read(implemented.replace(".md", ".yaml")), before);
});

test("a dry run checks the final inventory and relationship targets in every lifecycle directory", (t) => {
  const repo = repository(t);
  const doc = repo.read(accepted);
  for (const name of ["meeting.md", "ADR-100-draft.yml"]) {
    const path = "docs/adrs/proposed/" + name;
    repo.put(path, doc);
    const result = repo.run();
    assert.notEqual(result.status, 0);
    assert.ok(result.stderr.includes(name), result.stderr);
    rmSync(join(repo.cwd, path));
  }
  for (const target of ["ADR-999", "ADR-415"]) {
    repo.put(accepted, doc.replace("## Context", `**Amends:** ${target}\n\n## Context`));
    const result = repo.run();
    assert.notEqual(result.status, 0);
    assert.ok(result.stderr.includes(target), result.stderr);
    assert.ok(repo.has(implemented));
  }
});

test("link migration keeps sentence punctuation and resolves parenthesized Markdown destinations without editing remote URLs", (t) => {
  const repo = repository(t);
  const file = "docs/adrs/implemented/ADR-888-scope-(draft).md";
  const text = repo.read(implemented).replaceAll("ADR-317", "ADR-888");
  repo.put(file, text);
  const external = "https://example.net/notes/(v2)/" + file + "#context";
  repo.put(
    "README.md",
    [
      `See ${implemented}#context. Then read the next decision.`,
      `[with groups](./${file}#context "keep title")`,
      `[escaped](./${file.replace("(draft)", "\\(draft\\)")}#decision)`,
      `[external](${external})`,
    ].join("\n\n"),
  );
  const result = repo.run("--write");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    repo.read("README.md"),
    [
      "See docs/adrs/implemented/ADR-317-new-home.yaml. Then read the next decision.",
      '[with groups](./docs/adrs/implemented/ADR-888-scope-(draft).yaml "keep title")',
      "[escaped](./docs/adrs/implemented/ADR-888-scope-\\(draft\\).yaml)",
      `[external](${external})`,
    ].join("\n\n"),
  );
});
