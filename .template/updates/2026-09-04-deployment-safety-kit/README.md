# Add Preview Promotion Deployment Safety

Use this update when a template-derived Worker should upload and review an undeployed candidate before changing active traffic.

## Apply

1. Read ADR-058 and the current capability-kit spec.
2. Confirm the Worker supports version preview URLs. Stop for Durable Objects, Containers, or Sandbox and design a separate preview environment with isolated bindings.
3. Copy `.capabilities/deployment-safety/` and follow its README, manifest, recipe, runbook, and checks.
4. Replace direct `wrangler deploy` with the kit's preview alias only after the project accepts that workflow change.
5. Decide whether preview URLs may be public; configure Cloudflare Access when needed.
6. Adapt the review checklist and record exact candidate, active, and rollback version IDs.
7. Apply `patch.diff` or record the same operation-separation constraint in the target architecture docs.

## Fallback

If the project already has release orchestration, add the missing explicit preview/promotion/rollback safeguards to that workflow rather than installing a second wrapper.

## Verify

- `node --test scripts/run-deployment-safety.test.mjs`
- `npm run preflight`
- `npm run quality:gate`
- Use remote preview/status checks only with explicit authorization for the intended Worker.
