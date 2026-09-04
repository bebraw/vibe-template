# Deployment Safety Capability Kit

Use this kit to separate Worker version upload from traffic promotion so a presenter or reviewer can inspect a preview while the active stage remains on its last-known-good version.

## Adds

- `npm run deploy` uploads an undeployed candidate instead of changing traffic.
- A stable, configurable preview alias plus the version-specific preview URL emitted by Wrangler.
- Explicit status, 100% promotion, and rollback commands.
- Version-target validation and structured lifecycle logs around deployment commands.
- A short review-and-promotion runbook.

## Good Fit

- The Worker supports version preview URLs and a human should approve a candidate before stage traffic changes.
- A stable alias such as `stage-candidate` is useful during rapid iterations.
- Promotion should be all-or-nothing; gradual traffic splitting is outside this kit.

## Poor Fit

- The Worker implements Durable Objects, Containers, or Sandbox. Cloudflare does not currently generate preview URLs for Workers with Durable Objects, including those products; use an explicitly isolated Wrangler preview environment instead.
- The preview must have private access but Cloudflare Access has not been configured. Preview URLs are public when enabled.
- The change adds or modifies Durable Object lifecycle configuration. `versions upload` does not apply those migrations, and rollbacks cannot cross lifecycle changes.
- Preview logging is required. Workers Logs, Wrangler tail, and Logpush are not currently available for preview URLs.

## Apply

1. Inspect Wrangler environments, bindings, Durable Objects, migrations, routes, domains, cron triggers, deployment automation, access controls, and current rollback practice.
2. Stop if the Worker is in a poor-fit category; design a separate isolated preview Worker/environment rather than implying version previews are safe.
3. Follow `recipes/npm.md`, copy the wrapper and runbook, and merge `preview_urls: true` into Wrangler configuration.
4. Protect preview URLs with Cloudflare Access when public access is inappropriate.
5. Adapt the runbook's review checklist to the application's health, data, and interaction contracts.
6. Run `checks.md`. Do not test the mutating commands against a real Worker unless the user explicitly authorizes that account operation.

This kit does not deploy during repository verification. Tests assert the exact pinned-Wrangler arguments and safety guards without contacting Cloudflare.
