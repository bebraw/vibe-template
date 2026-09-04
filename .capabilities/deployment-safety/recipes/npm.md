# npm Recipe

This kit adds no dependency. It calls the repository-pinned Wrangler binary directly and assumes the target already has the core deploy preflight.

## Package Scripts

Replace a direct `wrangler deploy` script and merge the explicit lifecycle commands:

```json
{
  "scripts": {
    "deploy": "npm run deploy:preview",
    "deploy:preview": "node ./scripts/run-deployment-safety.mjs preview",
    "deploy:status": "node ./scripts/run-deployment-safety.mjs status",
    "deploy:promote": "node ./scripts/run-deployment-safety.mjs promote",
    "deploy:rollback": "node ./scripts/run-deployment-safety.mjs rollback"
  }
}
```

Copy:

- `files/scripts/run-deployment-safety.mjs` to `scripts/run-deployment-safety.mjs`
- `files/scripts/run-deployment-safety.test.mjs` to `scripts/run-deployment-safety.test.mjs`
- `files/docs/deployment-safety.md` to `docs/deployment-safety.md`

## Wrangler Configuration

Explicitly enable preview URLs in `wrangler.jsonc`:

```jsonc
{
  "preview_urls": true,
}
```

Preview URLs are public unless protected with Cloudflare Access. Do not enable them when the candidate exposes sensitive data or privileged operations without equivalent access control.

## Operation

`WORKER_PREVIEW_ALIAS` defaults to `stage-candidate` and must be a lowercase DNS label. `DEPLOY_MESSAGE` is optional and is passed as the Wrangler version/deployment message without being interpreted by a shell.

Promotion and rollback require the version ID after `--`:

```bash
npm run deploy:promote -- 12345678-abcd-4321-abcd-1234567890ab
npm run deploy:rollback -- 12345678-abcd-4321-abcd-1234567890ab
```

Do not supply `latest`, a tag, or an inferred candidate. Copy the exact reviewed version ID from Wrangler output and the runbook record.
