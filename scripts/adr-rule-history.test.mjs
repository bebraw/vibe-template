import assert from "node:assert/strict";
import test from "node:test";

import { resolveRuleHistories } from "./adr-rule-history.mjs";

function revision(id, adr, fields = {}) {
  return { id, adr, source: `docs/adrs/implemented/${adr}-example.md`, gates: { baseline: "full" }, ...fields };
}

const evidence = "scripts/run-quality-gate.test.mjs";

test("orders each rule's original revisions by explicit replacements and sorts results by rule ID", () => {
  const first = revision("worker.bindings", "ADR-009");
  const second = revision("worker.bindings", "ADR-011", { replaces: first.adr });
  const last = revision("worker.bindings", "ADR-004", { replaces: second.adr, evidence });
  const separate = revision("asset.cache", first.adr, { evidence });

  const result = resolveRuleHistories([last, separate, first, second]);

  assert.deepEqual(result, [
    { id: "asset.cache", history: [separate] },
    { id: "worker.bindings", history: [first, second, last] },
  ]);
  assert.equal(result[1].history[2], last);
});

test("rejects duplicate revisions for the same rule in one ADR", () => {
  const first = revision("worker.bindings", "ADR-001", { evidence });
  assert.throws(() => resolveRuleHistories([first, { ...first }]), /duplicate.*worker\.bindings.*ADR-001/i);
});

test("requires the predecessor to contain a revision of the same rule", () => {
  const other = revision("asset.cache", "ADR-001", { evidence });
  const head = revision("worker.bindings", "ADR-002", { replaces: other.adr, evidence });
  assert.throws(() => resolveRuleHistories([head]), /worker\.bindings.*ADR-001/);
  assert.throws(() => resolveRuleHistories([other, head]), /worker\.bindings.*ADR-001/);
});

test("rejects two successors that each replace the same revision", () => {
  const root = revision("worker.bindings", "ADR-001");
  const left = revision(root.id, "ADR-002", { replaces: root.adr, evidence });
  const right = revision(root.id, "ADR-003", { replaces: root.adr, evidence });
  assert.throws(() => resolveRuleHistories([left, right, root]), /fork.*worker\.bindings.*ADR-001/i);
});

test("rejects independent chains with the same rule ID", () => {
  const first = revision("worker.bindings", "ADR-001");
  const left = revision(first.id, "ADR-002", { replaces: first.adr, evidence });
  const second = revision(first.id, "ADR-003");
  const right = revision(first.id, "ADR-004", { replaces: second.adr, evidence });
  assert.throws(() => resolveRuleHistories([left, first, right, second]), /roots.*worker\.bindings/i);
});

test("rejects cyclic histories even when the same rule has a separate valid chain", () => {
  const left = revision("worker.bindings", "ADR-001", { replaces: "ADR-002", evidence });
  const right = revision(left.id, "ADR-002", { replaces: left.adr });
  const separate = revision(left.id, "ADR-003", { evidence });
  assert.throws(() => resolveRuleHistories([left, right]), /cycle.*worker\.bindings/i);
  assert.throws(() => resolveRuleHistories([left, separate, right]), /cycle.*worker\.bindings/i);
});

test("requires evidence on the current revision even when its predecessor cites evidence", () => {
  const previous = revision("worker.bindings", "ADR-005", { evidence });
  const current = revision(previous.id, "ADR-006", { replaces: previous.adr });
  assert.throws(() => resolveRuleHistories([previous, current]), /worker\.bindings.*ADR-006.*evidence/);
});
