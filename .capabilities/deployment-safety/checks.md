# Checks

Run these after applying the Deployment Safety kit.

## Repository Checks

```bash
node --test scripts/run-deployment-safety.test.mjs
npm run preflight
npm run quality:gate
```

`preflight` is read-only with respect to Cloudflare. The commands below mutate remote Worker version or deployment state and require explicit authorization for the intended account and Worker.

## Authorized Account Checks

```bash
npm run deploy:status
npm run deploy:preview
```

Confirm the preview command prints both a version ID and preview URL while `deploy:status` still reports the previous active version. Do not run promotion or rollback merely to test the wrapper.

## Expected Results

- `npm run deploy` and `npm run deploy:preview` upload a version with the configured alias without creating a deployment.
- Status is read-only and emits Wrangler's JSON representation of the active deployment.
- Promotion and rollback reject missing or flag-shaped version IDs.
- Promotion targets one explicit version at 100% and never selects a version interactively.
- Rollback targets one explicit previously deployed version and records an optional reason from `DEPLOY_MESSAGE`.
- Lifecycle logs state the operation and whether it mutates traffic without logging credentials or environment contents.
- The runbook warns about public previews, missing preview logs, binding drift, Durable Object limitations, and rollback compatibility.
