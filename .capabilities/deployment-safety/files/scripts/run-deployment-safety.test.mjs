import assert from "node:assert/strict";
import test from "node:test";

import { buildDeploymentPlan, runDeploymentPlan } from "./run-deployment-safety.mjs";

test("uploads a strict undeployed version with a stable preview alias", () => {
  assert.deepEqual(buildDeploymentPlan({ action: "preview", alias: "lecture-candidate", message: "ready for review" }), {
    args: ["versions", "upload", "--preview-alias", "lecture-candidate", "--strict", "--message", "ready for review"],
    event: "deployment.preview",
    mutatesTraffic: false,
  });
});

test("promotes only an explicit version id to all traffic", () => {
  assert.deepEqual(buildDeploymentPlan({ action: "promote", versionId: "12345678-abcd-4321-abcd-1234567890ab" }), {
    args: ["versions", "deploy", "12345678-abcd-4321-abcd-1234567890ab@100%", "--yes"],
    event: "deployment.promote",
    mutatesTraffic: true,
  });
});

test("rolls back only to an explicit version id", () => {
  assert.deepEqual(buildDeploymentPlan({ action: "rollback", versionId: "12345678-abcd-4321-abcd-1234567890ab" }), {
    args: ["rollback", "12345678-abcd-4321-abcd-1234567890ab", "--yes"],
    event: "deployment.rollback",
    mutatesTraffic: true,
  });
});

test("shows current deployment status without changing traffic", () => {
  assert.deepEqual(buildDeploymentPlan({ action: "status" }), {
    args: ["deployments", "status", "--json"],
    event: "deployment.status",
    mutatesTraffic: false,
  });
});

test("rejects ambiguous targets and unsafe preview aliases", () => {
  assert.throws(() => buildDeploymentPlan({ action: "promote" }), /explicit Worker version ID/);
  assert.throws(() => buildDeploymentPlan({ action: "rollback", versionId: "--latest" }), /explicit Worker version ID/);
  assert.throws(() => buildDeploymentPlan({ action: "preview", alias: "Invalid Alias" }), /lowercase DNS label/);
});

test("emits structured lifecycle logs around the exact Wrangler arguments", async () => {
  const logs = [];
  const plan = buildDeploymentPlan({ action: "status" });
  let invoked;

  const exitCode = await runDeploymentPlan(plan, {
    log: (message) => logs.push(JSON.parse(message)),
    root: "/example",
    run: async (args, root) => {
      invoked = { args, root };
      return 0;
    },
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(invoked, { args: ["deployments", "status", "--json"], root: "/example" });
  assert.deepEqual(logs, [
    { event: "deployment.status.start", mutatesTraffic: false },
    { event: "deployment.status.finish", exitCode: 0, mutatesTraffic: false },
  ]);
});
