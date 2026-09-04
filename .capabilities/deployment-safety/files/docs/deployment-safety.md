# Worker Candidate Review And Promotion

Use this runbook to keep the active stage on its last-known-good version until a specific candidate has been reviewed.

## Preconditions

- Confirm the intended Cloudflare account and Worker name. Set `WORKER_ENVIRONMENT` when using a named Wrangler environment, and use the same value for status, upload, promotion, and rollback.
- Confirm version preview URLs are supported. Stop for Workers with Durable Objects, Containers, or Sandbox.
- Confirm preview access is appropriate; previews are public unless protected with Cloudflare Access.
- Run `npm run preflight` and the repository readiness gate.
- Run `npm run deploy:status` and record the current active version as the rollback target.

## Upload Without Traffic

Optionally set `WORKER_PREVIEW_ALIAS` to a stable lowercase alias, `WORKER_ENVIRONMENT` to a lowercase named Wrangler environment, and `DEPLOY_MESSAGE` to the commit or change summary, then run:

```bash
npm run deploy
```

Wrangler builds and uploads a new version without deploying it. Record the exact candidate version ID and both the version-specific and aliased preview URLs. Confirm status still names the prior active version.

## Review The Preview

- Confirm the expected commit or change summary.
- Exercise the application's health endpoint and closed product loop.
- Check fallback, error, and no-JavaScript paths that matter to the presentation.
- Check bindings and data writes carefully: a preview URL is not an isolated data environment.
- Remember that preview requests do not currently appear in Workers Logs, Wrangler tail, or Logpush.

If review fails, keep the active deployment unchanged and upload a corrected candidate. Do not promote the alias by assumption; every candidate has its own version ID.

## Promote The Reviewed Version

Use the exact candidate version ID:

```bash
npm run deploy:promote -- 12345678-abcd-4321-abcd-1234567890ab
```

Run `npm run deploy:status`, repeat the critical smoke checks on the active stage, and record the result.

## Roll Back

If the promoted stage fails and the prior code remains compatible with current bindings and data, use the exact previously recorded version ID:

```bash
npm run deploy:rollback -- 12345678-abcd-4321-abcd-1234567890ab
```

Rollback immediately creates a deployment that sends 100% of traffic to that version. Connected resources are not rolled back. Do not cross a Durable Object lifecycle change or assume a prior data schema is still compatible.
