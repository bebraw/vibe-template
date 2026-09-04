import assert from "node:assert/strict";
import test from "node:test";

import { createPreflightPlan, evaluateRuntime, formatPreflightSummary, runPreflightPlan } from "./run-preflight.mjs";

test("accepts the repository's exact Node version and supported npm major", () => {
  assert.deepEqual(
    evaluateRuntime({
      actualNode: "24.20.0",
      actualNpm: "11.19.1",
      expectedNode: "24.20.0",
      expectedNpm: ">=11 <12",
    }),
    [
      { label: "Node 24.20.0", ok: true },
      { label: "npm 11.19.1", ok: true },
    ],
  );
});

test("reports actionable runtime mismatches", () => {
  assert.deepEqual(
    evaluateRuntime({
      actualNode: "22.0.0",
      actualNpm: "12.0.0",
      expectedNode: "24.20.0",
      expectedNpm: ">=11 <12",
    }),
    [
      {
        label: "Node 22.0.0",
        ok: false,
        hint: "Use Node 24.20.0 (run `nvm use` when nvm is available).",
      },
      {
        label: "npm 12.0.0",
        ok: false,
        hint: "Use an npm version matching >=11 <12.",
      },
    ],
  );
});

test("builds a read-only Wrangler validation plan", () => {
  assert.deepEqual(createPreflightPlan("/repo", "/tmp/preflight"), [
    {
      args: ["--version"],
      command: "/repo/node_modules/.bin/wrangler",
      hint: "Run `npm install` to restore the repo-pinned Wrangler binary.",
      label: "Wrangler CLI",
    },
    {
      args: ["whoami", "--json"],
      command: "/repo/node_modules/.bin/wrangler",
      hint: "Authenticate with `npx wrangler login` or configure an API token.",
      label: "Wrangler authentication",
    },
    {
      args: ["types", "/tmp/preflight/worker-configuration.d.ts", "--include-runtime=false"],
      command: "/repo/node_modules/.bin/wrangler",
      hint: "Fix Wrangler configuration or declared bindings, then regenerate environment types.",
      label: "Declared bindings",
    },
    {
      args: [
        "deploy",
        "--dry-run",
        "--outdir",
        "/tmp/preflight/bundle",
        "--experimental-provision=false",
        "--experimental-auto-create=false",
      ],
      command: "/repo/node_modules/.bin/wrangler",
      hint: "Fix the Worker build or Wrangler deployment configuration.",
      label: "Deploy dry run",
    },
  ]);
});

test("runs every preflight check and keeps command output private", () => {
  const calls = [];
  const results = runPreflightPlan(createPreflightPlan("/repo", "/tmp/preflight"), (command, args, options) => {
    calls.push({ command, args, options });
    return { status: args[0] === "whoami" ? 1 : 0 };
  });

  assert.equal(calls.length, 4);
  assert.ok(calls.every(({ options }) => options.stdio === "pipe"));
  assert.deepEqual(results, [
    { label: "Wrangler CLI", ok: true },
    {
      label: "Wrangler authentication",
      ok: false,
      hint: "Authenticate with `npx wrangler login` or configure an API token.",
    },
    { label: "Declared bindings", ok: true },
    { label: "Deploy dry run", ok: true },
  ]);
});

test("formats a compact pass/fail summary without child command output", () => {
  assert.equal(
    formatPreflightSummary([
      { label: "Node 24.20.0", ok: true },
      { label: "Wrangler authentication", ok: false, hint: "Authenticate Wrangler." },
    ]),
    ["Preflight", "✓ Node 24.20.0", "✗ Wrangler authentication", "  Authenticate Wrangler.", "Preflight failed (1 of 2 checks)."].join(
      "\n",
    ),
  );
});
