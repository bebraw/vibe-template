import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const previewAliasPattern = /^[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const versionIdPattern = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{6,126}[a-zA-Z0-9])?$/;

export function buildDeploymentPlan({ action, alias = "stage-candidate", message, versionId }) {
  if (action === "preview") {
    if (!previewAliasPattern.test(alias)) {
      throw new TypeError("The preview alias must be a lowercase DNS label.");
    }
    return {
      args: withMessage(["versions", "upload", "--preview-alias", alias, "--strict"], message, "--message"),
      event: "deployment.preview",
      mutatesTraffic: false,
    };
  }

  if (action === "promote") {
    assertVersionId(versionId);
    return {
      args: withMessage(["versions", "deploy", `${versionId}@100%`, "--yes"], message, "--message"),
      event: "deployment.promote",
      mutatesTraffic: true,
    };
  }

  if (action === "rollback") {
    assertVersionId(versionId);
    return {
      args: withMessage(["rollback", versionId, "--yes"], message, "--message"),
      event: "deployment.rollback",
      mutatesTraffic: true,
    };
  }

  if (action === "status") {
    return { args: ["deployments", "status", "--json"], event: "deployment.status", mutatesTraffic: false };
  }

  throw new TypeError("Expected deployment action: preview, status, promote, or rollback.");
}

export async function runDeploymentPlan(plan, { log = console.log, root = process.cwd(), run = spawnWrangler } = {}) {
  log(JSON.stringify({ event: `${plan.event}.start`, mutatesTraffic: plan.mutatesTraffic }));
  const exitCode = await run(plan.args, root);
  log(JSON.stringify({ event: `${plan.event}.finish`, exitCode, mutatesTraffic: plan.mutatesTraffic }));
  return exitCode;
}

function assertVersionId(versionId) {
  if (typeof versionId !== "string" || !versionIdPattern.test(versionId)) {
    throw new TypeError("Promotion and rollback require an explicit Worker version ID.");
  }
}

function withMessage(args, message, flag) {
  if (message === undefined || message.trim() === "") return args;
  if (message.length > 500) throw new TypeError("DEPLOY_MESSAGE must be at most 500 characters.");
  return [...args, flag, message];
}

function spawnWrangler(args, root) {
  return new Promise((resolve) => {
    const executable = path.join(root, "node_modules", ".bin", process.platform === "win32" ? "wrangler.cmd" : "wrangler");
    const child = spawn(executable, args, { cwd: root, env: process.env, stdio: "inherit" });
    child.once("error", (error) => {
      console.error(JSON.stringify({ event: "deployment.command.error", message: error.message }));
      resolve(1);
    });
    child.once("close", (code) => resolve(code ?? 1));
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const plan = buildDeploymentPlan({
      action: process.argv[2],
      alias: process.env.WORKER_PREVIEW_ALIAS,
      message: process.env.DEPLOY_MESSAGE,
      versionId: process.argv[3],
    });
    process.exitCode = await runDeploymentPlan(plan);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  }
}
